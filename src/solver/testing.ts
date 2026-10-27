// Seeded random positions and seat/suit transforms for solver tests (SPEC §5.3).

import type { Card, Deal, PlayedCard, Rng, Seat, Strain, Suit } from '../engine';
import {
  SEATS,
  STRAINS,
  SUITS,
  applyPlay,
  fullDeck,
  legalPlays,
  newPlayState,
  nextSeat,
  parseCardCode,
  parseHand,
  randomInt,
  shuffle,
} from '../engine';
import type { Position } from './position';
import { positionFromPlayState } from './position';

export type RandomPositionOptions = {
  minCards?: number;
  maxCards: number;
  /** Strains to choose from (default: all five). */
  strains?: readonly Strain[];
};

/**
 * A random end position: equal hands of `minCards`–`maxCards` cards drawn from 1–4 random suits
 * (fewer suits means more contested tricks), a random trump and leader, then 0–3 random legal
 * plays so the position may start in the middle of a trick.
 */
export function randomPosition(rng: Rng, opts: RandomPositionOptions): Position {
  const min = opts.minCards ?? 1;
  const size = min + randomInt(rng, opts.maxCards - min + 1);
  const minSuits = Math.ceil((4 * size) / 13);
  const suits = shuffle([...SUITS], rng).slice(0, minSuits + randomInt(rng, 5 - minSuits));
  const deck = shuffle(
    fullDeck().filter((c) => suits.includes(c.suit)),
    rng,
  ).slice(0, 4 * size);
  const deal: Deal = {
    N: deck.slice(0, size),
    E: deck.slice(size, 2 * size),
    S: deck.slice(2 * size, 3 * size),
    W: deck.slice(3 * size, 4 * size),
  };
  const strains = opts.strains ?? STRAINS;
  const strain = strains[randomInt(rng, strains.length)] as Strain;
  const leader = SEATS[randomInt(rng, 4)] as Seat;
  let state = newPlayState(deal, { level: 1, strain, declarer: 'S' }, leader);
  const plays = randomInt(rng, 4);
  for (let i = 0; i < plays; i++) {
    const legal = legalPlays(state);
    state = applyPlay(state, legal[randomInt(rng, legal.length)] as Card);
  }
  return positionFromPlayState(state);
}

function mapPosition(
  pos: Position,
  seatMap: (s: Seat) => Seat,
  cardMap: (c: Card) => Card,
): Position {
  const hands = {} as Record<Seat, Card[]>;
  for (const seat of SEATS) hands[seatMap(seat)] = pos.hands[seat].map(cardMap);
  const trick: PlayedCard[] = pos.trick.map((p) => ({
    seat: seatMap(p.seat),
    card: cardMap(p.card),
  }));
  const trump = pos.trump === 'NT' ? 'NT' : cardMap({ suit: pos.trump, rank: 2 }).suit;
  return { hands, trump, trick, toPlay: seatMap(pos.toPlay) };
}

const rotate = (steps: number) => (seat: Seat) => SEATS[(SEATS.indexOf(seat) + steps) % 4] as Seat;

/** Move every seat `steps` places clockwise (2 swaps N↔S and E↔W; 1 swaps the sides). */
export function rotatePosition(pos: Position, steps: number): Position {
  return mapPosition(pos, rotate(steps), (c) => c);
}

/** Rename suits: `perm[i]` is the new name of `SUITS[i]`. */
export function renameSuits(pos: Position, perm: readonly Suit[]): Position {
  return mapPosition(
    pos,
    (s) => s,
    (c) => ({ suit: perm[SUITS.indexOf(c.suit)] as Suit, rank: c.rank }),
  );
}

/** Cards left to play, counting the trick in progress. */
export function tricksLeft(pos: Position): number {
  return pos.hands[pos.toPlay].length;
}

/**
 * Position from PBN-style hands (`N:<N> <E> <S> <W>`, clockwise from the first seat) and the
 * trick cards (codes) already played. Hands that played to the trick hold one card fewer.
 */
export function positionFromPbn(
  pbn: string,
  trump: Strain,
  toPlay: Seat,
  trick: string[] = [],
): Position {
  const first = pbn[0] as Seat;
  const parts = pbn.slice(2).split(' ');
  if (!SEATS.includes(first) || pbn[1] !== ':' || parts.length !== 4)
    throw new Error(`bad PBN "${pbn}"`);
  const hands = {} as Record<Seat, Card[]>;
  parts.forEach((text, i) => (hands[nextSeat(first, i)] = parseHand(text)));
  const played: PlayedCard[] = trick.map((code, i) => ({
    seat: nextSeat(toPlay, i - trick.length + 4),
    card: parseCardCode(code),
  }));
  return { hands, trump, trick: played, toPlay };
}
