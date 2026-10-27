// Brute-force minimax reference (SPEC §5.3). Deliberately naive: it tries every legal card at
// every turn with no pruning, bounds or caching, so it is only usable on small end positions.
// The fast solver is tested against it.

import type { Card, PlayedCard, Seat, Strain } from '../engine';
import { SEATS, nextSeat, sideOf, trickWinner } from '../engine';
import type { Position } from './position';
import { assertValidPosition, legalCards } from './position';

type Hands = Record<Seat, Card[]>;

/** NS tricks from `pos` to the end of play with best play by both sides. */
export function referenceSolve(pos: Position): number {
  assertValidPosition(pos);
  return minimax(copyHands(pos), pos.trump, [...pos.trick], pos.toPlay);
}

/** Every legal card for the seat to play, with the NS tricks that follow it. */
export function referenceAnalyze(pos: Position): { card: Card; nsTricks: number }[] {
  assertValidPosition(pos);
  return legalCards(pos).map((card) => {
    const hands = copyHands(pos);
    hands[pos.toPlay] = hands[pos.toPlay].filter((c) => c !== card);
    const trick = [...pos.trick, { seat: pos.toPlay, card }];
    return { card, nsTricks: minimax(hands, pos.trump, trick, nextSeat(pos.toPlay)) };
  });
}

function copyHands(pos: Position): Hands {
  const hands = {} as Hands;
  for (const seat of SEATS) hands[seat] = [...pos.hands[seat]];
  return hands;
}

/**
 * NS tricks from here to the end, `seat` to play next to `trick`. Hands are modified while
 * searching and restored before returning.
 */
function minimax(hands: Hands, trump: Strain, trick: PlayedCard[], seat: Seat): number {
  if (trick.length === 4) {
    const winner = trickWinner(trick, trump);
    return (sideOf(winner) === 'NS' ? 1 : 0) + minimax(hands, trump, [], winner);
  }
  const hand = hands[seat];
  if (hand.length === 0) return 0; // every hand is empty
  const led = trick[0]?.card.suit;
  const mustFollow = led !== undefined && hand.some((c) => c.suit === led);
  const ns = sideOf(seat) === 'NS';
  let best = ns ? -Infinity : Infinity;
  for (let i = 0; i < hand.length; i++) {
    const card = hand[i] as Card;
    if (mustFollow && card.suit !== led) continue;
    hand.splice(i, 1);
    const v = minimax(hands, trump, [...trick, { seat, card }], nextSeat(seat));
    hand.splice(i, 0, card);
    best = ns ? Math.max(best, v) : Math.min(best, v);
  }
  return best;
}
