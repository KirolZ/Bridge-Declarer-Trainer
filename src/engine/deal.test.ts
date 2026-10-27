import { describe, expect, it } from 'vitest';
import type { Deal } from './card';
import { SEATS, cardIndex, hcp } from './card';
import { dealRandom, handSize, shuffle, validateDeal, withStrongerSouth } from './deal';
import { parseDealPbn, parseHand } from './encode';
import { cryptoRng, mulberry32 } from './rng';

const allIndexes = (deal: Deal) =>
  SEATS.flatMap((s) => deal[s].map(cardIndex)).sort((a, b) => a - b);

describe('rng', () => {
  it('mulberry32 is deterministic and in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('cryptoRng returns floats in [0, 1)', () => {
    const rng = cryptoRng();
    const xs = Array.from({ length: 500 }, rng);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(new Set(xs).size).toBeGreaterThan(490);
  });
});

describe('shuffle', () => {
  it('keeps every item (Fisher–Yates permutation)', () => {
    const items = Array.from({ length: 52 }, (_, i) => i);
    const out = shuffle([...items], mulberry32(7));
    expect([...out].sort((a, b) => a - b)).toEqual(items);
    expect(out).not.toEqual(items);
  });

  it('is roughly uniform', () => {
    // Where does item 0 of a 4-item list end up? Each slot should get ~25%.
    const rng = mulberry32(123);
    const counts = [0, 0, 0, 0];
    const runs = 8000;
    for (let i = 0; i < runs; i++) counts[shuffle([0, 1, 2, 3], rng).indexOf(0)]!++;
    for (const c of counts) expect(Math.abs(c / runs - 0.25)).toBeLessThan(0.02);
  });
});

describe('dealRandom', () => {
  it('deals 13 distinct cards to each seat', () => {
    const deal = dealRandom(mulberry32(1));
    for (const s of SEATS) expect(deal[s]).toHaveLength(13);
    expect(allIndexes(deal)).toEqual(Array.from({ length: 52 }, (_, i) => i));
    expect(validateDeal(deal, { full: true })).toBeNull();
  });

  it('is reproducible with a seed and varies between seeds', () => {
    expect(dealRandom(mulberry32(99))).toEqual(dealRandom(mulberry32(99)));
    expect(dealRandom(mulberry32(99))).not.toEqual(dealRandom(mulberry32(100)));
  });

  it('uses crypto randomness by default', () => {
    const deal = dealRandom();
    expect(validateDeal(deal, { full: true })).toBeNull();
  });
});

describe('withStrongerSouth', () => {
  it('swaps N and S when North has more HCP', () => {
    const deal = parseDealPbn(
      'N:AKQJ.AKQ.AKQ.AKQ T987.JT9.JT9.JT9 6543.876.876.876 2.5432.5432.5432',
    );
    expect(hcp(deal.N)).toBeGreaterThan(hcp(deal.S));
    const out = withStrongerSouth(deal);
    expect(out.S).toBe(deal.N);
    expect(out.N).toBe(deal.S);
    expect(out.E).toBe(deal.E);
    expect(out.W).toBe(deal.W);
  });

  it('keeps the deal when South is at least as strong', () => {
    for (let seed = 0; seed < 50; seed++) {
      const out = withStrongerSouth(dealRandom(mulberry32(seed)));
      expect(hcp(out.S)).toBeGreaterThanOrEqual(hcp(out.N));
    }
    const equal = parseDealPbn('N:A... ...A ..A. .A..');
    expect(withStrongerSouth(equal)).toBe(equal);
  });
});

describe('validateDeal', () => {
  it('accepts equal partial hands', () => {
    const deal = parseDealPbn('N:AK... QJ... T9... 87...');
    expect(handSize(deal)).toBe(2);
    expect(validateDeal(deal)).toBeNull();
    expect(validateDeal(deal, { full: true })).toMatch(/13 cards/);
  });

  it('rejects unequal hands, duplicates and empty hands', () => {
    const base = { N: parseHand('AK...'), E: parseHand('QJ...'), S: parseHand('T9...') };
    expect(validateDeal({ ...base, W: parseHand('8...') })).toMatch(/W has 1 cards/);
    expect(validateDeal({ ...base, W: parseHand('8A...') })).toMatch(/SA appears more than once/);
    expect(validateDeal({ N: [], E: [], S: [], W: [] })).toMatch(/1–13/);
  });
});
