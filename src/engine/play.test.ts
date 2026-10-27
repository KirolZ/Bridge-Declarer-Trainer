import { describe, expect, it } from 'vitest';
import type { Contract, Seat, Strain } from './card';
import { SEATS, cardCode, parseCardCode, sideOf } from './card';
import { dealRandom } from './deal';
import { parseDealPbn } from './encode';
import type { PlayState } from './play';
import {
  applyPlay,
  completedTricks,
  currentTrick,
  illegalReason,
  isComplete,
  legalPlays,
  newPlayState,
  openingLeader,
  remainingHand,
  remainingHands,
  totalTricks,
  toPlay,
  trickWinner,
  tricks,
  tricksWon,
} from './play';
import { mulberry32 } from './rng';

const contract = (strain: Strain, level: Contract['level'] = 1): Contract => ({
  level,
  strain,
  declarer: 'S',
});

/** Play cards given as codes ("SA", "H2", ...) in turn order. */
function play(state: PlayState, ...codes: string[]): PlayState {
  return codes.reduce((s, code) => applyPlay(s, parseCardCode(code)), state);
}

const legal = (state: PlayState) => legalPlays(state).map(cardCode).sort().join(' ');

// 3-card end position used for trump tests.
//   W ♠AKQ · N ♥2 ♦AK · E ♠2 ♣AK · S ♥3 ♦Q ♣Q
const END3 = 'N:.2.AK. 2...AK .3.Q.Q AKQ...';

describe('starting play', () => {
  it('West makes the opening lead and may lead anything', () => {
    const state = newPlayState(dealRandom(mulberry32(1)), contract('S', 4));
    expect(openingLeader(state)).toBe('W');
    expect(toPlay(state)).toBe('W');
    expect(legalPlays(state)).toHaveLength(13);
    expect(currentTrick(state)).toEqual([]);
    expect(tricksWon(state)).toEqual({ NS: 0, EW: 0 });
    expect(totalTricks(state)).toBe(13);
    expect(isComplete(state)).toBe(false);
  });

  it('can start from a chosen leader', () => {
    const state = newPlayState(parseDealPbn(END3), contract('H'), 'S');
    expect(toPlay(state)).toBe('S');
    expect(legal(state)).toBe('CQ DQ H3');
    expect(toPlay(play(state, 'DQ'))).toBe('W');
  });

  it('rejects an invalid deal', () => {
    const deal = parseDealPbn(END3);
    expect(() => newPlayState({ ...deal, N: deal.N.slice(1) }, contract('NT'))).toThrow(
      /invalid deal/,
    );
  });
});

describe('following suit', () => {
  const start = newPlayState(parseDealPbn(END3), contract('H'));

  it('must follow the suit led when able', () => {
    const s = play(start, 'SA', 'H2');
    expect(toPlay(s)).toBe('E');
    expect(legal(s)).toBe('S2');
    expect(illegalReason(s, parseCardCode('CA'))).toEqual({ code: 'must-follow-suit', suit: 'S' });
    expect(() => applyPlay(s, parseCardCode('CA'))).toThrow(/must-follow-suit/);
  });

  it('may ruff or discard when void in the suit led', () => {
    const s = play(start, 'SA');
    expect(toPlay(s)).toBe('N');
    expect(legal(s)).toBe('DA DK H2');
    expect(illegalReason(s, parseCardCode('DA'))).toBeNull();
    expect(illegalReason(s, parseCardCode('H2'))).toBeNull();
  });

  it("refuses cards not in the player's hand", () => {
    expect(illegalReason(start, parseCardCode('H2'))).toEqual({ code: 'not-in-hand', seat: 'W' });
    const s = play(start, 'SA');
    // ♠A was already played; N can't play it.
    expect(illegalReason(s, parseCardCode('SA'))).toEqual({ code: 'not-in-hand', seat: 'N' });
  });
});

describe('who wins the trick', () => {
  it('a ruff beats the ace of the suit led, and an overruff beats the ruff', () => {
    const s = play(newPlayState(parseDealPbn(END3), contract('H')), 'SA', 'H2', 'S2', 'H3');
    expect(completedTricks(s)[0]!.winner).toBe('S');
    expect(toPlay(s)).toBe('S');
    expect(tricksWon(s)).toEqual({ NS: 1, EW: 0 });
  });

  it('in NT the highest card of the suit led wins; other suits never win', () => {
    const s = play(newPlayState(parseDealPbn(END3), contract('NT')), 'SA', 'H2', 'S2', 'H3');
    expect(completedTricks(s)[0]!.winner).toBe('W');
    expect(toPlay(s)).toBe('W');
    expect(tricksWon(s)).toEqual({ NS: 0, EW: 1 });
  });

  it('a discard of a higher card from another suit does not win', () => {
    // S leads ♦Q, W (void) discards ♠K, E (void) discards ♣A: N's ♦K still wins.
    const s = play(newPlayState(parseDealPbn(END3), contract('NT'), 'S'), 'DQ', 'SK', 'DK', 'CA');
    expect(completedTricks(s)[0]!.winner).toBe('N');
  });

  it('trickWinner handles trump leads and multiple ruffs', () => {
    const t = (...codes: string[]) =>
      codes.map((code, i) => ({ seat: SEATS[i] as Seat, card: parseCardCode(code) }));
    expect(trickWinner(t('S2', 'SA', 'S3', 'S4'), 'H')).toBe('E');
    expect(trickWinner(t('HA', 'S2', 'HK', 'S3'), 'S')).toBe('W'); // overruff
    expect(trickWinner(t('HA', 'S2', 'HK', 'S3'), 'NT')).toBe('N');
    expect(trickWinner(t('D5', 'CA', 'D4', 'HA'), 'NT')).toBe('N');
    expect(trickWinner(t('D5', 'CA', 'D4', 'HA'), 'C')).toBe('E');
    expect(() => trickWinner([], 'NT')).toThrow();
  });
});

describe('a whole end position', () => {
  it('plays out 3 tricks with hearts trump', () => {
    let s = newPlayState(parseDealPbn(END3), contract('H'));
    s = play(s, 'SA', 'H2', 'S2', 'H3'); // S overruffs
    s = play(s, 'DQ', 'SK', 'DK', 'CA'); // ♠K and ♣A are discards; N's ♦K wins
    expect(completedTricks(s)[1]!.winner).toBe('N');
    expect(toPlay(s)).toBe('N');
    s = play(s, 'DA', 'CK', 'CQ', 'SQ');

    expect(isComplete(s)).toBe(true);
    expect(toPlay(s)).toBeNull();
    expect(legalPlays(s)).toEqual([]);
    expect(tricksWon(s)).toEqual({ NS: 3, EW: 0 });
    expect(illegalReason(s, parseCardCode('SA'))).toEqual({ code: 'hand-complete' });
    for (const seat of SEATS) expect(remainingHand(s, seat)).toEqual([]);
  });

  it('tracks the trick in progress and completed tricks', () => {
    const start = newPlayState(parseDealPbn(END3), contract('H'));
    const s1 = play(start, 'SA', 'H2');
    expect(currentTrick(s1).map((p) => `${p.seat}${cardCode(p.card)}`)).toEqual(['WSA', 'NH2']);
    expect(tricks(s1)).toHaveLength(1);
    expect(tricks(s1)[0]!.winner).toBeNull();
    expect(completedTricks(s1)).toEqual([]);

    const s2 = play(s1, 'S2', 'H3');
    expect(currentTrick(s2)).toEqual([]); // trick just finished
    expect(completedTricks(s2)).toHaveLength(1);
    expect(completedTricks(s2)[0]!.leader).toBe('W');

    expect(remainingHands(s2).W.map(cardCode)).toEqual(['SK', 'SQ']);
    expect(remainingHands(s2).N.map(cardCode)).toEqual(['DA', 'DK']);
  });

  it('is immutable: applyPlay never changes the old state', () => {
    const start = newPlayState(parseDealPbn(END3), contract('H'));
    const next = play(start, 'SA');
    expect(start.plays).toEqual([]);
    expect(next.plays).toHaveLength(1);
    // Undo = drop the last plays.
    expect(toPlay({ ...next, plays: next.plays.slice(0, -1) })).toBe('W');
  });

  it('handles 1-card hands', () => {
    const s = play(newPlayState(parseDealPbn('N:A... K... Q... ...2'), contract('C')), 'C2');
    expect(legal(s)).toBe('SA');
    const done = play(s, 'SA', 'SK', 'SQ');
    expect(isComplete(done)).toBe(true);
    expect(tricksWon(done)).toEqual({ NS: 0, EW: 1 }); // ♣2 is trump
  });
});

describe('random full hands (seeded)', () => {
  it('always ends after 13 tricks with legal, rule-consistent plays', () => {
    const rng = mulberry32(2024);
    const strains: Strain[] = ['S', 'H', 'D', 'C', 'NT'];
    for (let game = 0; game < 200; game++) {
      const strain = strains[game % 5]!;
      let s = newPlayState(dealRandom(rng), contract(strain, 3));
      while (!isComplete(s)) {
        const options = legalPlays(s);
        const seat = toPlay(s)!;
        const hand = remainingHand(s, seat);
        const led = currentTrick(s)[0]?.card.suit;
        // Follow-suit rule, checked independently.
        if (led !== undefined && hand.some((c) => c.suit === led)) {
          expect(options.every((c) => c.suit === led)).toBe(true);
          expect(options).toHaveLength(hand.filter((c) => c.suit === led).length);
        } else {
          expect(options).toHaveLength(hand.length);
        }
        s = applyPlay(s, options[Math.floor(rng() * options.length)]!);
      }

      expect(s.plays).toHaveLength(52);
      const done = completedTricks(s);
      expect(done).toHaveLength(13);
      const won = tricksWon(s);
      expect(won.NS + won.EW).toBe(13);
      expect(done.filter((t) => sideOf(t.winner!) === 'NS')).toHaveLength(won.NS);

      // Each trick: led by the previous winner, winner played the best card.
      let leader: Seat = 'W';
      for (const t of done) {
        expect(t.leader).toBe(leader);
        expect(t.plays[0]!.seat).toBe(leader);
        const led = t.plays[0]!.card.suit;
        const win = t.plays.find((p) => p.seat === t.winner)!.card;
        const trumps = t.plays.filter((p) => p.card.suit === strain);
        if (trumps.length > 0) {
          expect(win.suit).toBe(strain);
          expect(Math.max(...trumps.map((p) => p.card.rank))).toBe(win.rank);
        } else {
          expect(win.suit).toBe(led);
          const follows = t.plays.filter((p) => p.card.suit === led);
          expect(Math.max(...follows.map((p) => p.card.rank))).toBe(win.rank);
        }
        leader = t.winner!;
      }
    }
  });
});
