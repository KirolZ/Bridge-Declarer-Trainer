// Links of hands (SPEC §4.4): `#/play/<dealCode>/<contract>` with `?v=ns` when NS is vulnerable
// and, for a hand with an auction, `d=<dealer>&a=<calls>`. Links made before the auction existed
// have no `d` / `a` and open as before.

import type { Auction } from '../engine';
import {
  auctionResult,
  decodeAuction,
  decodeContract,
  decodeDeal,
  encodeCalls,
  encodeContract,
  encodeDeal,
  isAuctionComplete,
} from '../engine';
import type { HandSetup } from './playStore';

/** Link path of a full-deal hand. */
export function handPath(hand: HandSetup): string {
  const path = `/play/${encodeDeal(hand.deal)}/${encodeContract(hand.contract)}`;
  const query: string[] = [];
  if (hand.vulnerability === 'ns') query.push('v=ns');
  if (hand.auction) query.push(`d=${hand.auction.dealer}`, `a=${encodeCalls(hand.auction.calls)}`);
  return query.length > 0 ? `${path}?${query.join('&')}` : path;
}

/**
 * The auction of a link, checked against its contract: legal, finished, South declares the
 * link's contract and it is not doubled (the game scores no doubles, SPEC §4.3). Null when it
 * fails any of these.
 */
function linkAuction(dealer: string, calls: string, contract: string): Auction | null {
  const auction = decodeAuction(dealer, calls);
  if (!auction || !isAuctionComplete(auction.calls)) return null;
  const result = auctionResult(auction);
  if (!result || result.declarer !== 'S' || result.doubling !== 0) return null;
  const won = encodeContract({ level: result.level, strain: result.strain, declarer: 'S' });
  return won === contract ? auction : null;
}

/**
 * The hand of a link, or null when the link is broken (bad deal or contract code, or an `a`
 * that does not fit the contract). `d` without `a` is ignored.
 */
export function handFromLink(
  code: string,
  contract: string,
  query: { get(name: string): string | null },
): HandSetup | null {
  const deal = decodeDeal(code);
  const c = decodeContract(contract);
  if (!deal || !c) return null;
  const hand: HandSetup = {
    deal,
    contract: c,
    vulnerability: query.get('v') === 'ns' ? 'ns' : 'none',
  };
  const calls = query.get('a');
  if (calls === null) return hand;
  const auction = linkAuction(query.get('d') ?? '', calls, contract);
  return auction ? { ...hand, auction } : null;
}
