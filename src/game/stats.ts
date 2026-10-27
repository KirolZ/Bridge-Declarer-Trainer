// Stats (SPEC §7.6): hands played, contracts made, tricks lost against double dummy and hints
// used, kept per strain so they can be shown by suit and NT. Stored as running totals (not a log
// of hands) so the stored value stays small however long someone plays.

import type { Strain } from '../engine';
import { STRAINS, tricksNeeded } from '../engine';
import type { PlayStore, PlayStoreState } from './playStore';
import { isHandOver } from './playStore';
import { reviewHand } from './review';

/** One finished hand, as the stats count it. */
export type HandResult = {
  readonly strain: Strain;
  readonly made: boolean;
  /** Tricks lost against double-dummy play (SPEC §7.5). */
  readonly lost: number;
  readonly hints: number;
};

export type StatLine = {
  readonly hands: number;
  readonly made: number;
  readonly lost: number;
  readonly hints: number;
};

export type Stats = { readonly byStrain: Readonly<Record<Strain, StatLine>> };

export const EMPTY_LINE: StatLine = { hands: 0, made: 0, lost: 0, hints: 0 };

export const EMPTY_STATS: Stats = {
  byStrain: { C: EMPTY_LINE, D: EMPTY_LINE, H: EMPTY_LINE, S: EMPTY_LINE, NT: EMPTY_LINE },
};

export function addResult(stats: Stats, r: HandResult): Stats {
  const line = stats.byStrain[r.strain];
  return {
    byStrain: {
      ...stats.byStrain,
      [r.strain]: {
        hands: line.hands + 1,
        made: line.made + (r.made ? 1 : 0),
        lost: line.lost + r.lost,
        hints: line.hints + r.hints,
      },
    },
  };
}

export function sumLines(lines: readonly StatLine[]): StatLine {
  return lines.reduce(
    (a, l) => ({
      hands: a.hands + l.hands,
      made: a.made + l.made,
      lost: a.lost + l.lost,
      hints: a.hints + l.hints,
    }),
    EMPTY_LINE,
  );
}

/** All hands, suit contracts together, and NT. */
export function statTotals(stats: Stats): { all: StatLine; suit: StatLine; nt: StatLine } {
  const suit = sumLines((['S', 'H', 'D', 'C'] as const).map((s) => stats.byStrain[s]));
  const nt = stats.byStrain.NT;
  return { all: sumLines([suit, nt]), suit, nt };
}

const count = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : 0);

function parseLine(raw: unknown): StatLine {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const hands = count(o.hands);
  return {
    hands,
    made: Math.min(count(o.made), hands),
    lost: count(o.lost),
    hints: count(o.hints),
  };
}

/** Stats read back from storage; anything unreadable counts as zero. */
export function parseStats(raw: unknown): Stats {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const by =
    typeof o.byStrain === 'object' && o.byStrain !== null
      ? (o.byStrain as Record<string, unknown>)
      : {};
  const byStrain = Object.fromEntries(STRAINS.map((s) => [s, parseLine(by[s])])) as Record<
    Strain,
    StatLine
  >;
  return { byStrain };
}

/**
 * The result of the finished hand in `state`, or null while it does not count yet: hand not
 * over, review still missing analyses (`lost` would be short), or study mode was used.
 */
export function handResultOf(state: PlayStoreState): HandResult | null {
  const { play } = state;
  if (!play || !isHandOver(state) || state.studied) return null;
  const review = reviewHand(play, state.analyses, state.claimed);
  if (!review.complete) return null;
  return {
    strain: play.contract.strain,
    made: review.nsTricks >= tricksNeeded(play.contract),
    lost: review.lost,
    hints: state.hintsUsed,
  };
}

/**
 * Calls `onResult` once per hand started (`handSerial`): the first time it finishes with a
 * complete review. Finishing again after undo, "play from here" or "play again" is practice on a
 * hand already seen, so it is not counted. Returns the unsubscribe function.
 */
export function watchHandResults(store: PlayStore, onResult: (r: HandResult) => void): () => void {
  // Hands started before watching began are not counted.
  let counted = store.getState().handSerial;
  const check = (state: PlayStoreState) => {
    if (state.handSerial === counted || !state.play) return;
    // Seen in study mode once = never counted, even after "play again" with study mode off
    // (which resets `studied` for the new play-through).
    if (state.studied) {
      counted = state.handSerial;
      return;
    }
    const result = handResultOf(state);
    if (!result) return;
    counted = state.handSerial;
    onResult(result);
  };
  return store.subscribe(check);
}
