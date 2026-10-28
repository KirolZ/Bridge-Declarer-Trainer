// Play exercises of the guide (SPEC §7.7): played out on a play store against the double-dummy
// defenders. Passed with the goal or more; on a miss, the mistake is the first card of the
// player's after which the goal could no longer be made (the post-hand review of §7.5).

import type { Card, PlayState, PlayedCard, Seat } from '../engine';
import { applyPlay, isComplete, parseCardCode, sideOf, toPlay, tricksWon } from '../engine';
import { chooseDefenderCard, dealSeed } from '../bot';
import type { PlayExercise } from '../learn';
import { exerciseCards, exerciseContract, exerciseDeal, exerciseStart, wrongNote } from '../learn';
import type { CardAnalysis, Position } from '../solver';
import { positionFromPlayState } from '../solver/position';
import { playerDdLog } from './ddLog';
import type { HandSetup } from './playStore';

export function exerciseHand(ex: PlayExercise): HandSetup {
  return {
    deal: exerciseDeal(ex),
    contract: exerciseContract(ex),
    vulnerability: 'none',
    leader: ex.leader,
    plays: exerciseCards(ex),
  };
}

export type ExerciseMistake = {
  /** Index of the card in `play.plays`. */
  readonly index: number;
  /** Cards played since the exercise started. */
  readonly at: number;
  /** Trick of the exercise it was played to (1-based). */
  readonly trick: number;
  readonly seat: Seat;
  readonly card: Card;
  /** NS tricks with best play before / after the card. */
  readonly before: number;
  readonly after: number;
  /** Cards that kept the goal. */
  readonly best: readonly Card[];
  /** The exercise's note on this card, if it lists it as wrong. */
  readonly why: string | null;
};

export type ExerciseOutcome = {
  /** NS tricks taken. */
  readonly tricks: number;
  readonly passed: boolean;
  /** Set on a miss once the analyses are in. */
  readonly mistake: ExerciseMistake | null;
  /** False while an analysis the mistake needs is missing. */
  readonly complete: boolean;
};

/** Result of a finished play exercise; `analyses` as kept by the play store. */
export function exerciseOutcome(
  ex: PlayExercise,
  play: PlayState,
  analyses: Readonly<Record<number, readonly CardAnalysis[]>>,
): ExerciseOutcome {
  const tricks = tricksWon(play).NS;
  const goal = ex.goal.nsTricks;
  if (tricks >= goal) return { tricks, passed: true, mistake: null, complete: true };

  const start = (ex.plays ?? []).length;
  for (const e of playerDdLog(play, analyses)) {
    if (e.index < start) continue;
    if (e.before === null || e.after === null) {
      return { tricks, passed: false, mistake: null, complete: false };
    }
    if (e.before >= goal && e.after < goal) {
      const lines = analyses[e.index]!;
      const top = Math.max(...lines.map((l) => l.nsTricks));
      return {
        tricks,
        passed: false,
        complete: true,
        mistake: {
          index: e.index,
          at: e.index - start,
          trick: Math.floor(e.index / 4) - Math.floor(start / 4) + 1,
          seat: e.seat,
          card: e.card,
          before: e.before,
          after: e.after,
          best: lines.filter((l) => l.nsTricks === top).map((l) => l.card),
          why: wrongNote(ex, e.index - start, e.card),
        },
      };
    }
  }
  // Only possible if the start position itself cannot make the goal (the tests rule that out).
  return { tricks, passed: false, mistake: null, complete: true };
}

export type Analyze = (pos: Position) => Promise<readonly CardAnalysis[]> | readonly CardAnalysis[];

/**
 * The exercise's winning line from its start: the NS cards of `ex.solution`, and for East / West
 * the card the bot picks (the same bot and seed as the play store, so it is the line the player
 * meets when playing those cards). Throws if a solution card is illegal or missing.
 */
export async function solutionLine(ex: PlayExercise, analyze: Analyze): Promise<PlayedCard[]> {
  let play = exerciseStart(ex);
  const start = play.plays.length;
  const seed = dealSeed(play.deal);
  const ns = ex.solution.map(parseCardCode);
  let next = 0;
  while (!isComplete(play)) {
    const seat = toPlay(play)!;
    let card: Card;
    if (sideOf(seat) === 'NS') {
      const c = ns[next++];
      if (!c) throw new Error(`${ex.id}: solution ends before the hand does`);
      card = c;
    } else {
      const pos = positionFromPlayState(play);
      card = chooseDefenderCard(pos, await analyze(pos), seed);
    }
    play = applyPlay(play, card);
  }
  if (next !== ns.length) throw new Error(`${ex.id}: solution has cards left over`);
  return play.plays.slice(start);
}
