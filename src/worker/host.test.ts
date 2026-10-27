import { beforeAll, describe, expect, it } from 'vitest';
import type { Deal } from '../engine';
import { applyPlay, dealRandom, isComplete, legalPlays, mulberry32, newPlayState } from '../engine';
import type { CardAnalysis, DDTable, Position } from '../solver';
import { positionFromPlayState } from '../solver';
import type { DdsSolver } from '../solver/dds';
import { loadDds } from '../solver/dds';
import type { SolverEngine } from './host';
import { DealTracker, SolverHost } from './host';

/** Positions along one deal played with seeded random legal cards. */
function line(deal: Deal, seed: number): Position[] {
  const rng = mulberry32(seed);
  let state = newPlayState(deal, { level: 3, strain: 'NT', declarer: 'S' });
  const out: Position[] = [];
  while (!isComplete(state)) {
    out.push(positionFromPlayState(state));
    const legal = legalPlays(state);
    state = applyPlay(state, legal[Math.floor(rng() * legal.length)]!);
  }
  return out;
}

const dealA = dealRandom(mulberry32(11));
const dealB = dealRandom(mulberry32(12));

describe('DealTracker', () => {
  it('sees one deal while play goes forward and back', () => {
    const t = new DealTracker();
    const positions = line(dealA, 1);
    for (const p of positions) expect(t.observe(p)).toBe(true);
    for (const p of [...positions].reverse()) expect(t.observe(p)).toBe(true);
  });

  it('notices a new deal, then follows it', () => {
    const t = new DealTracker();
    t.observe(line(dealA, 1)[0]!);
    const b = line(dealB, 2);
    expect(t.observe(b[0]!)).toBe(false);
    expect(t.observe(b[5]!)).toBe(true);
    expect(t.observe(line(dealA, 1)[3]!)).toBe(false);
  });

  it('counts cards in the current trick as their player’s', () => {
    const t = new DealTracker();
    const positions = line(dealA, 3);
    const midTrick = positions.find((p) => p.trick.length === 2)!;
    expect(t.observe(midTrick)).toBe(true);
    expect(t.observe(positions[0]!)).toBe(true);
  });
});

/** An engine that records calls (answers are not checked here). */
function fakeEngine() {
  const calls: string[] = [];
  const engine: SolverEngine = {
    solve: () => (calls.push('solve'), 0),
    analyze: () => (calls.push('analyze'), [] as CardAnalysis[]),
    ddTable: () => (calls.push('ddTable'), { C: 0, D: 0, H: 0, S: 0, NT: 0 } as DDTable),
    clear: () => void calls.push('clear'),
  };
  return { engine, calls };
}

describe('SolverHost', () => {
  it('keeps the cache within a deal and clears it when a new deal starts', () => {
    const { engine, calls } = fakeEngine();
    const host = new SolverHost(engine);
    const a = line(dealA, 4);
    const b = line(dealB, 5);
    let id = 0;
    host.handle({ id: ++id, type: 'analyze', payload: a[0]! });
    host.handle({ id: ++id, type: 'solve', payload: a[1]! });
    host.handle({ id: ++id, type: 'solve', payload: a[0]! }); // undo
    expect(calls).toEqual(['analyze', 'solve', 'solve']);

    host.handle({ id: ++id, type: 'ddTable', payload: dealB }); // dealing does not count
    host.handle({ id: ++id, type: 'solve', payload: a[2]! });
    expect(calls.filter((c) => c === 'clear')).toHaveLength(0);

    host.handle({ id: ++id, type: 'solve', payload: b[0]! });
    host.handle({ id: ++id, type: 'analyze', payload: b[1]! });
    expect(calls.slice(-3)).toEqual(['clear', 'solve', 'analyze']);
    expect(host.clears).toBe(1);
  });

  it('answers errors as { ok: false } with the message', () => {
    const host = new SolverHost({
      ...fakeEngine().engine,
      solve: () => {
        throw new Error('invalid position: duplicate card');
      },
    });
    expect(host.handle({ id: 3, type: 'solve', payload: line(dealA, 1)[0]! })).toEqual({
      id: 3,
      ok: false,
      error: 'invalid position: duplicate card',
    });
    expect(
      host.handle({ id: 4, type: 'nope', payload: null } as unknown as Parameters<
        SolverHost['handle']
      >[0]),
    ).toEqual({ id: 4, ok: false, error: 'unknown job type' });
  });

  describe('with DDS', () => {
    let dds: DdsSolver;
    beforeAll(async () => {
      dds = await loadDds();
    });

    it('returns what the solver returns', () => {
      const host = new SolverHost(dds);
      const p = line(dealA, 6)[9]!;
      expect(host.handle({ id: 1, type: 'solve', payload: p })).toEqual({
        id: 1,
        ok: true,
        result: dds.solve(p),
      });
      expect(host.handle({ id: 2, type: 'analyze', payload: p })).toEqual({
        id: 2,
        ok: true,
        result: dds.analyze(p),
      });
      expect(host.handle({ id: 3, type: 'ddTable', payload: dealA })).toEqual({
        id: 3,
        ok: true,
        result: dds.ddTable(dealA),
      });
    });

    it('reports an invalid position instead of throwing', () => {
      const host = new SolverHost(dds);
      const bad: Position = {
        hands: { ...dealA, N: dealA.N.slice(1) },
        trump: 'S',
        trick: [],
        toPlay: 'W',
      };
      const res = host.handle({ id: 1, type: 'solve', payload: bad });
      expect(res).toMatchObject({ id: 1, ok: false });
      expect(res.ok ? '' : res.error).toMatch(/invalid/);
    });
  });
});
