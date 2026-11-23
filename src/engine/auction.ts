// The auction (SPEC §4.5): calls, their legality, the final contract and its declarer, the URL
// form of an auction, and the half-turn of the table that puts a North declarer in South.

import type { Deal, Level, Seat, Strain } from './card';
import { STRAINS, nextSeat, partnerOf, sideOf } from './card';

export type Bid = { readonly kind: 'bid'; readonly level: Level; readonly strain: Strain };
export type Call =
  Bid | { readonly kind: 'pass' } | { readonly kind: 'double' } | { readonly kind: 'redouble' };

/** Calls in order, clockwise from the dealer. */
export type Auction = { readonly dealer: Seat; readonly calls: readonly Call[] };

/** 0 = not doubled, 1 = doubled, 2 = redoubled. */
export type Doubling = 0 | 1 | 2;

/** What a finished auction (not passed out) contracts for. */
export type AuctionResult = {
  readonly level: Level;
  readonly strain: Strain;
  readonly declarer: Seat;
  readonly doubling: Doubling;
};

export const PASS: Call = { kind: 'pass' };
export const DOUBLE: Call = { kind: 'double' };
export const REDOUBLE: Call = { kind: 'redouble' };

export function bid(level: Level, strain: Strain): Bid {
  return { kind: 'bid', level, strain };
}

/** Order of bids: 1♣ < 1♦ < 1♥ < 1♠ < 1NT < 2♣ < … < 7NT. */
export function bidRank(b: { level: Level; strain: Strain }): number {
  return (b.level - 1) * 5 + STRAINS.indexOf(b.strain);
}

/** The seat that makes call number `index` (0 = the dealer). */
export function callerAt(dealer: Seat, index: number): Seat {
  return nextSeat(dealer, index % 4);
}

/** Three passes after a bid, double or redouble, or four passes from the start (passed out). */
export function isAuctionComplete(calls: readonly Call[]): boolean {
  const n = calls.length;
  if (n < 4) return false;
  if (calls.slice(-3).some((c) => c.kind !== 'pass')) return false;
  // Three passes end it after any bid; with no bid it takes all four players passing.
  return n === 4 || calls.some((c) => c.kind !== 'pass');
}

/** Four passes: nobody bid. */
export function isPassedOut(calls: readonly Call[]): boolean {
  return calls.length === 4 && calls.every((c) => c.kind === 'pass');
}

/** The seat to call next, or null when the auction is over. */
export function nextCaller(auction: Auction): Seat | null {
  return isAuctionComplete(auction.calls) ? null : callerAt(auction.dealer, auction.calls.length);
}

/** Index of the last bid, or -1 when nobody has bid yet. */
function lastBidIndex(calls: readonly Call[]): number {
  for (let i = calls.length - 1; i >= 0; i--) if (calls[i]!.kind === 'bid') return i;
  return -1;
}

/** Index of the last call that is not a pass, or -1. */
function lastActionIndex(calls: readonly Call[]): number {
  for (let i = calls.length - 1; i >= 0; i--) if (calls[i]!.kind !== 'pass') return i;
  return -1;
}

/** Why `call` cannot be made next in `auction`, or null when it is legal. */
export function callError(auction: Auction, call: Call): string | null {
  const { dealer, calls } = auction;
  if (isAuctionComplete(calls)) return 'the auction is over';
  const caller = callerAt(dealer, calls.length);
  const last = lastActionIndex(calls);
  switch (call.kind) {
    case 'pass':
      return null;
    case 'bid': {
      const prev = lastBidIndex(calls);
      if (prev >= 0 && bidRank(call) <= bidRank(calls[prev] as Bid)) {
        return 'a bid must be higher than the last bid';
      }
      return null;
    }
    case 'double': {
      if (last < 0 || calls[last]!.kind !== 'bid') return 'only a bid can be doubled';
      if (sideOf(callerAt(dealer, last)) === sideOf(caller)) return "cannot double partner's bid";
      return null;
    }
    case 'redouble': {
      if (last < 0 || calls[last]!.kind !== 'double') return 'only a double can be redoubled';
      if (sideOf(callerAt(dealer, last)) === sideOf(caller)) {
        return "cannot redouble partner's double";
      }
      return null;
    }
  }
}

/** Why the calls of `auction` break the rules (the first bad call), or null when they are legal. */
export function auctionError(auction: Auction): string | null {
  for (let i = 0; i < auction.calls.length; i++) {
    const err = callError(
      { dealer: auction.dealer, calls: auction.calls.slice(0, i) },
      auction.calls[i]!,
    );
    if (err) return `call ${i + 1} (${callCode(auction.calls[i]!)}): ${err}`;
  }
  return null;
}

/**
 * The contract of a finished auction: the last bid, declared by the first player of the side that
 * won the auction to bid its strain. Null when it was passed out. Throws on an unfinished or
 * illegal auction.
 */
export function auctionResult(auction: Auction): AuctionResult | null {
  const err = auctionError(auction);
  if (err) throw new Error(`illegal auction: ${err}`);
  const { dealer, calls } = auction;
  if (!isAuctionComplete(calls)) throw new Error('the auction is not over');
  const last = lastBidIndex(calls);
  if (last < 0) return null;
  const final = calls[last] as Bid;
  const side = sideOf(callerAt(dealer, last));
  let declarer: Seat | null = null;
  for (let i = 0; i <= last && !declarer; i++) {
    const c = calls[i]!;
    const seat = callerAt(dealer, i);
    if (c.kind === 'bid' && c.strain === final.strain && sideOf(seat) === side) declarer = seat;
  }
  let doubling: Doubling = 0;
  for (const c of calls.slice(last + 1)) {
    if (c.kind === 'double') doubling = 1;
    else if (c.kind === 'redouble') doubling = 2;
  }
  return { level: final.level, strain: final.strain, declarer: declarer!, doubling };
}

// ---------- Half-turn of the table: N ↔ S, E ↔ W ----------

/** The deal seen from the other side of the table: each hand moves to its partner's seat. */
export function rotateDeal(deal: Deal): Deal {
  return { N: deal.S, E: deal.W, S: deal.N, W: deal.E };
}

/**
 * The same auction with every seat turned half-way round. The calls stay as they were: only the
 * dealer (and so every caller) moves to the partner's seat. Vulnerability does not change, as
 * each side keeps its partner.
 */
export function rotateAuction(auction: Auction): Auction {
  return { dealer: partnerOf(auction.dealer), calls: auction.calls };
}

// ---------- Text form, as used in links: "1H-P-2H-X-XX-P-P-P" ----------

/** `1H`, `3N` (NT), `P`, `X`, `XX`. */
export function callCode(call: Call): string {
  switch (call.kind) {
    case 'bid':
      return `${call.level}${call.strain === 'NT' ? 'N' : call.strain}`;
    case 'pass':
      return 'P';
    case 'double':
      return 'X';
    case 'redouble':
      return 'XX';
  }
}

export function parseCallCode(code: string): Call | null {
  if (code === 'P') return PASS;
  if (code === 'X') return DOUBLE;
  if (code === 'XX') return REDOUBLE;
  const m = /^([1-7])([CDHSN])$/.exec(code);
  if (!m) return null;
  const s = m[2] as 'C' | 'D' | 'H' | 'S' | 'N';
  return bid(Number(m[1]) as Level, s === 'N' ? 'NT' : s);
}

/** The calls joined by `-`, e.g. `1H-P-2H-P-P-P`. */
export function encodeCalls(calls: readonly Call[]): string {
  return calls.map(callCode).join('-');
}

const SEAT_CODES: readonly string[] = ['N', 'E', 'S', 'W'];

/**
 * Reads `dealer` (`N` / `E` / `S` / `W`) and `calls` (as `encodeCalls` writes them). Null when
 * either is malformed or the calls break the rules. The auction may be unfinished.
 */
export function decodeAuction(dealer: string, calls: string): Auction | null {
  if (!SEAT_CODES.includes(dealer) || calls === '') return null;
  const parsed: Call[] = [];
  for (const code of calls.split('-')) {
    const call = parseCallCode(code);
    if (!call) return null;
    parsed.push(call);
  }
  const auction: Auction = { dealer: dealer as Seat, calls: parsed };
  return auctionError(auction) === null ? auction : null;
}
