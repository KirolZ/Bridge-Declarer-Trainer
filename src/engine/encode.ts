// Text formats for deals and contracts (SPEC §4.2, §4.4).

import type { Card, Contract, Deal, Level, Seat, Suit } from './card';
import { SEATS, SUITS, cardFromIndex, cardIndex, nextSeat, parseRankChar, rankChar } from './card';
import { validateDeal } from './deal';

// ---------- Deal code: 52 × 2-bit owners → 13 bytes → 18 base64url chars ----------

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const OWNER_BITS: Readonly<Record<Seat, number>> = { N: 0, E: 1, S: 2, W: 3 };
export const DEAL_CODE_LENGTH = 18;

/** Encode a full 52-card deal as an 18-character URL-safe code. Throws on a partial or invalid deal. */
export function encodeDeal(deal: Deal): string {
  const err = validateDeal(deal, { full: true });
  if (err) throw new Error(`cannot encode deal: ${err}`);
  const bytes = new Uint8Array(13);
  for (const seat of SEATS) {
    for (const c of deal[seat]) {
      const i = cardIndex(c);
      bytes[i >> 2] = (bytes[i >> 2] as number) | (OWNER_BITS[seat] << (6 - 2 * (i & 3)));
    }
  }
  return toBase64Url(bytes);
}

/** Decode a deal code. Returns null if it is malformed or any hand does not hold 13 cards. */
export function decodeDeal(code: string): Deal | null {
  const bytes = fromBase64Url(code);
  if (!bytes) return null;
  const deal: Deal = { N: [], E: [], S: [], W: [] };
  for (let i = 0; i < 52; i++) {
    const owner = ((bytes[i >> 2] as number) >> (6 - 2 * (i & 3))) & 3;
    deal[SEATS[owner] as Seat].push(cardFromIndex(i));
  }
  return validateDeal(deal, { full: true }) === null ? deal : null;
}

function toBase64Url(bytes: Uint8Array): string {
  let out = '';
  let acc = 0;
  let bits = 0;
  for (const b of bytes) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      out += B64[(acc >> bits) & 63];
    }
  }
  if (bits > 0) out += B64[(acc << (6 - bits)) & 63];
  return out;
}

/** Strict decode of exactly 13 bytes: rejects other lengths and non-zero padding bits. */
function fromBase64Url(code: string): Uint8Array | null {
  if (code.length !== DEAL_CODE_LENGTH) return null;
  const bytes = new Uint8Array(13);
  let acc = 0;
  let bits = 0;
  let n = 0;
  for (const ch of code) {
    const v = B64.indexOf(ch);
    if (v < 0) return null;
    acc = ((acc << 6) | v) & 0xffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      if (n < 13) bytes[n] = (acc >> bits) & 0xff;
      n++;
    }
  }
  // 18 chars = 108 bits: 13 bytes + 4 leftover bits that must be zero (one code per deal).
  if (n !== 13 || (acc & ((1 << bits) - 1)) !== 0) return null;
  return bytes;
}

// ---------- PBN hands: "AK3.Q2..T9" = ♠AK3 ♥Q2 ♦— ♣T9 ----------

/** Parse one hand in PBN form (suits ♠.♥.♦.♣, ranks 2–9 T J Q K A). Throws on bad input. */
export function parseHand(text: string): Card[] {
  const parts = text.split('.');
  if (parts.length !== 4) throw new Error(`hand "${text}" must have 4 suits separated by "."`);
  const cards: Card[] = [];
  parts.forEach((part, i) => {
    const suit = SUITS[i] as Suit;
    for (const ch of part) {
      const rank = parseRankChar(ch);
      if (rank === null) throw new Error(`hand "${text}": bad rank "${ch}"`);
      if (cards.some((c) => c.suit === suit && c.rank === rank)) {
        throw new Error(`hand "${text}": duplicate ${suit}${ch}`);
      }
      cards.push({ suit, rank });
    }
  });
  return cards;
}

/** Format a hand in PBN form, each suit high to low. */
export function formatHand(cards: readonly Card[]): string {
  return SUITS.map((suit) =>
    cards
      .filter((c) => c.suit === suit)
      .sort((a, b) => b.rank - a.rank)
      .map((c) => rankChar(c.rank))
      .join(''),
  ).join('.');
}

/**
 * Parse a PBN deal such as `N:AK3.Q2..T9 ... ... ...` (four hands, clockwise from the first seat).
 * Validates the result (equal hand sizes, no duplicates). Throws on bad input.
 */
export function parseDealPbn(text: string): Deal {
  const m = /^([NESW]):(.*)$/.exec(text.trim());
  if (!m) throw new Error(`deal "${text}" must start with N:, E:, S: or W:`);
  const hands = (m[2] as string).trim().split(/\s+/);
  if (hands.length !== 4) throw new Error(`deal "${text}" must have 4 hands`);
  const deal = {} as Deal;
  hands.forEach((h, i) => {
    deal[nextSeat(m[1] as Seat, i)] = parseHand(h);
  });
  const err = validateDeal(deal);
  if (err) throw new Error(`deal "${text}": ${err}`);
  return deal;
}

/** Format a deal as PBN starting from North. */
export function formatDealPbn(deal: Deal): string {
  return `N:${SEATS.map((s) => formatHand(deal[s])).join(' ')}`;
}

// ---------- Contract code in URLs: "4S", "3N" ----------

/** e.g. `4S`, `3N` (NT is written as N). */
export function encodeContract(contract: Contract): string {
  return `${contract.level}${contract.strain === 'NT' ? 'N' : contract.strain}`;
}

/** Parse `4S` / `3N` (South declares). Returns null if malformed. */
export function decodeContract(code: string): Contract | null {
  const m = /^([1-7])([SHDCN])$/.exec(code);
  if (!m) return null;
  const s = m[2] as 'S' | 'H' | 'D' | 'C' | 'N';
  return { level: Number(m[1]) as Level, strain: s === 'N' ? 'NT' : s, declarer: 'S' };
}
