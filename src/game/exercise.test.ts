// Play exercises on a play store with DDS (SPEC §7.7): passing, a miss with the mistake pointed
// out, and an end position that starts with cards already played.

import { beforeAll, describe, expect, it } from 'vitest';
import type { Card } from '../engine';
import { isComplete, legalPlays, parseCardCode, sideOf, toPlay } from '../engine';
import type { PlayExercise } from '../learn';
import { exerciseById } from '../learn';
import type { CardAnalysis, Position } from '../solver';
import type { DdsSolver } from '../solver/dds';
import { loadDds } from '../solver/dds';
import { exerciseHand, exerciseOutcome } from './exercise';
import type { PlaySolver, PlayStore } from './playStore';
import { canUndo, createPlayStore } from './playStore';

let dds: DdsSolver;
beforeAll(async () => {
  dds = await loadDds();
});

const solver: PlaySolver = {
  analyze: (pos: Position) => Promise.resolve(dds.analyze(pos) as CardAnalysis[]),
  ddTable: (deal) => Promise.resolve(dds.ddTable(deal)),
};

const finesse = () => exerciseById('ch10-finesse-aq') as PlayExercise;

async function until(cond: () => boolean, ms = 10_000): Promise<void> {
  const end = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > end) throw new Error('timed out waiting');
    await new Promise((r) => setTimeout(r, 0));
  }
}

const over = (store: PlayStore) => {
  const { play, trickPause } = store.getState();
  return play !== null && isComplete(play) && !trickPause;
};

const playerTurn = (store: PlayStore) => {
  const { play, trickPause, botThinking } = store.getState();
  if (!play || trickPause || botThinking || isComplete(play)) return false;
  const seat = toPlay(play);
  return seat !== null && sideOf(seat) === 'NS';
};

/** Plays the given NS cards in turn, then the first legal card until the end. */
async function playOut(store: PlayStore, cards: readonly string[]) {
  const queue = cards.map(parseCardCode);
  while (!over(store)) {
    await until(() => playerTurn(store) || over(store));
    if (over(store)) break;
    const card: Card = queue.shift() ?? legalPlays(store.getState().play!)[0]!;
    expect(store.getState().playCard(card)).toBe(true);
  }
}

function newStore() {
  return createPlayStore({ solver, pace: { cardMs: 0, trickMs: 0 } });
}

describe('play exercises', () => {
  it('the solution passes', async () => {
    const ex = finesse();
    const store = newStore();
    store.getState().startHand(exerciseHand(ex));
    expect(store.getState().dealCode).toBeNull();
    expect(toPlay(store.getState().play!)).toBe('S');
    await playOut(store, ex.solution);
    const { play, analyses } = store.getState();
    expect(exerciseOutcome(ex, play!, analyses)).toEqual({
      tricks: 3,
      passed: true,
      mistake: null,
      complete: true,
    });
  });

  it('a miss points at the first card that lost the goal, with its note', async () => {
    const ex = finesse();
    const store = newStore();
    store.getState().startHand(exerciseHand(ex));
    // Lead the spade, then rise with the ace instead of finessing.
    await playOut(store, ['S2', 'SA']);
    expect(await store.getState().completeReview()).toBe(true);
    const { play, analyses } = store.getState();
    const outcome = exerciseOutcome(ex, play!, analyses);
    expect(outcome.passed).toBe(false);
    expect(outcome.complete).toBe(true);
    expect(outcome.tricks).toBeLessThan(3);
    expect(outcome.mistake).toMatchObject({
      at: 2,
      trick: 1,
      seat: 'N',
      card: { suit: 'S', rank: 14 },
      before: 3,
      after: 2,
      best: [{ suit: 'S', rank: 12 }],
      why: ex.wrong.find((w) => w.card === 'SA')!.why,
    });
    // Without the analyses the mistake cannot be named yet.
    expect(exerciseOutcome(ex, play!, {})).toEqual({
      tricks: outcome.tricks,
      passed: false,
      mistake: null,
      complete: false,
    });
  });

  it('starts after the cards already played; undo and restart never go before them', async () => {
    const base = finesse();
    // Same position with South's lead already on the table: West (a bot) plays next.
    const ex: PlayExercise = { ...base, plays: ['S2'], solution: base.solution.slice(1) };
    const store = newStore();
    store.getState().startHand(exerciseHand(ex));
    expect(store.getState().startPlays).toBe(1);
    expect(canUndo(store.getState())).toBe(false);
    expect(store.getState().undo()).toBe(false);
    expect(store.getState().rewindTo(0)).toBe(false);

    await until(() => playerTurn(store));
    expect(store.getState().play!.plays.map((p) => p.seat)).toEqual(['S', 'W']);
    expect(store.getState().playCard(parseCardCode('SQ'))).toBe(true);
    expect(canUndo(store.getState())).toBe(true);
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().play!.plays).toHaveLength(2);

    store.getState().restart();
    expect(store.getState().play!.plays.map((p) => p.seat)).toEqual(['S']);
    await playOut(store, ex.solution);
    expect(exerciseOutcome(ex, store.getState().play!, store.getState().analyses).passed).toBe(
      true,
    );
  });
});
