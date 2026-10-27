import { describe, expect, it } from 'vitest';
import type { Strain } from '../engine';
import { applyPlay, cardCode, newPlayState, parseCardCode, parseDealPbn } from '../engine';
import { positionFromPlayState, validatePosition } from './position';
import { referenceAnalyze, referenceSolve } from './reference';
import { positionFromPbn as pos } from './testing';

// Spade finesse: North AQ over West's K (South leads small).
const FINESSE = 'N:AQ... ..43. 32... K4...';
// Same cards, but East holds the king.
const FINESSE_OFFSIDE = 'N:AQ... K4... 32... ..43.';
// Simple squeeze against West: ♣A forces West to give up ♥K guard or ♦Q.
const SQUEEZE = 'N:2.AQ.. KQJ... .3.J.A .K9.Q.';

describe('reference solver (hand-checked positions)', () => {
  it('scores a lone winner and a ruff', () => {
    expect(referenceSolve(pos('N:A... 2... 3... 4...', 'NT', 'W'))).toBe(1);
    expect(referenceSolve(pos('N:.2.. A... 3... 4...', 'NT', 'E'))).toBe(0);
    expect(referenceSolve(pos('N:.2.. A... 3... 4...', 'H', 'E'))).toBe(1);
  });

  it('handles an overruff', () => {
    // East leads ♠A, South ruffs with ♥2, West overruffs with ♥3.
    expect(referenceSolve(pos('N:...2 A... .2.. .3..', 'H', 'E'))).toBe(0);
    // In NT nobody can ruff: East's ace wins.
    expect(referenceSolve(pos('N:...2 A... .2.. .3..', 'NT', 'E'))).toBe(0);
    // With clubs trump, North's ♣2 ruffs last and wins.
    expect(referenceSolve(pos('N:...2 A... .2.. .3..', 'C', 'E'))).toBe(1);
  });

  it('takes a finesse only when the king is onside', () => {
    expect(referenceSolve(pos(FINESSE, 'NT', 'S'))).toBe(2);
    expect(referenceSolve(pos(FINESSE_OFFSIDE, 'NT', 'S'))).toBe(1);
    // Leading from the AQ side gives up the finesse.
    expect(referenceSolve(pos(FINESSE, 'NT', 'N'))).toBe(1);
  });

  it('starts in the middle of a trick', () => {
    expect(
      referenceSolve(pos(FINESSE.replace('32', '3').replace('K4', 'K'), 'NT', 'N', ['S2', 'S4'])),
    ).toBe(2);
    expect(
      referenceAnalyze(
        pos(FINESSE.replace('32', '3').replace('K4', 'K'), 'NT', 'N', ['S2', 'S4']),
      ).map((a) => `${cardCode(a.card)}=${a.nsTricks}`),
    ).toEqual(['SA=1', 'SQ=2']);
  });

  it('finds a simple squeeze', () => {
    expect(referenceSolve(pos(SQUEEZE, 'NT', 'S'))).toBe(3);
    const lines = referenceAnalyze(pos(SQUEEZE, 'NT', 'S'));
    expect(Object.fromEntries(lines.map((a) => [cardCode(a.card), a.nsTricks]))).toEqual({
      CA: 3,
      DJ: 2,
      H3: 2,
    });
  });
});

describe('positions', () => {
  it('builds a position from a hand in play', () => {
    let state = newPlayState(parseDealPbn(FINESSE), { level: 1, strain: 'NT', declarer: 'S' }, 'S');
    state = applyPlay(state, parseCardCode('S2'));
    const p = positionFromPlayState(state);
    expect(p.toPlay).toBe('W');
    expect(p.trick).toEqual([{ seat: 'S', card: parseCardCode('S2') }]);
    expect(p.hands.S.map(cardCode)).toEqual(['S3']);
    expect(validatePosition(p)).toBeNull();
  });

  it('rejects positions that cannot arise in play', () => {
    const ok = pos(FINESSE, 'NT', 'S');
    expect(validatePosition(ok)).toBeNull();
    // Trick card played by the wrong seat.
    expect(
      validatePosition({ ...ok, trick: [{ seat: 'N', card: parseCardCode('S2') }], toPlay: 'W' }),
    ).toMatch(/played by S/);
    // Hand sizes do not match the trick.
    expect(
      validatePosition({ ...ok, toPlay: 'W', trick: [{ seat: 'S', card: parseCardCode('S5') }] }),
    ).toMatch(/should hold/);
    // Card both in a hand and in the trick.
    expect(validatePosition(pos('N:AQ... ..43. 3... K4...', 'NT', 'W', ['SA']))).toMatch(
      /should hold|more than once/,
    );
    expect(validatePosition({ ...ok, trump: 'X' as Strain })).toMatch(/bad trump/);
    expect(() => referenceSolve({ ...ok, hands: { ...ok.hands, W: [] } })).toThrow(
      /W should hold 2/,
    );
  });
});
