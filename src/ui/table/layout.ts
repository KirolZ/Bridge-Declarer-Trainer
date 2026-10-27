// Display order and spacing for the table (SPEC §8).

import type { Card, Strain, Suit, SuitOrder } from '../../engine';
import { SUIT_ORDERS } from '../../engine';

const TRUMP_FIRST: Readonly<Record<Suit, readonly Suit[]>> = {
  S: ['S', 'H', 'C', 'D'],
  H: ['H', 'S', 'D', 'C'],
  C: ['C', 'H', 'S', 'D'],
  D: ['D', 'S', 'H', 'C'],
};

/**
 * Suit order for the hands on show. `alternate` (default): black / red alternating (SPEC §4.1),
 * with the trump suit first in a suit contract (as dummy lays trumps on declarer's left).
 * `rank`: always ♠ ♥ ♦ ♣, whatever the contract.
 */
export function displaySuits(trump: Strain, order: SuitOrder = 'alternate'): readonly Suit[] {
  if (order === 'rank') return SUIT_ORDERS.rank;
  return trump === 'NT' ? SUIT_ORDERS.alternate : TRUMP_FIRST[trump];
}

/** `cards` sorted for display: by `displaySuits(trump, order)`, high to low. */
export function sortForDisplay(
  cards: readonly Card[],
  trump: Strain,
  order: SuitOrder = 'alternate',
): Card[] {
  const suits = displaySuits(trump, order);
  return [...cards].sort(
    (a, b) => suits.indexOf(a.suit) - suits.indexOf(b.suit) || b.rank - a.rank,
  );
}

/**
 * Vertical step between cards in a dummy column, as a fraction of the card height: tighter for
 * long suits so dummy stays short. The `row` index needs about the top 22% of a card.
 */
export function dummyStep(longest: number): number {
  if (longest <= 4) return 0.3;
  if (longest <= 6) return 0.26;
  return 0.22;
}
