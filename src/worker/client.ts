// Main-thread side of the solver worker (SPEC §5.5): one Promise per job, cancellable, with a
// watchdog that terminates a stuck worker and starts a new one.
//
// Jobs are queued here and sent to the worker one at a time. A queued job can then be cancelled
// without the worker ever seeing it; a job the worker is already running cannot be interrupted
// (DDS runs synchronously), so cancelling it rejects the Promise at once, drops the result when it
// arrives, and restarts the worker if it is still busy after `cancelGraceMs` so the jobs behind it
// do not have to wait.

import type { Deal } from '../engine';
import type { CardAnalysis, DDTable, Position } from '../solver';
import type { JobResult, JobType, SolverJobs, SolverRequest, SolverResponse } from './protocol';

/** The parts of `Worker` the client uses (a fake one in tests). */
export type WorkerLike = {
  postMessage(message: SolverRequest): void;
  terminate(): void;
  onmessage: ((event: { data: SolverResponse }) => void) | null;
  onerror: ((event: { message?: string; preventDefault?: () => void }) => void) | null;
};

export type SolverClientOptions = {
  createWorker: () => WorkerLike;
  /** A job running longer than this restarts the worker and fails with `SolverTimeoutError`. */
  timeoutMs?: number;
  /** How long a cancelled job may keep the worker busy before the worker is restarted. */
  cancelGraceMs?: number;
};

export type JobOptions = {
  /** Aborting rejects the job with `SolverAbortError` (e.g. on undo or a new deal). */
  signal?: AbortSignal;
  /** Overrides the client's `timeoutMs` for this job. */
  timeoutMs?: number;
};

export const DEFAULT_TIMEOUT_MS = 20_000;
export const DEFAULT_CANCEL_GRACE_MS = 300;

/** The job was cancelled (its signal aborted, `cancelAll()`, or the client was disposed). */
export class SolverAbortError extends Error {
  override name = 'AbortError';
  constructor(message = 'solver job cancelled') {
    super(message);
  }
}

/** The job ran longer than its time limit; the worker was restarted. */
export class SolverTimeoutError extends Error {
  override name = 'SolverTimeoutError';
}

/** The solver reported an error (invalid position, failed to load) or the worker crashed. */
export class SolverError extends Error {
  override name = 'SolverError';
}

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

type Job = {
  request: SolverRequest;
  timeoutMs: number;
  settled: boolean;
  resolve(result: unknown): void;
  reject(err: Error): void;
  detach(): void;
};

export class SolverClient {
  /** Workers started so far (the first one included). */
  workersStarted = 0;

  private worker: WorkerLike | null = null;
  private readonly queue: Job[] = [];
  /** The job the worker is busy with (possibly already cancelled). */
  private running: Job | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextId = 1;
  private disposed = false;
  private readonly createWorker: () => WorkerLike;
  private readonly timeoutMs: number;
  private readonly cancelGraceMs: number;

  constructor(options: SolverClientOptions) {
    this.createWorker = options.createWorker;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.cancelGraceMs = options.cancelGraceMs ?? DEFAULT_CANCEL_GRACE_MS;
  }

  solve(pos: Position, options?: JobOptions): Promise<number> {
    return this.run('solve', pos, options);
  }

  analyze(pos: Position, options?: JobOptions): Promise<CardAnalysis[]> {
    return this.run('analyze', pos, options);
  }

  ddTable(deal: Deal, options?: JobOptions): Promise<DDTable> {
    return this.run('ddTable', deal, options);
  }

  /** Starts the worker (and its solver download) ahead of the first job. */
  warmUp(): void {
    if (!this.disposed) this.ensureWorker();
  }

  /** Cancels every queued and running job. */
  cancelAll(): void {
    for (const job of [...this.queue]) this.cancel(job);
    if (this.running) this.cancel(this.running);
  }

  /** Cancels everything and stops the worker for good. */
  dispose(): void {
    this.cancelAll();
    this.disposed = true;
    this.stopWorker();
  }

  /** Number of jobs waiting or running (cancelled ones not included). */
  get pending(): number {
    return this.queue.length + (this.running && !this.running.settled ? 1 : 0);
  }

  private run<T extends JobType>(
    type: T,
    payload: SolverJobs[T]['payload'],
    options: JobOptions = {},
  ): Promise<JobResult<T>> {
    const { signal } = options;
    if (this.disposed) return Promise.reject(new SolverAbortError('solver client disposed'));
    if (signal?.aborted) return Promise.reject(new SolverAbortError());

    return new Promise<JobResult<T>>((resolve, reject) => {
      const job: Job = {
        request: { id: this.nextId++, type, payload } as SolverRequest,
        timeoutMs: options.timeoutMs ?? this.timeoutMs,
        settled: false,
        resolve: (result) => settle(() => resolve(result as JobResult<T>)),
        reject: (err) => settle(() => reject(err)),
        detach: () => signal?.removeEventListener('abort', onAbort),
      };
      const settle = (fn: () => void) => {
        if (job.settled) return;
        job.settled = true;
        job.detach();
        fn();
      };
      const onAbort = () => this.cancel(job);
      signal?.addEventListener('abort', onAbort, { once: true });

      this.queue.push(job);
      this.pump();
    });
  }

  private cancel(job: Job): void {
    if (job.settled) return;
    job.reject(new SolverAbortError());
    const i = this.queue.indexOf(job);
    if (i >= 0) this.queue.splice(i, 1);
    else if (job === this.running) this.arm(this.cancelGraceMs);
  }

  /** Sends the next queued job if the worker is free. */
  private pump(): void {
    if (this.running || this.disposed) return;
    const job = this.queue.shift();
    if (!job) return;
    this.running = job;
    this.arm(job.timeoutMs);
    this.ensureWorker().postMessage(job.request);
  }

  private onMessage(res: SolverResponse): void {
    const job = this.running;
    if (!job || res.id !== job.request.id) return;
    this.disarm();
    this.running = null;
    if (res.ok) job.resolve(res.result);
    else job.reject(new SolverError(res.error));
    this.pump();
  }

  /** Terminates the worker, fails the job it was running, and goes on with the queue. */
  private restart(err: Error): void {
    this.disarm();
    this.stopWorker();
    const job = this.running;
    this.running = null;
    job?.reject(err);
    this.pump();
  }

  private ensureWorker(): WorkerLike {
    if (this.worker) return this.worker;
    const worker = this.createWorker();
    worker.onmessage = (event) => {
      if (worker === this.worker) this.onMessage(event.data);
    };
    worker.onerror = (event) => {
      event.preventDefault?.();
      if (worker === this.worker) {
        this.restart(new SolverError(`solver worker crashed: ${event.message ?? 'unknown error'}`));
      }
    };
    this.worker = worker;
    this.workersStarted++;
    return worker;
  }

  private stopWorker(): void {
    const worker = this.worker;
    this.worker = null;
    if (!worker) return;
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
  }

  private arm(ms: number): void {
    this.disarm();
    this.timer = setTimeout(() => {
      this.timer = null;
      const job = this.running;
      this.restart(
        new SolverTimeoutError(
          `solver job ${job?.request.type ?? ''} took longer than ${job?.timeoutMs ?? ms} ms`,
        ),
      );
    }, ms);
  }

  private disarm(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
