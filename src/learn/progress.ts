// Guide progress (SPEC §7.6, §7.7, §7.8), saved in storage: chapters read, exercises passed,
// whether the first-visit question was answered, and the table tips the player has dismissed.

export type LearnProgress = {
  /** Chapter numbers read to the end, ascending. */
  readonly read: readonly number[];
  /** Ids of exercises passed, in the order passed. */
  readonly passed: readonly string[];
  /** The "have you played bridge?" question was answered. */
  readonly welcomed: boolean;
  /** Beginner-mode tips dismissed with "เข้าใจแล้ว" (never shown again). */
  readonly tips: readonly string[];
};

export const EMPTY_PROGRESS: LearnProgress = { read: [], passed: [], welcomed: false, tips: [] };

function ids(raw: unknown): string[] {
  return Array.isArray(raw)
    ? [...new Set(raw.filter((id): id is string => typeof id === 'string' && id !== ''))]
    : [];
}

/** Progress read back from storage; bad entries are dropped, the rest kept. */
export function parseProgress(raw: unknown): LearnProgress {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const read = Array.isArray(o.read)
    ? [...new Set(o.read.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= 99))]
    : [];
  return {
    read: read.sort((a, b) => a - b),
    passed: ids(o.passed),
    welcomed: o.welcomed === true,
    tips: ids(o.tips),
  };
}

/**
 * First visit (SPEC §7.7): no progress yet and the question not answered, so the home page asks
 * whether the player knows bridge.
 */
export function isFirstVisit(p: LearnProgress): boolean {
  return !p.welcomed && p.read.length === 0 && p.passed.length === 0;
}

export function withRead(p: LearnProgress, n: number): LearnProgress {
  if (p.read.includes(n)) return p;
  return { ...p, read: [...p.read, n].sort((a, b) => a - b) };
}

export function withPassed(p: LearnProgress, id: string): LearnProgress {
  if (p.passed.includes(id)) return p;
  return { ...p, passed: [...p.passed, id] };
}

export function withWelcomed(p: LearnProgress): LearnProgress {
  return p.welcomed ? p : { ...p, welcomed: true };
}

export function withTipDismissed(p: LearnProgress, id: string): LearnProgress {
  if (p.tips.includes(id)) return p;
  return { ...p, tips: [...p.tips, id] };
}
