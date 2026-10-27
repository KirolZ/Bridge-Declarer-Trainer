import { describe, expect, it } from 'vitest';
import type { Deal } from './card';
import { SEATS, cardCode, fullDeck } from './card';
import { dealRandom } from './deal';
import {
  DEAL_CODE_LENGTH,
  decodeContract,
  decodeDeal,
  encodeContract,
  encodeDeal,
  formatDealPbn,
  formatHand,
  parseDealPbn,
  parseHand,
} from './encode';
import { mulberry32 } from './rng';

const sorted = (deal: Deal) => formatDealPbn(deal);

describe('deal code', () => {
  it('matches a hand-computed vector', () => {
    // Cards in index order go N, E, S, W, N, ... → every byte is 0b00_01_10_11 = 0x1B.
    const deal: Deal = { N: [], E: [], S: [], W: [] };
    fullDeck().forEach((c, i) => deal[SEATS[i % 4]!].push(c));
    expect(encodeDeal(deal)).toBe('GxsbGxsbGxsbGxsbGw');
    expect(decodeDeal('GxsbGxsbGxsbGxsbGw')).toEqual(deal);
  });

  it('round-trips random deals in 18 URL-safe characters', () => {
    const rng = mulberry32(2026);
    for (let i = 0; i < 500; i++) {
      const deal = dealRandom(rng);
      const code = encodeDeal(deal);
      expect(code).toHaveLength(DEAL_CODE_LENGTH);
      expect(code).toMatch(/^[A-Za-z0-9_-]{18}$/);
      const back = decodeDeal(code);
      expect(back).not.toBeNull();
      expect(sorted(back!)).toBe(sorted(deal));
    }
  });

  it('gives the same code regardless of card order within a hand', () => {
    const deal = dealRandom(mulberry32(5));
    const reversed = { ...deal, N: [...deal.N].reverse() };
    expect(encodeDeal(reversed)).toBe(encodeDeal(deal));
  });

  it('rejects malformed codes', () => {
    const good = encodeDeal(dealRandom(mulberry32(3)));
    expect(decodeDeal(good.slice(1))).toBeNull(); // too short
    expect(decodeDeal(good + 'A')).toBeNull(); // too long
    expect(decodeDeal('!' + good.slice(1))).toBeNull(); // bad character
    expect(decodeDeal(good.slice(0, 17) + '=')).toBeNull(); // padding is not allowed
    expect(decodeDeal('')).toBeNull();
  });

  it('rejects non-zero trailing bits so each deal has exactly one code', () => {
    // Last char carries 2 data bits + 4 padding bits; "Gw" → "Gx" sets a padding bit.
    expect(decodeDeal('GxsbGxsbGxsbGxsbGx')).toBeNull();
  });

  it('rejects codes whose hands do not hold 13 cards each', () => {
    expect(decodeDeal('AAAAAAAAAAAAAAAAAA')).toBeNull(); // all 52 cards to North
    // Move one card from N to E: first card's owner bits 00 → 01 (0x1B → 0x5B).
    expect(decodeDeal('WxsbGxsbGxsbGxsbGw')).toBeNull();
  });

  it('refuses to encode partial or invalid deals', () => {
    expect(() => encodeDeal(parseDealPbn('N:A... K... Q... J...'))).toThrow(/13 cards/);
  });
});

describe('PBN hands', () => {
  it('parses ♠.♥.♦.♣ with empty suits and T for ten', () => {
    expect(parseHand('AK3.Q2..T9').map(cardCode)).toEqual([
      'SA',
      'SK',
      'S3',
      'HQ',
      'H2',
      'CT',
      'C9',
    ]);
    expect(parseHand('...')).toEqual([]);
  });

  it('formats high to low regardless of input order', () => {
    expect(formatHand(parseHand('3KA.2Q..9T'))).toBe('AK3.Q2..T9');
    expect(formatHand([])).toBe('...');
  });

  it('rejects bad hands', () => {
    expect(() => parseHand('AK3.Q2.T9')).toThrow(/4 suits/);
    expect(() => parseHand('AK3.Q2..T9.')).toThrow(/4 suits/);
    expect(() => parseHand('AK10...')).toThrow(/bad rank/);
    expect(() => parseHand('ak...')).toThrow(/bad rank/);
    expect(() => parseHand('AKA...')).toThrow(/duplicate/);
  });

  it('parses and formats whole deals clockwise from the first seat', () => {
    const deal = parseDealPbn('W:A... K... Q... J...');
    expect(deal.W.map(cardCode)).toEqual(['SA']);
    expect(deal.N.map(cardCode)).toEqual(['SK']);
    expect(deal.E.map(cardCode)).toEqual(['SQ']);
    expect(deal.S.map(cardCode)).toEqual(['SJ']);
    expect(formatDealPbn(deal)).toBe('N:K... Q... J... A...');

    const full = dealRandom(mulberry32(8));
    expect(formatDealPbn(parseDealPbn(formatDealPbn(full)))).toBe(formatDealPbn(full));
  });

  it('rejects bad deals', () => {
    expect(() => parseDealPbn('A... K... Q... J...')).toThrow(/must start/);
    expect(() => parseDealPbn('N:A... K... Q...')).toThrow(/4 hands/);
    expect(() => parseDealPbn('N:A... K... Q... A...')).toThrow(/more than once/);
    expect(() => parseDealPbn('N:AK... K... Q... J...')).toThrow(/cards/);
  });
});

describe('contract code', () => {
  it('round-trips all 35 contracts', () => {
    for (const level of [1, 2, 3, 4, 5, 6, 7] as const) {
      for (const strain of ['C', 'D', 'H', 'S', 'NT'] as const) {
        const c = { level, strain, declarer: 'S' as const };
        expect(decodeContract(encodeContract(c))).toEqual(c);
      }
    }
    expect(encodeContract({ level: 3, strain: 'NT', declarer: 'S' })).toBe('3N');
    expect(decodeContract('4S')).toEqual({ level: 4, strain: 'S', declarer: 'S' });
  });

  it('rejects malformed codes', () => {
    for (const bad of ['', '0S', '8S', '4X', '4NT', '4s', ' 4S', '44S']) {
      expect(decodeContract(bad)).toBeNull();
    }
  });
});
