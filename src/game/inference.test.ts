import { describe, expect, it } from 'vitest';
import type { Auction, Call, Level } from '../engine';
import { parseHand } from '../engine';
import type { Meaning } from '../bidding';
import { NOTHING_SHOWN, explainAuction } from '../bidding';
import { infer, shownBySeat } from './inference';

const bid = (level: Level, strain: 'C' | 'D' | 'H' | 'S' | 'NT'): Call => ({
  kind: 'bid',
  level,
  strain,
});
const PASS: Call = { kind: 'pass' };

// 24 HCP between them: South 14, North 10. ♥: South 3, North 2 → 8 hearts out of sight.
const SOUTH = parseHand('AKJ2.A32.Q32.432');
const NORTH = parseHand('J543.54.AQ54.K65');

describe('shownBySeat', () => {
  it('stacks every meaning of a seat and leaves the others untouched', () => {
    const auction: Auction = { dealer: 'E', calls: [bid(1, 'H'), PASS, PASS, PASS] };
    const meanings: (Meaning | null)[] = [
      { name: 'opening', hcp: [12, 21], len: { H: [5, 13] } },
      { name: 'pass', hcp: [0, 15] },
      { name: 'pass', hcp: [0, 5] },
      null,
    ];
    const shown = shownBySeat(auction, meanings);
    expect(shown.E.hcp).toEqual([12, 21]);
    expect(shown.E.len.H).toEqual([5, 13]);
    expect(shown.S.hcp).toEqual([0, 15]);
    expect(shown.W.hcp).toEqual([0, 5]);
    expect(shown.N).toEqual(NOTHING_SHOWN);
  });
});

describe('infer', () => {
  const shown = {
    N: NOTHING_SHOWN,
    S: NOTHING_SHOWN,
    E: {
      ...NOTHING_SHOWN,
      hcp: [12, 21] as const,
      len: { ...NOTHING_SHOWN.len, H: [5, 13] as const },
    },
    W: { ...NOTHING_SHOWN, hcp: [0, 5] as const },
  };

  it('shares the points and cards out of sight between the hidden hands', () => {
    const out = infer(shown, { S: SOUTH, N: NORTH });
    expect(Object.keys(out).sort()).toEqual(['E', 'W']);
    // 16 HCP left: East 12+ leaves West at most 4, so East has at least 12 and at most 16.
    expect(out.E!.hcp).toEqual([12, 16]);
    expect(out.W!.hcp).toEqual([0, 4]);
    // 8 hearts out of sight: East 5+ leaves West at most 3.
    expect(out.E!.len.H).toEqual([5, 8]);
    expect(out.W!.len.H).toEqual([0, 3]);
    expect(out.W!.unseen.H).toBe(8);
    // Nothing said about spades: 5 out of sight, anywhere.
    expect(out.W!.len.S).toEqual([0, 5]);
  });

  it('counts only what is in sight: with dummy face down, North is a hidden hand too', () => {
    const out = infer(shown, { S: SOUTH });
    expect(Object.keys(out).sort()).toEqual(['E', 'N', 'W']);
    // 26 HCP left among three hands; East and West ranges are only cut by what they showed.
    expect(out.E!.hcp).toEqual([12, 21]);
    expect(out.W!.hcp).toEqual([0, 5]);
    expect(out.N!.hcp).toEqual([0, 14]);
    expect(out.E!.len.H).toEqual([5, 10]);
  });

  it('falls back to the auction alone when it cannot be true of the cards in sight', () => {
    // East "showed" 22+ HCP but only 16 are out of sight.
    const wrong = { ...shown, E: { ...shown.E, hcp: [22, 37] as const } };
    const out = infer(wrong, { S: SOUTH, N: NORTH });
    expect(out.E!.hcp).toEqual([22, 37]);
    expect(out.W!.hcp).toEqual([0, 5]);
  });

  it('works on the meanings the bidder gives a real auction', () => {
    // East opens 1♥ in third seat, South overcalls 1♠, West raises, North raises, all pass.
    const auction: Auction = {
      dealer: 'N',
      calls: [PASS, bid(1, 'H'), bid(1, 'S'), bid(2, 'H'), bid(2, 'S'), PASS, PASS, PASS],
    };
    const meanings = explainAuction(auction, 'none');
    // 20 HCP between South (12, five spades) and North (8): 20 out of sight.
    const south = parseHand('AKJ32.A32.32.432');
    const north = parseHand('Q54.54.Q654.KJ54');
    const out = infer(shownBySeat(auction, meanings), { S: south, N: north });
    const e = out.E!;
    const w = out.W!;
    expect(e.hcp[0]).toBeGreaterThanOrEqual(12);
    expect(e.len.H[0]).toBeGreaterThanOrEqual(5);
    expect(w.len.H[0]).toBeGreaterThanOrEqual(3);
    // Between them they hold the 20 HCP out of sight.
    expect(e.hcp[0] + w.hcp[1]).toBe(20);
    expect(e.hcp[1] + w.hcp[0]).toBe(20);
    expect(w.hcp[0]).toBeGreaterThan(0);
  });
});
