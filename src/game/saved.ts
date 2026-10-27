// Settings and stats stores, saved to storage on every change (SPEC §7.6). There is no "save"
// button: a change applies and is kept at once.

import { createStore } from 'zustand/vanilla';
import type { Settings } from './settings';
import { parseSettings } from './settings';
import type { HandResult, Stats } from './stats';
import { EMPTY_STATS, addResult, parseStats } from './stats';
import type { SafeStorage } from './storage';
import { STORAGE_KEYS } from './storage';

export type SettingsState = {
  readonly settings: Settings;
  /** Changes reach real storage (false: blocked, kept for this session only). */
  readonly persistent: boolean;
  update(patch: Partial<Settings>): void;
  /** Reads storage again (another tab changed it). */
  reload(): void;
};

export function createSettingsStore(storage: SafeStorage) {
  return createStore<SettingsState>()((set, get) => ({
    settings: parseSettings(storage.read(STORAGE_KEYS.settings)),
    persistent: storage.persistent,
    update(patch) {
      const settings = parseSettings({ ...get().settings, ...patch });
      storage.write(STORAGE_KEYS.settings, settings);
      set({ settings, persistent: storage.persistent });
    },
    reload() {
      set({ settings: parseSettings(storage.read(STORAGE_KEYS.settings)) });
    },
  }));
}

export type StatsState = {
  readonly stats: Stats;
  readonly persistent: boolean;
  record(result: HandResult): void;
  reset(): void;
  reload(): void;
};

export function createStatsStore(storage: SafeStorage) {
  const load = () => parseStats(storage.read(STORAGE_KEYS.stats));
  return createStore<StatsState>()((set) => ({
    stats: load(),
    persistent: storage.persistent,
    record(result) {
      // Read again first so a hand finished in another tab is not overwritten.
      const stats = addResult(load(), result);
      storage.write(STORAGE_KEYS.stats, stats);
      set({ stats, persistent: storage.persistent });
    },
    reset() {
      storage.remove(STORAGE_KEYS.stats);
      set({ stats: EMPTY_STATS, persistent: storage.persistent });
    },
    reload() {
      set({ stats: load() });
    },
  }));
}

export type SettingsStore = ReturnType<typeof createSettingsStore>;
export type StatsStore = ReturnType<typeof createStatsStore>;
