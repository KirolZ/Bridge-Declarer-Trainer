// What the bidder sees of a hand (SPEC §6.5): points, suit lengths, shape, aces, stoppers.

import type { Card, Suit } from '../engine';
import { SUITS, hcp } from '../engine';

export type HandEval = {
  readonly hcp: number;
  readonly len: Readonly<Record<Suit, number>>;
  /** High-card points in each suit (for the quality of a suit to overcall in). */
  readonly suitHcp: Readonly<Record<Suit, number>>;
  /** 4-3-3-3, 4-4-3-2 or 5-3-3-2. */
  readonly balanced: boolean;
  readonly aces: number;
  /** A, Kx, Qxx or Jxxx (or better) in the suit: the opponents cannot run it at once in notrump. */
  readonly stoppers: Readonly<Record<Suit, boolean>>;
};

const BALANCED_SHAPES = new Set(['4333', '4432', '5332']);

/** Fewest cards that make each honour a stopper: A alone, K with one more, Q with two, J with three. */
const STOPPER_LENGTH: Readonly<Record<number, number>> = { 14: 1, 13: 2, 12: 3, 11: 4 };

export function evaluate(cards: readonly Card[]): HandEval {
  const len = { S: 0, H: 0, D: 0, C: 0 } as Record<Suit, number>;
  const suitHcp = { S: 0, H: 0, D: 0, C: 0 } as Record<Suit, number>;
  for (const c of cards) {
    len[c.suit]++;
    suitHcp[c.suit] += hcp([c]);
  }
  const stoppers = { S: false, H: false, D: false, C: false } as Record<Suit, boolean>;
  for (const c of cards) {
    const need = STOPPER_LENGTH[c.rank];
    if (need !== undefined && len[c.suit] >= need) stoppers[c.suit] = true;
  }
  const shape = SUITS.map((s) => len[s])
    .sort((a, b) => b - a)
    .join('');
  return {
    hcp: hcp(cards),
    len,
    suitHcp,
    balanced: BALANCED_SHAPES.has(shape),
    aces: cards.filter((c) => c.rank === 14).length,
    stoppers,
  };
}
