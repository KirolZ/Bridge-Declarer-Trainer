import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Deal } from '../engine';
import { STRAINS, SUITS, cardCode, dealRandom, mulberry32, shuffle, sideOf } from '../engine';
import type { Position } from './position';
import { referenceAnalyze, referenceSolve } from './reference';
import type { CardAnalysis } from './solve';
import { Solver, analyze, ddTable, solve } from './solve';
import {
  positionFromPbn,
  randomPosition,
  renameSuits,
  rotatePosition,
  tricksLeft,
} from './testing';

const describePos = (p: Position) =>
  JSON.stringify({
    hands: Object.fromEntries(
      Object.entries(p.hands).map(([s, h]) => [s, h.map(cardCode).join(' ')]),
    ),
    trump: p.trump,
    trick: p.trick.map((t) => `${t.seat}:${cardCode(t.card)}`),
    toPlay: p.toPlay,
  });

/** Runs `check` on `count` seeded random positions and lists the ones that fail. */
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

const analysisText = (lines: CardAnalysis[]) =>
  lines
    .map((a) => `${cardCode(a.card)}=${a.nsTricks}`)
    .sort()
    .join(' ');

describe('solve matches the brute-force reference', () => {
  it('on 2,000 random positions of 1–4 cards (suit + NT, mid-trick starts)', () => {
    const rng = mulberry32(2026);
    const bad: string[] = [];
    let midTrick = 0;
    const strains = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const p = randomPosition(rng, { maxCards: 4 });
      if (p.trick.length > 0) midTrick++;
      strains.add(p.trump);
      if (solve(p) !== referenceSolve(p)) bad.push(describePos(p));
    }
    expect(bad).toEqual([]);
    // The sample really covers what the spec asks for.
    expect(midTrick).toBeGreaterThan(1000);
    expect([...strains].sort()).toEqual([...STRAINS].sort());
  });

  // 5-card positions take the reference up to a few seconds each. `SOLVER_SLOW=1 pnpm test` runs
  // a much bigger batch (use it after every solver optimization in M4).
  const fiveCards = process.env.SOLVER_SLOW ? 200 : 12;
  it(`on ${fiveCards} random 5-card positions`, () => {
    expect(
      failures(55, fiveCards, { minCards: 5, maxCards: 5 }, (p) => solve(p) === referenceSolve(p)),
    ).toEqual([]);
  }, 600_000);

  it('analyze matches the reference card by card on 500 positions', () => {
    expect(
      failures(
        77,
        500,
        { maxCards: 4 },
        (p) => analysisText(analyze(p)) === analysisText(referenceAnalyze(p)),
      ),
    ).toEqual([]);
  });

  it('agrees on the hand-checked squeeze', () => {
    const squeeze = positionFromPbn('N:2.AQ.. KQJ... .3.J.A .K9.Q.', 'NT', 'S');
    expect(solve(squeeze)).toBe(3);
    expect(analyze(squeeze).map((a) => `${cardCode(a.card)}=${a.nsTricks}`)).toEqual([
      'H3=2',
      'DJ=2',
      'CA=3',
    ]);
  });
});

describe('solver properties (1–6 cards)', () => {
  const opts = { maxCards: 6 };

  it('is unchanged by turning the table 180° (N↔S, E↔W)', () => {
    expect(failures(1, 500, opts, (p) => solve(rotatePosition(p, 2)) === solve(p))).toEqual([]);
  });

  it('is unchanged by renaming suits in NT', () => {
    const rng = mulberry32(99);
    const bad = failures(2, 500, { ...opts, strains: ['NT'] }, (p) => {
      const perm = shuffle([...SUITS], rng);
      return solve(renameSuits(p, perm)) === solve(p);
    });
    expect(bad).toEqual([]);
  });

  it('is unchanged by renaming suits together with the trump suit', () => {
    const rng = mulberry32(98);
    const bad = failures(3, 300, { ...opts, strains: ['S', 'H', 'D', 'C'] }, (p) => {
      const perm = shuffle([...SUITS], rng);
      return solve(renameSuits(p, perm)) === solve(p);
    });
    expect(bad).toEqual([]);
  });

  it('NS tricks + EW tricks = tricks left', () => {
    // Turning the table 90° puts EW in the NS seats, so solve() then counts EW's tricks.
    expect(
      failures(4, 500, opts, (p) => solve(p) + solve(rotatePosition(p, 1)) === tricksLeft(p)),
    ).toEqual([]);
  });

  it('analyze is consistent with solve (max for NS to play, min for EW)', () => {
    const bad = failures(5, 500, opts, (p) => {
      const values = analyze(p).map((a) => a.nsTricks);
      const best = sideOf(p.toPlay) === 'NS' ? Math.max(...values) : Math.min(...values);
      return best === solve(p);
    });
    expect(bad).toEqual([]);
  });

  it('analyze lists every legal card once, in hand order', () => {
    const p = positionFromPbn('N:AQ... ..43. 3... K4...', 'NT', 'W', ['S2']);
    expect(analyze(p).map((a) => cardCode(a.card))).toEqual(['SK', 'S4']);
    const lead = positionFromPbn('N:A2.K.Q.J 3.2.43.5 ...AKQ98 T9.8.7.6', 'NT', 'N');
    expect(analyze(lead).map((a) => cardCode(a.card))).toEqual(['SA', 'S2', 'HK', 'DQ', 'CJ']);
  });
});

// The reference is too slow past 5 cards, so the table and the sure-trick bounds — the parts
// that generalise from one position to others — are also checked against plain search
// (equivalent cards and move ordering only) on bigger positions.
describe('optimized search matches plain search (5–7 cards)', () => {
  const plain = new Solver({ plain: true });
  const opts = { minCards: 5, maxCards: 7 };

  it('solve, with a table shared by all positions', () => {
    const shared = new Solver();
    expect(failures(11, 300, opts, (p) => shared.solve(p) === plain.solve(p))).toEqual([]);
  });

  it('solve, with a tiny table (constant collisions and evictions)', () => {
    const tiny = new Solver({ ttBits: 5 });
    expect(failures(12, 300, opts, (p) => tiny.solve(p) === plain.solve(p))).toEqual([]);
  });

  it('analyze card by card', () => {
    const shared = new Solver();
    const bad = failures(
      13,
      150,
      opts,
      (p) => analysisText(shared.analyze(p)) === analysisText(plain.analyze(p)),
    );
    expect(bad).toEqual([]);
  });

  it('ddTable on 7-card deals', () => {
    const shared = new Solver();
    const rng = mulberry32(14);
    for (let i = 0; i < 15; i++) {
      const full = dealRandom(rng);
      const cut = (seat: keyof Deal) => full[seat].slice(0, 7);
      const deal: Deal = { N: cut('N'), E: cut('E'), S: cut('S'), W: cut('W') };
      expect(shared.ddTable(deal)).toEqual(plain.ddTable(deal));
    }
  });
});

describe('solve edge cases', () => {
  it('returns 0 when every hand is empty', () => {
    const empty: Deal = { N: [], E: [], S: [], W: [] };
    expect(solve({ hands: empty, trump: 'NT', trick: [], toPlay: 'W' })).toBe(0);
  });

  it('counts the trick in progress', () => {
    // South has played ♠A; West, North and East follow with small cards.
    const p = positionFromPbn('N:3... 4... ... 2...', 'NT', 'W', ['SA']);
    expect(solve(p)).toBe(1);
  });

  it('rejects invalid positions', () => {
    const p = positionFromPbn('N:3... 4... ... 2...', 'NT', 'N', ['SA']);
    expect(() => solve(p)).toThrow(/invalid position/);
    expect(() => analyze(p)).toThrow(/invalid position/);
  });
});

describe('ddTable', () => {
  it('matches the reference in all five strains with West on lead', () => {
    const rng = mulberry32(8);
    for (let i = 0; i < 30; i++) {
      const full = dealRandom(rng);
      const size = 1 + (i % 4);
      const deal: Deal = {
        N: full.N.slice(0, size),
        E: full.E.slice(0, size),
        S: full.S.slice(0, size),
        W: full.W.slice(0, size),
      };
      const table = ddTable(deal);
      for (const trump of STRAINS) {
        expect(table[trump]).toBe(referenceSolve({ hands: deal, trump, trick: [], toPlay: 'W' }));
      }
    }
  });

  it('rejects an invalid deal', () => {
    const full = dealRandom(mulberry32(1));
    expect(() => ddTable({ ...full, N: full.N.slice(1) })).toThrow(/invalid deal/);
  });
});

describe('solver boundary', () => {
  const dir = fileURLToPath(new URL('.', import.meta.url));
  const sources = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

  it.each(sources)('%s only imports solver modules and the engine', (file) => {
    const text = readFileSync(join(dir, file), 'utf8');
    const specifiers = [...text.matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)].map((m) => m[1]);
    for (const spec of specifiers) expect(spec).toMatch(/^(\.\/[\w-]+|\.\.\/engine)$/);
  });
});
