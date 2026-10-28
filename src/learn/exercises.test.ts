// Every exercise of the guide (SPEC §7.7, §10): the data is well-formed, the rules engine agrees
// with the answers, and for play exercises the solver confirms the goal can be made, the solution
// line makes it, and every card marked wrong really makes it impossible. Guards against teaching
// something false.

import { beforeAll, describe, expect, it } from 'vitest';
import type { Contract, PlayState, Seat } from '../engine';
import {
  applyPlay,
  decodeContract,
  isComplete,
  legalPlays,
  newPlayState,
  openingLeader,
  parseCardCode,
  sameCard,
  score,
  scoreBreakdown,
  sideOf,
  toPlay,
  totalTricks,
  tricksNeeded,
  tricksWon,
} from '../engine';
import { solutionLine } from '../game/exercise';
import type { DdsSolver } from '../solver/dds';
import { loadDds } from '../solver/dds';
import { positionFromPlayState } from '../solver/position';
import { CHAPTERS } from './chapters';
import { exerciseStart, legalAnswer, winnerAnswer } from './exercise';
import { EXERCISES } from './exercises';
import { glossaryEntry } from './glossary';
import { parseInline } from './markup';
import type { ChoiceExercise, Exercise, PlayExercise } from './types';

let dds: DdsSolver;
beforeAll(async () => {
  dds = await loadDds();
});

/** NS tricks for the whole exercise with best play from `play` on. */
function ddValue(play: PlayState): number {
  const won = tricksWon(play).NS;
  return isComplete(play) ? won : won + dds.solve(positionFromPlayState(play));
}

function texts(ex: Exercise): string[] {
  const out = [ex.title, ex.instruction, ex.explanation, ex.hint];
  if (ex.kind === 'choice') out.push(...ex.options);
  if (ex.kind === 'play') out.push(...ex.wrong.map((w) => w.why));
  return out;
}

/** `4{S}` / `3NT` as written in the guide → the contract (South declares). */
function contractOf(text: string): Contract {
  const c = decodeContract(text.replace(/\{([SHDC])\}/, '$1').replace('NT', 'N'));
  if (!c) throw new Error(`not a contract: ${text}`);
  return c;
}

/** Points as the options write them: `420`, `−100`. */
const points = (n: number) => (n < 0 ? `−${-n}` : String(n));

const SEAT_NAMES: Record<Seat, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };

/**
 * The right option of choice questions, worked out by the engine (tricks needed, trump, scores,
 * opening leader), so the guide cannot state a rule the game does not follow.
 */
const CHOICE_ANSWERS: Readonly<Record<string, (ex: ChoiceExercise) => string>> = {
  'ch4-3nt-tricks': () => String(tricksNeeded(contractOf('3NT'))),
  'ch4-trump-suit': () => `{${contractOf('4{H}').strain}}`,
  'ch4-defenders-need': () => String(13 - tricksNeeded(contractOf('2{S}')) + 1),
  'ch5-opening-leader': () => {
    const deal = {
      N: [parseCardCode('SA')],
      E: [parseCardCode('SK')],
      S: [parseCardCode('SQ')],
      W: [parseCardCode('SJ')],
    };
    return SEAT_NAMES[openingLeader(newPlayState(deal, contractOf('1NT')))];
  },
  'ch6-4s-made': () => points(score(contractOf('4{S}'), 10, false)),
  'ch6-3nt-down-two': () => points(score(contractOf('3NT'), 7, false)),
  'ch6-which-game': (ex) => {
    const games = ex.options.filter((o) => {
      const c = contractOf(o);
      return scoreBreakdown(c, tricksNeeded(c), false).gameBonus > 50;
    });
    expect(games).toHaveLength(1);
    return games[0]!;
  },
};

/** Choice questions the engine cannot answer: checked by reading them (TASKS 12.9). */
const ANSWERED_BY_HAND: readonly string[] = [
  'ch5-who-plays-dummy',
  'ch14-bots-see-all',
  'ch14-claim-rejected',
  'ch14-zero-lost',
];

it('exercise ids are unique', () => {
  const ids = EXERCISES.map((e) => e.id);
  expect(new Set(ids).size).toBe(ids.length);
});

it('every written chapter from 2 on ends with at least 2 exercises', () => {
  for (const c of CHAPTERS) {
    if (c.n < 2 || c.blocks.length === 0) continue;
    expect(
      EXERCISES.filter((e) => e.chapter === c.n).length,
      `chapter ${c.n}`,
    ).toBeGreaterThanOrEqual(2);
  }
});

describe.each(EXERCISES.map((ex) => [ex.id, ex] as const))('%s', (id, ex) => {
  it('is well-formed', () => {
    expect(id).toMatch(new RegExp(`^ch${ex.chapter}-[a-z0-9]+(-[a-z0-9]+)*$`));
    // Chapter 1 has no exercise (SPEC §7.7).
    expect(CHAPTERS.some((c) => c.n === ex.chapter)).toBe(true);
    expect(ex.chapter).toBeGreaterThanOrEqual(2);
    for (const text of texts(ex)) {
      expect(text.trim()).not.toBe('');
      // Card / suit tokens parse; every glossary link points at an entry.
      for (const part of parseInline(text)) {
        if (part.t === 'term') expect(glossaryEntry(part.id), `[[${part.id}]]`).toBeDefined();
      }
    }
    if (ex.kind !== 'choice') {
      // Equal hands, no card twice, every card already played is legal.
      expect(() => exerciseStart(ex)).not.toThrow();
    }
  });

  if (ex.kind === 'legal') {
    it('asks for a card of the player (South or North)', () => {
      const { seat, cards } = legalAnswer(ex);
      expect(sideOf(seat)).toBe('NS');
      expect(cards.length).toBeGreaterThan(0);
    });
  }

  if (ex.kind === 'winner') {
    it('shows a complete trick', () => {
      const n = (ex.plays ?? []).length;
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n % 4).toBe(0);
      expect(() => winnerAnswer(ex)).not.toThrow();
    });
  }

  if (ex.kind === 'choice') {
    it('has one right option among distinct ones', () => {
      expect(ex.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(ex.options).size).toBe(ex.options.length);
      expect(Number.isInteger(ex.answer)).toBe(true);
      expect(ex.answer).toBeGreaterThanOrEqual(0);
      expect(ex.answer).toBeLessThan(ex.options.length);
      if (ex.cards !== undefined)
        expect(() => ex.cards!.split(' ').map(parseCardCode)).not.toThrow();
    });

    it('has the answer the rules give', () => {
      const answer = CHOICE_ANSWERS[ex.id];
      if (answer) expect(ex.options[ex.answer]).toBe(answer(ex));
      else
        expect(ANSWERED_BY_HAND, 'add an engine check or list it as checked by hand').toContain(
          ex.id,
        );
    });
  }

  if (ex.kind === 'play') checkPlayExercise(ex);
});

function checkPlayExercise(ex: PlayExercise) {
  it('has a reachable goal and at least one wrong card', () => {
    const start = exerciseStart(ex);
    const goal = ex.goal.nsTricks;
    expect(Number.isInteger(goal)).toBe(true);
    expect(goal).toBeGreaterThanOrEqual(1);
    expect(goal).toBeLessThanOrEqual(totalTricks(start));
    // End positions of 3–6 cards (SPEC §7.7).
    expect(start.deal.N.length).toBeGreaterThanOrEqual(3);
    expect(start.deal.N.length).toBeLessThanOrEqual(6);
    expect(ddValue(start)).toBeGreaterThanOrEqual(goal);
    expect(ex.wrong.length).toBeGreaterThan(0);
  });

  it('solution line makes the goal, every card of it keeping the goal', async () => {
    const line = await solutionLine(ex, (pos) => dds.analyze(pos));
    let play = exerciseStart(ex);
    for (const p of line) {
      play = applyPlay(play, p.card);
      expect(ddValue(play), `after ${p.seat} ${p.card.suit}${p.card.rank}`).toBeGreaterThanOrEqual(
        ex.goal.nsTricks,
      );
    }
    expect(isComplete(play)).toBe(true);
    expect(tricksWon(play).NS).toBeGreaterThanOrEqual(ex.goal.nsTricks);
  });

  it.each(ex.wrong.map((w) => [`${w.card} after ${w.at} card(s)`, w] as const))(
    'wrong card %s loses the goal',
    async (_, w) => {
      const line = await solutionLine(ex, (pos) => dds.analyze(pos));
      expect(w.at).toBeLessThan(line.length);
      let play = exerciseStart(ex);
      for (const p of line.slice(0, w.at)) play = applyPlay(play, p.card);
      const seat = toPlay(play);
      expect(seat && sideOf(seat)).toBe('NS');
      const card = parseCardCode(w.card);
      expect(legalPlays(play).some((c) => sameCard(c, card))).toBe(true);
      // Before the card the goal is still there; after it, it is gone against best defence.
      expect(ddValue(play)).toBeGreaterThanOrEqual(ex.goal.nsTricks);
      expect(ddValue(applyPlay(play, card))).toBeLessThan(ex.goal.nsTricks);
    },
  );
}
