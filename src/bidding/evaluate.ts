// What the bidder sees of a hand (SPEC §6.5): points, suit lengths, shape, aces.

import type { Card, Suit } from '../engine';
import { SUITS, hcp } from '../engine';

export type HandEval = {
  readonly hcp: number;
  readonly len: Readonly<Record<Suit, number>>;
  /** 4-3-3-3, 4-4-3-2 or 5-3-3-2. */
  readonly balanced: boolean;
  readonly aces: number;
};

const BALANCED_SHAPES = new Set(['4333', '4432', '5332']);

export function evaluate(cards: readonly Card[]): HandEval {
  const len = { S: 0, H: 0, D: 0, C: 0 } as Record<Suit, number>;
  for (const c of cards) len[c.suit]++;
  const shape = SUITS.map((s) => len[s])
    .sort((a, b) => b - a)
    .join('');
  return {
    hcp: hcp(cards),
    len,
    balanced: BALANCED_SHAPES.has(shape),
    aces: cards.filter((c) => c.rank === 14).length,
  };
}
