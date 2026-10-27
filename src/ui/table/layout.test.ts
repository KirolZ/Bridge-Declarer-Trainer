import { describe, expect, it } from 'vitest';
import { STRAINS, SUIT_INFO, parseHand } from '../../engine';
import { displaySuits, sortForDisplay } from './layout';

describe('table layout', () => {
  it('shows trumps first and keeps black / red alternating', () => {
    for (const strain of STRAINS) {
      const suits = displaySuits(strain);
      expect([...suits].sort()).toEqual(['C', 'D', 'H', 'S']);
      if (strain !== 'NT') expect(suits[0]).toBe(strain);
      for (let i = 1; i < 4; i++) {
        expect(SUIT_INFO[suits[i]!].red).not.toBe(SUIT_INFO[suits[i - 1]!].red);
      }
    }
    expect(displaySuits('NT')).toEqual(['S', 'H', 'C', 'D']);
  });

  it('sorts by display suit, then high to low', () => {
    const hand = parseHand('A2.K3.Q4.J5');
    const codes = (s: 'NT' | 'D') =>
      sortForDisplay(hand, s)
        .map((c) => c.suit + c.rank)
        .join(' ');
    expect(codes('NT')).toBe('S14 S2 H13 H3 C11 C5 D12 D4');
    expect(codes('D')).toBe('D12 D4 S14 S2 H13 H3 C11 C5');
  });
});
