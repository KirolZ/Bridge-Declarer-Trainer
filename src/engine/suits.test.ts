import { describe, expect, it } from 'vitest';
import { SUIT_SYMBOLS, SUITS } from './suits';

describe('suits', () => {
  it('orders suits high to low: ♠ ♥ ♦ ♣', () => {
    expect(SUITS).toEqual(['S', 'H', 'D', 'C']);
    expect(SUIT_SYMBOLS.map((s) => s.symbol).join('')).toBe('♠♥♦♣');
  });

  it('marks hearts and diamonds as red', () => {
    expect(SUIT_SYMBOLS.filter((s) => s.red).map((s) => s.suit)).toEqual(['H', 'D']);
  });
});
