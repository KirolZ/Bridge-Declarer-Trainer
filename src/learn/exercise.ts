// Exercises on the table: the position they start from and the answers the rules engine gives.

import type { Card, Contract, Deal, PlayState, PlayedCard, Seat } from '../engine';
import {
  SEATS,
  applyPlay,
  completedTricks,
  legalPlays,
  nextSeat,
  newPlayState,
  parseCardCode,
  parseHand,
  sameCard,
  toPlay,
} from '../engine';
import type { CardExercise, LegalExercise, PlayExercise, WinnerExercise } from './types';

export function exerciseDeal(ex: CardExercise): Deal {
  const deal = {} as Deal;
  for (const seat of SEATS) deal[seat] = parseHand(ex.hands[seat]);
  return deal;
}

/**
 * The engine needs a contract; exercises only have a trump suit (and play exercises a goal in
 * tricks), so the level is a placeholder that is never shown or scored.
 */
export function exerciseContract(ex: CardExercise): Contract {
  return { level: 1, strain: ex.trump, declarer: 'S' };
}

export function exerciseCards(ex: CardExercise): Card[] {
  return (ex.plays ?? []).map(parseCardCode);
}

/** The position the exercise starts from. Throws if the data is invalid or a card is illegal. */
export function exerciseStart(ex: CardExercise): PlayState {
  let play = newPlayState(exerciseDeal(ex), exerciseContract(ex), ex.leader);
  for (const c of exerciseCards(ex)) play = applyPlay(play, c);
  return play;
}

/** The seat to play in a "legal" exercise and the cards it may play. */
export function legalAnswer(ex: LegalExercise): { seat: Seat; cards: Card[] } {
  const play = exerciseStart(ex);
  const seat = toPlay(play);
  if (seat === null) throw new Error(`${ex.id}: no one is to play`);
  return { seat, cards: legalPlays(play) };
}

/** Winner of the last complete trick of a "winner" exercise. */
export function winnerAnswer(ex: WinnerExercise): Seat {
  const winner = completedTricks(exerciseStart(ex)).at(-1)?.winner;
  if (!winner) throw new Error(`${ex.id}: no complete trick`);
  return winner;
}

/** What the exercise says about playing `card` after `at` cards, if it marks it wrong. */
export function wrongNote(ex: PlayExercise, at: number, card: Card): string | null {
  const hit = ex.wrong.find((w) => w.at === at && sameCard(parseCardCode(w.card), card));
  return hit?.why ?? null;
}

/** Cards of a trick with their seats, in play order from `leader` (examples in the chapters). */
export function trickPlays(leader: Seat, cards: readonly Card[]): PlayedCard[] {
  return cards.map((card, i) => ({ seat: nextSeat(leader, i), card }));
}
