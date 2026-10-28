// Beginner mode on the table (SPEC §7.7, §7.8): which short tip to show at this point of the hand,
// and which guide chapter the `?` button opens. Pure functions of the play state, so undo and
// "play again" need no bookkeeping.

import type { Card, PlayState, Seat, Suit, Trick } from '../engine';
import { completedTricks, currentTrick, remainingHand, sideOf, toPlay, trumpOf } from '../engine';

/** Why a trick was won. */
export type TrickWin = {
  readonly trick: number;
  readonly winner: Seat;
  readonly card: Card;
  readonly led: Suit;
  /** `high`: highest card of the suit led; `ruff`: the only trump; `overruff`: highest of several. */
  readonly how: 'high' | 'ruff' | 'overruff';
  /** Someone played another suit without trumping (it could not win). */
  readonly discard: boolean;
};

export function trickWin(
  trick: Trick,
  n: number,
  trump: PlayState['contract']['strain'],
): TrickWin {
  const winner = trick.winner;
  if (winner === null) throw new Error('trick is not complete');
  const led = trick.plays[0]!.card.suit;
  const card = trick.plays.find((p) => p.seat === winner)!.card;
  const trumps = trick.plays.filter((p) => p.card.suit === trump).length;
  const ruffed = trump !== 'NT' && led !== trump && card.suit === trump;
  return {
    trick: n,
    winner,
    card,
    led,
    how: ruffed ? (trumps > 1 ? 'overruff' : 'ruff') : 'high',
    discard: trick.plays.some((p) => p.card.suit !== led && p.card.suit !== trump),
  };
}

export type CoachTip =
  /** Hand start: the contract, tricks needed and trumps. */
  | { readonly id: 'contract' }
  /** After the opening lead: dummy is face up and you pick its cards. */
  | { readonly id: 'dummy' }
  /** North to play: click dummy's cards at the top. */
  | { readonly id: 'north-turn' }
  /** A trick won by a trump on another suit: why it won. */
  | { readonly id: 'ruff'; readonly win: TrickWin }
  /** End of one of the first 3 tricks: who won and why. */
  | { readonly id: 'trick-won'; readonly win: TrickWin };

export type CoachTipId = CoachTip['id'];

/** Tricks explained by `trick-won` (SPEC §7.8: the first 2–3). */
export const EXPLAINED_TRICKS = 3;

/**
 * The tip to show now, or null. Each tip shows from its moment until dismissed for good
 * (`dismissed`); several pending tips show one at a time, the one to act on first (North to
 * play), then in the order they came up. `trick-won` always explains the last trick finished.
 */
export function coachTip(play: PlayState, dismissed: readonly string[]): CoachTip | null {
  const open = (id: CoachTipId) => !dismissed.includes(id);
  const seat = toPlay(play);
  const trump = trumpOf(play);
  const done = completedTricks(play);

  if (seat === 'N' && open('north-turn')) return { id: 'north-turn' };
  if (open('contract')) return { id: 'contract' };
  if (play.plays.length > 0 && open('dummy')) return { id: 'dummy' };

  const wins = done.map((t, i) => trickWin(t, i + 1, trump));
  const ruff = wins.find((w) => w.how !== 'high');
  if (ruff && open('ruff')) return { id: 'ruff', win: ruff };

  const last = wins.at(-1);
  if (last && last.trick <= EXPLAINED_TRICKS && open('trick-won')) {
    return { id: 'trick-won', win: last };
  }
  return null;
}

/**
 * The guide chapter about the situation at the table (SPEC §7.7), for the `?` button: the
 * contract before play, dummy when North is to play, following suit / trumping when a trick is
 * under way, planning when the player leads, scoring when the hand is over.
 */
export function guideChapterFor(play: PlayState, over: boolean): number {
  if (over) return 6;
  if (play.plays.length === 0) return 4;
  const seat = toPlay(play);
  if (seat === 'N') return 5;
  const trick = currentTrick(play);
  const led = trick[0]?.card.suit;
  if (seat === null || sideOf(seat) === 'EW') return 2;
  if (led === undefined) {
    // Leading: right after a ruff, explain trumps; otherwise plan the play.
    const last = completedTricks(play).at(-1);
    if (last && trickWin(last, 0, trumpOf(play)).how !== 'high') return 3;
    return 7;
  }
  const canFollow = remainingHand(play, seat).some((c) => c.suit === led);
  return canFollow || trumpOf(play) === 'NT' ? 2 : 3;
}
