import { beforeAll, describe, expect, it } from 'vitest';
import type { Card, Contract, Deal } from '../engine';
import {
  applyPlay,
  cardCode,
  currentTrick,
  dealRandom,
  isComplete,
  legalPlays,
  mulberry32,
  newPlayState,
  sameCard,
  sideOf,
  toPlay,
  tricksWon,
  withStrongerSouth,
} from '../engine';
import { chooseDefenderCard, dealSeed } from '../bot';
import type { CardAnalysis, Position } from '../solver';
import { positionFromPlayState } from '../solver/position';
import type { DdsSolver } from '../solver/dds';
import { loadDds } from '../solver/dds';
import { playerDdLog } from './ddLog';
import type { HandSetup, PlaySolver, PlayStore } from './playStore';
import { createPlayStore, handPath, isSameHand } from './playStore';
import { DEFAULT_DEAL_SETTINGS } from './settings';

let dds: DdsSolver;
beforeAll(async () => {
  dds = await loadDds();
});

const NO_PACE = { cardMs: 0, trickMs: 0 };

/** Solver backed by DDS in this thread; counts calls and can be made to hang or fail. */
function ddsSolver(opts: { hang?: boolean; fail?: () => boolean } = {}) {
  const calls = { analyze: 0, ddTable: 0 };
  const solver: PlaySolver = {
    analyze(pos: Position, { signal }) {
      calls.analyze++;
      if (opts.fail?.()) return Promise.reject(new Error('boom'));
      if (opts.hang) {
        return new Promise((_, reject) =>
          signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          ),
        );
      }
      return Promise.resolve(dds.analyze(pos));
    },
    ddTable(deal: Deal, { signal }) {
      calls.ddTable++;
      if (opts.hang) {
        return new Promise((_, reject) =>
          signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          ),
        );
      }
      return Promise.resolve(dds.ddTable(deal));
    },
  };
  return { solver, calls };
}

/** Resolves once `cond` holds (polls the event loop; fails after `ms`). */
async function until(cond: () => boolean, ms = 10_000): Promise<void> {
  const end = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > end) throw new Error('timed out waiting');
    await new Promise((r) => setTimeout(r, 0));
  }
}

const playerTurn = (store: PlayStore) => {
  const { play, trickPause, botThinking } = store.getState();
  if (!play || trickPause || botThinking || isComplete(play)) return false;
  const seat = toPlay(play);
  return seat !== null && sideOf(seat) === 'NS';
};

const handOver = (store: PlayStore) => {
  const { play, trickPause } = store.getState();
  return play !== null && isComplete(play) && !trickPause;
};

function hand(seed: number, contract: Contract): HandSetup {
  return { deal: withStrongerSouth(dealRandom(mulberry32(seed))), contract, vulnerability: 'none' };
}

/** Plays the hand out; the player picks with `pick` (default: a DD-best card). */
async function playOut(store: PlayStore, pick?: (legal: Card[], lines: CardAnalysis[]) => Card) {
  while (!handOver(store)) {
    await until(() => playerTurn(store) || handOver(store));
    if (handOver(store)) break;
    const play = store.getState().play!;
    const lines = dds.analyze(positionFromPlayState(play));
    const best = Math.max(...lines.map((l) => l.nsTricks));
    const card = pick
      ? pick(legalPlays(play), lines)
      : lines.find((l) => l.nsTricks === best)!.card;
    expect(store.getState().playCard(card)).toBe(true);
  }
}

describe('play store', () => {
  it('plays a whole hand with DD bots; best play makes the DD tricks', async () => {
    const { solver } = ddsSolver();
    const store = createPlayStore({ solver, pace: NO_PACE });
    const setup = hand(11, { level: 1, strain: 'NT', declarer: 'S' });
    const dd = dds.solve({ hands: setup.deal, trump: 'NT', trick: [], toPlay: 'W' });

    store.getState().startHand(setup);
    // West leads on its own.
    await until(() => store.getState().play!.plays.length === 1);
    expect(store.getState().play!.plays[0]!.seat).toBe('W');

    await playOut(store);
    const { play, analyses } = store.getState();
    expect(play!.plays).toHaveLength(52);
    expect(tricksWon(play!).NS).toBe(dd);

    // Every player card has its DD value before and after, and best play loses nothing.
    await until(() => playerDdLog(play!, store.getState().analyses).every((e) => e.after !== null));
    const log = playerDdLog(play!, store.getState().analyses);
    expect(log).toHaveLength(26);
    expect(log.every((e) => e.before === dd && e.after === dd)).toBe(true);
    expect(Object.keys(analyses).length).toBeGreaterThanOrEqual(26);
  });

  it('defenders play the bot card for the deal (same as chooseDefenderCard)', async () => {
    const { solver } = ddsSolver();
    const store = createPlayStore({ solver, pace: NO_PACE });
    const setup = hand(5, { level: 4, strain: 'S', declarer: 'S' });
    store.getState().startHand(setup);
    await playOut(store);

    const seed = dealSeed(setup.deal);
    let replay = newPlayState(setup.deal, setup.contract);
    for (const { seat, card } of store.getState().play!.plays) {
      if (sideOf(seat) === 'EW') {
        const pos = positionFromPlayState(replay);
        expect(cardCode(chooseDefenderCard(pos, dds.analyze(pos), seed))).toBe(cardCode(card));
      }
      replay = applyPlay(replay, card);
    }
  });

  it('logs the tricks lost by a bad card', async () => {
    const { solver } = ddsSolver();
    const store = createPlayStore({ solver, pace: NO_PACE });
    // Find a deal whose first player turn has a card that costs a trick.
    let setup: HandSetup | null = null;
    for (let s = 100; !setup; s++) {
      const h = hand(s, { level: 1, strain: 'NT', declarer: 'S' });
      let st = newPlayState(h.deal, h.contract);
      const lead = dds.analyze(positionFromPlayState(st));
      st = applyPlay(st, chooseDefenderCard(positionFromPlayState(st), lead, dealSeed(h.deal)));
      const lines = dds.analyze(positionFromPlayState(st));
      if (new Set(lines.map((l) => l.nsTricks)).size > 1) setup = h;
    }
    store.getState().startHand(setup);

    let worst: { card: Card; lost: number } | null = null;
    await playOut(store, (legal, lines) => {
      if (worst) return lines.reduce((a, b) => (b.nsTricks > a.nsTricks ? b : a)).card;
      const best = Math.max(...lines.map((l) => l.nsTricks));
      const bad = lines.reduce((a, b) => (b.nsTricks < a.nsTricks ? b : a));
      worst = { card: bad.card, lost: best - bad.nsTricks };
      expect(legal.some((c) => sameCard(c, bad.card))).toBe(true);
      return bad.card;
    });
    const { play } = store.getState();
    await until(() => playerDdLog(play!, store.getState().analyses).every((e) => e.after !== null));
    const log = playerDdLog(play!, store.getState().analyses);
    const drops = log.filter((e) => e.after! < e.before!);
    expect(drops).toHaveLength(1);
    expect(sameCard(drops[0]!.card, worst!.card)).toBe(true);
    expect(drops[0]!.before! - drops[0]!.after!).toBe(worst!.lost);
    expect(tricksWon(play!).NS).toBe(log.at(-1)!.after);
  });

  it('rejects illegal cards, cards out of turn, and cards during the trick pause', async () => {
    const { solver } = ddsSolver();
    const store = createPlayStore({ solver, pace: { cardMs: 0, trickMs: 60_000 } });
    const setup = hand(3, { level: 3, strain: 'NT', declarer: 'S' });
    store.getState().startHand(setup);

    // West's turn (bot): the player can't play.
    expect(store.getState().playCard(setup.deal.S[0]!)).toBe(false);
    await until(() => playerTurn(store));

    const play = store.getState().play!;
    const led = currentTrick(play)[0]!.card.suit;
    const seat = toPlay(play)!;
    const illegal = setup.deal[seat].find(
      (c) => c.suit !== led && setup.deal[seat].some((d) => d.suit === led),
    );
    if (illegal) expect(store.getState().playCard(illegal)).toBe(false);
    expect(store.getState().play!.plays).toHaveLength(1);

    // Fill the trick; then the finished trick is on show and nothing can be played.
    while (store.getState().play!.plays.length < 4) {
      await until(() => playerTurn(store) || store.getState().trickPause);
      if (store.getState().trickPause) break;
      store.getState().playCard(legalPlays(store.getState().play!)[0]!);
    }
    await until(() => store.getState().trickPause);
    const next = store.getState().play!;
    const anyCard = [...next.deal.N, ...next.deal.S][0]!;
    expect(store.getState().playCard(anyCard)).toBe(false);
    store.getState().leave();
  });

  it('starting another hand cancels the bot that was thinking', async () => {
    const { solver, calls } = ddsSolver({ hang: true });
    const store = createPlayStore({ solver, pace: NO_PACE });
    store.getState().startHand(hand(1, { level: 2, strain: 'H', declarer: 'S' }));
    await until(() => store.getState().botThinking);
    expect(calls.analyze).toBe(1);

    const second = hand(2, { level: 3, strain: 'NT', declarer: 'S' });
    store.getState().startHand(second);
    expect(isSameHand(store.getState(), second)).toBe(true);
    expect(store.getState().play!.plays).toHaveLength(0);
    await new Promise((r) => setTimeout(r, 10));
    // The first job was aborted and nothing from it leaked into the new hand.
    expect(store.getState().error).toBeNull();
    expect(store.getState().play!.plays).toHaveLength(0);
    store.getState().leave();
    expect(store.getState().play).toBeNull();
  });

  it('a solver error stops the bot with a message; retry() carries on', async () => {
    let failing = true;
    const { solver } = ddsSolver({ fail: () => failing });
    const store = createPlayStore({ solver, pace: NO_PACE });
    store.getState().startHand(hand(7, { level: 1, strain: 'C', declarer: 'S' }));
    await until(() => store.getState().error !== null);
    expect(store.getState().botThinking).toBe(false);
    expect(store.getState().play!.plays).toHaveLength(0);

    failing = false;
    store.getState().retry();
    await until(() => store.getState().play!.plays.length === 1);
    expect(store.getState().error).toBeNull();
    store.getState().leave();
  });

  it('dealNew deals and starts a hand; cancelDeal stops it', async () => {
    const { solver } = ddsSolver();
    const store = createPlayStore({ solver, pace: NO_PACE });
    await expect(store.getState().dealNew(DEFAULT_DEAL_SETTINGS)).resolves.toBe(true);
    const { hand: h, play, dealing } = store.getState();
    expect(dealing).toBe(false);
    expect(h).not.toBeNull();
    expect(play!.contract).toEqual(h!.contract);
    store.getState().leave();

    const hanging = createPlayStore({ solver: ddsSolver({ hang: true }).solver, pace: NO_PACE });
    const p = hanging.getState().dealNew(DEFAULT_DEAL_SETTINGS);
    expect(hanging.getState().dealing).toBe(true);
    hanging.getState().cancelDeal();
    await expect(p).resolves.toBe(false);
    expect(hanging.getState().dealing).toBe(false);
    expect(hanging.getState().dealError).toBeNull();
    expect(hanging.getState().hand).toBeNull();
  });

  it('handPath gives the link of a hand', () => {
    const setup = hand(9, { level: 4, strain: 'S', declarer: 'S' });
    expect(handPath(setup)).toMatch(/^\/play\/[A-Za-z0-9_-]{18}\/4S$/);
    expect(handPath({ ...setup, vulnerability: 'ns' })).toMatch(/\/4S\?v=ns$/);
  });
});
