// Where the auction stands for the player to call (SPEC §6.5): built from the calls so far and
// their meanings only — never from a hand — so the same context explains a call after the fact.

import type { Auction, Bid, Call, Seat, Strain, Vulnerability } from '../engine';
import { bidRank, callCode, callerAt, partnerOf, sideOf } from '../engine';
import type { Meaning, Shown } from './meaning';
import { NOTHING_SHOWN, narrow } from './meaning';

export type BidContext = {
  readonly auction: Auction;
  readonly seat: Seat;
  readonly partner: Seat;
  readonly weVul: boolean;
  readonly theyVul: boolean;
  /** Meanings of the calls so far (null: not explained by the system). */
  readonly meanings: readonly (Meaning | null)[];
  /** The other side made a call other than pass. */
  readonly theyActed: boolean;
  /** Our side's calls from our first non-pass call on, e.g. `1S 2S` ('' if we have not opened). */
  readonly seq: readonly string[];
  /** Who of our side opened (null: nobody yet). */
  readonly opener: Seat | null;
  /** The last bid of the auction and who made it. */
  readonly lastBid: { readonly bid: Bid; readonly seat: Seat } | null;
  readonly shownByPartner: Shown;
  readonly shownByMe: Shown;
  /** Partner's last call, and its meaning. */
  readonly partnerLast: { readonly call: Call; readonly meaning: Meaning | null } | null;
  /** My own last call, and its meaning. */
  readonly myLast: { readonly call: Call; readonly meaning: Meaning | null } | null;
  /** Pass is not allowed: partner's last call forces a bid, or our side is forced to game short of it. */
  readonly forced: boolean;
  /** Our side asked for aces already. */
  readonly blackwoodAsked: boolean;
};

/** Lowest bid of a game in `strain`: 3NT, 4♥ / 4♠, 5♣ / 5♦. */
export function gameLevel(strain: Strain): 3 | 4 | 5 {
  if (strain === 'NT') return 3;
  return strain === 'H' || strain === 'S' ? 4 : 5;
}

export function isGameBid(b: { level: number; strain: Strain }): boolean {
  return b.level >= gameLevel(b.strain);
}

export function buildContext(
  auction: Auction,
  vulnerability: Vulnerability,
  meanings: readonly (Meaning | null)[],
): BidContext {
  const { dealer, calls } = auction;
  const seat = callerAt(dealer, calls.length);
  const partner = partnerOf(seat);
  const side = sideOf(seat);
  const ours = (i: number) => sideOf(callerAt(dealer, i)) === side;

  let theyActed = false;
  let openIndex = -1;
  let lastBid: BidContext['lastBid'] = null;
  let shownByPartner = NOTHING_SHOWN;
  let shownByMe = NOTHING_SHOWN;
  let partnerLast: BidContext['partnerLast'] = null;
  let myLast: BidContext['myLast'] = null;
  let blackwoodAsked = false;
  let gameForcing = false;
  calls.forEach((call, i) => {
    const who = callerAt(dealer, i);
    const m = meanings[i] ?? null;
    if (call.kind === 'bid') lastBid = { bid: call, seat: who };
    if (!ours(i)) {
      if (call.kind !== 'pass') theyActed = true;
      return;
    }
    if (openIndex < 0 && call.kind !== 'pass') openIndex = i;
    if (m?.name === 'blackwood') blackwoodAsked = true;
    if (m?.forcing === 'game') gameForcing = true;
    if (who === partner) {
      shownByPartner = narrow(shownByPartner, m);
      partnerLast = { call, meaning: m };
    } else {
      shownByMe = narrow(shownByMe, m);
      myLast = { call, meaning: m };
    }
  });

  const seq =
    openIndex < 0
      ? []
      : calls.flatMap((call, i) => (i >= openIndex && ours(i) ? [callCode(call)] : []));
  const last = lastBid as BidContext['lastBid'];
  const pLast = partnerLast as BidContext['partnerLast'];
  const belowGame = !last || !isGameBid(last.bid) || sideOf(last.seat) !== side;
  const forced =
    (pLast?.meaning?.forcing === 'round' && pLast.call.kind !== 'pass') ||
    (gameForcing && belowGame);

  return {
    auction,
    seat,
    partner,
    weVul: vulnerability === 'ns' && side === 'NS',
    theyVul: vulnerability === 'ns' && side === 'EW',
    meanings,
    theyActed,
    seq,
    opener: openIndex < 0 ? null : callerAt(dealer, openIndex),
    lastBid: last,
    shownByPartner,
    shownByMe,
    partnerLast: pLast,
    myLast,
    forced,
    blackwoodAsked,
  };
}

/** `b` is higher than the last bid (so it can be made, doubles aside). */
export function canBid(ctx: BidContext, b: { level: number; strain: Strain }): boolean {
  return b.level <= 7 && (!ctx.lastBid || bidRank(b as Bid) > bidRank(ctx.lastBid.bid));
}
