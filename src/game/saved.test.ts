import { beforeAll, describe, expect, it } from 'vitest';
import type { Contract } from '../engine';
import { dealRandom, mulberry32, sideOf, toPlay, withStrongerSouth } from '../engine';
import type { DdsSolver } from '../solver/dds';
import { loadDds } from '../solver/dds';
import type { HandSetup, PlaySolver, PlayStore } from './playStore';
import { createPlayStore, isHandOver } from './playStore';
import { createSettingsStore, createStatsStore } from './saved';
import { DEFAULT_SETTINGS, dealSettingsOf, parseSettings } from './settings';
import type { HandResult } from './stats';
import { EMPTY_STATS, addResult, parseStats, statTotals, watchHandResults } from './stats';
import { STORAGE_KEYS, createSafeStorage } from './storage';

/** In-memory `Storage`; `fail` makes every call throw (blocked storage). */
function fakeStorage(opts: { fail?: 'get' | 'set' } = {}) {
  const data = new Map<string, string>();
  const s = {
    getItem(k: string) {
      if (opts.fail === 'get') throw new DOMException('denied', 'SecurityError');
      return data.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      if (opts.fail) throw new DOMException('full', 'QuotaExceededError');
      data.set(k, v);
    },
    removeItem(k: string) {
      data.delete(k);
    },
  } as unknown as Storage;
  return { s, data };
}

describe('safe storage', () => {
  it('round-trips JSON and ignores garbage', () => {
    const { s, data } = fakeStorage();
    const st = createSafeStorage(() => s);
    expect(st.write('k', { a: 1 })).toBe(true);
    expect(st.read('k')).toEqual({ a: 1 });
    data.set('bad', '{not json');
    expect(st.read('bad')).toBeUndefined();
    expect(st.read('missing')).toBeUndefined();
    st.remove('k');
    expect(st.read('k')).toBeUndefined();
    expect(st.persistent).toBe(true);
  });

  it('falls back to memory when storage throws', () => {
    for (const get of [
      () => {
        throw new DOMException('denied', 'SecurityError');
      },
      () => fakeStorage({ fail: 'get' }).s,
      () => fakeStorage({ fail: 'set' }).s,
      () => null,
    ]) {
      const st = createSafeStorage(get);
      expect(st.write('k', [1, 2])).toBe(false);
      expect(st.read('k')).toEqual([1, 2]);
      expect(st.persistent).toBe(false);
    }
  });
});

describe('settings', () => {
  it('keeps valid fields and defaults the rest', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('nope')).toEqual(DEFAULT_SETTINGS);
    expect(
      parseSettings({
        contractType: 'slam',
        botSpeed: 'warp',
        studyMode: 'yes',
        suitOrder: 'rank',
      }),
    ).toEqual({ ...DEFAULT_SETTINGS, contractType: 'slam', suitOrder: 'rank' });
    expect(dealSettingsOf({ ...DEFAULT_SETTINGS, vulnerability: 'ns' })).toEqual({
      contractType: 'any',
      difficulty: 'exact',
      vulnerability: 'ns',
    });
  });

  it('saves every change and reads it back in a new session', () => {
    const { s } = fakeStorage();
    const a = createSettingsStore(createSafeStorage(() => s));
    a.getState().update({ botSpeed: 'fast', difficulty: 'cushion' });
    a.getState().update({ studyMode: true });
    const b = createSettingsStore(createSafeStorage(() => s));
    expect(b.getState().settings).toEqual({
      ...DEFAULT_SETTINGS,
      botSpeed: 'fast',
      difficulty: 'cushion',
      studyMode: true,
    });
    expect(b.getState().persistent).toBe(true);
  });

  it('works for the session when storage is blocked', () => {
    const store = createSettingsStore(
      createSafeStorage(() => {
        throw new DOMException('denied', 'SecurityError');
      }),
    );
    expect(store.getState().persistent).toBe(false);
    store.getState().update({ suitOrder: 'rank' });
    expect(store.getState().settings.suitOrder).toBe('rank');
  });
});

const r = (over: Partial<HandResult> = {}): HandResult => ({
  strain: 'S',
  made: true,
  lost: 0,
  hints: 0,
  ...over,
});

describe('stats', () => {
  it('adds hands per strain and totals suit / NT', () => {
    let st = EMPTY_STATS;
    st = addResult(st, r({ strain: 'S', made: true, lost: 0, hints: 2 }));
    st = addResult(st, r({ strain: 'H', made: false, lost: 2, hints: 0 }));
    st = addResult(st, r({ strain: 'NT', made: true, lost: 1, hints: 5 }));
    const { all, suit, nt } = statTotals(st);
    expect(all).toEqual({ hands: 3, made: 2, lost: 3, hints: 7 });
    expect(suit).toEqual({ hands: 2, made: 1, lost: 2, hints: 2 });
    expect(nt).toEqual({ hands: 1, made: 1, lost: 1, hints: 5 });
    expect(st.byStrain.D).toEqual({ hands: 0, made: 0, lost: 0, hints: 0 });
  });

  it('reads back bad data as zero', () => {
    expect(parseStats(null)).toEqual(EMPTY_STATS);
    const st = parseStats({ byStrain: { S: { hands: 2, made: 9, lost: -1, hints: 1.5 }, NT: 3 } });
    expect(st.byStrain.S).toEqual({ hands: 2, made: 2, lost: 0, hints: 0 });
    expect(st.byStrain.NT).toEqual({ hands: 0, made: 0, lost: 0, hints: 0 });
  });

  it('saves, does not overwrite another tab, and resets', () => {
    const { s } = fakeStorage();
    const tab1 = createStatsStore(createSafeStorage(() => s));
    const tab2 = createStatsStore(createSafeStorage(() => s));
    tab1.getState().record(r());
    tab2.getState().record(r({ strain: 'NT' }));
    const fresh = createStatsStore(createSafeStorage(() => s));
    expect(statTotals(fresh.getState().stats).all.hands).toBe(2);
    fresh.getState().reset();
    expect(s.getItem(STORAGE_KEYS.stats)).toBeNull();
    tab1.getState().reload();
    expect(tab1.getState().stats).toEqual(EMPTY_STATS);
  });
});

describe('recording finished hands', () => {
  let dds: DdsSolver;
  beforeAll(async () => {
    dds = await loadDds();
  });

  const solver = (): PlaySolver => ({
    analyze: (pos) => Promise.resolve(dds.analyze(pos)),
    ddTable: (deal) => Promise.resolve(dds.ddTable(deal)),
  });

  async function until(cond: () => boolean, ms = 10_000): Promise<void> {
    const end = Date.now() + ms;
    while (!cond()) {
      if (Date.now() > end) throw new Error('timed out waiting');
      await new Promise((res) => setTimeout(res, 0));
    }
  }

  const playerTurn = (store: PlayStore) => {
    const { play, trickPause, botThinking } = store.getState();
    const seat = play && !trickPause && !botThinking ? toPlay(play) : null;
    return seat !== null && sideOf(seat) === 'NS';
  };

  const contract: Contract = { level: 3, strain: 'H', declarer: 'S' };
  const setup = (seed: number): HandSetup => ({
    deal: withStrongerSouth(dealRandom(mulberry32(seed))),
    contract,
    vulnerability: 'none',
  });

  /** Ends the hand at the player's first turn by claiming no more tricks (always accepted). */
  async function claimNothing(store: PlayStore) {
    await until(() => playerTurn(store));
    await expect(store.getState().claim(0)).resolves.toBe('accepted');
    expect(isHandOver(store.getState())).toBe(true);
  }

  it('counts the first finish of each hand once; not after undo / play again; not studied', async () => {
    const store = createPlayStore({ solver: solver(), pace: { cardMs: 0, trickMs: 0 } });
    const results: HandResult[] = [];
    watchHandResults(store, (res) => results.push(res));
    // The review needs the analysis of the claim point and of the opening lead.
    const recorded = (n: number) => until(() => results.length === n);

    store.getState().startHand(setup(5));
    await claimNothing(store);
    store.getState().completeReview();
    await recorded(1);
    const dd = dds.solve({ hands: setup(5).deal, trump: 'H', trick: [], toPlay: 'W' });
    expect(results[0]).toEqual({ strain: 'H', made: false, lost: dd, hints: 0 });

    // Undo the claim and finish again; then play the hand again from the start.
    store.getState().undo();
    await claimNothing(store);
    store.getState().restart();
    await claimNothing(store);
    await store.getState().completeReview();
    expect(results).toHaveLength(1);

    // A new hand counts; a hint shows in the result.
    store.getState().startHand(setup(5));
    await until(() => playerTurn(store));
    await store.getState().showHint();
    await claimNothing(store);
    await store.getState().completeReview();
    await recorded(2);
    expect(results[1]!.hints).toBe(1);

    // Study mode at any point: not counted, even after switching it off and playing again.
    store.getState().startHand(setup(7));
    await until(() => playerTurn(store));
    store.getState().setStudyMode(true);
    store.getState().setStudyMode(false);
    store.getState().restart();
    await claimNothing(store);
    await store.getState().completeReview();
    expect(results).toHaveLength(2);
  });
});
