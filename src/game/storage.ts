// Safe `localStorage` (SPEC §7.6): every access is wrapped in try/catch. When the browser blocks
// storage (private mode, blocked site data, quota), values live in memory instead, so the app keeps
// working for the session and `persistent` tells the UI that nothing will survive a reload.

export type SafeStorage = {
  /** The parsed JSON under `key`, or undefined if missing / unreadable. */
  read(key: string): unknown;
  /** Stores `value` as JSON. False when it only went to memory. */
  write(key: string, value: unknown): boolean;
  remove(key: string): void;
  /** Values are reaching real storage (false after any failed access). */
  readonly persistent: boolean;
};

/** `getStorage` may itself throw (some browsers throw on `window.localStorage`). */
export function createSafeStorage(getStorage: () => Storage | null | undefined): SafeStorage {
  const memory = new Map<string, string>();
  let persistent = true;

  function storage(): Storage | null {
    if (!persistent) return null;
    try {
      const s = getStorage();
      if (s) return s;
    } catch {
      // fall through
    }
    persistent = false;
    return null;
  }

  function parse(raw: string | null | undefined): unknown {
    if (raw == null) return undefined;
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return undefined;
    }
  }

  return {
    read(key) {
      const s = storage();
      if (s) {
        try {
          return parse(s.getItem(key));
        } catch {
          persistent = false;
        }
      }
      return parse(memory.get(key));
    },

    write(key, value) {
      const raw = JSON.stringify(value);
      memory.set(key, raw);
      const s = storage();
      if (!s) return false;
      try {
        s.setItem(key, raw);
        return true;
      } catch {
        persistent = false;
        return false;
      }
    },

    remove(key) {
      memory.delete(key);
      const s = storage();
      if (!s) return;
      try {
        s.removeItem(key);
      } catch {
        persistent = false;
      }
    },

    get persistent() {
      // Probe once so a blocked storage is noticed before the first write.
      storage();
      return persistent;
    },
  };
}

/** The browser's `localStorage` (memory only where there is none, e.g. in Node). */
export function browserStorage(): SafeStorage {
  return createSafeStorage(() => (typeof localStorage === 'undefined' ? null : localStorage));
}

/** Storage keys; the version suffix lets a later format start fresh instead of misreading. */
export const STORAGE_KEYS = {
  settings: 'bridge-trainer.settings.v1',
  stats: 'bridge-trainer.stats.v1',
} as const;
