import { beforeAll, describe, expect, it } from 'vitest';
import type { Card, PlayedCard, Seat, Strain } from '../engine';
import {
  STRAINS,
  applyPlay,
  cardCode,
  dealRandom,
  decodeDeal,
  encodeDeal,
  isComplete,
  mulberry32,
  newPlayState,
  nextSeat,
  parseCardCode,
  randomInt,
  sameCard,
  trickWinner,
  tricksWon,
} from '../engine';
import type { CardAnalysis, Position } from '../solver';
import { legalCards, positionFromPlayState, validatePosition } from '../solver';
import type { DdsSolver } from '../solver/dds';
import { loadDds } from '../solver/dds';
import { positionFromPbn, randomPosition } from '../solver/testing';
import { chooseCard, chooseDefenderCard, dealSeed } from './index';

/** Fake analysis: every legal card scores `base`, except the listed codes. */
function fakeAnalysis(pos: Position, base: number, scores: Record<string, number> = {}) {
  return legalCards(pos).map((card) => ({ card, nsTricks: scores[cardCode(card)] ?? base }));
}

const code = (c: Card) => cardCode(c);

// South led ♠A, West (void in spades) to play. West: ♥5 ♦Q2 ♣8.
// Cards out above West's top card: ♦ 2 (♦AK), ♣ 3 (♣AKQ), ♥ 1 (♥A).
const discardPbn = 'N:KQ..3.A J.A.4.Q ..AK.K .5.Q2.8';
const discardPos = (trump: Strain) => positionFromPbn(discardPbn, trump, 'W', ['SA']);

describe('following suit (7.1 rule 1)', () => {
  it('plays the lowest of the best cards', () => {
    // West led ♠K; North follows from ♠952.
    const pos = positionFromPbn('N:952.2.. 3.3.2.3 J.J.3.2 .4.4.4', 'NT', 'N', ['SK']);
    expect(code(chooseCard(pos, fakeAnalysis(pos, 1), 7))).toBe('S2');
    // Only ♠9 and ♠5 give NS (who maximize) the most tricks.
    expect(code(chooseCard(pos, fakeAnalysis(pos, 0, { S9: 1, S5: 1 }), 7))).toBe('S5');
  });

  it('defenders pick the lowest card that gives NS the fewest tricks', () => {
    // North led ♠2; East follows from ♠93.
    const pos = positionFromPbn('N:5.2.. 93.3.. J.J.3. K.4.4.', 'NT', 'E', ['S2']);
    expect(code(chooseDefenderCard(pos, fakeAnalysis(pos, 2, { S3: 1, S9: 1 }), 1))).toBe('S3');
    expect(code(chooseDefenderCard(pos, fakeAnalysis(pos, 2, { S9: 1 }), 1))).toBe('S9');
  });
});

describe('discarding (7.1 rule 2)', () => {
  it('discards from the suit worth least, lowest card', () => {
    const pos = discardPos('H');
    expect(code(chooseDefenderCard(pos, fakeAnalysis(pos, 3), 1))).toBe('C8');
    const nt = discardPos('NT');
    expect(code(chooseDefenderCard(nt, fakeAnalysis(nt, 3), 1))).toBe('C8');
  });

  it('does not ruff when a discard is as good', () => {
    const pos = discardPos('H');
    // Only ♥5 (ruff) and ♦2 are best: keep the trump.
    expect(code(chooseDefenderCard(pos, fakeAnalysis(pos, 3, { H5: 2, D2: 2 }), 1))).toBe('D2');
    // ♦Q and ♦2 both best: the lower one.
    expect(code(chooseDefenderCard(pos, fakeAnalysis(pos, 3, { DQ: 2, D2: 2 }), 1))).toBe('D2');
  });

  it('ruffs when only a trump is best', () => {
    const pos = discardPos('H');
    expect(code(chooseDefenderCard(pos, fakeAnalysis(pos, 3, { H5: 2 }), 1))).toBe('H5');
  });
});

describe('leading (7.1 rule 3, 7.2)', () => {
  // West on lead with ♠862 ♥K73 ♦9.
  const pos = positionFromPbn('N:AK.A54.T.A 975.QJ.J.K QJT3.T2..Q 862.K73.9.', 'NT', 'W', []);

  it('leads the lowest best card of a suit with a best card', () => {
    const a = fakeAnalysis(pos, 3, { S8: 2, S6: 2, HK: 2 });
    for (let seed = 0; seed < 50; seed++) {
      expect(['S6', 'HK']).toContain(code(chooseDefenderCard(pos, a, seed)));
    }
  });

  it('draws the suit with the seed: same seed same card, different seeds vary', () => {
    const a = fakeAnalysis(pos, 3);
    const picks = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const c = chooseDefenderCard(pos, a, seed);
      expect(code(chooseDefenderCard(pos, a, seed))).toBe(code(c));
      expect(['S2', 'H3', 'D9']).toContain(code(c));
      picks.add(code(c));
    }
    expect(picks.size).toBe(3);
  });
});

it('hand-made positions are valid', () => {
  for (const pos of [
    discardPos('H'),
    positionFromPbn('N:952.2.. 3.3.2.3 J.J.3.2 .4.4.4', 'NT', 'N', ['SK']),
    positionFromPbn('N:5.2.. 93.3.. J.J.3. K.4.4.', 'NT', 'E', ['S2']),
    positionFromPbn('N:AK.A54.T.A 975.QJ.J.K QJT3.T2..Q 862.K73.9.', 'NT', 'W', []),
  ]) {
    expect(validatePosition(pos)).toBeNull();
  }
});

describe('analysis checks', () => {
  const pos = discardPos('H');

  it('rejects an analysis that does not match the position', () => {
    const full = fakeAnalysis(pos, 3);
    expect(() => chooseCard(pos, full.slice(1), 1)).toThrow(/every legal card/);
    expect(() => chooseCard(pos, [...full, full[0]!], 1)).toThrow(/does not match/);
    const stale: CardAnalysis[] = [...full.slice(1), { card: parseCardCode('SK'), nsTricks: 3 }];
    expect(() => chooseCard(pos, stale, 1)).toThrow(/does not match/);
  });

  it('chooseDefenderCard refuses North and South', () => {
    const north = positionFromPbn('N:952.2.. 3.3.2.3 J.J.3.2 .4.4.4', 'NT', 'N', ['SK']);
    expect(() => chooseDefenderCard(north, fakeAnalysis(north, 1), 1)).toThrow(/not a defender/);
  });
});

describe('with DDS (7.3)', () => {
  let dds: DdsSolver;
  beforeAll(async () => {
    dds = await loadDds();
  });

  /** Checks the SPEC §6 rules for one decision and returns the card. */
  function checkChoice(pos: Position, seed: number): Card {
    const analysis = dds.analyze(pos);
    const card = chooseCard(pos, analysis, seed);
    const ns = pos.toPlay === 'N' || pos.toPlay === 'S';
    const values = analysis.map((a) => a.nsTricks);
    const target = ns ? Math.max(...values) : Math.min(...values);
    const best = analysis.filter((a) => a.nsTricks === target).map((a) => a.card);

    // Legal and best.
    expect(legalCards(pos).some((c) => sameCard(c, card))).toBe(true);
    expect(best.some((c) => sameCard(c, card))).toBe(true);
    // The lowest best card of its suit.
    expect(best.filter((c) => c.suit === card.suit && c.rank < card.rank)).toEqual([]);
    const led = pos.trick[0]?.card.suit;
    if (led !== undefined && card.suit !== led && card.suit === pos.trump) {
      // Ruffed: only when no best card is a discard.
      expect(best.every((c) => c.suit === pos.trump)).toBe(true);
    }
    // Same position, same seed → same card.
    expect(sameCard(chooseCard(pos, analysis, seed), card)).toBe(true);
    if (ns === false) expect(sameCard(chooseDefenderCard(pos, analysis, seed), card)).toBe(true);
    return card;
  }

  it('picks a best, legal, lowest-of-suit card in 1,500 random positions', () => {
    const rng = mulberry32(7001);
    for (let i = 0; i < 1500; i++) {
      const pos = randomPosition(rng, { maxCards: 8 });
      checkChoice(pos, randomInt(rng, 2 ** 31));
    }
  });

  it('opening leads: best, and the same deal gives the same lead', () => {
    const rng = mulberry32(7002);
    for (let i = 0; i < 20; i++) {
      const deal = dealRandom(rng);
      const strain = STRAINS[i % 5] as Strain;
      const pos = positionFromPlayState(newPlayState(deal, { level: 1, strain, declarer: 'S' }));
      expect(pos.toPlay).toBe('W');
      const lead = checkChoice(pos, dealSeed(deal));
      // A fresh copy of the deal (e.g. opened again from its link) leads the same card.
      const again = decodeDeal(encodeDeal(deal))!;
      expect(dealSeed(again)).toBe(dealSeed(deal));
      const pos2 = positionFromPlayState(newPlayState(again, { level: 1, strain, declarer: 'S' }));
      expect(sameCard(chooseDefenderCard(pos2, dds.analyze(pos2), dealSeed(again)), lead)).toBe(
        true,
      );
    }
  });

  /** Bot plays all four seats from the start; returns NS tricks and the cards played. */
  function playOut(deal: ReturnType<typeof dealRandom>, strain: Strain) {
    let state = newPlayState(deal, { level: 1, strain, declarer: 'S' });
    const seed = dealSeed(deal);
    const cards: string[] = [];
    while (!isComplete(state)) {
      const pos = positionFromPlayState(state);
      const card = checkChoice(pos, seed);
      cards.push(code(card));
      state = applyPlay(state, card);
    }
    return { ns: tricksWon(state).NS, cards };
  }

  it('bots in all four seats take exactly the DD tricks (full deals)', () => {
    const rng = mulberry32(7003);
    for (let i = 0; i < 20; i++) {
      const deal = dealRandom(rng);
      const strain = STRAINS[i % 5] as Strain;
      dds.clear();
      const start = positionFromPlayState(newPlayState(deal, { level: 1, strain, declarer: 'S' }));
      const dd = dds.solve(start);
      const first = playOut(deal, strain);
      expect(first.ns).toBe(dd);
      // Replaying the deal gives the same cards.
      expect(playOut(deal, strain).cards).toEqual(first.cards);
    }
  }, 60_000);

  it('bots in all four seats take exactly the DD tricks (end positions)', () => {
    const rng = mulberry32(7004);
    for (let i = 0; i < 200; i++) {
      const pos = randomPosition(rng, { maxCards: 6 });
      const dd = dds.solve(pos);
      let p = pos;
      let ns = 0;
      let trick: PlayedCard[] = [...p.trick];
      const hands: Record<Seat, Card[]> = {
        N: [...p.hands.N],
        E: [...p.hands.E],
        S: [...p.hands.S],
        W: [...p.hands.W],
      };
      let toPlay: Seat = p.toPlay;
      while (hands[toPlay].length > 0) {
        p = { hands, trump: pos.trump, trick, toPlay };
        const card = checkChoice(p, 99);
        hands[toPlay] = hands[toPlay].filter((c) => !sameCard(c, card));
        trick = [...trick, { seat: toPlay, card }];
        if (trick.length === 4) {
          const winner = trickWinner(trick, pos.trump);
          if (winner === 'N' || winner === 'S') ns++;
          toPlay = winner;
          trick = [];
        } else {
          toPlay = nextSeat(toPlay);
        }
      }
      expect(ns).toBe(dd);
    }
  });
});
