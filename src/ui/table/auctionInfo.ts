// The data around the auction table (M31): the meaning of each call (src/bidding) and what the
// defenders probably hold (src/game/inference.ts), plus a call written in guide markup.

import { useMemo } from 'react';
import type { Meaning } from '../../bidding';
import { explainAuction } from '../../bidding';
import type { Call, Seat } from '../../engine';
import type { Inference } from '../../game/inference';
import { infer, shownBySeat } from '../../game/inference';
import type { HandSetup } from '../../game/playStore';
import type { Messages } from '../../i18n';

/** A call in guide markup (`2{H}`), for text that also holds a meaning. */
export function callMarkup(call: Call, t: Messages): string {
  if (call.kind === 'pass') return t.auction.pass;
  if (call.kind === 'double') return t.auction.double;
  if (call.kind === 'redouble') return t.auction.redouble;
  return call.strain === 'NT' ? `${call.level}NT` : `${call.level}{${call.strain}}`;
}

/** What the table shows besides the calls: their meanings and what the defenders hold. */
export type AuctionInfo = {
  readonly meanings: readonly (Meaning | null)[];
  /** West and East, from the auction and the hands in sight. */
  readonly inference: Partial<Record<Seat, Inference>>;
};

/**
 * Meanings of the hand's calls and what the defenders hold, counting South's hand and, once
 * `dummyUp`, North's. Null for a hand without an auction.
 */
export function useAuctionInfo(hand: HandSetup | null, dummyUp: boolean): AuctionInfo | null {
  const auction = hand?.auction;
  const vulnerability = hand?.vulnerability ?? 'none';
  const meanings = useMemo(
    () => (auction ? explainAuction(auction, vulnerability) : null),
    [auction, vulnerability],
  );
  const deal = hand?.deal;
  return useMemo(() => {
    if (!auction || !meanings || !deal) return null;
    const visible = dummyUp ? { S: deal.S, N: deal.N } : { S: deal.S };
    return { meanings, inference: infer(shownBySeat(auction, meanings), visible) };
  }, [auction, meanings, deal, dummyUp]);
}
