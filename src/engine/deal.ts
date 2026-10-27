// Shuffling, dealing and deal validation (SPEC §4.1, §7.1 step 1).

import type { Card, Deal } from './card';
import { SEATS, cardCode, cardIndex, fullDeck, hcp } from './card';
import type { Rng } from './rng';
import { cryptoRng, randomInt } from './rng';

/** In-place Fisher–Yates shuffle. */
export function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    const tmp = items[i] as T;
    items[i] = items[j] as T;
    items[j] = tmp;
  }
  return items;
}

/** Deal 13 cards to each seat. Uses crypto randomness unless a (seeded) RNG is given. */
export function dealRandom(rng: Rng = cryptoRng()): Deal {
  const deck = shuffle(fullDeck(), rng);
  return {
    N: deck.slice(0, 13),
    E: deck.slice(13, 26),
    S: deck.slice(26, 39),
    W: deck.slice(39, 52),
  };
}

/** Swap North and South when North holds more HCP, so declarer has the stronger hand. */
export function withStrongerSouth(deal: Deal): Deal {
  return hcp(deal.N) > hcp(deal.S) ? { ...deal, N: deal.S, S: deal.N } : deal;
}

/** Number of cards in each hand (= number of tricks). Assumes a valid deal. */
export function handSize(deal: Deal): number {
  return deal.N.length;
}

/**
 * Checks that every hand has the same number of cards (1–13), and no card appears twice.
 * With `full`, every hand must hold 13 cards. Returns an error message, or null when valid.
 */
export function validateDeal(deal: Deal, opts: { full?: boolean } = {}): string | null {
  const size = deal.N.length;
  if (size < 1 || size > 13) return `hands must hold 1–13 cards (N has ${size})`;
  if (opts.full && size !== 13) return `hands must hold 13 cards (N has ${size})`;
  const seen = new Set<number>();
  for (const seat of SEATS) {
    const hand: readonly Card[] = deal[seat];
    if (hand.length !== size) return `${seat} has ${hand.length} cards, N has ${size}`;
    for (const c of hand) {
      const i = cardIndex(c);
      if (!Number.isInteger(i) || i < 0 || i > 51) return `${seat} holds an invalid card`;
      if (seen.has(i)) return `${cardCode(c)} appears more than once`;
      seen.add(i);
    }
  }
  return null;
}

export function assertValidDeal(deal: Deal, opts: { full?: boolean } = {}): void {
  const err = validateDeal(deal, opts);
  if (err) throw new Error(`invalid deal: ${err}`);
}
