// Public solver API (SPEC §5.1).

import type { Card, Deal, Strain } from '../engine';
import { STRAINS, assertValidDeal, sortHand } from '../engine';
import { cardToCode, packPosition } from './bits';
import type { Position } from './position';
import { assertValidPosition, legalCards } from './position';
import { DDSearch } from './search';

export type CardAnalysis = { card: Card; nsTricks: number };
export type DDTable = Record<Strain, number>;

function prepare(pos: Position) {
  assertValidPosition(pos);
  const packed = packPosition(pos);
  const search = new DDSearch(packed.hands, packed.trump);
  return { search, node: search.rootNode(packed.toPlay, packed.trick) };
}

/**
 * Most tricks NS can take from `pos` to the end of play (not counting tricks already won)
 * with best play by both sides.
 */
export function solve(pos: Position): number {
  const { search, node } = prepare(pos);
  return search.value(node);
}

/**
 * Every legal card for the seat to play, with the tricks NS take if it is played and everyone
 * plays best from then on. Cards come in hand order (suit ♠ ♥ ♦ ♣, high to low).
 */
export function analyze(pos: Position): CardAnalysis[] {
  const { search, node } = prepare(pos);
  const cards = sortHand(legalCards(pos), 'rank');
  let guess: number | undefined;
  return cards.map((card) => {
    const nsTricks = search.valueAfter(node, cardToCode(card), guess);
    guess = nsTricks;
    return { card, nsTricks };
  });
}

/** Tricks South (declarer) takes in each strain with West on lead. */
export function ddTable(deal: Deal): DDTable {
  assertValidDeal(deal);
  const table = {} as DDTable;
  for (const trump of STRAINS) table[trump] = solve({ hands: deal, trump, trick: [], toPlay: 'W' });
  return table;
}
