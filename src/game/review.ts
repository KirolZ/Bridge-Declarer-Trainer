// Post-hand analysis (SPEC §7.5): where the player lost tricks against double-dummy play, and
// which cards would have kept them. Built from the `analyze` results the play store keeps.
// The defenders always play a DD-best card, so the NS value only ever drops on the player's
// cards (or on a claim for fewer tricks than the position was worth).

import type { Card, PlayState, Seat } from '../engine';
import { sideOf, toPlay, tricksWon } from '../engine';
import type { CardAnalysis } from '../solver';
import { playerDdLog } from './ddLog';

type Analyses = Readonly<Record<number, readonly CardAnalysis[]>>;

/** A card of the player's that cost tricks. */
export type CardLoss = {
  readonly kind: 'card';
  /** Index of the card in `play.plays`. */
  readonly index: number;
  /** Trick it was played to (1-based). */
  readonly trick: number;
  readonly seat: Seat;
  readonly card: Card;
  /** NS tricks for the whole hand with best play, before / after the card. */
  readonly before: number;
  readonly after: number;
  readonly lost: number;
  /** The cards that would have kept `before` (from `analyze`). */
  readonly best: readonly Card[];
};

/** An accepted claim for fewer tricks than best play still makes (taken as claimed). */
export type ClaimLoss = {
  readonly kind: 'claim';
  /** Number of cards played when the claim was made. */
  readonly index: number;
  readonly trick: number;
  readonly seat: Seat;
  /** NS tricks for the whole hand: as claimed / with best play from the claim point. */
  readonly claimed: number;
  readonly before: number;
  readonly lost: number;
  readonly best: readonly Card[];
};

export type Loss = CardLoss | ClaimLoss;

export type HandReview = {
  /** NS tricks with best play from the opening lead (null until known). */
  readonly ddTricks: number | null;
  /** NS tricks at the end of the hand (counting an accepted claim). */
  readonly nsTricks: number;
  /** Where tricks were lost, in order of play. */
  readonly losses: readonly Loss[];
  /** Sum of `losses[].lost`. */
  readonly lost: number;
  /** Every analysis the review needs is in; otherwise `reviewKeys` lists what to fetch. */
  readonly complete: boolean;
};

function prefix(play: PlayState, n: number): PlayState {
  return { ...play, plays: play.plays.slice(0, n) };
}

const bestValue = (lines: readonly CardAnalysis[]) => Math.max(...lines.map((l) => l.nsTricks));

const bestCards = (lines: readonly CardAnalysis[]) => {
  const best = bestValue(lines);
  return lines.filter((l) => l.nsTricks === best).map((l) => l.card);
};

/**
 * NS tricks for the whole hand with best play from the position after `n` cards: the side to
 * play picks its best line (EW the fewest NS tricks).
 */
function positionValue(play: PlayState, n: number, lines: readonly CardAnalysis[]): number {
  const at = prefix(play, n);
  const seat = toPlay(at);
  const values = lines.map((l) => l.nsTricks);
  const best = seat && sideOf(seat) === 'EW' ? Math.min(...values) : Math.max(...values);
  return tricksWon(at).NS + best;
}

/** NS tricks for the whole hand with best play after `n` cards, if that position was analysed. */
export function ddValueAt(play: PlayState, analyses: Analyses, n: number): number | null {
  const lines = analyses[n];
  return lines && lines.length > 0 ? positionValue(play, n, lines) : null;
}

/**
 * Tricks to step through when replaying the hand: every trick played, plus the trick a claim
 * was made in (possibly with no card played to it yet).
 */
export function replayTrickCount(play: PlayState, claimed: boolean): number {
  const full = Math.floor(play.plays.length / 4);
  return claimed ? full + 1 : full;
}

/**
 * Positions (as numbers of cards played) whose analysis the review needs: the opening lead, each
 * card of the player's, and the claim point when the hand ended with a claim.
 */
export function reviewKeys(play: PlayState, claimed: boolean): number[] {
  const keys = new Set<number>([0]);
  play.plays.forEach(({ seat }, i) => {
    if (sideOf(seat) === 'NS') keys.add(i);
  });
  if (claimed) keys.add(play.plays.length);
  return [...keys].sort((a, b) => a - b);
}

/** The review of the hand in `play`; `claimed` = NS tricks of an accepted claim, or null. */
export function reviewHand(
  play: PlayState,
  analyses: Analyses,
  claimed: number | null,
): HandReview {
  const losses: Loss[] = [];
  let complete = true;

  for (const e of playerDdLog(play, analyses)) {
    if (e.before === null || e.after === null) {
      complete = false;
      continue;
    }
    if (e.after < e.before) {
      losses.push({
        kind: 'card',
        index: e.index,
        trick: Math.floor(e.index / 4) + 1,
        seat: e.seat,
        card: e.card,
        before: e.before,
        after: e.after,
        lost: e.before - e.after,
        best: bestCards(analyses[e.index]!),
      });
    }
  }

  if (claimed !== null) {
    const n = play.plays.length;
    const before = ddValueAt(play, analyses, n);
    if (before === null) {
      complete = false;
    } else {
      const lines = analyses[n]!;
      if (claimed < before) {
        losses.push({
          kind: 'claim',
          index: n,
          trick: Math.floor(n / 4) + 1,
          seat: toPlay(prefix(play, n)) ?? 'S',
          claimed,
          before,
          lost: before - claimed,
          best: bestCards(lines),
        });
      }
    }
  }

  const ddTricks = ddValueAt(play, analyses, 0);
  if (ddTricks === null) complete = false;

  return {
    ddTricks,
    nsTricks: claimed ?? tricksWon(play).NS,
    losses,
    lost: losses.reduce((sum, l) => sum + l.lost, 0),
    complete,
  };
}
