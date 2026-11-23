// The SAYC bidder (SPEC §6.5, TASKS M28): hand evaluation, meanings, example hands for each rule,
// and the property that matters most — every call's meaning covers the hand that made it.

import { describe, expect, it } from 'vitest';
import type { Auction, Call, Seat, Vulnerability } from '../engine';
import {
  SEATS,
  auctionError,
  auctionResult,
  callCode,
  callerAt,
  dealRandom,
  decodeAuction,
  isAuctionComplete,
  mulberry32,
  parseHand,
  hcp,
  sideOf,
} from '../engine';
import type { Meaning } from '.';
import { SAYC_CASES } from './saycCases';
import {
  NOTHING_SHOWN,
  bidDeal,
  buildContext,
  chooseCall,
  evaluate,
  explainAuction,
  fits,
  hull,
  narrow,
} from '.';

/** The call `hand` makes after `calls` (dealer first, `-` between calls; '' = it deals). */
function callFor(
  hand: string,
  calls = '',
  dealer: Seat = 'N',
  vul: Vulnerability = 'none',
): string {
  const auction: Auction = calls ? decodeAuction(dealer, calls)! : { dealer, calls: [] };
  expect(auction, calls).not.toBeNull();
  const ctx = buildContext(auction, vul, explainAuction(auction, vul));
  return callCode(chooseCall(ctx, evaluate(parseHand(hand))).call);
}

describe('hand evaluation', () => {
  it('counts points, lengths and aces, and knows a balanced hand', () => {
    const ev = evaluate(parseHand('AKJ52.K4.Q73.A82'));
    expect(ev).toEqual({
      hcp: 17,
      len: { S: 5, H: 2, D: 3, C: 3 },
      suitHcp: { S: 8, H: 3, D: 2, C: 4 },
      balanced: true,
      aces: 2,
      stoppers: { S: true, H: true, D: true, C: true },
    });
    // A stopper is A, Kx, Qxx or Jxxx: here Q doubleton and K singleton do not stop the suit.
    expect(evaluate(parseHand('Q3.K.JT92.A87654')).stoppers).toEqual({
      S: false,
      H: false,
      D: true,
      C: true,
    });
    expect(evaluate(parseHand('AK52.K4.Q73.A982')).balanced).toBe(true); // 4-4-3-2
    expect(evaluate(parseHand('AK52.K42.Q73.A98')).balanced).toBe(true); // 4-3-3-3
    expect(evaluate(parseHand('AK52.K4.Q7.A9832')).balanced).toBe(false); // 5-4-2-2
    expect(evaluate(parseHand('AK5.K4.Q73.A9832')).balanced).toBe(true); // 5-3-3-2 (minor)
    expect(evaluate(parseHand('AK5.K42.Q732.A98')).balanced).toBe(true);
    expect(evaluate(parseHand('AK52.4.Q732.A983')).balanced).toBe(false); // singleton
  });
});

describe('meanings', () => {
  const ev = evaluate(parseHand('AKJ52.K4.Q73.A82'));

  it('a hand fits a meaning when it holds what the meaning says', () => {
    expect(fits({}, ev)).toBe(true);
    expect(fits({ hcp: [12, 21], len: { S: [5, 13] } }, ev)).toBe(true);
    expect(fits({ hcp: [18, 21] }, ev)).toBe(false);
    expect(fits({ len: { H: [3, 13] } }, ev)).toBe(false);
    expect(fits({ balanced: false }, ev)).toBe(false);
    expect(fits({ aces: [0, 4] }, ev)).toBe(false);
    expect(fits({ aces: [2] }, ev)).toBe(true);
  });

  it('the hull of meanings covers each of them and keeps only what they share', () => {
    const a: Meaning = {
      name: 'notrump',
      hcp: [6, 10],
      len: { S: [0, 2], H: [0, 3] },
      balanced: true,
    };
    const b: Meaning = { name: 'notrump', hcp: [11, 12], len: { S: [0, 2] } };
    expect(hull([a, b])).toEqual({ name: 'notrump', hcp: [6, 12], len: { S: [0, 2] } });
    expect(hull([a, {}])).toEqual({});
    expect(hull([{ aces: [0, 4] }, { aces: [1] }])).toEqual({ aces: [0, 1, 4] });
  });

  it('what a player has shown narrows with each call; a balanced hand has 2–5 in each suit', () => {
    let shown = narrow(NOTHING_SHOWN, { hcp: [12, 21], len: { H: [5, 13] } });
    shown = narrow(shown, null);
    shown = narrow(shown, { hcp: [12, 14], balanced: true });
    expect(shown.hcp).toEqual([12, 14]);
    expect(shown.len).toEqual({ S: [2, 5], H: [5, 5], D: [2, 5], C: [2, 5] });
  });
});

describe('openings', () => {
  it.each([
    ['AKJ52.K4.Q73.A82', '1S', 'five spades, 17 balanced: the major'],
    ['KQ3.AJ4.K852.Q93', '1N', '15–17 balanced'],
    ['AK3.KQ4.AJ52.KJ3', '2N', '20–21 balanced'],
    ['AKQ3.AKJ4.AQ3.K2', '2C', '22+'],
    ['K3.Q52.AJ84.K973', '1D', '4-4 in the minors: 1♦'],
    ['KQ43.A95.K73.J42', '1C', '3-3 in the minors: 1♣'],
    ['KQ43.A952.K73.J4', '1D', '4-4-3-2 with three diamonds: 1♦'],
    ['AQ873.KJ942.A3.4', '1S', '5-5 in the majors: 1♠'],
    ['A7.KQJ84.AQ763.5', '1H', 'five hearts, five diamonds'],
    ['Q3.KQJ974.84.632', '2H', 'weak two: six hearts, 8'],
    ['82.4.T93.KQJ8753', '3C', 'preempt: seven clubs'],
    ['8642.J93.Q72.K84', 'P', '6 points'],
    ['Q3.KQJ97.842.632', 'P', 'five hearts, 8 points'],
  ])('%s opens %s (%s)', (hand, call) => {
    expect(callFor(hand)).toBe(call);
  });
});

describe('responses and rebids', () => {
  it.each([
    ['1H-P', 'K84.Q93.J7642.83', '2H', 'simple raise, 6'],
    ['1H-P', '84.KJ93.A7642.Q3', '3H', 'limit raise, 10'],
    ['1H-P', '4.KJ932.T7642.83', '4H', 'preemptive raise, five trumps, 4'],
    ['1H-P', 'KJ84.93.Q7642.83', '1S', 'four spades, 6'],
    ['1S-P', 'K4.Q93.AJ764.K83', '2D', '2/1 with 13'],
    ['1S-P', 'J4.K932.Q764.Q83', '1N', '8 without support'],
    ['1S-P', '42.J93.8764.9832', 'P', '1 point'],
    ['1C-P', 'Q942.K93.J76.832', '1S', 'a major first'],
    ['1D-P', '842.K3.QJ76.A832', '3D', 'limit raise: four diamonds, 10'],
    ['1D-P', '842.K3.QJ7.A8632', '2C', '2/1 in clubs, 10'],
    ['1C-P', 'Q42.K93.J762.832', '1D', 'four diamonds, no major'],
    ['1D-P', 'Q42.K93.KJ76.A82', '2N', '13–15 balanced, no major'],
    ['1C-P-1H-P', 'AQ3.KJ84.Q7.K962', '2H', 'raise, 15 and four hearts'],
    ['1C-P-1H-P', 'AQ3.KJ84.K7.K962', '3H', 'jump raise, 16 and four hearts'],
    ['1C-P-1H-P', 'AQ3.K84.Q72.K962', '1N', '12–14 balanced'],
    ['1D-P-1S-P', 'A3.KJ84.AQ762.K2', '2H', 'reverse with 17'],
    ['1S-P-1N-P', 'AQJ864.K4.Q72.82', '2S', 'six spades, 12'],
  ])('after %s, %s bids %s (%s)', (calls, hand, call) => {
    expect(callFor(hand, calls)).toBe(call);
  });

  // TASKS 28.9: a balanced hand with five spades opens 1♠ at 12–19, so each range has its own rebid.
  it.each([
    ['1S-P-1N-P', 'AJ852.K4.Q73.K82', 'P', '12–14: pass 1NT'],
    ['1S-P-1N-P', 'AKJ52.K4.Q73.A82', '2N', '15–17: 2NT invitation'],
    ['1S-P-1N-P', 'AKJ52.K4.KJ3.A82', '3N', '18–19: 3NT'],
    ['1H-P-1S-P', 'K4.AJ852.Q73.K82', '1N', 'after 1♠: 12–14 = 1NT'],
    ['1H-P-1S-P', 'K4.AKJ52.Q73.A82', '2N', 'after 1♠: 15–17 = 2NT'],
    ['1H-P-1S-P', 'K4.AKJ52.KJ3.A82', '3N', 'after 1♠: 18–19 = 3NT'],
    ['1S-P-2C-P', 'AJ852.K4.Q73.K82', '2N', 'after 2/1: 12–14 = 2NT'],
    ['1S-P-2C-P', 'AKJ52.K4.KJ3.A82', '3N', 'after 2/1: 15–19 = 3NT'],
    ['1C-P-1S-P', 'K4.AJ5.KQ3.AQ852', '2N', 'a minor opener: 2NT = 18–19'],
  ])('balanced five-card major: after %s, %s bids %s (%s)', (calls, hand, call) => {
    expect(callFor(hand, calls)).toBe(call);
  });

  it('says what each balanced rebid shows, so responder can add up', () => {
    const meaningOf = (calls: string) => {
      const a = decodeAuction('N', calls)!;
      return explainAuction(a, 'none').at(-1);
    };
    expect(meaningOf('1S-P-1N-P-2N')).toMatchObject({ hcp: [15, 17], balanced: true });
    expect(meaningOf('1S-P-1N-P-3N')).toMatchObject({ hcp: [18, 19], balanced: true });
    expect(meaningOf('1S-P-1N-P-P')).toMatchObject({ hcp: [12, 15] });
    expect(meaningOf('1H-P-1S-P-1N')).toMatchObject({ hcp: [12, 14], balanced: true });
    expect(meaningOf('1H-P-1S-P-2N')).toMatchObject({ hcp: [15, 17], balanced: true });
    expect(meaningOf('1S-P-2C-P-2N')).toMatchObject({ hcp: [12, 14], balanced: true });
    expect(meaningOf('1S-P-2C-P-3N')).toMatchObject({ hcp: [15, 19], balanced: true });
    expect(meaningOf('1C-P-1S-P-2N')).toMatchObject({ hcp: [18, 19], balanced: true });
    // 2NT opening may hold five hearts, so Stayman's 3♥ reply says 4–5.
    expect(meaningOf('2N-P-3C-P-3H')).toMatchObject({ len: { H: [4, 5] } });
    expect(meaningOf('1N-P-2C-P-2H')).toMatchObject({ len: { H: [4, 4] } });
  });

  it('opens 2NT with 20–21 balanced even with five hearts', () => {
    expect(callFor('AK3.KQJ42.AJ5.K3')).toBe('2N');
  });
});

describe('notrump conventions', () => {
  it.each([
    ['1N-P', 'KJ84.Q932.A64.83', '2C', 'Stayman with a four-card major and 10'],
    ['1N-P', 'Q8743.94.J73.852', '2H', 'transfer to spades'],
    ['1N-P', '94.Q8743.J73.852', '2D', 'transfer to hearts'],
    ['1N-P', 'K94.Q83.J732.K52', '2N', 'invitation, 9'],
    ['1N-P', 'K94.Q83.AJ73.K52', '3N', 'game, 13'],
    ['1N-P', 'K94.Q83.J732.852', 'P', '6'],
    ['1N-P-2C-P', 'KQ3.AJ42.K85.Q93', '2H', 'Stayman: four hearts'],
    ['1N-P-2C-P', 'KQ32.AJ4.K85.Q93', '2S', 'Stayman: four spades'],
    ['1N-P-2C-P', 'KQ3.AJ4.K852.Q93', '2D', 'Stayman: no major'],
    ['1N-P-2D-P', 'KQ3.AJ4.K852.Q93', '2H', 'completes the transfer'],
    ['1N-P-2D-P-2H-P', '94.Q8743.AJ3.K52', '3N', 'five hearts, game values: 3NT'],
    ['1N-P-2D-P-2H-P-3N-P', 'KQ3.AJ4.K852.Q93', '4H', 'three hearts: 4♥'],
    ['1N-P-2C-P-2H-P-3N-P', 'KQ32.AJ42.K8.Q93', '4S', 'responder has spades'],
    ['2N-P', 'KJ84.Q932.764.83', '3C', 'Stayman over 2NT with 7'],
    ['2C-P', '8642.J93.Q72.K84', '2D', 'waiting'],
  ])('after %s, %s bids %s (%s)', (calls, hand, call) => {
    expect(callFor(hand, calls)).toBe(call);
  });

  it('Blackwood: asks for aces with a slam fit and answers in steps', () => {
    // 2♣–2♦–2♠ (four or more spades): responder with four spades and 11+ asks for aces.
    expect(callFor('Q842.KQ9.KJ7.832', '2C-P-2D-P-2S-P')).toBe('4N');
    expect(callFor('Q842.KQ9.J73.832', '2C-P-2D-P-2S-P')).toBe('4S'); // 6: game only
    const meanings = explainAuction(decodeAuction('N', '2C-P-2D-P-2S-P-4N-P')!, 'none');
    expect(meanings[6]).toMatchObject({ name: 'blackwood', artificial: true });
    const after = '2C-P-2D-P-2S-P-4N-P';
    expect(callFor('AKQJ3.AJ4.AQ5.K2', after)).toBe('5S'); // three aces
    expect(callFor('AKQJ3.AJ4.KQ5.K2', after)).toBe('5H'); // two
    expect(callFor('AKQJ3.KQJ.KQ5.A2', after)).toBe('5H');
    expect(callFor('KQJT3.KQJ.KQ5.A2', after)).toBe('5D'); // one
    expect(explainAuction(decodeAuction('N', `${after}-5C`)!, 'none')[8]!.aces).toEqual([0, 4]);
  });
});

describe('SAYC cases from an independent checker (TASKS 29.7)', () => {
  it.each(SAYC_CASES.map((k) => [k.id, k] as const))('%s', (_, k) => {
    expect(k.expect, k.why).toContain(callFor(k.hand, k.auction, k.dealer));
  });
});

describe('every auction (property, 5,000 seeded deals)', () => {
  const rng = mulberry32(2028);
  const boards = Array.from({ length: 5000 }, (_, i) => {
    const deal = dealRandom(rng);
    const dealer = SEATS[i % 4]!;
    const vul: Vulnerability = i % 3 === 0 ? 'ns' : 'none';
    return { deal, dealer, vul, result: bidDeal(deal, dealer, vul) };
  });

  it('is legal and finished', () => {
    for (const { result } of boards) {
      expect(auctionError(result.auction)).toBeNull();
      expect(isAuctionComplete(result.auction.calls)).toBe(true);
      expect(result.steps).toHaveLength(result.auction.calls.length);
    }
  });

  it('gives every call a meaning that covers the hand that made it (fallbacks aside)', () => {
    let fallbacks = 0;
    const wrong: string[] = [];
    for (const { deal, result } of boards) {
      result.steps.forEach((step, i) => {
        if (step.rule === 'fallback') {
          fallbacks++;
          return;
        }
        const seat = callerAt(result.auction.dealer, i);
        if (step.meaning && !fits(step.meaning, evaluate(deal[seat]))) {
          wrong.push(`${step.rule} ${callCode(step.call)} ${JSON.stringify(step.meaning)}`);
        }
      });
    }
    expect(wrong).toEqual([]);
    // The system has a call for almost every hand; a board with a fallback is never shown (M30).
    expect(fallbacks).toBeLessThanOrEqual(3);
  });

  it('explains each auction from its calls exactly as the bidder meant them', () => {
    for (const { vul, result } of boards.slice(0, 1000)) {
      expect(explainAuction(result.auction, vul)).toEqual(result.steps.map((s) => s.meaning));
    }
  });

  it('competes: both sides often bid, and the declaring side can hold fewer points (brief §4.1)', () => {
    let both = 0;
    let weaker = 0;
    let declared = 0;
    for (const { deal, result } of boards) {
      const { dealer, calls } = result.auction;
      const sides = new Set(
        calls.flatMap((call: Call, i) =>
          call.kind === 'bid' ? [sideOf(callerAt(dealer, i))] : [],
        ),
      );
      if (sides.size === 2) both++;
      const r = auctionResult(result.auction);
      if (!r) continue;
      declared++;
      const pair =
        sideOf(r.declarer) === 'NS' ? hcp(deal.N) + hcp(deal.S) : hcp(deal.E) + hcp(deal.W);
      if (pair < 20) weaker++;
    }
    expect(both / boards.length).toBeGreaterThan(0.3);
    expect(weaker / declared).toBeGreaterThan(0.1);
  });

  it('never ends doubled: the only doubles are for takeout, and there are no redoubles', () => {
    for (const { result } of boards) {
      expect(auctionResult(result.auction)?.doubling ?? 0).toBe(0);
      result.steps.forEach((step) => {
        if (step.call.kind === 'double') expect(step.meaning?.name).toBe('takeoutDouble');
        expect(step.call.kind).not.toBe('redouble');
      });
    }
  });

  it('is deterministic', () => {
    for (const { deal, dealer, vul, result } of boards.slice(0, 200)) {
      expect(bidDeal(deal, dealer, vul)).toEqual(result);
    }
  });

  it('reaches a spread of contracts, games and slams included', () => {
    const counts = { passedOut: 0, partscore: 0, game: 0, slam: 0 };
    for (const { result } of boards) {
      const r = auctionResult(result.auction);
      if (!r) counts.passedOut++;
      else if (r.level >= 6) counts.slam++;
      else if (r.level >= (r.strain === 'NT' ? 3 : r.strain === 'H' || r.strain === 'S' ? 4 : 5))
        counts.game++;
      else counts.partscore++;
    }
    expect(counts.passedOut / boards.length).toBeLessThan(0.06);
    expect(counts.game / boards.length).toBeGreaterThan(0.2);
    expect(counts.slam).toBeGreaterThan(0);
  });
});
