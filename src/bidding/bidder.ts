// The bidder (SPEC §6.5): makes the first call of the system whose meaning the hand fits, bids a
// whole deal, and explains any auction from the calls alone.

import type { Auction, Call, Deal, Seat, Vulnerability } from '../engine';
import { PASS, callCode, callError, isAuctionComplete } from '../engine';
import type { BidContext } from './context';
import { buildContext } from './context';
import type { HandEval } from './evaluate';
import { evaluate } from './evaluate';
import type { Meaning } from './meaning';
import { fits, hull } from './meaning';
import type { Candidate } from './system';
import { candidates } from './system';

export type BidStep = {
  readonly call: Call;
  /** What the call tells the table (null: the system does not explain it). */
  readonly meaning: Meaning | null;
  /**
   * The rule that made the call; 'fallback' when no rule fitted the hand (its meaning may then be
   * wrong for this hand, so such an auction is never shown — M30); null when the system had no say.
   */
  readonly rule: string | null;
};

export type BidResult = { readonly auction: Auction; readonly steps: readonly BidStep[] };

/** The system's calls that can be made here. */
function legalCandidates(ctx: BidContext): Candidate[] {
  return candidates(ctx).filter(
    (c) => callError(ctx.auction, c.call) === null && !(ctx.forced && c.call.kind === 'pass'),
  );
}

/** What `call` tells at this point: the meanings of every rule that makes it, together. */
function explainIn(cands: readonly Candidate[], call: Call): Meaning | null {
  const code = callCode(call);
  const ms = cands.filter((c) => callCode(c.call) === code).map((c) => c.meaning);
  return ms.length > 0 ? hull(ms) : null;
}

export function explainCall(ctx: BidContext, call: Call): Meaning | null {
  return explainIn(legalCandidates(ctx), call);
}

export function chooseCall(ctx: BidContext, ev: HandEval): BidStep {
  const cands = legalCandidates(ctx);
  if (cands.length === 0) return { call: PASS, meaning: null, rule: null };
  const pick = cands.find((c) => fits(c.meaning, ev) && (c.when?.(ev) ?? true));
  if (pick) return { call: pick.call, meaning: explainIn(cands, pick.call), rule: pick.rule };
  const call = ctx.forced ? (cands.find((c) => c.call.kind !== 'pass')?.call ?? PASS) : PASS;
  return { call, meaning: explainIn(cands, call), rule: 'fallback' };
}

/** Bids `deal` from `dealer` to the end. Deterministic. */
export function bidDeal(deal: Deal, dealer: Seat, vulnerability: Vulnerability): BidResult {
  const evals = {
    N: evaluate(deal.N),
    E: evaluate(deal.E),
    S: evaluate(deal.S),
    W: evaluate(deal.W),
  };
  const calls: Call[] = [];
  const meanings: (Meaning | null)[] = [];
  const steps: BidStep[] = [];
  while (!isAuctionComplete(calls)) {
    const ctx = buildContext({ dealer, calls }, vulnerability, meanings);
    const step = chooseCall(ctx, evals[ctx.seat]);
    calls.push(step.call);
    meanings.push(step.meaning);
    steps.push(step);
  }
  return { auction: { dealer, calls }, steps };
}

/** The meaning of every call of `auction`, as the system reads it (no hand needed). */
export function explainAuction(auction: Auction, vulnerability: Vulnerability): (Meaning | null)[] {
  const meanings: (Meaning | null)[] = [];
  auction.calls.forEach((call, i) => {
    const ctx = buildContext(
      { dealer: auction.dealer, calls: auction.calls.slice(0, i) },
      vulnerability,
      meanings,
    );
    meanings.push(explainCall(ctx, call));
  });
  return meanings;
}
