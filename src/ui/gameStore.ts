// The app's stores: the play store wired to the solver worker, and the saved settings and stats
// (SPEC §7.6). Settings drive the play store (bot speed, study mode) and the next deal; each
// finished hand is added to the stats.

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from 'zustand';
import type { PlayStoreState } from '../game/playStore';
import { createPlayStore, handPath } from '../game/playStore';
import type { SettingsState, StatsState } from '../game/saved';
import { createSettingsStore, createStatsStore } from '../game/saved';
import type { Settings } from '../game/settings';
import { BOT_PACE, dealSettingsOf } from '../game/settings';
import { watchHandResults } from '../game/stats';
import { STORAGE_KEYS, browserStorage } from '../game/storage';
import { getSolver } from '../worker';

const storage = browserStorage();
export const settingsStore = createSettingsStore(storage);
export const statsStore = createStatsStore(storage);

const initial = settingsStore.getState().settings;
export const gameStore = createPlayStore({
  solver: getSolver(),
  pace: BOT_PACE[initial.botSpeed],
});
gameStore.getState().setStudyMode(initial.studyMode);

settingsStore.subscribe(({ settings }, prev) => {
  const game = gameStore.getState();
  if (settings.botSpeed !== prev.settings.botSpeed) game.setPace(BOT_PACE[settings.botSpeed]);
  if (settings.studyMode !== game.studyMode) game.setStudyMode(settings.studyMode);
});

watchHandResults(gameStore, (result) => statsStore.getState().record(result));

// Another tab changed settings or stats.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key === STORAGE_KEYS.settings) settingsStore.getState().reload();
    if (e.key === null || e.key === STORAGE_KEYS.stats) statsStore.getState().reload();
  });
}

export function useGame<T>(selector: (state: PlayStoreState) => T): T {
  return useStore(gameStore, selector);
}

export function useSettings<T>(selector: (state: SettingsState) => T): T {
  return useStore(settingsStore, selector);
}

export function useStats<T>(selector: (state: StatsState) => T): T {
  return useStore(statsStore, selector);
}

/** Suit order for the hands on show (a setting). */
export function useSuitOrder() {
  return useStore(settingsStore, (s) => s.settings.suitOrder);
}

export function updateSettings(patch: Partial<Settings>): void {
  settingsStore.getState().update(patch);
}

/** Deals a new hand per the current settings and opens it at its link. */
export function useDealNew(): () => Promise<void> {
  const navigate = useNavigate();
  return useCallback(async () => {
    const settings = dealSettingsOf(settingsStore.getState().settings);
    const ok = await gameStore.getState().dealNew(settings);
    const { hand } = gameStore.getState();
    if (ok && hand) navigate(handPath(hand));
  }, [navigate]);
}
