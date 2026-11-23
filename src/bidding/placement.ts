// Placing the contract (SPEC §6.5): once partner has described their hand, the captain picks
// slam, game, invitation or partscore from the points partner has shown and the known fits.

import type { Bid, Suit } from '../engine';
import { PASS, bid } from '../engine';
import type { BidContext } from './context';
import { canBid, gameLevel, isGameBid } from './context';
import type { Range } from './meaning';
import { MAX_HCP, NO_INFO } from './meaning';
import type { Candidate } from './rules';
import { MAJORS, MINORS, SUIT_PREFERENCE, c, cheapest, r, withRange } from './rules';

/**
 * Captain's decision once partner has described their hand: slam, game, invite or partscore, in
 * a known eight-card fit or in notrump, from the points partner has shown at least (and at most,
 * for invitations).
 */
export function placement(ctx: BidContext): Candidate[] {
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
export function finish(ctx: BidContext, out: Candidate[]): Candidate[] {
  if (!ctx.forced) return out;
  const last = ctx.partnerLast?.call;
  const options: Bid[] = [cheapest(ctx, 'NT')];
  if (last?.kind === 'bid' && last.strain !== 'NT') options.unshift(cheapest(ctx, last.strain));
  const fallback = options.find((b) => b.level <= 5 && !(b.level === 4 && b.strain === 'NT'));
  return fallback ? [...out, c(fallback, NO_INFO, 'place.forced')] : out;
}
