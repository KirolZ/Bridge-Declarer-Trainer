// The SAYC system (SPEC §6.5), as data: for each point of the auction, the calls the system makes
// in order of preference, each with its meaning. The bidder makes the first call whose meaning
// the hand fits; an explanation of a call is the meaning of the rules that make it there.
//
// Phase one (M28) covers auctions where the other side only passes. Where the system has nothing
// to say (the other side bid — M29) it gives no calls: the player passes and the pass means
// nothing. Point ranges follow the ACBL SAYC booklet; DECISIONS.md (M28) lists where they differ.

import type { Bid, Call, Strain, Suit } from '../engine';
import { PASS, STRAINS, bid } from '../engine';
import type { BidContext } from './context';
import { canBid, gameLevel, isGameBid } from './context';
import type { HandEval } from './evaluate';
import type { Meaning, Range } from './meaning';
import { MAX_HCP, NO_INFO } from './meaning';

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

const MAJORS: readonly Suit[] = ['S', 'H'];
const MINORS: readonly Suit[] = ['D', 'C'];
/** Majors first, then minors, higher first. */
const SUIT_PREFERENCE: readonly Suit[] = ['S', 'H', 'D', 'C'];

function c(
  call: Call,
  meaning: Meaning,
  rule: string,
  when?: (ev: HandEval) => boolean,
): Candidate {
  return when ? { call, meaning, rule, when } : { call, meaning, rule };
}

/** [lo, hi] clamped to 0–37, or null when empty. */
function r(lo: number, hi: number): Range | null {
  const a = Math.max(0, lo);
  const b = Math.min(MAX_HCP, hi);
  return a <= b ? [a, b] : null;
}

/** Adds `make(range)` when `range` is not empty. */
function withRange(out: Candidate[], range: Range | null, make: (hcp: Range) => Candidate): void {
  if (range) out.push(make(range));
}

const higher = (a: Strain, b: Strain) => STRAINS.indexOf(a) > STRAINS.indexOf(b);
const isSuit = (s: string): s is Suit => s === 'S' || s === 'H' || s === 'D' || s === 'C';

/** The lowest bid of `strain` above the last bid. */
function cheapest(ctx: BidContext, strain: Strain): Bid {
  const last = ctx.lastBid?.bid;
  if (!last) return bid(1, strain);
  return bid((higher(strain, last.strain) ? last.level : last.level + 1) as Bid['level'], strain);
}

/** Parses a bid code of the seq (`1S`, `2N`); null for pass / double. */
function bidOf(code: string | undefined): Bid | null {
  const m = /^([1-7])([CDHSN])$/.exec(code ?? '');
  if (!m) return null;
  const s = m[2]!;
  return bid(Number(m[1]) as Bid['level'], s === 'N' ? 'NT' : (s as Suit));
}

// ---------- Openings ----------

/** The major to open: the longer of two five-card majors, spades when equal. */
function openingMajor(ev: HandEval): Suit | null {
  if (ev.len.S >= 5 && ev.len.S >= ev.len.H) return 'S';
  if (ev.len.H >= 5) return 'H';
  return null;
}

/** The minor to open without a five-card major: the longer; 1♦ with 4-4, 1♣ with 3-3. */
function openingMinor(ev: HandEval): Suit {
  if (ev.len.D !== ev.len.C) return ev.len.D > ev.len.C ? 'D' : 'C';
  return ev.len.D >= 4 ? 'D' : 'C';
}

function opening(): Candidate[] {
  const one: Range = [12, 21];
  // A balanced hand with a five-card major opens the major (as the brief's 1♠ example).
  const noFiveMajor = { H: [0, 4] as Range, S: [0, 4] as Range };
  return [
    c(
      bid(2, 'C'),
      { name: 'strongTwoClubs', hcp: [22, MAX_HCP], artificial: true, forcing: 'round' },
      'open.2C',
    ),
    c(
      bid(2, 'NT'),
      { name: 'notrump', hcp: [20, 21], balanced: true, len: noFiveMajor },
      'open.2NT',
    ),
    c(
      bid(1, 'NT'),
      { name: 'notrump', hcp: [15, 17], balanced: true, len: noFiveMajor },
      'open.1NT',
    ),
    c(
      bid(1, 'S'),
      { name: 'opening', hcp: one, len: { S: [5, 13] } },
      'open.1S',
      (ev) => openingMajor(ev) === 'S',
    ),
    c(
      bid(1, 'H'),
      { name: 'opening', hcp: one, len: { H: [5, 13] } },
      'open.1H',
      (ev) => openingMajor(ev) === 'H',
    ),
    c(
      bid(1, 'D'),
      { name: 'opening', hcp: one, len: { D: [3, 13], H: [0, 4], S: [0, 4] } },
      'open.1D',
      (ev) => openingMinor(ev) === 'D',
    ),
    c(
      bid(1, 'C'),
      { name: 'opening', hcp: one, len: { C: [3, 13], H: [0, 4], S: [0, 4] } },
      'open.1C',
    ),
    // Weak twos: six cards, 5–10, no four cards in a major other than the suit.
    c(
      bid(2, 'S'),
      { name: 'weakTwo', hcp: [5, 10], len: { S: [6, 6] } },
      'open.2S',
      (ev) => ev.len.H < 4,
    ),
    c(
      bid(2, 'H'),
      { name: 'weakTwo', hcp: [5, 10], len: { H: [6, 6] } },
      'open.2H',
      (ev) => ev.len.S < 4,
    ),
    c(
      bid(2, 'D'),
      { name: 'weakTwo', hcp: [5, 10], len: { D: [6, 6] } },
      'open.2D',
      (ev) => ev.len.H < 4 && ev.len.S < 4,
    ),
    ...SUIT_PREFERENCE.map((s) =>
      c(bid(3, s), { name: 'preempt', hcp: [5, 10], len: { [s]: [7, 13] } }, `open.3${s}`),
    ),
    c(PASS, { name: 'pass', hcp: [0, 11] }, 'open.pass'),
  ];
}

// ---------- Responses to one of a suit ----------

/** The new suit for a 2/1 response: the longest eligible, the cheaper when equal. */
function twoOverOneSuit(ev: HandEval, major: Suit): Suit | null {
  const eligible = (['C', 'D', 'H'] as Suit[]).filter(
    (s) => higher(major, s) && ev.len[s] >= (s === 'H' ? 5 : 4),
  );
  let best: Suit | null = null;
  for (const s of eligible) if (!best || ev.len[s] > ev.len[best]) best = s;
  return best;
}

function majorResponses(major: Suit): Candidate[] {
  const out: Candidate[] = [
    c(
      bid(4, major),
      { name: 'preemptiveRaise', hcp: [0, 9], len: { [major]: [5, 13] } },
      'resp1M.4M',
    ),
    c(bid(3, major), { name: 'limitRaise', hcp: [10, 12], len: { [major]: [3, 13] } }, 'resp1M.3M'),
    c(bid(2, major), { name: 'raise', hcp: [6, 10], len: { [major]: [3, 13] } }, 'resp1M.2M'),
  ];
  if (major === 'H') {
    out.push(
      c(
        bid(1, 'S'),
        { name: 'newSuit', hcp: [6, MAX_HCP], len: { S: [4, 13] }, forcing: 'round' },
        'resp1M.1S',
      ),
    );
  }
  for (const s of ['C', 'D', 'H'] as Suit[]) {
    if (!higher(major, s)) continue;
    out.push(
      c(
        bid(2, s),
        {
          name: 'twoOverOne',
          hcp: [10, MAX_HCP],
          len: { [s]: [s === 'H' ? 5 : 4, 13] },
          forcing: 'round',
        },
        `resp1M.2${s}`,
        (ev) => twoOverOneSuit(ev, major) === s,
      ),
    );
  }
  // Without support (raises come first) and, over 1♥, without four spades.
  const noFit = { [major]: [0, 2] as Range, ...(major === 'H' ? { S: [0, 3] as Range } : {}) };
  out.push(
    c(
      bid(2, 'NT'),
      { name: 'notrump', hcp: [13, 15], balanced: true, forcing: 'game' },
      'resp1M.2NT',
    ),
    c(bid(3, 'NT'), { name: 'notrump', hcp: [16, MAX_HCP], balanced: true }, 'resp1M.3NT'),
    c(bid(1, 'NT'), { name: 'notrump', hcp: [6, 10], len: noFit }, 'resp1M.1NT'),
    // 11–12 with no raise, no new suit and no 2NT: the nearest is 1NT.
    c(bid(1, 'NT'), { name: 'notrump', hcp: [11, 12], len: noFit }, 'resp1M.1NT.max'),
    // Game values and support but no other bid: a new minor of three cards first (fit shown later).
    c(
      bid(2, 'C'),
      { name: 'twoOverOne', hcp: [13, MAX_HCP], len: { C: [3, 13] }, forcing: 'round' },
      'resp1M.2C.three',
    ),
    c(
      bid(2, 'D'),
      { name: 'twoOverOne', hcp: [13, MAX_HCP], len: { D: [3, 13] }, forcing: 'round' },
      'resp1M.2D.three',
    ),
    c(PASS, { name: 'pass', hcp: [0, 5] }, 'resp1M.pass'),
  );
  return out;
}

/** The major to respond with: 1♥ with 4-4, the longer otherwise, 1♠ with 5-5. */
function responseMajor(ev: HandEval): Suit | null {
  if (ev.len.S >= 5 && ev.len.S >= ev.len.H) return 'S';
  if (ev.len.H >= 4 && ev.len.H >= ev.len.S) return 'H';
  if (ev.len.S >= 4) return 'S';
  return null;
}

function minorResponses(minor: Suit): Candidate[] {
  const noMajor = { H: [0, 3] as Range, S: [0, 3] as Range };
  const support = minor === 'D' ? 4 : 5;
  const out: Candidate[] = [
    c(
      bid(1, 'H'),
      { name: 'newSuit', hcp: [6, MAX_HCP], len: { H: [4, 13] }, forcing: 'round' },
      'resp1m.1H',
      (ev) => responseMajor(ev) === 'H',
    ),
    c(
      bid(1, 'S'),
      { name: 'newSuit', hcp: [6, MAX_HCP], len: { S: [4, 13] }, forcing: 'round' },
      'resp1m.1S',
    ),
  ];
  if (minor === 'C') {
    out.push(
      c(
        bid(1, 'D'),
        { name: 'newSuit', hcp: [6, MAX_HCP], len: { D: [4, 13], ...noMajor }, forcing: 'round' },
        'resp1m.1D',
      ),
    );
  }
  const raiseLen = { [minor]: [support, 13] as Range, ...noMajor };
  out.push(
    c(bid(3, minor), { name: 'limitRaise', hcp: [10, 12], len: raiseLen }, 'resp1m.3m'),
    c(bid(2, minor), { name: 'raise', hcp: [6, 10], len: raiseLen }, 'resp1m.2m'),
  );
  if (minor === 'D') {
    out.push(
      c(
        bid(2, 'C'),
        {
          name: 'twoOverOne',
          hcp: [10, MAX_HCP],
          len: { C: [4, 13], ...noMajor },
          forcing: 'round',
        },
        'resp1m.2C',
      ),
    );
  }
  out.push(
    c(
      bid(2, 'NT'),
      { name: 'notrump', hcp: [13, 15], balanced: true, len: noMajor, forcing: 'game' },
      'resp1m.2NT',
    ),
    c(
      bid(3, 'NT'),
      { name: 'notrump', hcp: [16, MAX_HCP], balanced: true, len: noMajor },
      'resp1m.3NT',
    ),
    c(bid(1, 'NT'), { name: 'notrump', hcp: [6, 10], len: noMajor }, 'resp1m.1NT'),
    c(bid(1, 'NT'), { name: 'notrump', hcp: [11, 12], len: noMajor }, 'resp1m.1NT.max'),
    // Game values without a major, a fit or a balanced hand: a long minor of our own.
    c(bid(3, 'NT'), { name: 'notrump', hcp: [13, MAX_HCP], len: noMajor }, 'resp1m.3NT.unbalanced'),
    c(PASS, { name: 'pass', hcp: [0, 5] }, 'resp1m.pass'),
  );
  return out;
}

// ---------- Opener's rebid ----------

/** Opener's rebid after a new suit at the one level (forcing). */
function rebidAfterOneLevel(ctx: BidContext, open: Suit, resp: Suit): Candidate[] {
  const out: Candidate[] = [];
  const support = { [resp]: [4, 13] as Range };
  // A major is raised to game with 19–21; diamonds (1♣–1♦) only to three.
  const raises: Candidate[] =
    resp === 'D'
      ? [
          c(bid(3, resp), { name: 'invite', hcp: [16, 21], len: support }, 'rebid1.raise3'),
          c(bid(2, resp), { name: 'raise', hcp: [12, 15], len: support }, 'rebid1.raise2'),
        ]
      : [
          c(bid(4, resp), { name: 'game', hcp: [19, 21], len: support }, 'rebid1.raise4'),
          c(bid(3, resp), { name: 'invite', hcp: [16, 18], len: support }, 'rebid1.raise3'),
          c(bid(2, resp), { name: 'raise', hcp: [12, 15], len: support }, 'rebid1.raise2'),
        ];
  const newMajors = MAJORS.filter((s) => s !== resp && s !== open && higher(s, resp)).reverse(); // 1♥ before 1♠
  const showMajor = newMajors.map((s) =>
    c(
      bid(1, s),
      { name: 'newSuit', hcp: [12, 18], len: { [s]: [4, 13] } },
      `rebid1.1${s}`,
      (ev) => newMajors.find((x) => ev.len[x] >= 4) === s,
    ),
  );
  const noFit: Partial<Record<Suit, Range>> = resp === 'D' ? {} : { [resp]: [0, 3] };
  if (resp === 'D') out.push(...showMajor, ...raises);
  else out.push(...raises, ...showMajor);
  out.push(
    c(bid(2, 'NT'), { name: 'notrump', hcp: [18, 19], balanced: true, len: noFit }, 'rebid1.2NT'),
    c(bid(1, 'NT'), { name: 'notrump', hcp: [12, 14], balanced: true, len: noFit }, 'rebid1.1NT'),
  );
  const others = SUIT_PREFERENCE.filter((s) => s !== open && s !== resp);
  for (const s of others) {
    const low = cheapest(ctx, s);
    out.push(
      c(
        bid((low.level + 1) as Bid['level'], s),
        { name: 'jumpShift', hcp: [19, 21], len: { [s]: [4, 13] }, forcing: 'game' },
        `rebid1.jump${s}`,
      ),
    );
  }
  out.push(
    c(bid(3, open), { name: 'rebid', hcp: [16, 21], len: { [open]: [6, 13] } }, 'rebid1.3O'),
    c(bid(2, open), { name: 'rebid', hcp: [12, 15], len: { [open]: [6, 13] } }, 'rebid1.2O'),
  );
  for (const s of others) {
    const low = cheapest(ctx, s);
    if (low.level !== 2) continue;
    if (higher(open, s)) {
      out.push(c(low, { name: 'newSuit', hcp: [12, 18], len: { [s]: [4, 13] } }, `rebid1.2${s}`));
    } else {
      out.push(
        c(
          low,
          {
            name: 'reverse',
            hcp: [17, 21],
            len: { [s]: [4, 13], [open]: [5, 13] },
            forcing: 'round',
          },
          `rebid1.reverse${s}`,
          (ev) => ev.len[open] > ev.len[s],
        ),
      );
    }
  }
  out.push(
    c(bid(2, open), { name: 'rebid', hcp: [12, 21], len: { [open]: [5, 13] } }, 'rebid1.2O.five'),
    c(bid(1, 'NT'), { name: 'notrump', hcp: [12, 14], len: noFit }, 'rebid1.1NT.unbalanced'),
    c(bid(2, 'NT'), { name: 'notrump', hcp: [15, 21], len: noFit }, 'rebid1.2NT.unbalanced'),
  );
  return out;
}

/** Opener's rebid after a two-over-one response (forcing one round). */
function rebidAfterTwoOverOne(ctx: BidContext, open: Suit, resp: Suit): Candidate[] {
  const support = resp === 'H' ? 3 : 4;
  const out: Candidate[] = [
    c(
      bid(3, resp),
      { name: 'raise', hcp: [12, 21], len: { [resp]: [support, 13] } },
      'rebid2.raise',
    ),
    c(bid(2, open), { name: 'rebid', hcp: [12, 21], len: { [open]: [6, 13] } }, 'rebid2.2O'),
  ];
  for (const s of SUIT_PREFERENCE) {
    if (s === open || s === resp) continue;
    const low = cheapest(ctx, s);
    if (low.level === 2) {
      out.push(c(low, { name: 'newSuit', hcp: [12, 21], len: { [s]: [4, 13] } }, `rebid2.2${s}`));
    }
  }
  out.push(
    c(bid(2, 'NT'), { name: 'notrump', hcp: [12, 14], balanced: true }, 'rebid2.2NT'),
    c(bid(3, 'NT'), { name: 'notrump', hcp: [15, 21], balanced: true }, 'rebid2.3NT'),
    c(bid(2, open), { name: 'rebid', hcp: [12, 21], len: { [open]: [5, 13] } }, 'rebid2.2O.five'),
    c(bid(2, 'NT'), { name: 'notrump', hcp: [12, 21] }, 'rebid2.2NT.other'),
  );
  return out;
}

/** Opener's rebid after 1♥ / 1♠ – 1NT (not forcing). */
function rebidAfterOneNT(ctx: BidContext, open: Suit): Candidate[] {
  const out: Candidate[] = [
    c(bid(4, open), { name: 'game', hcp: [19, 21], len: { [open]: [6, 13] } }, 'rebidNT.4O'),
  ];
  for (const s of SUIT_PREFERENCE) {
    if (s === open) continue;
    const low = cheapest(ctx, s);
    out.push(
      c(
        bid((low.level + 1) as Bid['level'], s),
        { name: 'jumpShift', hcp: [19, 21], len: { [s]: [4, 13] }, forcing: 'game' },
        `rebidNT.jump${s}`,
      ),
    );
  }
  out.push(
    c(bid(3, open), { name: 'invite', hcp: [16, 18], len: { [open]: [6, 13] } }, 'rebidNT.3O'),
    c(bid(2, 'NT'), { name: 'invite', hcp: [18, 19], balanced: true }, 'rebidNT.2NT'),
    c(bid(2, open), { name: 'rebid', hcp: [12, 15], len: { [open]: [6, 13] } }, 'rebidNT.2O'),
  );
  for (const s of SUIT_PREFERENCE) {
    if (s === open || !higher(open, s)) continue;
    out.push(
      c(bid(2, s), { name: 'newSuit', hcp: [12, 18], len: { [s]: [4, 13] } }, `rebidNT.2${s}`),
    );
  }
  out.push(c(PASS, { name: 'pass', hcp: [12, 21] }, 'rebidNT.pass'));
  return out;
}

// ---------- 1NT / 2NT and the 2♣ opening ----------

/** Responses to partner's 1NT / 2NT (also 2♣–2♦–2NT), thresholds from what partner showed. */
function notrumpResponses(ctx: BidContext, level: 1 | 2): Candidate[] {
  const [pmin, pmax] = ctx.shownByPartner.hcp;
  const inviteLo = Math.max(0, 25 - pmax);
  const gameLo = level === 1 ? 25 - pmin : inviteLo;
  const slamLo = 33 - pmin;
  const l = (level + 1) as Bid['level'];
  const noMajor = { H: [0, 3] as Range, S: [0, 3] as Range };
  const out: Candidate[] = [
    c(
      bid(l, 'H'),
      { name: 'transfer', len: { S: [5, 13] }, artificial: true, forcing: 'round' },
      'nt.transferS',
      (ev) => ev.len.S >= ev.len.H,
    ),
    c(
      bid(l, 'D'),
      { name: 'transfer', len: { H: [5, 13] }, artificial: true, forcing: 'round' },
      'nt.transferH',
    ),
    c(
      bid(l, 'C'),
      { name: 'stayman', hcp: [inviteLo, MAX_HCP], artificial: true, forcing: 'round' },
      'nt.stayman',
      (ev) => ev.len.H === 4 || ev.len.S === 4,
    ),
  ];
  withRange(out, r(slamLo, MAX_HCP), (hcp) =>
    c(bid(6, 'NT'), { name: 'slam', hcp, len: noMajor }, 'nt.6NT'),
  );
  withRange(out, r(gameLo, slamLo - 1), (hcp) =>
    c(bid(3, 'NT'), { name: 'game', hcp, len: noMajor }, 'nt.3NT'),
  );
  if (level === 1) {
    withRange(out, r(inviteLo, gameLo - 1), (hcp) =>
      c(bid(2, 'NT'), { name: 'invite', hcp, len: noMajor }, 'nt.2NT'),
    );
  }
  withRange(out, r(0, inviteLo - 1), (hcp) => c(PASS, { name: 'pass', hcp }, 'nt.pass'));
  return out;
}

function staymanReplies(stayman: Bid): Candidate[] {
  const l = stayman.level;
  return [
    c(bid(l, 'H'), { name: 'staymanReply', len: { H: [4, 4] } }, 'stayman.H'),
    c(bid(l, 'S'), { name: 'staymanReply', len: { S: [4, 4], H: [0, 3] } }, 'stayman.S'),
    c(
      bid(l, 'D'),
      { name: 'staymanReply', len: { H: [0, 3], S: [0, 3] }, artificial: true },
      'stayman.D',
    ),
  ];
}

/** After 1NT–2♣–2♥–(2NT / 3NT): responder holds four spades, so opener with four bids them. */
function staymanSpades(ctx: BidContext, nt: Bid): Candidate[] {
  const pmin = ctx.shownByPartner.hcp[0];
  const myMin = ctx.shownByMe.hcp[0];
  const out: Candidate[] = [];
  if (isGameBid(nt)) {
    out.push(c(bid(4, 'S'), { name: 'game', len: { S: [4, 13] } }, 'stayman.4S'));
  } else {
    withRange(out, r(25 - pmin, MAX_HCP), (hcp) =>
      c(bid(4, 'S'), { name: 'game', hcp, len: { S: [4, 13] } }, 'stayman.4S'),
    );
    withRange(out, r(myMin, 24 - pmin), (hcp) =>
      c(bid(3, 'S'), { name: 'signoff', hcp, len: { S: [4, 13] } }, 'stayman.3S'),
    );
  }
  return out;
}

function twoClubRebids(): Candidate[] {
  const longest = (s: Suit) => (ev: HandEval) =>
    SUIT_PREFERENCE.every(
      (x) =>
        ev.len[x] < ev.len[s] ||
        (ev.len[x] === ev.len[s] && SUIT_PREFERENCE.indexOf(x) >= SUIT_PREFERENCE.indexOf(s)),
    );
  const suitBid = (s: Suit) => bid(MAJORS.includes(s) ? 2 : 3, s);
  const noFiveMajor = { H: [0, 4] as Range, S: [0, 4] as Range };
  return [
    // A five-card major is shown first, so the notrump rebids deny one (Stayman then works).
    ...MAJORS.map((s) =>
      c(
        suitBid(s),
        { name: 'rebid', len: { [s]: [5, 13] }, forcing: 'game' },
        `2C.${s}`,
        longest(s),
      ),
    ),
    c(bid(2, 'NT'), { name: 'notrump', hcp: [22, 24], balanced: true, len: noFiveMajor }, '2C.2NT'),
    c(bid(3, 'NT'), { name: 'notrump', hcp: [25, 27], balanced: true, len: noFiveMajor }, '2C.3NT'),
    ...SUIT_PREFERENCE.map((s) =>
      c(
        suitBid(s),
        { name: 'rebid', len: { [s]: [5, 13] }, forcing: 'game' },
        `2C.${s}`,
        longest(s),
      ),
    ),
    ...SUIT_PREFERENCE.map((s) =>
      c(
        suitBid(s),
        { name: 'rebid', len: { [s]: [4, 13] }, forcing: 'game' },
        `2C.${s}.four`,
        longest(s),
      ),
    ),
    c(bid(2, 'NT'), { name: 'notrump' }, '2C.2NT.other'),
  ];
}

// ---------- Blackwood ----------

function aceReplies(): Candidate[] {
  return [
    c(bid(5, 'C'), { name: 'aceReply', aces: [0, 4], artificial: true }, 'bw.5C'),
    c(bid(5, 'D'), { name: 'aceReply', aces: [1], artificial: true }, 'bw.5D'),
    c(bid(5, 'H'), { name: 'aceReply', aces: [2], artificial: true }, 'bw.5H'),
    c(bid(5, 'S'), { name: 'aceReply', aces: [3], artificial: true }, 'bw.5S'),
  ];
}

/** After partner's ace reply: slam with at most one ace missing, else stop in five. */
function afterAceReply(ctx: BidContext): Candidate[] {
  const reply = ctx.partnerLast!;
  const theirAces = reply.meaning?.aces ?? [0];
  // A 5♣ reply is 0 or 4 aces: 4 when we hold none (we asked for slam, so they must be there).
  const total = (mine: number) =>
    mine + (theirAces.includes(4) && mine === 0 ? 4 : Math.min(...theirAces));
  const ok = [0, 1, 2, 3, 4].filter((a) => total(a) >= 3);
  const short = [0, 1, 2, 3, 4].filter((a) => total(a) < 3);
  const need = (s: Suit) => Math.max(0, 8 - ctx.shownByPartner.len[s][0]);
  const out: Candidate[] = [];
  for (const s of SUIT_PREFERENCE) {
    const len = { [s]: [need(s), 13] as Range };
    if (ok.length > 0) out.push(c(bid(6, s), { name: 'slam', len, aces: ok }, `bw.6${s}`));
    if (short.length > 0) {
      if (canBid(ctx, { level: 5, strain: s })) {
        out.push(c(bid(5, s), { name: 'signoff', len, aces: short }, `bw.5${s}.signoff`));
      } else if (reply.call.kind === 'bid' && reply.call.strain === s) {
        out.push(c(PASS, { name: 'signoff', len, aces: short }, `bw.pass${s}`));
      }
    }
  }
  // Short of aces with the five level gone: slam anyway.
  for (const s of SUIT_PREFERENCE) {
    out.push(c(bid(6, s), { name: 'slam', len: { [s]: [need(s), 13] } }, `bw.6${s}.anyway`));
  }
  return out;
}

// ---------- Placing the contract ----------

/**
 * Captain's decision once partner has described their hand: slam, game, invite or partscore, in
 * a known eight-card fit or in notrump, from the points partner has shown at least (and at most,
 * for invitations).
 */
function placement(ctx: BidContext): Candidate[] {
  const p = ctx.shownByPartner;
  const [pmin, pmax] = p.hcp;
  const cur = ctx.lastBid?.bid ?? null;
  if (ctx.blackwoodAsked || (cur && cur.level >= 6)) return [c(PASS, NO_INFO, 'place.done')];
  const need = (s: Suit) => Math.max(0, 8 - p.len[s][0]);
  const fit = (s: Suit) => ({ [s]: [need(s), 13] as Range });
  const out: Candidate[] = [];

  // Slam: Blackwood with a fit, 6NT without.
  const slam = r(33 - pmin, MAX_HCP);
  if (slam) {
    for (const s of SUIT_PREFERENCE) {
      out.push(
        c(
          bid(4, 'NT'),
          { name: 'blackwood', hcp: slam, len: fit(s), artificial: true, forcing: 'round' },
          `place.blackwood${s}`,
        ),
      );
    }
    out.push(c(bid(6, 'NT'), { name: 'slam', hcp: slam }, 'place.6NT'));
  }

  // Game: a major fit, then 3NT, then a minor fit.
  for (const s of MAJORS) {
    withRange(out, r(25 - pmin, MAX_HCP), (hcp) =>
      c(bid(4, s), { name: 'game', hcp, len: fit(s) }, `place.4${s}`),
    );
  }
  withRange(out, r(25 - pmin, MAX_HCP), (hcp) =>
    c(bid(3, 'NT'), { name: 'game', hcp }, 'place.3NT'),
  );
  for (const s of MINORS) {
    withRange(out, r(29 - pmin, MAX_HCP), (hcp) =>
      c(bid(5, s), { name: 'game', hcp, len: fit(s) }, `place.5${s}`),
    );
  }

  const ourBid = cur !== null;
  const atGame = cur !== null && isGameBid(cur);
  if (atGame) {
    withRange(out, r(0, 32 - pmin), (hcp) => c(PASS, { name: 'pass', hcp }, 'place.pass.game'));
    return finish(ctx, out);
  }

  // Invitations, only when partner's strength is known within a few points.
  const invite = pmax - pmin <= 5 ? r(25 - pmax, 24 - pmin) : null;
  if (invite) {
    for (const s of MAJORS)
      out.push(c(bid(3, s), { name: 'invite', hcp: invite, len: fit(s) }, `place.3${s}`));
    out.push(c(bid(2, 'NT'), { name: 'invite', hcp: invite }, 'place.2NT'));
  }
  // With 2NT still open every hand in the invitation range invites, so passing shows less.
  const ntInvite = invite !== null && canBid(ctx, { level: 2, strain: 'NT' });
  const keep = r(0, ntInvite ? invite[0] - 1 : 24 - pmin);
  if (keep && ourBid) {
    const strain = cur.strain;
    // Stay in a fit or in notrump; otherwise move to a fit at the lowest level.
    if (strain !== 'NT')
      out.push(c(PASS, { name: 'pass', hcp: keep, len: fit(strain) }, 'place.pass.fit'));
    else out.push(c(PASS, { name: 'pass', hcp: keep }, 'place.pass.nt'));
    for (const s of SUIT_PREFERENCE) {
      if (s === strain) continue;
      const low = cheapest(ctx, s);
      if (low.level < gameLevel(s))
        out.push(c(low, { name: 'signoff', hcp: keep, len: fit(s) }, `place.to${s}`));
    }
    out.push(c(PASS, { name: 'pass', hcp: keep }, 'place.pass'));
  }
  return finish(ctx, out);
}

/** When pass is not allowed, a last resort that keeps the auction going. */
function finish(ctx: BidContext, out: Candidate[]): Candidate[] {
  if (!ctx.forced) return out;
  const last = ctx.partnerLast?.call;
  const options: Bid[] = [cheapest(ctx, 'NT')];
  if (last?.kind === 'bid' && last.strain !== 'NT') options.unshift(cheapest(ctx, last.strain));
  const fallback = options.find((b) => b.level <= 5 && !(b.level === 4 && b.strain === 'NT'));
  return fallback ? [...out, c(fallback, NO_INFO, 'place.forced')] : out;
}

// ---------- Dispatch ----------

/** The calls the system makes at this point, in order of preference (none: it has no say). */
export function candidates(ctx: BidContext): Candidate[] {
  if (ctx.theyActed) return []; // competitive bidding: M29
  if (ctx.opener === null) return opening();

  const partner = ctx.partnerLast;
  const partnerName = partner?.meaning?.name;
  if (partner?.call.kind === 'bid') {
    if (partnerName === 'blackwood') return aceReplies();
    if (partnerName === 'stayman') return staymanReplies(partner.call);
    if (partnerName === 'transfer') {
      const target = partner.call.strain === 'D' ? 'H' : 'S';
      return [c(bid(partner.call.level, target), { name: 'transferAccept' }, 'transfer.accept')];
    }
  }
  if (ctx.myLast?.meaning?.name === 'blackwood') return afterAceReply(ctx);

  const { seq } = ctx;
  const iOpened = ctx.opener === ctx.seat;
  const first = bidOf(seq[0]);
  if (!iOpened && seq.length === 1 && first) {
    if (first.level === 1 && (first.strain === 'H' || first.strain === 'S'))
      return majorResponses(first.strain);
    if (first.level === 1 && (first.strain === 'C' || first.strain === 'D'))
      return minorResponses(first.strain);
    if (first.strain === 'NT' && first.level <= 2)
      return notrumpResponses(ctx, first.level as 1 | 2);
    if (first.level === 2 && first.strain === 'C') {
      return [c(bid(2, 'D'), { name: 'waiting', artificial: true }, '2C.waiting')];
    }
  }
  if (!iOpened && seq.join(' ') === '2C 2D 2N') return notrumpResponses(ctx, 2);
  if (iOpened && seq.length === 2 && first && first.level === 1 && first.strain !== 'NT') {
    const resp = bidOf(seq[1]);
    if (resp && isSuit(resp.strain)) {
      if (resp.level === 1) return rebidAfterOneLevel(ctx, first.strain, resp.strain);
      if (resp.level === 2 && resp.strain !== first.strain && !higher(resp.strain, first.strain)) {
        return rebidAfterTwoOverOne(ctx, first.strain, resp.strain);
      }
    }
    if (seq[1] === '1N' && (first.strain === 'H' || first.strain === 'S'))
      return rebidAfterOneNT(ctx, first.strain);
  }
  if (iOpened && seq.join(' ') === '2C 2D') return twoClubRebids();
  const mine = ctx.myLast;
  if (
    mine?.meaning?.name === 'staymanReply' &&
    mine.call.kind === 'bid' &&
    mine.call.strain === 'H' &&
    partner?.call.kind === 'bid' &&
    partner.call.strain === 'NT'
  ) {
    return [...staymanSpades(ctx, partner.call), ...placement(ctx)];
  }
  return placement(ctx);
}
