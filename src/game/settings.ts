// Player settings (SPEC §7.1, §7.6) and their validation when read back from storage.

import type { SuitOrder, Vulnerability } from '../engine';

/**
 * Which contracts a new deal may give (SPEC §7.1 step 4). `noSlam` (partscore or game) is not a
 * setting of its own: beginner mode deals with it (SPEC §7.8).
 */
export type ContractType = 'any' | 'gameUp' | 'slam' | 'nt' | 'suit' | 'noSlam';

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

/**
 * How a click on a card plays it. `tap`: at once. `confirm`: the first click picks the card, and it
 * is played by the confirm button or by clicking it again (guards against a slip of the finger).
 */
export type CardPlay = 'tap' | 'confirm';

/** Language of the screens (SPEC §7.6). The first visit is always Thai. */
export type Language = 'th' | 'en';

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
  readonly cardPlay: CardPlay;
  /**
   * Beginner mode (SPEC §7.8): contracts with a cushion and no slams, slow bots, and the table
   * explains more. Overrides the contract type, difficulty and bot speed while on.
   */
  readonly beginnerMode: boolean;
  readonly language: Language;
};

export const CONTRACT_TYPES: readonly ContractType[] = ['any', 'gameUp', 'slam', 'nt', 'suit'];
export const DIFFICULTIES: readonly Difficulty[] = ['exact', 'cushion'];
export const VULNERABILITIES: readonly Vulnerability[] = ['none', 'ns'];
export const BOT_SPEEDS: readonly BotSpeed[] = ['slow', 'normal', 'fast'];
export const SUIT_ORDER_OPTIONS: readonly SuitOrder[] = ['alternate', 'rank'];
export const CARD_PLAY_OPTIONS: readonly CardPlay[] = ['tap', 'confirm'];
export const LANGUAGES: readonly Language[] = ['th', 'en'];

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
  cardPlay: 'tap',
  beginnerMode: false,
  language: 'th',
};

/** What the next deal uses: the settings, or in beginner mode an easy contract (SPEC §7.8). */
export function dealSettingsOf(settings: Settings): DealSettings {
  const { contractType, difficulty, vulnerability } = settings;
  if (settings.beginnerMode)
    return { contractType: 'noSlam', difficulty: 'cushion', vulnerability };
  return { contractType, difficulty, vulnerability };
}

/** Bot speed in effect: always slow in beginner mode (SPEC §7.8). */
export function botSpeedOf(settings: Settings): BotSpeed {
  return settings.beginnerMode ? 'slow' : settings.botSpeed;
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
    cardPlay: pick(o.cardPlay, CARD_PLAY_OPTIONS, d.cardPlay),
    beginnerMode: flag(o.beginnerMode, d.beginnerMode),
    language: pick(o.language, LANGUAGES, d.language),
  };
}
