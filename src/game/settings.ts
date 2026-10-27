// Player settings (SPEC §7.1, §7.6) and their validation when read back from storage.

import type { SuitOrder, Vulnerability } from '../engine';

/** Which contracts a new deal may give (SPEC §7.1 step 4). */
export type ContractType = 'any' | 'gameUp' | 'slam' | 'nt' | 'suit';

/** `exact`: contract = DD maximum. `cushion`: one level lower when possible. */
export type Difficulty = 'exact' | 'cushion';

export type DealSettings = {
  readonly contractType: ContractType;
  readonly difficulty: Difficulty;
  readonly vulnerability: Vulnerability;
};

/** Bot timing: at least `cardMs` per card, and a finished trick stays up `trickMs` (SPEC §6). */
export type Pace = { readonly cardMs: number; readonly trickMs: number };

export type BotSpeed = 'slow' | 'normal' | 'fast';

export const BOT_PACE: Readonly<Record<BotSpeed, Pace>> = {
  slow: { cardMs: 1000, trickMs: 1400 },
  normal: { cardMs: 500, trickMs: 800 },
  fast: { cardMs: 250, trickMs: 400 },
};

export type Settings = DealSettings & {
  readonly botSpeed: BotSpeed;
  /**
   * `alternate`: black / red alternating with trumps first (as dummy lays them out);
   * `rank`: always ♠ ♥ ♦ ♣.
   */
  readonly suitOrder: SuitOrder;
  /** Show the defenders' cards while playing; such hands do not count for the stats. */
  readonly studyMode: boolean;
  /** Beginner mode (SPEC §7.8). Stored from M11; what it does comes with M12. */
  readonly beginnerMode: boolean;
};

export const CONTRACT_TYPES: readonly ContractType[] = ['any', 'gameUp', 'slam', 'nt', 'suit'];
export const DIFFICULTIES: readonly Difficulty[] = ['exact', 'cushion'];
export const VULNERABILITIES: readonly Vulnerability[] = ['none', 'ns'];
export const BOT_SPEEDS: readonly BotSpeed[] = ['slow', 'normal', 'fast'];
export const SUIT_ORDER_OPTIONS: readonly SuitOrder[] = ['alternate', 'rank'];

export const DEFAULT_DEAL_SETTINGS: DealSettings = {
  contractType: 'any',
  difficulty: 'exact',
  vulnerability: 'none',
};

export const DEFAULT_SETTINGS: Settings = {
  ...DEFAULT_DEAL_SETTINGS,
  botSpeed: 'normal',
  suitOrder: 'alternate',
  studyMode: false,
  beginnerMode: false,
};

export function dealSettingsOf(settings: Settings): DealSettings {
  const { contractType, difficulty, vulnerability } = settings;
  return { contractType, difficulty, vulnerability };
}

function pick<T>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Settings read back from storage, field by field: anything missing or invalid (an older format,
 * hand edits) falls back to its default and the rest is kept.
 */
export function parseSettings(raw: unknown): Settings {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const d = DEFAULT_SETTINGS;
  return {
    contractType: pick(o.contractType, CONTRACT_TYPES, d.contractType),
    difficulty: pick(o.difficulty, DIFFICULTIES, d.difficulty),
    vulnerability: pick(o.vulnerability, VULNERABILITIES, d.vulnerability),
    botSpeed: pick(o.botSpeed, BOT_SPEEDS, d.botSpeed),
    suitOrder: pick(o.suitOrder, SUIT_ORDER_OPTIONS, d.suitOrder),
    studyMode: flag(o.studyMode, d.studyMode),
    beginnerMode: flag(o.beginnerMode, d.beginnerMode),
  };
}
