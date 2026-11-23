// Building blocks of the system's rules (SPEC §6.5): a candidate call with its meaning, and small
// helpers about suits and bids shared by the uncontested and the competitive rules.

import type { Bid, Call, Strain, Suit } from '../engine';
import { STRAINS, bid } from '../engine';
import type { BidContext } from './context';
import type { HandEval } from './evaluate';
import type { Meaning, Range } from './meaning';
import { MAX_HCP } from './meaning';

export type Candidate = {
  readonly call: Call;
  readonly meaning: Meaning;
  /** Rule id, for tests and DECISIONS. */
  readonly rule: string;
  /**
   * A choice between calls the meaning does not show (e.g. which of two long suits to bid first).
   * Never a reason the meaning would be wrong: the hand still fits the meaning.
   */
  readonly when?: (ev: HandEval) => boolean;
};

export const MAJORS: readonly Suit[] = ['S', 'H'];
export const MINORS: readonly Suit[] = ['D', 'C'];
/** Majors first, then minors, higher first. */
export const SUIT_PREFERENCE: readonly Suit[] = ['S', 'H', 'D', 'C'];

export function c(
  call: Call,
  meaning: Meaning,
  rule: string,
  when?: (ev: HandEval) => boolean,
): Candidate {
  return when ? { call, meaning, rule, when } : { call, meaning, rule };
}

/** [lo, hi] clamped to 0–37, or null when empty. */
export function r(lo: number, hi: number): Range | null {
  const a = Math.max(0, lo);
  const b = Math.min(MAX_HCP, hi);
  return a <= b ? [a, b] : null;
}

/** Adds `make(range)` when `range` is not empty. */
export function withRange(
  out: Candidate[],
  range: Range | null,
  make: (hcp: Range) => Candidate,
): void {
  if (range) out.push(make(range));
}

export const higher = (a: Strain, b: Strain) => STRAINS.indexOf(a) > STRAINS.indexOf(b);
export const isMajor = (s: Strain) => s === 'H' || s === 'S';
export const isSuit = (s: string): s is Suit => s === 'S' || s === 'H' || s === 'D' || s === 'C';

/** The lowest bid of `strain` above the last bid. */
export function cheapest(ctx: BidContext, strain: Strain): Bid {
  const last = ctx.lastBid?.bid;
  if (!last) return bid(1, strain);
  return bid((higher(strain, last.strain) ? last.level : last.level + 1) as Bid['level'], strain);
}

/** Parses a bid code of the seq (`1S`, `2N`); null for pass / double. */
export function bidOf(code: string | undefined): Bid | null {
  const m = /^([1-7])([CDHSN])$/.exec(code ?? '');
  if (!m) return null;
  const s = m[2]!;
  return bid(Number(m[1]) as Bid['level'], s === 'N' ? 'NT' : (s as Suit));
}

/** The longest of `suits` in the hand; the higher-ranking when equal. */
export function longestOf(ev: HandEval, suits: readonly Suit[]): Suit | null {
  let best: Suit | null = null;
  for (const s of SUIT_PREFERENCE) {
    if (suits.includes(s) && (!best || ev.len[s] > ev.len[best])) best = s;
  }
  return best;
}
