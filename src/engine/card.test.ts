import { describe, expect, it } from 'vitest';
import {
  SUITS,
  SUIT_INFO,
  cardCode,
  cardFromIndex,
  cardIndex,
  cardLabel,
  cardsOfSuit,
  compareRank,
  contractLabel,
  fullDeck,
  hcp,
  nextSeat,
  parseCardCode,
  parseRankChar,
  partnerOf,
  rankChar,
  rankLabel,
  sideOf,
  sortHand,
  strainSymbol,
  tricksNeeded,
} from './card';
import { parseHand } from './encode';

const codes = (cards: { suit: string; rank: number }[]) =>
  cards.map((c) => cardCode(c as Parameters<typeof cardCode>[0])).join(' ');

describe('suits and ranks', () => {
  it('orders suits high to low with symbols and colours', () => {
    expect(SUITS).toEqual(['S', 'H', 'D', 'C']);
    expect(SUITS.map((s) => SUIT_INFO[s].symbol).join('')).toBe('♠♥♦♣');
    expect(SUITS.filter((s) => SUIT_INFO[s].red)).toEqual(['H', 'D']);
    expect(SUIT_INFO.C.thaiName).toBe('ดอกจิก');
    expect(strainSymbol('NT')).toBe('NT');
    expect(strainSymbol('H')).toBe('♥');
  });

  it('compares ranks with A high', () => {
    expect(compareRank(14, 13)).toBeGreaterThan(0);
    expect(compareRank(2, 10)).toBeLessThan(0);
    expect(compareRank(11, 11)).toBe(0);
  });

  it('formats and parses rank characters', () => {
    expect([14, 13, 12, 11, 10, 9, 2].map((r) => rankChar(r as 2))).toEqual([
      'A',
      'K',
      'Q',
      'J',
      'T',
      '9',
      '2',
    ]);
    expect(rankLabel(10)).toBe('10');
    expect(rankLabel(12)).toBe('Q');
    expect(parseRankChar('T')).toBe(10);
    expect(parseRankChar('A')).toBe(14);
    expect(parseRankChar('1')).toBeNull();
    expect(parseRankChar('10')).toBeNull();
    expect(parseRankChar('t')).toBeNull();
  });
});

describe('cards', () => {
  it('indexes the deck ♠A..♠2, ♥A..♥2, ♦A..♦2, ♣A..♣2', () => {
    const deck = fullDeck();
    expect(deck).toHaveLength(52);
    expect(cardCode(deck[0]!)).toBe('SA');
    expect(cardCode(deck[12]!)).toBe('S2');
    expect(cardCode(deck[13]!)).toBe('HA');
    expect(cardCode(deck[51]!)).toBe('C2');
    deck.forEach((c, i) => {
      expect(cardIndex(c)).toBe(i);
      expect(cardFromIndex(i)).toEqual(c);
    });
    expect(() => cardFromIndex(52)).toThrow();
  });

  it('labels and codes', () => {
    expect(cardLabel({ suit: 'H', rank: 10 })).toBe('♥10');
    expect(cardLabel({ suit: 'S', rank: 14 })).toBe('♠A');
    expect(parseCardCode('DT')).toEqual({ suit: 'D', rank: 10 });
    expect(() => parseCardCode('X5')).toThrow();
    expect(() => parseCardCode('S1')).toThrow();
  });
});

describe('hands', () => {
  const hand = parseHand('K2.A.QJ3.T98');

  it('sorts ♠ ♥ ♣ ♦ (alternating colours) high to low by default', () => {
    expect(codes(sortHand(hand))).toBe('SK S2 HA CT C9 C8 DQ DJ D3');
  });

  it('sorts ♠ ♥ ♦ ♣ in rank order when asked', () => {
    expect(codes(sortHand(hand, 'rank'))).toBe('SK S2 HA DQ DJ D3 CT C9 C8');
  });

  it('does not mutate the input', () => {
    const before = codes(hand);
    sortHand(hand);
    expect(codes(hand)).toBe(before);
  });

  it('picks cards of one suit high to low', () => {
    expect(codes(cardsOfSuit(parseHand('..3QJ.'), 'D'))).toBe('DQ DJ D3');
  });

  it('counts HCP: A=4 K=3 Q=2 J=1', () => {
    expect(hcp(fullDeck())).toBe(40);
    expect(hcp(hand)).toBe(3 + 4 + 2 + 1);
    expect(hcp(parseHand('T98.765.432.T98'))).toBe(0);
    expect(hcp([])).toBe(0);
  });
});

describe('seats', () => {
  it('moves clockwise N → E → S → W', () => {
    expect(nextSeat('N')).toBe('E');
    expect(nextSeat('W')).toBe('N');
    expect(nextSeat('S', 3)).toBe('E');
    expect(partnerOf('E')).toBe('W');
    expect(partnerOf('S')).toBe('N');
    expect(sideOf('N')).toBe('NS');
    expect(sideOf('W')).toBe('EW');
  });
});

describe('contracts', () => {
  it('needs level + 6 tricks', () => {
    expect(tricksNeeded({ level: 4, strain: 'S', declarer: 'S' })).toBe(10);
    expect(tricksNeeded({ level: 7, strain: 'NT', declarer: 'S' })).toBe(13);
    expect(contractLabel({ level: 3, strain: 'NT', declarer: 'S' })).toBe('3NT');
    expect(contractLabel({ level: 4, strain: 'S', declarer: 'S' })).toBe('4♠');
  });
});
