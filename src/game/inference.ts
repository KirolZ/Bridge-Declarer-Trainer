// What the player can tell about the defenders' hands (SPEC §7.5, §8 — M31): what each of them
// showed in the auction (every meaning of their calls at once, src/bidding), narrowed by the cards
// the player can see — the high-card points and cards of each suit that are not in sight are
// shared by the hands that are not. Pure, so the table and the summary show the same thing.

import type { Auction, Card, Seat, Suit } from '../engine';
import { SEATS, SUITS, callerAt, hcp } from '../engine';
import type { Meaning, Range, Shown } from '../bidding';
import { NOTHING_SHOWN, narrow } from '../bidding';

/** What each seat showed in the auction; `meanings[i]` is the meaning of call `i`. */
export function shownBySeat(
  auction: Auction,
  meanings: readonly (Meaning | null)[],
): Record<Seat, Shown> {
  const out: Record<Seat, Shown> = {
    N: NOTHING_SHOWN,
    E: NOTHING_SHOWN,
    S: NOTHING_SHOWN,
    W: NOTHING_SHOWN,
  };
  auction.calls.forEach((_, i) => {
    const seat = callerAt(auction.dealer, i);
    out[seat] = narrow(out[seat], meanings[i] ?? null);
  });
  return out;
}

/** What is known about one hidden hand. */
export type Inference = {
  readonly hcp: Range;
  /** Cards held in each suit. */
  readonly len: Readonly<Record<Suit, Range>>;
  /** The most a hidden hand could hold in each suit: the cards of the suit not in sight. */
  readonly unseen: Readonly<Record<Suit, number>>;
  readonly balanced: boolean;
};

const empty = (r: Range) => r[0] > r[1];

/**
 * `seat`'s range of a total shared by the hidden hands: what it showed, and what is left of `total`
 * once the other hidden hands hold the most / least they showed.
 */
function share(total: number, own: Range, others: readonly Range[]): Range {
  const lo = Math.max(own[0], total - others.reduce((n, r) => n + r[1], 0));
  const hi = Math.min(own[1], total - others.reduce((n, r) => n + r[0], 0));
  return [lo, hi];
}

/**
 * What is known about each hidden hand: `shown` from the auction, narrowed by `visible` (whole
 * hands the player sees). The ranges are narrowed again until nothing changes. If what the auction
 * says cannot be true of the cards in sight (an edited link), only the auction is used.
 */
export function infer(
  shown: Readonly<Record<Seat, Shown>>,
  visible: Readonly<Partial<Record<Seat, readonly Card[]>>>,
): Partial<Record<Seat, Inference>> {
  const hidden = SEATS.filter((s) => !visible[s]);
  const seen = SEATS.flatMap((s) => visible[s] ?? []);
  const restHcp = 40 - hcp(seen);
  const unseen = {} as Record<Suit, number>;
  for (const suit of SUITS) unseen[suit] = 13 - seen.filter((c) => c.suit === suit).length;

  type Known = { hcp: Range; len: Record<Suit, Range> };
  const cur = new Map<Seat, Known>();
  for (const s of hidden) {
    const len = {} as Record<Suit, Range>;
    for (const suit of SUITS) {
      len[suit] = [shown[s].len[suit][0], Math.min(shown[s].len[suit][1], unseen[suit])];
    }
    cur.set(s, { hcp: shown[s].hcp, len });
  }
  let changed = true;
  let ok = true;
  for (let round = 0; changed && ok && round < 8; round++) {
    changed = false;
    for (const s of hidden) {
      const me = cur.get(s)!;
      const others = hidden.filter((o) => o !== s).map((o) => cur.get(o)!);
      const h = share(
        restHcp,
        me.hcp,
        others.map((o) => o.hcp),
      );
      const len = {} as Record<Suit, Range>;
      for (const suit of SUITS) {
        len[suit] = share(
          unseen[suit],
          me.len[suit],
          others.map((o) => o.len[suit]),
        );
        if (empty(len[suit])) ok = false;
      }
      if (empty(h)) ok = false;
      if (!ok) break;
      if (h[0] !== me.hcp[0] || h[1] !== me.hcp[1]) changed = true;
      for (const suit of SUITS) {
        if (len[suit][0] !== me.len[suit][0] || len[suit][1] !== me.len[suit][1]) changed = true;
      }
      cur.set(s, { hcp: h, len });
    }
  }

  const out: Partial<Record<Seat, Inference>> = {};
  for (const s of hidden) {
    const known = ok ? cur.get(s)! : { hcp: shown[s].hcp, len: shown[s].len };
    out[s] = { hcp: known.hcp, len: known.len, unseen, balanced: shown[s].balanced };
  }
  return out;
}
