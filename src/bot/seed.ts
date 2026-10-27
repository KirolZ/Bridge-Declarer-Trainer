// Deterministic seeds for the bot's tie-breaks (SPEC §6: the same deal gives the same cards).

import type { Deal, Rng } from '../engine';
import { SEATS, cardIndex, formatDealPbn, mulberry32 } from '../engine';
import type { Position } from '../solver';

/** 32-bit FNV-1a hash of a string. */
function fnv1a(text: string, hash = 0x811c9dc5): number {
  let h = hash >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Seed for a deal (full or an end position): the same deal always gives the same seed. */
export function dealSeed(deal: Deal): number {
  return fnv1a(formatDealPbn(deal));
}

/**
 * RNG for one decision: mixes the deal seed with the position, so each decision in a hand draws
 * differently, yet replaying (or undoing back to) the same position gives the same draw.
 */
export function positionRng(seed: number, pos: Position): Rng {
  const hands = SEATS.map((s) =>
    pos.hands[s]
      .map(cardIndex)
      .sort((a, b) => a - b)
      .join(','),
  ).join('/');
  const trick = pos.trick.map((p) => `${p.seat}${cardIndex(p.card)}`).join(',');
  return mulberry32(fnv1a(`${hands}|${trick}|${pos.toPlay}|${pos.trump}`, seed));
}
