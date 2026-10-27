import { beforeAll, describe, expect, it } from 'vitest';
import type { Strain } from '../engine';
import {
  STRAINS,
  applyPlay,
  cardCode,
  dealRandom,
  isComplete,
  legalPlays,
  mulberry32,
  newPlayState,
} from '../engine';
import { DdsSolver, loadDds } from './dds';
import type { Position } from './position';
import { positionFromPlayState } from './position';
import { referenceAnalyze, referenceSolve } from './reference';
import type { CardAnalysis } from './solve';
import { Solver } from './solve';
import { positionFromPbn, randomPosition } from './testing';

let dds: DdsSolver;
beforeAll(async () => {
  dds = await loadDds();
});

const text = (lines: CardAnalysis[]) =>
  lines.map((a) => `${cardCode(a.card)}=${a.nsTricks}`).join(' ');

const describePos = (p: Position) =>
  JSON.stringify({
    hands: Object.fromEntries(
      Object.entries(p.hands).map(([s, h]) => [s, h.map(cardCode).join(' ')]),
    ),
    trump: p.trump,
    trick: p.trick.map((t) => `${t.seat}:${cardCode(t.card)}`),
    toPlay: p.toPlay,
  });

/** Seeded random positions on which `check` fails. */
function failures(
  seed: number,
  count: number,
  opts: Parameters<typeof randomPosition>[1],
  check: (p: Position) => boolean,
) {
  const rng = mulberry32(seed);
  const bad: string[] = [];
  for (let i = 0; i < count; i++) {
    const p = randomPosition(rng, opts);
    if (!check(p)) bad.push(describePos(p));
  }
  return bad;
}

describe('DDS (wasm) matches the brute-force reference', () => {
  it('solve on 2,000 random positions of 1–4 cards (suit + NT, mid-trick starts)', () => {
    expect(
      failures(2026, 2000, { maxCards: 4 }, (p) => dds.solve(p) === referenceSolve(p)),
    ).toEqual([]);
  });

  it('analyze card by card on 500 positions', () => {
    expect(
      failures(77, 500, { maxCards: 4 }, (p) => sameSet(dds.analyze(p), referenceAnalyze(p))),
    ).toEqual([]);
  });

  it('agrees on the hand-checked squeeze, in hand order', () => {
    const squeeze = positionFromPbn('N:2.AQ.. KQJ... .3.J.A .K9.Q.', 'NT', 'S');
    expect(dds.solve(squeeze)).toBe(3);
    expect(text(dds.analyze(squeeze))).toBe('H3=2 DJ=2 CA=3');
  });
});

describe('DDS (wasm) matches the TS solver', () => {
  const ts = new Solver();

  it('analyze on 300 random positions of 5–8 cards', () => {
    expect(
      failures(
        909,
        300,
        { minCards: 5, maxCards: 8 },
        (p) => text(dds.analyze(p)) === text(ts.analyze(p)),
      ),
    ).toEqual([]);
  }, 120_000);

  it('ddTable on 7-card end positions', () => {
    for (let i = 0; i < 10; i++) {
      const full = dealRandom(mulberry32(300 + i));
      const deal = {
        N: full.N.slice(0, 7),
        E: full.E.slice(0, 7),
        S: full.S.slice(0, 7),
        W: full.W.slice(0, 7),
      };
      expect(dds.ddTable(deal)).toEqual(ts.ddTable(deal));
    }
  });
});

describe('DDS (wasm) on full deals', () => {
  it('ddTable agrees with solve and analyze in every strain', () => {
    for (let i = 0; i < 5; i++) {
      const deal = dealRandom(mulberry32(500 + i));
      const table = dds.ddTable(deal);
      for (const trump of STRAINS) {
        const pos: Position = { hands: deal, trump, trick: [], toPlay: 'W' };
        expect(dds.solve(pos)).toBe(table[trump]);
        // West is on lead, so NS get the fewest tricks West can hold them to.
        const lines = dds.analyze(pos);
        expect(lines).toHaveLength(13);
        expect(Math.min(...lines.map((a) => a.nsTricks))).toBe(table[trump]);
      }
    }
  });

  it('a finished hand leaves nothing to solve', () => {
    const empty: Position = {
      hands: { N: [], E: [], S: [], W: [] },
      trump: 'NT',
      trick: [],
      toPlay: 'W',
    };
    expect(dds.solve(empty)).toBe(0);
    expect(dds.analyze(empty)).toEqual([]);
  });

  it('rejects an invalid position', () => {
    const deal = dealRandom(mulberry32(1));
    expect(() =>
      dds.solve({ hands: { ...deal, N: deal.N.slice(1) }, trump: 'S', trick: [], toPlay: 'W' }),
    ).toThrow();
  });
});

describe('DDS (wasm) keeps its cache between calls (SPEC §5.5)', () => {
  // A second wasm instance whose cache is never cleared, checked against the shared one cleared
  // before every call: along played-out deals, with undo-style jumps back, and across deals.
  it('gives the same answers as a cold start along played-out deals', async () => {
    const warm = await DdsSolver.load();
    const bad: string[] = [];
    for (let i = 0; i < 6; i++) {
      const deal = dealRandom(mulberry32(700 + i));
      const strain = STRAINS[i % 5] as Strain;
      const rng = mulberry32(800 + i);
      let state = newPlayState(deal, { level: 1, strain, declarer: 'S' });
      const positions: Position[] = [];
      while (!isComplete(state)) {
        positions.push(positionFromPlayState(state));
        const legal = legalPlays(state);
        state = applyPlay(state, legal[Math.floor(rng() * legal.length)]!);
      }
      // Forward, jumping back a few cards after every trick (as undo does).
      const order: number[] = [];
      positions.forEach((_, k) => {
        order.push(k);
        if (k % 4 === 3) order.push(k - 1 - Math.floor(rng() * 3));
      });
      for (const k of order) {
        const pos = positions[k]!;
        const got = `${warm.solve(pos)} ${text(warm.analyze(pos))}`;
        dds.clear();
        const solved = dds.solve(pos);
        dds.clear();
        const want = `${solved} ${text(dds.analyze(pos))}`;
        if (got !== want) bad.push(`${describePos(pos)}: ${got} ≠ ${want}`);
      }
    }
    expect(bad).toEqual([]);
  }, 180_000);
});

function sameSet(a: CardAnalysis[], b: CardAnalysis[]): boolean {
  const key = (l: CardAnalysis[]) =>
    l
      .map((x) => `${cardCode(x.card)}=${x.nsTricks}`)
      .sort()
      .join(' ');
  return key(a) === key(b);
}
