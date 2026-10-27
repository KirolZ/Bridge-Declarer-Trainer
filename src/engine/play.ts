// Card play (SPEC §4.2). PlayState is immutable; everything is derived from `plays`,
// so undo is just dropping plays from the end.

import type { Card, Contract, Deal, Seat, Side, Strain, Suit } from './card';
import { SEATS, nextSeat, sameCard, sideOf } from './card';
import { assertValidDeal, handSize } from './deal';

export type PlayedCard = { readonly seat: Seat; readonly card: Card };

export type PlayState = {
  /** Hands at the start of play (never changes). */
  readonly deal: Deal;
  readonly contract: Contract;
  /** Every card played so far, in order. */
  readonly plays: readonly PlayedCard[];
  /** Who leads to the first trick. Defaults to the declarer's left-hand opponent (West). */
  readonly leader?: Seat;
};

export type Trick = {
  readonly leader: Seat;
  readonly plays: readonly PlayedCard[];
  /** Set once all four cards are in. */
  readonly winner: Seat | null;
};

export type TrickCount = Record<Side, number>;

/** Start play. Validates that the deal has equal hands of 1–13 cards with no duplicates. */
export function newPlayState(deal: Deal, contract: Contract, leader?: Seat): PlayState {
  assertValidDeal(deal);
  return leader === undefined
    ? { deal, contract, plays: [] }
    : { deal, contract, plays: [], leader };
}

export function openingLeader(state: PlayState): Seat {
  return state.leader ?? nextSeat(state.contract.declarer);
}

export function trumpOf(state: PlayState): Strain {
  return state.contract.strain;
}

/** Total tricks in this hand (= cards per hand). */
export function totalTricks(state: PlayState): number {
  return handSize(state.deal);
}

/** Winner of a complete trick: highest trump, otherwise highest card of the suit led. */
export function trickWinner(plays: readonly PlayedCard[], trump: Strain): Seat {
  const first = plays[0];
  if (!first) throw new Error('trickWinner: empty trick');
  let best = first;
  for (const p of plays) {
    if (beats(p.card, best.card, trump)) best = p;
  }
  return best.seat;
}

function beats(a: Card, b: Card, trump: Strain): boolean {
  if (a.suit === b.suit) return a.rank > b.rank;
  return a.suit === trump;
}

/** All tricks so far, in order; the last one may be in progress. */
export function tricks(state: PlayState): Trick[] {
  const trump = trumpOf(state);
  const out: Trick[] = [];
  let leader = openingLeader(state);
  for (let i = 0; i < state.plays.length; i += 4) {
    const plays = state.plays.slice(i, i + 4);
    const winner = plays.length === 4 ? trickWinner(plays, trump) : null;
    out.push({ leader, plays, winner });
    if (winner) leader = winner;
  }
  return out;
}

/** Tricks with all four cards played. */
export function completedTricks(state: PlayState): Trick[] {
  return tricks(state).filter((t) => t.winner !== null);
}

/**
 * Cards played to the trick in progress (0–3). Right after the fourth card of a trick this is
 * empty; use `completedTricks` to show the trick that just finished.
 */
export function currentTrick(state: PlayState): PlayedCard[] {
  const n = state.plays.length % 4;
  return state.plays.slice(state.plays.length - n);
}

export function isComplete(state: PlayState): boolean {
  return state.plays.length >= 4 * totalTricks(state);
}

/** Seat whose turn it is, or null when play is over. */
export function toPlay(state: PlayState): Seat | null {
  if (isComplete(state)) return null;
  const trick = currentTrick(state);
  const first = trick[0];
  if (first) return nextSeat(first.seat, trick.length);
  const last = completedTricks(state).at(-1);
  return last?.winner ?? openingLeader(state);
}

/** Cards still held by `seat`, in their original order. */
export function remainingHand(state: PlayState, seat: Seat): Card[] {
  const played = state.plays.filter((p) => p.seat === seat).map((p) => p.card);
  return state.deal[seat].filter((c) => !played.some((p) => sameCard(p, c)));
}

export function remainingHands(state: PlayState): Deal {
  const out = {} as Deal;
  for (const seat of SEATS) out[seat] = remainingHand(state, seat);
  return out;
}

export function tricksWon(state: PlayState): TrickCount {
  const count: TrickCount = { NS: 0, EW: 0 };
  for (const t of completedTricks(state)) count[sideOf(t.winner as Seat)]++;
  return count;
}

export type IllegalReason =
  | { code: 'hand-complete' }
  | { code: 'not-in-hand'; seat: Seat }
  | { code: 'must-follow-suit'; suit: Suit };

/** Why `card` can't be played now by the seat to play, or null if it is legal. */
export function illegalReason(state: PlayState, card: Card): IllegalReason | null {
  const seat = toPlay(state);
  if (seat === null) return { code: 'hand-complete' };
  const hand = remainingHand(state, seat);
  if (!hand.some((c) => sameCard(c, card))) return { code: 'not-in-hand', seat };
  const led = currentTrick(state)[0]?.card.suit;
  if (led !== undefined && card.suit !== led && hand.some((c) => c.suit === led)) {
    return { code: 'must-follow-suit', suit: led };
  }
  return null;
}

/** Cards the seat to play may play (empty when play is over). */
export function legalPlays(state: PlayState): Card[] {
  const seat = toPlay(state);
  if (seat === null) return [];
  const hand = remainingHand(state, seat);
  const led = currentTrick(state)[0]?.card.suit;
  const follow = led === undefined ? [] : hand.filter((c) => c.suit === led);
  return follow.length > 0 ? follow : hand;
}

/** Play `card` for the seat to play. Throws if the play is illegal. */
export function applyPlay(state: PlayState, card: Card): PlayState {
  const reason = illegalReason(state, card);
  if (reason) throw new Error(`illegal play: ${reason.code}`);
  const seat = toPlay(state) as Seat;
  return { ...state, plays: [...state.plays, { seat, card }] };
}
