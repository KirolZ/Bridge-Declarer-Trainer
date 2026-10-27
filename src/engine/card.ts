// Card model and helpers (SPEC §4.1).

export type Suit = 'S' | 'H' | 'D' | 'C';
/** 2–10 as-is, 11 = J, 12 = Q, 13 = K, 14 = A. */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type Card = { readonly suit: Suit; readonly rank: Rank };
/** Clockwise order: N → E → S → W. */
export type Seat = 'N' | 'E' | 'S' | 'W';
export type Strain = Suit | 'NT';
/** Every hand holds the same number of cards: 13 for a full deal, 1–13 for an end position. */
export type Deal = Record<Seat, Card[]>;
export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Contract = { readonly level: Level; readonly strain: Strain; readonly declarer: 'S' };
export type Side = 'NS' | 'EW';

/** Suits from highest to lowest: ♠ ♥ ♦ ♣. */
export const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C'];
export const STRAINS: readonly Strain[] = ['C', 'D', 'H', 'S', 'NT'];
export const SEATS: readonly Seat[] = ['N', 'E', 'S', 'W'];
/** Ranks from highest to lowest. */
export const RANKS: readonly Rank[] = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

export const SUIT_INFO: Readonly<
  Record<Suit, { symbol: string; name: string; thaiName: string; red: boolean }>
> = {
  S: { symbol: '♠', name: 'Spades', thaiName: 'โพดำ', red: false },
  H: { symbol: '♥', name: 'Hearts', thaiName: 'โพแดง', red: true },
  D: { symbol: '♦', name: 'Diamonds', thaiName: 'ข้าวหลามตัด', red: true },
  C: { symbol: '♣', name: 'Clubs', thaiName: 'ดอกจิก', red: false },
};

export function strainSymbol(strain: Strain): string {
  return strain === 'NT' ? 'NT' : SUIT_INFO[strain].symbol;
}

// ---------- Ranks ----------

const RANK_CHARS = '23456789TJQKA';

/** One-character rank as used in PBN and codes: 2–9, T, J, Q, K, A. */
export function rankChar(rank: Rank): string {
  return RANK_CHARS[rank - 2] as string;
}

/** Rank as shown to people: like `rankChar` but 10 is "10". */
export function rankLabel(rank: Rank): string {
  return rank === 10 ? '10' : rankChar(rank);
}

export function parseRankChar(ch: string): Rank | null {
  const i = RANK_CHARS.indexOf(ch);
  return ch.length === 1 && i >= 0 ? ((i + 2) as Rank) : null;
}

/** Negative when `a` ranks below `b`, positive when above, 0 when equal. */
export function compareRank(a: Rank, b: Rank): number {
  return a - b;
}

// ---------- Cards ----------

export function card(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

export function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

/** Stable index 0–51 in the order ♠A..♠2, ♥A..♥2, ♦A..♦2, ♣A..♣2 (SPEC §4.4). */
export function cardIndex(c: Card): number {
  return SUITS.indexOf(c.suit) * 13 + (14 - c.rank);
}

export function cardFromIndex(i: number): Card {
  const suit = SUITS[Math.floor(i / 13)];
  if (suit === undefined || !Number.isInteger(i)) throw new RangeError(`bad card index ${i}`);
  return { suit, rank: (14 - (i % 13)) as Rank };
}

/** e.g. `♠A`, `♥10`. */
export function cardLabel(c: Card): string {
  return SUIT_INFO[c.suit].symbol + rankLabel(c.rank);
}

/** Compact code such as `SA`, `HT` (handy in tests and logs). */
export function cardCode(c: Card): string {
  return c.suit + rankChar(c.rank);
}

export function parseCardCode(code: string): Card {
  const suit = code[0];
  const rank = parseRankChar(code.slice(1));
  if ((suit !== 'S' && suit !== 'H' && suit !== 'D' && suit !== 'C') || rank === null) {
    throw new Error(`bad card code "${code}"`);
  }
  return { suit, rank };
}

/** All 52 cards in `cardIndex` order. */
export function fullDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));
}

// ---------- Hands ----------

/**
 * `alternate` = ♠ ♥ ♣ ♦ (black/red alternate, the default display order),
 * `rank` = ♠ ♥ ♦ ♣ (suit rank order).
 */
export type SuitOrder = 'alternate' | 'rank';

export const SUIT_ORDERS: Readonly<Record<SuitOrder, readonly Suit[]>> = {
  alternate: ['S', 'H', 'C', 'D'],
  rank: ['S', 'H', 'D', 'C'],
};

/** New array sorted by suit (per `order`), then high to low. */
export function sortHand(cards: readonly Card[], order: SuitOrder = 'alternate'): Card[] {
  const suits = SUIT_ORDERS[order];
  return [...cards].sort(
    (a, b) => suits.indexOf(a.suit) - suits.indexOf(b.suit) || b.rank - a.rank,
  );
}

/** Cards of one suit, high to low. */
export function cardsOfSuit(cards: readonly Card[], suit: Suit): Card[] {
  return cards.filter((c) => c.suit === suit).sort((a, b) => b.rank - a.rank);
}

const HCP_BY_RANK: Partial<Record<Rank, number>> = { 14: 4, 13: 3, 12: 2, 11: 1 };

/** High-card points: A=4, K=3, Q=2, J=1. */
export function hcp(cards: readonly Card[]): number {
  return cards.reduce((sum, c) => sum + (HCP_BY_RANK[c.rank] ?? 0), 0);
}

// ---------- Seats ----------

const SEAT_INDEX: Readonly<Record<Seat, number>> = { N: 0, E: 1, S: 2, W: 3 };

/** The seat `steps` places clockwise from `seat` (1 = left-hand opponent). */
export function nextSeat(seat: Seat, steps = 1): Seat {
  return SEATS[(SEAT_INDEX[seat] + steps) % 4] as Seat;
}

export function partnerOf(seat: Seat): Seat {
  return nextSeat(seat, 2);
}

export function sideOf(seat: Seat): Side {
  return seat === 'N' || seat === 'S' ? 'NS' : 'EW';
}

// ---------- Contracts ----------

export function tricksNeeded(contract: Contract): number {
  return contract.level + 6;
}

/** e.g. `4♠`, `3NT`. */
export function contractLabel(contract: Contract): string {
  return `${contract.level}${strainSymbol(contract.strain)}`;
}
