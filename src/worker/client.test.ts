import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dealRandom, mulberry32 } from '../engine';
import type { Position } from '../solver';
import type { WorkerLike } from './client';
import {
  SolverAbortError,
  SolverClient,
  SolverError,
  SolverTimeoutError,
  isAbortError,
} from './client';
import type { SolverRequest, SolverResponse } from './protocol';

class FakeWorker implements WorkerLike {
  onmessage: WorkerLike['onmessage'] = null;
  onerror: WorkerLike['onerror'] = null;
  readonly sent: SolverRequest[] = [];
  terminated = false;

  postMessage(message: SolverRequest): void {
    this.sent.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  /** Answers the last job sent (or `id`). */
  reply(result: unknown, id = this.last().id): void {
    this.onmessage?.({ data: { id, ok: true, result } as SolverResponse });
  }

  fail(error: string, id = this.last().id): void {
    this.onmessage?.({ data: { id, ok: false, error } });
  }

  crash(message: string): void {
    this.onerror?.({ message });
  }

  last(): SolverRequest {
    const req = this.sent.at(-1);
    if (!req) throw new Error('nothing sent');
    return req;
  }
}

const deal = dealRandom(mulberry32(1));
const pos: Position = { hands: deal, trump: 'NT', trick: [], toPlay: 'W' };

let workers: FakeWorker[];
let client: SolverClient;

beforeEach(() => {
  vi.useFakeTimers();
  workers = [];
  client = new SolverClient({
    createWorker: () => {
      const w = new FakeWorker();
      workers.push(w);
      return w;
    },
    timeoutMs: 5000,
    cancelGraceMs: 200,
  });
});

afterEach(() => {
  client.dispose();
  vi.useRealTimers();
});

/** Settles a promise into a value we can inspect without unhandled rejections. */
function outcome<T>(p: Promise<T>): { value?: T; error?: unknown; done: boolean } {
  const box: { value?: T; error?: unknown; done: boolean } = { done: false };
  p.then(
    (value) => Object.assign(box, { value, done: true }),
    (error: unknown) => Object.assign(box, { error, done: true }),
  );
  return box;
}

const flush = () => vi.advanceTimersByTimeAsync(0);

describe('SolverClient', () => {
  it('sends { id, type, payload } and resolves with the result', async () => {
    const job = client.solve(pos);
    expect(workers).toHaveLength(1);
    expect(workers[0]!.sent).toEqual([{ id: 1, type: 'solve', payload: pos }]);
    workers[0]!.reply(7);
    await expect(job).resolves.toBe(7);

    const table = client.ddTable(deal);
    expect(workers[0]!.last()).toMatchObject({ id: 2, type: 'ddTable', payload: deal });
    workers[0]!.reply({ C: 1, D: 2, H: 3, S: 4, NT: 5 });
    await expect(table).resolves.toEqual({ C: 1, D: 2, H: 3, S: 4, NT: 5 });
    expect(workers).toHaveLength(1);
  });

  it('runs one job at a time, in order', async () => {
    const a = client.solve(pos);
    const b = client.analyze(pos);
    const c = client.ddTable(deal);
    const w = workers[0]!;
    expect(w.sent.map((r) => r.type)).toEqual(['solve']);
    expect(client.pending).toBe(3);

    w.reply(3);
    expect(w.sent.map((r) => r.type)).toEqual(['solve', 'analyze']);
    w.reply([]);
    w.reply({ C: 0, D: 0, H: 0, S: 0, NT: 0 });

    await expect(a).resolves.toBe(3);
    await expect(b).resolves.toEqual([]);
    await expect(c).resolves.toMatchObject({ NT: 0 });
    expect(client.pending).toBe(0);
  });

  it('rejects with SolverError when the worker reports an error, then carries on', async () => {
    const bad = client.solve(pos);
    const next = client.solve(pos);
    workers[0]!.fail('invalid position: duplicate card');
    await expect(bad).rejects.toThrow(SolverError);
    await expect(bad).rejects.toThrow('invalid position: duplicate card');
    workers[0]!.reply(4);
    await expect(next).resolves.toBe(4);
  });

  it('ignores replies to other ids', async () => {
    const job = outcome(client.solve(pos));
    workers[0]!.reply(9, 999);
    await flush();
    expect(job.done).toBe(false);
    workers[0]!.reply(2);
    await flush();
    expect(job.value).toBe(2);
  });

  describe('cancelling', () => {
    it('rejects at once when the signal is already aborted, and sends nothing', async () => {
      const ctrl = new AbortController();
      ctrl.abort();
      const job = client.solve(pos, { signal: ctrl.signal });
      await expect(job).rejects.toThrow(SolverAbortError);
      expect(workers).toHaveLength(0);
    });

    it('drops a queued job without the worker ever seeing it', async () => {
      const ctrl = new AbortController();
      const first = client.solve(pos);
      const queued = client.analyze(pos, { signal: ctrl.signal });
      const after = client.ddTable(deal);
      ctrl.abort();
      await expect(queued).rejects.toSatisfy(isAbortError);

      const w = workers[0]!;
      w.reply(1);
      expect(w.sent.map((r) => r.type)).toEqual(['solve', 'ddTable']);
      w.reply({ C: 0, D: 0, H: 0, S: 0, NT: 0 });
      await expect(first).resolves.toBe(1);
      await expect(after).resolves.toBeTruthy();
    });

    it('rejects a running job at once and drops its late result', async () => {
      const ctrl = new AbortController();
      const running = client.ddTable(deal, { signal: ctrl.signal });
      const next = outcome(client.solve(pos));
      ctrl.abort();
      await expect(running).rejects.toThrow(SolverAbortError);

      // The worker finishes within the grace period: same worker, next job goes out.
      await vi.advanceTimersByTimeAsync(100);
      const w = workers[0]!;
      w.reply({ C: 9, D: 9, H: 9, S: 9, NT: 9 });
      expect(w.last().type).toBe('solve');
      w.reply(6);
      await flush();
      expect(next.value).toBe(6);
      expect(workers).toHaveLength(1);
      expect(w.terminated).toBe(false);
    });

    it('restarts the worker when a cancelled job keeps it busy past the grace period', async () => {
      const ctrl = new AbortController();
      const running = outcome(client.ddTable(deal, { signal: ctrl.signal }));
      const next = outcome(client.solve(pos));
      ctrl.abort();
      await vi.advanceTimersByTimeAsync(199);
      expect(workers).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(workers[0]!.terminated).toBe(true);
      expect(workers).toHaveLength(2);
      expect(workers[1]!.sent.map((r) => r.type)).toEqual(['solve']);
      workers[1]!.reply(8);
      await flush();
      expect(isAbortError(running.error)).toBe(true);
      expect(next.value).toBe(8);
      expect(client.workersStarted).toBe(2);
    });

    it('cancelAll rejects queued and running jobs', async () => {
      const a = client.solve(pos);
      const b = client.solve(pos);
      client.cancelAll();
      await expect(a).rejects.toSatisfy(isAbortError);
      await expect(b).rejects.toSatisfy(isAbortError);
      expect(workers[0]!.sent).toHaveLength(1);
      expect(client.pending).toBe(0);
    });

    it('aborting a signal after its job settled does nothing', async () => {
      const ctrl = new AbortController();
      const job = client.solve(pos, { signal: ctrl.signal });
      workers[0]!.reply(5);
      await expect(job).resolves.toBe(5);
      const next = outcome(client.solve(pos));
      ctrl.abort();
      await vi.advanceTimersByTimeAsync(1000);
      expect(workers[0]!.terminated).toBe(false);
      workers[0]!.reply(6);
      await flush();
      expect(next.value).toBe(6);
    });
  });

  describe('stuck or crashed worker', () => {
    it('times out, terminates the worker and runs the next job on a new one', async () => {
      const slow = outcome(client.ddTable(deal));
      const next = outcome(client.solve(pos));
      await vi.advanceTimersByTimeAsync(4999);
      expect(slow.done).toBe(false);
      await vi.advanceTimersByTimeAsync(1);

      expect(slow.error).toBeInstanceOf(SolverTimeoutError);
      expect(workers[0]!.terminated).toBe(true);
      expect(workers[1]!.last().type).toBe('solve');
      workers[1]!.reply(3);
      await flush();
      expect(next.value).toBe(3);
    });

    it('honours a per-job timeout', async () => {
      const job = outcome(client.solve(pos, { timeoutMs: 50 }));
      await vi.advanceTimersByTimeAsync(50);
      expect(job.error).toBeInstanceOf(SolverTimeoutError);
    });

    it('the timer restarts for each job', async () => {
      const a = outcome(client.solve(pos));
      const b = outcome(client.solve(pos));
      await vi.advanceTimersByTimeAsync(4000);
      workers[0]!.reply(1);
      await vi.advanceTimersByTimeAsync(4000);
      workers[0]!.reply(2);
      await flush();
      expect([a.value, b.value]).toEqual([1, 2]);
      expect(workers).toHaveLength(1);
    });

    it('a crash fails the running job, and the next job starts a new worker', async () => {
      const job = outcome(client.solve(pos));
      workers[0]!.crash('out of memory');
      await flush();
      expect(job.error).toBeInstanceOf(SolverError);
      expect(String((job.error as Error).message)).toContain('out of memory');
      expect(workers[0]!.terminated).toBe(true);

      const again = client.solve(pos);
      expect(workers).toHaveLength(2);
      workers[1]!.reply(4);
      await expect(again).resolves.toBe(4);
    });
  });

  it('warmUp starts the worker once, before any job', () => {
    client.warmUp();
    client.warmUp();
    expect(workers).toHaveLength(1);
    expect(workers[0]!.sent).toEqual([]);
  });

  it('dispose cancels everything and refuses new jobs', async () => {
    const job = client.solve(pos);
    client.dispose();
    await expect(job).rejects.toSatisfy(isAbortError);
    expect(workers[0]!.terminated).toBe(true);
    await expect(client.solve(pos)).rejects.toSatisfy(isAbortError);
    expect(workers).toHaveLength(1);
  });
});
