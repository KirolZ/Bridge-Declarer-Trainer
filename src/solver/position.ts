// Solver input (SPEC §5.1): a position anywhere in the play, possibly in the middle of a trick.

import type { Card, PlayState, PlayedCard, Seat, Strain } from '../engine';
import {
  SEATS,
  STRAINS,
  cardCode,
  cardIndex,
  completedTricks,
  currentTrick,
  nextSeat,
  remainingHands,
  toPlay,
} from '../engine';

export type Position = {
  /** Cards still held (hands that already played to the current trick hold one card fewer). */
  readonly hands: Readonly<Record<Seat, readonly Card[]>>;
  readonly trump: Strain;
  /** Cards already played to the current trick (0–3), in play order. */
  readonly trick: readonly PlayedCard[];
  readonly toPlay: Seat;
};

/** The position reached in a hand being played. A finished hand gives empty hands. */
export function positionFromPlayState(state: PlayState): Position {
  const seat = toPlay(state) ?? (completedTricks(state).at(-1)?.winner as Seat);
  return {
    hands: remainingHands(state),
    trump: state.contract.strain,
    trick: currentTrick(state),
    toPlay: seat,
  };
}

/**
 * Checks that the position could arise in play: 0–3 trick cards played by consecutive seats
 * ending just before `toPlay`, hands that played to the trick hold one card fewer than the
 * others, and no card appears twice. Returns an error message, or null when valid.
 */
export function validatePosition(pos: Position): string | null {
  if (!STRAINS.includes(pos.trump)) return `bad trump "${String(pos.trump)}"`;
  if (!SEATS.includes(pos.toPlay)) return `bad seat to play "${String(pos.toPlay)}"`;
  const n = pos.trick.length;
  if (n > 3) return `a trick in progress holds 0–3 cards (got ${n})`;
  for (let i = 0; i < n; i++) {
    const expected = nextSeat(pos.toPlay, i - n + 4);
    if (pos.trick[i]?.seat !== expected)
      return `trick card ${i + 1} should be played by ${expected}`;
  }
  const size = pos.hands[pos.toPlay].length;
  if (size > 13) return 'hands hold at most 13 cards';
  if (n > 0 && size === 0) return `${pos.toPlay} has no card to play to the trick`;
  const seen = new Set<number>();
  const add = (c: Card): string | null => {
    const i = cardIndex(c);
    if (!Number.isInteger(i) || i < 0 || i > 51) return 'invalid card';
    if (seen.has(i)) return `${cardCode(c)} appears more than once`;
    seen.add(i);
    return null;
  };
  for (const seat of SEATS) {
    const played = pos.trick.some((p) => p.seat === seat);
    const want = played ? size - 1 : size;
    const hand = pos.hands[seat];
    if (hand.length !== want) return `${seat} should hold ${want} card(s) (holds ${hand.length})`;
    for (const c of hand) {
      const err = add(c);
      if (err) return err;
    }
  }
  for (const p of pos.trick) {
    const err = add(p.card);
    if (err) return err;
  }
  return null;
}

export function assertValidPosition(pos: Position): void {
  const err = validatePosition(pos);
  if (err) throw new Error(`invalid position: ${err}`);
}

/** Cards the seat to play may play: follow the suit led if possible. */
export function legalCards(pos: Position): Card[] {
  const hand = pos.hands[pos.toPlay];
  const led = pos.trick[0]?.card.suit;
  const follow = led === undefined ? [] : hand.filter((c) => c.suit === led);
  return follow.length > 0 ? [...follow] : [...hand];
}
