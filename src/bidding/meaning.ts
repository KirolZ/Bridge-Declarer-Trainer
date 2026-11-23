// The meaning of a call as data (SPEC §6.5): what the hand of the player who made it holds. The
// bidder only makes a call whose meaning the hand fits, so what the player is told is the data the
// bidder used — never a separate text that could drift from it.

import type { Suit } from '../engine';
import { SUITS } from '../engine';
import type { HandEval } from './evaluate';

/** Inclusive [min, max]. */
export type Range = readonly [number, number];

/** The convention or kind of call, for the words shown to the player (M31). */
export type MeaningName =
  | 'opening'
  | 'strongTwoClubs'
  | 'weakTwo'
  | 'preempt'
  | 'raise'
  | 'limitRaise'
  | 'preemptiveRaise'
  | 'newSuit'
  | 'twoOverOne'
  | 'jumpShift'
  | 'reverse'
  | 'rebid'
  | 'notrump'
  | 'stayman'
  | 'staymanReply'
  | 'transfer'
  | 'transferAccept'
  | 'waiting'
  | 'blackwood'
  | 'aceReply'
  | 'invite'
  | 'game'
  | 'slam'
  | 'signoff'
  | 'overcall'
  | 'weakJumpOvercall'
  | 'notrumpOvercall'
  | 'takeoutDouble'
  | 'advance'
  | 'compete'
  | 'pass';

export type Forcing = 'round' | 'game';

export type Meaning = {
  readonly name?: MeaningName;
  readonly hcp?: Range;
  readonly len?: Readonly<Partial<Record<Suit, Range>>>;
  readonly balanced?: boolean;
  /** Number of aces held (Blackwood replies): one of these. */
  readonly aces?: readonly number[];
  /** Suits held stopped (notrump bids over the opponents' suits). */
  readonly stoppers?: readonly Suit[];
  /** Partner must bid again (one round) or the side must reach game. */
  readonly forcing?: Forcing;
  /** Says nothing about the suit named (Stayman, transfers, 2♣, Blackwood and its replies). */
  readonly artificial?: boolean;
};

export const MAX_HCP = 37;

/** Nothing known: a call the system does not explain. */
export const NO_INFO: Meaning = {};

const inRange = (v: number, r: Range | undefined) => !r || (v >= r[0] && v <= r[1]);

/** The hand holds what the meaning says. */
export function fits(m: Meaning, ev: HandEval): boolean {
  if (!inRange(ev.hcp, m.hcp)) return false;
  if (m.len) for (const s of SUITS) if (!inRange(ev.len[s], m.len[s])) return false;
  if (m.balanced !== undefined && m.balanced !== ev.balanced) return false;
  if (m.aces && !m.aces.includes(ev.aces)) return false;
  if (m.stoppers && !m.stoppers.every((s) => ev.stoppers[s])) return false;
  return true;
}

/** Same value in every meaning, else undefined. */
function common<T>(values: readonly (T | undefined)[]): T | undefined {
  const [first] = values;
  return values.every((v) => v === first) ? first : undefined;
}

function hullRange(ranges: readonly (Range | undefined)[]): Range | undefined {
  if (ranges.some((r) => !r)) return undefined;
  const rs = ranges as Range[];
  return [Math.min(...rs.map((r) => r[0])), Math.max(...rs.map((r) => r[1]))];
}

/**
 * The smallest meaning that covers all of `ms`: what is known when the call could come from any of
 * them (one call, several rules). A field missing from one meaning is unknown in the result.
 */
export function hull(ms: readonly Meaning[]): Meaning {
  if (ms.length === 1) return ms[0]!;
  const len: Partial<Record<Suit, Range>> = {};
  for (const s of SUITS) {
    const r = hullRange(ms.map((m) => m.len?.[s]));
    if (r) len[s] = r;
  }
  const stoppers = ms.every((m) => m.stoppers)
    ? SUITS.filter((s) => ms.every((m) => m.stoppers!.includes(s)))
    : undefined;
  const aces = ms.every((m) => m.aces)
    ? [...new Set(ms.flatMap((m) => m.aces!))].sort((a, b) => a - b)
    : undefined;
  const out: {
    -readonly [K in keyof Meaning]: Meaning[K];
  } = {};
  const name = common(ms.map((m) => m.name));
  if (name) out.name = name;
  const hcp = hullRange(ms.map((m) => m.hcp));
  if (hcp) out.hcp = hcp;
  if (Object.keys(len).length > 0) out.len = len;
  const balanced = common(ms.map((m) => m.balanced));
  if (balanced !== undefined) out.balanced = balanced;
  if (aces) out.aces = aces;
  if (stoppers && stoppers.length > 0) out.stoppers = stoppers;
  const forcing = common(ms.map((m) => m.forcing));
  if (forcing) out.forcing = forcing;
  const artificial = common(ms.map((m) => m.artificial));
  if (artificial) out.artificial = artificial;
  return out;
}

/** What one player has shown over the whole auction: every one of their meanings at once. */
export type Shown = {
  readonly hcp: Range;
  readonly len: Readonly<Record<Suit, Range>>;
  readonly balanced: boolean;
  readonly aces: readonly number[];
  readonly stoppers: readonly Suit[];
};

export const NOTHING_SHOWN: Shown = {
  hcp: [0, MAX_HCP],
  len: { S: [0, 13], H: [0, 13], D: [0, 13], C: [0, 13] },
  balanced: false,
  aces: [0, 1, 2, 3, 4],
  stoppers: [],
};

const cut = (a: Range, b: Range | undefined): Range =>
  b ? [Math.max(a[0], b[0]), Math.min(a[1], b[1])] : a;

/** `shown` narrowed by one more meaning. A balanced hand has 2–5 cards in every suit. */
export function narrow(shown: Shown, m: Meaning | null): Shown {
  if (!m) return shown;
  const balanced = shown.balanced || m.balanced === true;
  const len = {} as Record<Suit, Range>;
  for (const s of SUITS) {
    const r = cut(shown.len[s], m.len?.[s]);
    len[s] = balanced ? cut(r, [2, 5]) : r;
  }
  return {
    hcp: cut(shown.hcp, m.hcp),
    len,
    balanced,
    aces: m.aces ? shown.aces.filter((a) => m.aces!.includes(a)) : shown.aces,
    stoppers: m.stoppers
      ? SUITS.filter((s) => shown.stoppers.includes(s) || m.stoppers!.includes(s))
      : shown.stoppers,
  };
}
