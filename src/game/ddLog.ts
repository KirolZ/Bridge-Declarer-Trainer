// Double-dummy value before and after each of the player's cards (SPEC §7.5), from the
// `analyze` results the play store keeps.

import type { Card, PlayState, Seat } from '../engine';
import { sameCard, sideOf, tricksWon } from '../engine';
import type { CardAnalysis } from '../solver';

export type PlayerDd = {
  /** Index of the card in `play.plays`. */
  readonly index: number;
  readonly seat: Seat;
  readonly card: Card;
  /** NS tricks for the whole hand with best play from here on, before / after this card. */
  readonly before: number | null;
  readonly after: number | null;
};

/**
 * One entry per card the player (South or North) has played. `before` / `after` are null while
 * the analysis of that position is not in yet (or failed); M10 fills such gaps later.
 */
export function playerDdLog(
  play: PlayState,
  analyses: Readonly<Record<number, readonly CardAnalysis[]>>,
): PlayerDd[] {
  const out: PlayerDd[] = [];
  play.plays.forEach(({ seat, card }, index) => {
    if (sideOf(seat) !== 'NS') return;
    const lines = analyses[index];
    const won = tricksWon({ ...play, plays: play.plays.slice(0, index) }).NS;
    const chosen = lines?.find((l) => sameCard(l.card, card));
    out.push({
      index,
      seat,
      card,
      before: lines && lines.length > 0 ? won + Math.max(...lines.map((l) => l.nsTricks)) : null,
      after: chosen ? won + chosen.nsTricks : null,
    });
  });
  return out;
}
