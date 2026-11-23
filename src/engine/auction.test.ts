import { describe, expect, it } from 'vitest';
import type { Auction, Call } from './auction';
import {
  DOUBLE,
  PASS,
  REDOUBLE,
  auctionError,
  auctionResult,
  bid,
  bidRank,
  callError,
  callerAt,
  decodeAuction,
  encodeCalls,
  isAuctionComplete,
  isPassedOut,
  nextCaller,
  parseCallCode,
  rotateAuction,
  rotateDeal,
} from './auction';
import type { Seat } from './card';
import { SEATS, STRAINS } from './card';
import { dealRandom } from './deal';
import { mulberry32 } from './rng';

/** `"1H P 2H P"` → calls. */
function calls(text: string): Call[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((code) => {
      const c = parseCallCode(code);
      if (!c) throw new Error(`bad call ${code}`);
      return c;
    });
}

const auction = (dealer: Seat, text: string): Auction => ({ dealer, calls: calls(text) });

describe('calls', () => {
  it('orders bids 1♣ < 1♦ < 1♥ < 1♠ < 1NT < 2♣ … < 7NT', () => {
    const all = [1, 2, 3, 4, 5, 6, 7].flatMap((l) => STRAINS.map((s) => bid(l as 1, s)));
    expect(all.map(bidRank)).toEqual(all.map((_, i) => i));
  });

  it('reads and writes the link form of every call', () => {
    for (const code of ['1C', '1D', '1H', '1S', '1N', '7N', 'P', 'X', 'XX']) {
      expect(encodeCalls([parseCallCode(code)!])).toBe(code);
    }
    for (const bad of ['', '0C', '8S', '1NT', '1s', 'p', 'XXX', 'R'])
      expect(parseCallCode(bad)).toBeNull();
  });

  it('walks round the table clockwise from the dealer', () => {
    expect([0, 1, 2, 3, 4].map((i) => callerAt('E', i))).toEqual(['E', 'S', 'W', 'N', 'E']);
    expect(nextCaller(auction('W', '1S P'))).toBe('E');
  });
});

describe('legality', () => {
  it('needs each bid to be higher than the last', () => {
    expect(callError(auction('N', '1H'), bid(1, 'H'))).toMatch(/higher/);
    expect(callError(auction('N', '1H'), bid(1, 'D'))).toMatch(/higher/);
    expect(callError(auction('N', '1H P'), bid(1, 'S'))).toBeNull();
    expect(callError(auction('N', '1N X'), bid(2, 'C'))).toBeNull();
  });

  it('lets a player double only an opponent’s bid that is not doubled yet', () => {
    expect(callError(auction('N', ''), DOUBLE)).toMatch(/only a bid/);
    expect(callError(auction('N', '1H'), DOUBLE)).toBeNull(); // East doubles North
    expect(callError(auction('N', '1H P'), DOUBLE)).toMatch(/partner/); // South
    expect(callError(auction('N', '1H P P'), DOUBLE)).toBeNull(); // West, in fourth seat
    expect(callError(auction('N', '1H X'), DOUBLE)).toMatch(/only a bid/);
    expect(callError(auction('N', '1H X P'), DOUBLE)).toMatch(/only a bid/);
  });

  it('lets a player redouble only an opponent’s double of their side', () => {
    expect(callError(auction('N', '1H'), REDOUBLE)).toMatch(/only a double/);
    expect(callError(auction('N', '1H X'), REDOUBLE)).toBeNull(); // South
    expect(callError(auction('N', '1H X P'), REDOUBLE)).toMatch(/partner/); // West
    expect(callError(auction('N', '1H X P P'), REDOUBLE)).toBeNull(); // North
    expect(callError(auction('N', '1H X XX'), REDOUBLE)).toMatch(/only a double/);
  });

  it('ends after three passes following a call, or four passes from the start', () => {
    expect(isAuctionComplete(calls('P P P'))).toBe(false);
    expect(isAuctionComplete(calls('P P P P'))).toBe(true);
    expect(isPassedOut(calls('P P P P'))).toBe(true);
    expect(isAuctionComplete(calls('1C P P'))).toBe(false);
    expect(isAuctionComplete(calls('1C P P P'))).toBe(true);
    expect(isAuctionComplete(calls('P P P 1C P P P'))).toBe(true);
    expect(isAuctionComplete(calls('1C X P P P'))).toBe(true);
    expect(isAuctionComplete(calls('1C P 1H P P'))).toBe(false);
    expect(isPassedOut(calls('1C P P P'))).toBe(false);
    expect(callError(auction('S', '1C P P P'), PASS)).toMatch(/over/);
    expect(nextCaller(auction('S', '1C P P P'))).toBeNull();
  });

  it('names the first bad call', () => {
    expect(auctionError(auction('N', '1H P 1D'))).toMatch(/^call 3 \(1D\)/);
    expect(auctionError(auction('N', '1S P P P P'))).toMatch(/^call 5 \(P\): the auction is over/);
    expect(auctionError(auction('N', '1S P 2S P 4S P P P'))).toBeNull();
  });
});

describe('result', () => {
  it('gives the last bid, declared by the first of that side to bid its strain', () => {
    // N 1♥, E 1♠, S 2♥, W 2♠, N 4♥: North bid hearts first → North declares.
    expect(auctionResult(auction('N', '1H 1S 2H 2S 4H P P P'))).toEqual({
      level: 4,
      strain: 'H',
      declarer: 'N',
      doubling: 0,
    });
    // S transfers: N 1NT, S 2♥ (asks for ♠), N 2♠ → North first named ♠ and declares.
    expect(auctionResult(auction('N', '1N P 2H P 2S P P P'))!.declarer).toBe('N');
    // The other side's earlier bid of the strain does not count.
    expect(auctionResult(auction('E', '1S P P 2S P P P'))!.declarer).toBe('N');
  });

  it('records doubles and redoubles of the final bid only', () => {
    expect(auctionResult(auction('N', '1H X 2H P P P'))!.doubling).toBe(0);
    expect(auctionResult(auction('N', '1H X P P P'))!.doubling).toBe(1);
    expect(auctionResult(auction('N', '1H X XX P P P'))!.doubling).toBe(2);
  });

  it('is null when passed out, and refuses an unfinished or illegal auction', () => {
    expect(auctionResult(auction('W', 'P P P P'))).toBeNull();
    expect(() => auctionResult(auction('W', '1S P P'))).toThrow(/not over/);
    expect(() => auctionResult(auction('W', '1S 1H P P P'))).toThrow(/illegal/);
  });
});

describe('half-turn of the table', () => {
  it('moves every hand to its partner’s seat, and back again', () => {
    const deal = dealRandom(mulberry32(27));
    const turned = rotateDeal(deal);
    for (const seat of SEATS) {
      expect(turned[seat]).toBe(deal[{ N: 'S', E: 'W', S: 'N', W: 'E' }[seat] as Seat]);
    }
    expect(rotateDeal(turned)).toEqual(deal);
  });

  it('keeps the calls and turns the dealer, so a North declarer becomes South', () => {
    const a = auction('E', 'P 1S P 2S P 4S P P P'); // E deals, S opens 1♠ → S declares
    const b = auction('W', 'P 1S P 2S P 4S P P P'); // W deals, N opens 1♠ → N declares
    expect(auctionResult(b)!.declarer).toBe('N');
    const turned = rotateAuction(b);
    expect(turned).toEqual(a);
    expect(auctionResult(turned)).toEqual({ ...auctionResult(b)!, declarer: 'S' });
    expect(rotateAuction(turned)).toEqual(b);
  });

  it('has each caller hold the same cards after the turn', () => {
    const deal = dealRandom(mulberry32(4));
    const a = auction('N', '1C P 1H P');
    const deal2 = rotateDeal(deal);
    const a2 = rotateAuction(a);
    for (let i = 0; i < a.calls.length; i++) {
      expect(deal2[callerAt(a2.dealer, i)]).toBe(deal[callerAt(a.dealer, i)]);
    }
  });
});

describe('link form', () => {
  it('round-trips an auction with its dealer', () => {
    const a = auction('E', '1H 1S X 2S 3H P 4H P P P');
    const text = encodeCalls(a.calls);
    expect(text).toBe('1H-1S-X-2S-3H-P-4H-P-P-P');
    expect(decodeAuction('E', text)).toEqual(a);
  });

  it('rejects a bad dealer, a bad call or an illegal auction', () => {
    expect(decodeAuction('Q', '1H-P')).toBeNull();
    expect(decodeAuction('', '1H-P')).toBeNull();
    expect(decodeAuction('N', '')).toBeNull();
    expect(decodeAuction('N', '1H--P')).toBeNull();
    expect(decodeAuction('N', '1H-1NT')).toBeNull();
    expect(decodeAuction('N', '1H-P-X')).toBeNull(); // South doubles partner
    expect(decodeAuction('N', '1H-P-P-P-P')).toBeNull(); // a call after the end
    expect(decodeAuction('N', '1H-P')).toEqual(auction('N', '1H P')); // unfinished is fine here
  });
});
