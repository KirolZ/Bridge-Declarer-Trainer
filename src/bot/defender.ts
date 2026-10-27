// Double-dummy card choice for the bot (SPEC §6).

import type { Card, Suit } from '../engine';
import { SEATS, SUITS, cardCode, cardIndex, randomInt, sideOf } from '../engine';
import type { CardAnalysis, Position } from '../solver';
import { legalCards } from '../solver/position';
import { positionRng } from './seed';

/**
 * The card the seat to play should play: one of the cards with the best double-dummy result for
 * its side (fewest NS tricks for E/W, most for N/S), chosen among equals so it looks natural:
 *
 * 1. Following suit: the lowest of the best cards.
 * 2. Discarding (void in the suit led): a non-trump if one is among the best, from the suit worth
 *    least (most cards still out above our top card in it), then its lowest best card.
 *    Ruffing when only trumps are best: the lowest best trump.
 * 3. Leading (including the opening lead): a suit drawn at random among those holding a best
 *    card, then its lowest best card.
 *
 * Remaining ties are drawn with an RNG seeded by `seed` (see `dealSeed`) and the position, so
 * the same deal and position always give the same card. `analysis` must be `analyze(pos)`:
 * exactly the legal cards of the seat to play.
 */
export function chooseCard(pos: Position, analysis: readonly CardAnalysis[], seed: number): Card {
  checkAnalysis(pos, analysis);
  const ns = sideOf(pos.toPlay) === 'NS';
  const target = ns
    ? Math.max(...analysis.map((a) => a.nsTricks))
    : Math.min(...analysis.map((a) => a.nsTricks));
  const best = analysis.filter((a) => a.nsTricks === target).map((a) => a.card);

  const led = pos.trick[0]?.card.suit;
  const following = led !== undefined && best.some((c) => c.suit === led);
  if (following) return lowest(best);

  const bySuit = SUITS.map((suit) => best.filter((c) => c.suit === suit)).filter(
    (cards) => cards.length > 0,
  );
  if (led === undefined) {
    return lowest(bySuit[randomInt(positionRng(seed, pos), bySuit.length)]!);
  }

  // Void in the suit led: discard (or ruff only when every best card is a trump).
  const sideSuits = bySuit.filter((cards) => cards[0]?.suit !== pos.trump);
  const groups = sideSuits.length > 0 ? sideSuits : bySuit;
  const scored = groups.map((cards) => {
    const low = lowest(cards);
    return { low, above: cardsAbove(pos, low.suit), rank: low.rank };
  });
  const most = Math.max(...scored.map((s) => s.above));
  const worthless = scored.filter((s) => s.above === most);
  const lowRank = Math.min(...worthless.map((s) => s.rank));
  const ties = worthless.filter((s) => s.rank === lowRank);
  if (ties.length === 1) return ties[0]!.low;
  return ties[randomInt(positionRng(seed, pos), ties.length)]!.low;
}

/** `chooseCard` for the defenders (East / West). */
export function chooseDefenderCard(
  pos: Position,
  analysis: readonly CardAnalysis[],
  seed: number,
): Card {
  if (sideOf(pos.toPlay) !== 'EW') {
    throw new Error(`chooseDefenderCard: ${pos.toPlay} is not a defender`);
  }
  return chooseCard(pos, analysis, seed);
}

function lowest(cards: readonly Card[]): Card {
  return cards.reduce((a, b) => (b.rank < a.rank ? b : a));
}

/**
 * How many cards of `suit` the other seats still hold above the top card the seat to play holds
 * in it. Higher means the holding is worth less.
 */
function cardsAbove(pos: Position, suit: Suit): number {
  const own = pos.hands[pos.toPlay].filter((c) => c.suit === suit);
  const top = Math.max(...own.map((c) => c.rank));
  let n = 0;
  for (const seat of SEATS) {
    if (seat === pos.toPlay) continue;
    for (const c of pos.hands[seat]) if (c.suit === suit && c.rank > top) n++;
  }
  return n;
}

/** The analysis must list each legal card exactly once (guards against a stale analysis). */
function checkAnalysis(pos: Position, analysis: readonly CardAnalysis[]): void {
  const legal = new Set(legalCards(pos).map(cardIndex));
  if (legal.size === 0) throw new Error(`chooseCard: ${pos.toPlay} has no card to play`);
  const seen = new Set<number>();
  for (const { card, nsTricks } of analysis) {
    const i = cardIndex(card);
    if (!legal.has(i) || seen.has(i)) {
      throw new Error(`chooseCard: analysis does not match the position (${cardCode(card)})`);
    }
    if (!Number.isInteger(nsTricks)) throw new Error('chooseCard: bad nsTricks in analysis');
    seen.add(i);
  }
  if (seen.size !== legal.size) {
    throw new Error('chooseCard: analysis does not cover every legal card');
  }
}
