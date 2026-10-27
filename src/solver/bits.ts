// Internal solver representation (SPEC §5.2): one 13-bit mask per hand per suit, plain numbers only.
//
//   seat  0 = N, 1 = E, 2 = S, 3 = W (clockwise; NS seats are even)
//   suit  0 = ♠, 1 = ♥, 2 = ♦, 3 = ♣; trump 4 = NT
//   bit   rank - 2 (bit 0 = the 2, bit 12 = the ace)
//   card  (suit << 4) | bit — within a suit, a higher code is a higher card

import type { Card, PlayedCard, Rank, Seat, Strain, Suit } from '../engine';
import { SEATS, SUITS } from '../engine';
import type { Position } from './position';

export const NT = 4;

export type PackedPosition = {
  /** `hands[seat * 4 + suit]` = rank bitmask. */
  readonly hands: Int32Array;
  readonly trump: number;
  readonly toPlay: number;
  /** Card codes already played to the current trick, in play order (seats run up to `toPlay`). */
  readonly trick: readonly number[];
};

export const seatIndex = (seat: Seat): number => SEATS.indexOf(seat);
export const suitIndex = (suit: Suit): number => SUITS.indexOf(suit);
export const strainIndex = (strain: Strain): number => (strain === 'NT' ? NT : suitIndex(strain));

export const cardToCode = (c: Card): number => (suitIndex(c.suit) << 4) | (c.rank - 2);

export function codeToCard(code: number): Card {
  return { suit: SUITS[code >> 4] as Suit, rank: ((code & 15) + 2) as Rank };
}

export function popcount(x: number): number {
  x -= (x >>> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

/** Number of cards a seat holds. */
export function handLength(hands: Int32Array, seat: number): number {
  const b = seat * 4;
  return (
    popcount(hands[b] as number) +
    popcount(hands[b + 1] as number) +
    popcount(hands[b + 2] as number) +
    popcount(hands[b + 3] as number)
  );
}

/** Assumes a valid position (see `validatePosition`). */
export function packPosition(pos: Position): PackedPosition {
  const hands = new Int32Array(16);
  SEATS.forEach((seat, s) => {
    for (const c of pos.hands[seat]) hands[s * 4 + suitIndex(c.suit)]! |= 1 << (c.rank - 2);
  });
  return {
    hands,
    trump: strainIndex(pos.trump),
    toPlay: seatIndex(pos.toPlay),
    trick: pos.trick.map((p) => cardToCode(p.card)),
  };
}

export function unpackPosition(p: PackedPosition): Position {
  const hands = {} as Record<Seat, Card[]>;
  SEATS.forEach((seat, s) => {
    const cards: Card[] = [];
    for (let suit = 0; suit < 4; suit++) {
      const mask = p.hands[s * 4 + suit] as number;
      for (let bit = 12; bit >= 0; bit--) {
        if (mask & (1 << bit)) cards.push(codeToCard((suit << 4) | bit));
      }
    }
    hands[seat] = cards;
  });
  const n = p.trick.length;
  const trick: PlayedCard[] = p.trick.map((code, i) => ({
    seat: SEATS[(p.toPlay - n + i + 4) & 3] as Seat,
    card: codeToCard(code),
  }));
  return {
    hands,
    trump: p.trump === NT ? 'NT' : (SUITS[p.trump] as Suit),
    trick,
    toPlay: SEATS[p.toPlay] as Seat,
  };
}
