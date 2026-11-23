// Competitive bidding (SPEC §6.5, M29): both sides use the same rules. The side that did not open
// overcalls, doubles for takeout or bids notrump; its partner advances; the opening side answers
// the overcall; after that each side competes in a known fit up to the level the Law of Total
// Tricks allows (8 trumps → the two level, 9 → three, 10 → four). There are no penalty doubles and
// no redoubles, and after a takeout double the advancer must bid unless the next player bid —
// so no auction ends doubled.

import type { Suit } from '../engine';
import { DOUBLE, PASS, bid, bidRank, sideOf } from '../engine';
import type { BidContext } from './context';
import { gameLevel } from './context';
import type { HandEval } from './evaluate';
import type { Range } from './meaning';
import { MAX_HCP } from './meaning';
import { placement } from './placement';
import type { Candidate } from './rules';
import { MAJORS, SUIT_PREFERENCE, c, cheapest, longestOf, r, withRange } from './rules';

/** A suit good enough to overcall at five cards: two of the top honours or so (3+ HCP in it). */
const goodSuit = (ev: HandEval, s: Suit) => ev.len[s] >= 6 || ev.suitHcp[s] >= 3;

/** One length range per suit, for meanings. */
function lens(entries: readonly [Suit, Range][]): Partial<Record<Suit, Range>> {
  return Object.fromEntries(entries) as Partial<Record<Suit, Range>>;
}

// ---------- The side that did not open: first action ----------

/**
 * Over the opponents' natural bid, before our side has acted: takeout double, weak jump overcall,
 * simple overcall, notrump overcall, or pass. In the balancing seat (pass would end the auction)
 * the point ranges are lower.
 */
export function defend(ctx: BidContext): Candidate[] {
  const last = ctx.theirLast!;
  const lb = last.bid;
  const bal = ctx.passEnds;
  const out: Candidate[] = [];
  const unbid = SUIT_PREFERENCE.filter((s) => !ctx.theirSuits.includes(s));

  if (lb.strain === 'NT') {
    // Over their notrump: a natural overcall with a six-card suit.
    for (const s of SUIT_PREFERENCE) {
      const b = cheapest(ctx, s);
      if (b.level > 3) continue;
      out.push(
        c(
          b,
          { name: 'overcall', hcp: b.level <= 2 ? [8, 15] : [10, 15], len: { [s]: [6, 13] } },
          `def.nt.${s}`,
          (ev) => longestOf(ev, SUIT_PREFERENCE) === s,
        ),
      );
    }
    out.push(c(PASS, { name: 'pass' }, 'def.nt.pass'));
    return out;
  }

  const x = lb.strain;
  const single = ctx.theirSuits.length === 1;
  const firstBid = single && ctx.theirLast?.seat === ctx.openedBy && lb.level === 1;
  const takeout = single && lb.level <= 3;
  if (takeout) {
    const lo = (bal ? 9 : 12) + (lb.level === 3 ? 1 : 0);
    out.push(
      c(
        DOUBLE,
        {
          name: 'takeoutDouble',
          hcp: [lo, MAX_HCP],
          len: lens([[x, [0, 2]], ...unbid.map((s): [Suit, Range] => [s, [3, 13]])]),
          forcing: 'round',
        },
        'def.x',
      ),
    );
  }
  if (firstBid && !bal) {
    for (const s of unbid) {
      const jump = bid((cheapest(ctx, s).level + 1) as 2 | 3, s);
      if (jump.level > 3) continue;
      out.push(
        c(
          jump,
          { name: 'weakJumpOvercall', hcp: [5, 10], len: { [s]: [6, 6] } },
          `def.wjo${s}`,
          (ev) => longestOf(ev, unbid) === s && goodSuit(ev, s),
        ),
      );
    }
  }
  for (const s of unbid) {
    const b = cheapest(ctx, s);
    if (b.level > 3) continue;
    const hcp: Range =
      b.level === 1 ? [bal ? 7 : 8, 16] : b.level === 2 ? [bal ? 8 : 10, 16] : [bal ? 10 : 12, 17];
    out.push(
      c(
        b,
        { name: 'overcall', hcp, len: { [s]: [b.level === 3 ? 6 : 5, 13] } },
        `def.overcall${s}`,
        (ev) => longestOf(ev, unbid) === s && goodSuit(ev, s),
      ),
    );
  }
  const nt = cheapest(ctx, 'NT');
  if (single && nt.level === 1) {
    out.push(
      c(
        nt,
        { name: 'notrumpOvercall', hcp: bal ? [11, 14] : [15, 18], balanced: true, stoppers: [x] },
        'def.1NT',
      ),
    );
  }
  if (single && !bal && nt.level === 2 && lb.level === 2) {
    out.push(
      c(nt, { name: 'notrumpOvercall', hcp: [15, 18], balanced: true, stoppers: [x] }, 'def.2NT'),
    );
  }
  if (takeout) {
    // Too strong to overcall: double first (then bid the suit).
    out.push(
      c(
        DOUBLE,
        { name: 'takeoutDouble', hcp: [17, MAX_HCP], len: { [x]: [0, 3] }, forcing: 'round' },
        'def.x.strong',
      ),
    );
  }
  out.push(c(PASS, { name: 'pass' }, 'def.pass'));
  return out;
}

// ---------- Partner of the overcaller / doubler ----------

/** The suit to advance a takeout double in: the longest unbid major with four, else the longest. */
function advanceSuit(ev: HandEval, unbid: readonly Suit[]): Suit | null {
  const major = longestOf(
    ev,
    unbid.filter((s) => MAJORS.includes(s)),
  );
  if (major && ev.len[major] >= 4) return major;
  return longestOf(ev, unbid);
}

/** Advancing partner's takeout double: forced to bid when the next player passed. */
export function advanceDouble(ctx: BidContext): Candidate[] {
  const x = ctx.theirLast!.bid.strain as Suit;
  const unbid = SUIT_PREFERENCE.filter((s) => !ctx.theirSuits.includes(s));
  const stoppers = [...ctx.theirSuits];
  const out: Candidate[] = [];
  const pick = (s: Suit) => (ev: HandEval) => advanceSuit(ev, unbid) === s;

  if (ctx.rhoCall?.kind === 'bid') {
    // Free to pass: bid only with something to say.
    for (const s of unbid) {
      out.push(
        c(
          cheapest(ctx, s),
          { name: 'advance', hcp: [6, MAX_HCP], len: { [s]: [4, 13] } },
          `adv.x.free${s}`,
          pick(s),
        ),
      );
    }
    out.push(c(PASS, { name: 'pass' }, 'adv.x.pass'));
    return out;
  }

  for (const s of unbid.filter((u) => MAJORS.includes(u))) {
    out.push(
      c(bid(4, s), { name: 'game', hcp: [12, MAX_HCP], len: { [s]: [4, 13] } }, `adv.x.4${s}`),
    );
  }
  out.push(c(bid(3, 'NT'), { name: 'game', hcp: [12, MAX_HCP], stoppers }, 'adv.x.3NT'));
  // A jump (to the three level at most, so 3NT stays open) shows 9+; a hand too strong for a
  // simple bid whose jump would go past three bids the suit cheaply, so that bid shows any strength.
  const canJump = (s: Suit) => cheapest(ctx, s).level + 1 <= 3;
  for (const s of unbid) {
    if (!canJump(s)) continue;
    const jump = bid((cheapest(ctx, s).level + 1) as 2, s);
    out.push(
      c(
        jump,
        { name: 'invite', hcp: [9, MAX_HCP], len: { [s]: [4, 13] } },
        `adv.x.jump${s}`,
        pick(s),
      ),
    );
  }
  const nt = cheapest(ctx, 'NT');
  if (nt.level === 1) {
    out.push(c(bid(2, 'NT'), { name: 'invite', hcp: [10, 11], stoppers }, 'adv.x.2NT'));
  }
  for (const s of unbid) {
    out.push(
      c(
        cheapest(ctx, s),
        { name: 'advance', hcp: canJump(s) ? [0, 8] : [0, MAX_HCP], len: { [s]: [4, 13] } },
        `adv.x.${s}`,
        pick(s),
      ),
    );
  }
  if (nt.level <= 2) {
    out.push(c(nt, { name: 'advance', hcp: [6, 9], stoppers: [x] }, 'adv.x.NT'));
  }
  // No four-card suit to show: the cheapest three-card suit.
  const byCost = [...unbid].sort((a, b) => bidRank(cheapest(ctx, a)) - bidRank(cheapest(ctx, b)));
  for (const s of byCost) {
    out.push(
      c(
        cheapest(ctx, s),
        { name: 'advance', len: { [s]: [3, 13] } },
        `adv.x.three${s}`,
        (ev) => byCost.find((u) => ev.len[u] >= 3) === s,
      ),
    );
  }
  return out;
}

/** Advancing partner's overcall in `s`: raise by the Law of Total Tricks, new suit, notrump. */
export function advanceOvercall(ctx: BidContext, s: Suit): Candidate[] {
  const p = ctx.shownByPartner;
  const pmin = p.hcp[0];
  const plen = p.len[s][0];
  const stoppers = [...ctx.theirSuits];
  const out: Candidate[] = [];
  const game = r(25 - pmin, MAX_HCP);

  if (game && MAJORS.includes(s)) {
    out.push(
      c(bid(4, s), { name: 'game', hcp: game, len: { [s]: [8 - plen, 13] } }, 'adv.oc.game'),
    );
  }
  withRange(out, game, (hcp) => c(bid(3, 'NT'), { name: 'game', hcp, stoppers }, 'adv.oc.3NT'));
  // Raises: as high as the total trumps allow, but not past the three level (which would skip 3NT
  // in a minor; game in a major is bid above).
  const low = cheapest(ctx, s).level;
  for (let level = Math.min(3, gameLevel(s) - 1); level >= low; level--) {
    const need = Math.max(8, level + 6) - plen;
    withRange(out, r(5, 24 - pmin), (hcp) =>
      c(
        bid(level as 2, s),
        { name: 'raise', hcp, len: { [s]: [need, 13] } },
        `adv.oc.raise${level}`,
      ),
    );
  }
  const others = SUIT_PREFERENCE.filter((u) => u !== s && !ctx.theirSuits.includes(u));
  for (const u of others) {
    const b = cheapest(ctx, u);
    if (b.level > 2) continue;
    out.push(
      c(
        b,
        { name: 'newSuit', hcp: [8, MAX_HCP], len: { [u]: [5, 13] } },
        `adv.oc.new${u}`,
        (ev) => longestOf(ev, others) === u && goodSuit(ev, u),
      ),
    );
  }
  const nt = cheapest(ctx, 'NT');
  if (nt.level === 1) {
    out.push(c(nt, { name: 'notrump', hcp: [8, 11], stoppers }, 'adv.oc.1NT'));
    out.push(c(bid(2, 'NT'), { name: 'invite', hcp: [12, 14], stoppers }, 'adv.oc.2NT'));
  } else if (nt.level === 2) {
    out.push(c(nt, { name: 'invite', hcp: [11, 13], stoppers }, 'adv.oc.2NT'));
  }
  out.push(c(PASS, { name: 'pass' }, 'adv.oc.pass'));
  return out;
}

/** The takeout doubler's next call: a strong hand shows its own suit; otherwise compete. */
export function doublerRebid(ctx: BidContext): Candidate[] {
  const out: Candidate[] = [];
  const own = SUIT_PREFERENCE.filter((s) => !ctx.theirSuits.includes(s));
  for (const s of own) {
    const b = cheapest(ctx, s);
    if (b.level > 3) continue;
    out.push(
      c(
        b,
        { name: 'rebid', hcp: [17, MAX_HCP], len: { [s]: [5, 13] } },
        `dbl.own${s}`,
        (ev) => longestOf(ev, own) === s,
      ),
    );
  }
  return [...out, ...contest(ctx)];
}

// ---------- The opening side, after an overcall ----------

/** Responder's first call after partner opened one of a suit and the next player overcalled. */
export function respondOverOvercall(ctx: BidContext, open: Suit): Candidate[] {
  const support = MAJORS.includes(open) ? 3 : open === 'D' ? 4 : 5;
  const stoppers = [...ctx.theirSuits];
  const fit = { [open]: [support, 13] as Range };
  const out: Candidate[] = [];
  const others = SUIT_PREFERENCE.filter((s) => s !== open && !ctx.theirSuits.includes(s));
  if (MAJORS.includes(open)) {
    out.push(c(bid(4, open), { name: 'game', hcp: [13, MAX_HCP], len: fit }, 'oc.resp.4M'));
  } else {
    // Over a minor, a four-card major at the one level comes before raising the minor (as uncontested).
    const majors = others.filter((s) => MAJORS.includes(s) && cheapest(ctx, s).level === 1);
    for (const s of majors) {
      out.push(
        c(
          bid(1, s),
          { name: 'newSuit', hcp: [6, MAX_HCP], len: { [s]: [4, 13] }, forcing: 'round' },
          `oc.resp.major${s}`,
          (ev) =>
            longestOf(
              ev,
              majors.filter((m) => ev.len[m] >= 4),
            ) === s,
        ),
      );
    }
  }
  const raise = cheapest(ctx, open);
  const jump = bid((raise.level + 1) as 3, open);
  // A jump raise past the three level would skip 3NT: only when it stays at three.
  if (jump.level < gameLevel(open) && jump.level <= 3) {
    out.push(c(jump, { name: 'limitRaise', hcp: [10, 12], len: fit }, 'oc.resp.limit'));
  }
  if (raise.level < gameLevel(open)) {
    out.push(c(raise, { name: 'raise', hcp: [6, 10], len: fit }, 'oc.resp.raise'));
  }
  for (const s of others) {
    const b = cheapest(ctx, s);
    if (b.level > 2) continue;
    out.push(
      c(
        b,
        {
          name: 'newSuit',
          hcp: b.level === 1 ? [6, MAX_HCP] : [10, MAX_HCP],
          len: { [s]: [b.level === 1 ? 4 : 5, 13] },
          forcing: 'round',
        },
        `oc.resp.new${s}`,
        (ev) => longestOf(ev, others) === s,
      ),
    );
  }
  const nt = cheapest(ctx, 'NT');
  if (nt.level === 1) {
    out.push(c(nt, { name: 'notrump', hcp: [8, 10], stoppers }, 'oc.resp.1NT'));
  }
  if (nt.level <= 2) {
    out.push(c(bid(2, 'NT'), { name: 'invite', hcp: [11, 12], stoppers }, 'oc.resp.2NT'));
  }
  out.push(c(bid(3, 'NT'), { name: 'game', hcp: [13, MAX_HCP], stoppers }, 'oc.resp.3NT'));
  out.push(c(PASS, { name: 'pass' }, 'oc.resp.pass'));
  return out;
}

// ---------- Later in a contested auction ----------

/**
 * Once both sides are in: when the last bid is ours, place the contract as usual; when it is
 * theirs, bid game with the values, or compete in a known fit as far as the total trumps allow
 * (a suit of our own counts partner for two), or let them play.
 */
export function contest(ctx: BidContext): Candidate[] {
  if (ctx.lastBid && sideOf(ctx.lastBid.seat) === sideOf(ctx.seat)) return placement(ctx);
  const p = ctx.shownByPartner;
  const pmin = p.hcp[0];
  const stoppers = [...ctx.theirSuits];
  const out: Candidate[] = [];
  const game = r(25 - pmin, MAX_HCP);
  const free = SUIT_PREFERENCE.filter((s) => !ctx.theirSuits.includes(s));

  if (game && p.hcp[0] > 0) {
    for (const s of MAJORS.filter((m) => free.includes(m))) {
      const need = 8 - p.len[s][0];
      if (need <= 5) {
        out.push(c(bid(4, s), { name: 'game', hcp: game, len: { [s]: [need, 13] } }, `ct.4${s}`));
      }
    }
    out.push(c(bid(3, 'NT'), { name: 'game', hcp: game, stoppers }, 'ct.3NT'));
  }
  for (const s of free) {
    const b = cheapest(ctx, s);
    // Competing stops at the three level (a four-level partscore would skip 3NT in a minor).
    if (b.level >= gameLevel(s) || b.level > 3) continue;
    const total = Math.max(8, b.level + 6);
    // Partner's shown length, or two for a suit of my own.
    const theirs = p.len[s][0];
    const mine = ctx.shownByMe.len[s][0] >= 5 ? Math.max(theirs, 2) : theirs;
    const need = total - mine;
    if (need > 13 || mine < 2) continue;
    out.push(c(b, { name: 'compete', len: { [s]: [need, 13] } }, `ct.compete${s}`));
  }
  if (ctx.opener === ctx.seat) {
    // The opener with a second five-card suit shows it at the two level.
    const fresh = free.filter(
      (u) => ctx.shownByMe.len[u][0] < 5 && ctx.shownByPartner.len[u][0] < 3,
    );
    for (const u of fresh) {
      const b = cheapest(ctx, u);
      if (b.level > 2) continue;
      out.push(
        c(
          b,
          { name: 'newSuit', hcp: [12, MAX_HCP], len: { [u]: [5, 13] } },
          `ct.new${u}`,
          (ev) => longestOf(ev, fresh) === u,
        ),
      );
    }
  }
  out.push(c(PASS, { name: 'pass' }, 'ct.pass'));
  return out;
}
