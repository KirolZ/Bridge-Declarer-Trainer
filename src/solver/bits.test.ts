import { describe, expect, it } from 'vitest';
import { cardCode, mulberry32, sortHand } from '../engine';
import type { Position } from './position';
import {
  NT,
  codeToCard,
  cardToCode,
  handLength,
  packPosition,
  popcount,
  unpackPosition,
} from './bits';
import { randomPosition } from './testing';

const normalize = (pos: Position) => ({
  hands: Object.fromEntries(
    Object.entries(pos.hands).map(([seat, cards]) => [seat, sortHand(cards, 'rank').map(cardCode)]),
  ),
  trump: pos.trump,
  trick: pos.trick.map((p) => `${p.seat}:${cardCode(p.card)}`),
  toPlay: pos.toPlay,
});

describe('bitmask representation', () => {
  it('codes cards as (suit << 4) | (rank - 2)', () => {
    expect(cardToCode({ suit: 'S', rank: 14 })).toBe(12);
    expect(cardToCode({ suit: 'H', rank: 2 })).toBe(16);
    expect(cardToCode({ suit: 'C', rank: 10 })).toBe(56);
    expect(codeToCard(56)).toEqual({ suit: 'C', rank: 10 });
  });

  it('counts bits', () => {
    expect(popcount(0)).toBe(0);
    expect(popcount(0b1011)).toBe(3);
    expect(popcount(0x1fff)).toBe(13);
  });

  it('packs hands one mask per seat per suit', () => {
    const p = packPosition({
      hands: {
        N: [
          { suit: 'S', rank: 14 },
          { suit: 'S', rank: 2 },
        ],
        E: [
          { suit: 'H', rank: 13 },
          { suit: 'C', rank: 3 },
        ],
        S: [
          { suit: 'D', rank: 12 },
          { suit: 'D', rank: 11 },
        ],
        W: [
          { suit: 'C', rank: 10 },
          { suit: 'H', rank: 9 },
        ],
      },
      trump: 'NT',
      trick: [],
      toPlay: 'W',
    });
    const seat = (i: number) => [...p.hands.subarray(i * 4, i * 4 + 4)];
    expect(seat(0)).toEqual([(1 << 12) | 1, 0, 0, 0]); // N ♠A2
    expect(seat(1)).toEqual([0, 1 << 11, 0, 1 << 1]); // E ♥K ♣3
    expect(seat(2)).toEqual([0, 0, (1 << 10) | (1 << 9), 0]); // S ♦QJ
    expect(seat(3)).toEqual([0, 1 << 7, 0, 1 << 8]); // W ♥9 ♣T
    expect(p.trump).toBe(NT);
    expect(p.toPlay).toBe(3);
    expect(handLength(p.hands, 0)).toBe(2);
  });

  it('round-trips random positions, including tricks in progress', () => {
    const rng = mulberry32(31);
    for (let i = 0; i < 500; i++) {
      const pos = randomPosition(rng, { maxCards: 13 });
      const back = unpackPosition(packPosition(pos));
      expect(normalize(back)).toEqual(normalize(pos));
    }
  });
});
