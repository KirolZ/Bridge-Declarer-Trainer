// Placeholder from M1 scaffold; the full card model arrives in M2 (SPEC §4.1).

export type Suit = 'S' | 'H' | 'D' | 'C';

/** Suits from highest to lowest rank: ♠ ♥ ♦ ♣. */
export const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C'];

export const SUIT_SYMBOLS: readonly { suit: Suit; symbol: string; red: boolean }[] = SUITS.map(
  (suit) => ({
    suit,
    symbol: { S: '♠', H: '♥', D: '♦', C: '♣' }[suit],
    red: suit === 'H' || suit === 'D',
  }),
);
