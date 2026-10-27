// State of the hand being played (SPEC §4.2, §6, §7.5): a vanilla Zustand store that the UI
// reads with `useStore`. The store drives the defenders: whenever East or West is to play it asks
// the solver for `analyze`, waits out the bot's pace, and plays the bot's card. It also keeps the
// `analyze` result of every position it saw, so the DD value before and after each of the
// player's cards is known for the post-hand analysis (M10) and hints (M9).
//
// Async work belongs to a "generation": starting a new hand (or leaving) bumps the generation and
// aborts its solver jobs, and every continuation checks that its generation is still current
// before touching state.

import { createStore } from 'zustand/vanilla';
import type { Card, Contract, Deal, PlayState, Vulnerability } from '../engine';
import {
  applyPlay,
  encodeContract,
  encodeDeal,
  illegalReason,
  isComplete,
  newPlayState,
  sideOf,
  toPlay,
} from '../engine';
import { chooseDefenderCard, dealSeed } from '../bot';
import type { CardAnalysis, DDTable, Position } from '../solver';
import { positionFromPlayState } from '../solver/position';
import type { ContractType, DealSettings } from './settings';
import type { NewHand } from './newHand';
import { newHand } from './newHand';

/** Bot timing: at least `cardMs` per card, and a finished trick stays up `trickMs` (SPEC §6). */
export type Pace = { readonly cardMs: number; readonly trickMs: number };

export type BotSpeed = 'slow' | 'normal' | 'fast';

export const BOT_PACE: Readonly<Record<BotSpeed, Pace>> = {
  slow: { cardMs: 1000, trickMs: 1400 },
  normal: { cardMs: 500, trickMs: 800 },
  fast: { cardMs: 250, trickMs: 400 },
};

/** What the store needs from the solver (the app passes the worker client). */
export type PlaySolver = {
  analyze(pos: Position, options: { signal: AbortSignal }): Promise<CardAnalysis[]>;
  ddTable(deal: Deal, options: { signal?: AbortSignal; timeoutMs: number }): Promise<DDTable>;
};

export type HandSetup = {
  readonly deal: Deal;
  readonly contract: Contract;
  readonly vulnerability: Vulnerability;
};

export const CONTRACT_TYPE_LABEL: Readonly<Record<ContractType, string>> = {
  any: 'อะไรก็ได้',
  gameUp: 'game ขึ้นไป',
  slam: 'slam',
  nt: 'NT เท่านั้น',
  suit: 'suit เท่านั้น',
};

export type PlayStoreState = {
  readonly hand: HandSetup | null;
  /** `encodeDeal(hand.deal)`, for links. */
  readonly dealCode: string | null;
  readonly play: PlayState | null;
  /**
   * `analyze` of each position seen, keyed by the number of cards played before it. Only
   * positions on the current line of play are kept (an undo in M9 must drop the later ones).
   */
  readonly analyses: Readonly<Record<number, readonly CardAnalysis[]>>;
  /** A defender is waiting for the solver or its pace. */
  readonly botThinking: boolean;
  /** A finished trick is on show before it is gathered; no card can be played meanwhile. */
  readonly trickPause: boolean;
  /** The bot could not move (solver error); `retry()` tries again. */
  readonly error: string | null;
  /** One-off message for the table (e.g. the contract type was relaxed). */
  readonly notice: string | null;
  /** `newHand` is running. */
  readonly dealing: boolean;
  readonly dealError: string | null;
  readonly pace: Pace;

  /** Starts playing `hand` from the opening lead (West, a bot). */
  startHand(hand: HandSetup): void;
  /** The player plays `card` from South or North. False (and no change) if not allowed now. */
  playCard(card: Card): boolean;
  /** Deals a new hand per `settings` and starts it. False when cancelled or failed. */
  dealNew(settings: DealSettings): Promise<boolean>;
  cancelDeal(): void;
  retry(): void;
  dismissNotice(): void;
  setPace(pace: Pace): void;
  /** Stops the bots and clears the hand. */
  leave(): void;
};

export type PlayStoreOptions = {
  solver: PlaySolver;
  pace?: Pace;
};

/** True when `state` holds `hand`'s deal, contract and vulnerability. */
export function isSameHand(state: PlayStoreState, hand: HandSetup): boolean {
  return (
    state.hand !== null &&
    state.dealCode === encodeDeal(hand.deal) &&
    encodeContract(state.hand.contract) === encodeContract(hand.contract) &&
    state.hand.vulnerability === hand.vulnerability
  );
}

/** Link path of a hand: `/play/<dealCode>/<contract>` plus `?v=ns` when NS is vulnerable. */
export function handPath(hand: HandSetup): string {
  const path = `/play/${encodeDeal(hand.deal)}/${encodeContract(hand.contract)}`;
  return hand.vulnerability === 'ns' ? `${path}?v=ns` : path;
}

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function createPlayStore(options: PlayStoreOptions) {
  const { solver } = options;

  let gen = 0;
  let abort = new AbortController();
  let seed = 0;
  /** In-flight `analyze` jobs of the current generation, by position key. */
  let pending = new Map<number, Promise<readonly CardAnalysis[]>>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let dealAbort: AbortController | null = null;

  const store = createStore<PlayStoreState>()((set, get) => {
    /** Ends the current generation: cancels its solver jobs and timers. */
    function nextGeneration(): number {
      gen++;
      abort.abort();
      abort = new AbortController();
      pending = new Map();
      for (const t of timers) clearTimeout(t);
      timers.clear();
      return gen;
    }

    function wait(ms: number): Promise<void> {
      return new Promise((resolve) => {
        const t = setTimeout(
          () => {
            timers.delete(t);
            resolve();
          },
          Math.max(0, ms),
        );
        timers.add(t);
      });
    }

    /** `analyze` of the position in `play`, from the cache or a (shared) solver job. */
    function analysisOf(play: PlayState, g: number): Promise<readonly CardAnalysis[]> {
      const key = play.plays.length;
      const known = get().analyses[key];
      if (known) return Promise.resolve(known);
      let job = pending.get(key);
      if (!job) {
        job = solver
          .analyze(positionFromPlayState(play), { signal: abort.signal })
          .then((result) => {
            if (g === gen) set({ analyses: { ...get().analyses, [key]: result } });
            return result;
          });
        // A failed job is not cached, so it is retried the next time it is needed.
        job.catch(() => {
          if (pending.get(key) === job) pending.delete(key);
        });
        pending.set(key, job);
      }
      return job;
    }

    /** Fetches the analysis in the background; a failure only leaves a gap in the DD log. */
    function prefetch(play: PlayState, g: number): void {
      analysisOf(play, g).catch(() => {});
    }

    /** Plays for the defenders until it is the player's turn or the hand is over. */
    async function step(g: number): Promise<void> {
      const { play } = get();
      if (g !== gen || !play || isComplete(play) || get().trickPause) return;
      const seat = toPlay(play);
      if (seat === null) return;
      if (sideOf(seat) === 'NS') {
        prefetch(play, g);
        return;
      }

      set({ botThinking: true, error: null });
      const started = Date.now();
      let analysis: readonly CardAnalysis[];
      try {
        analysis = await analysisOf(play, g);
        await wait(get().pace.cardMs - (Date.now() - started));
      } catch (err) {
        if (g !== gen || isAbort(err)) return;
        set({ botThinking: false, error: `บอทคิดไม่สำเร็จ (${message(err)})` });
        return;
      }
      if (g !== gen) return;
      const card = chooseDefenderCard(positionFromPlayState(play), analysis, seed);
      commit(applyPlay(play, card), g);
    }

    function commit(next: PlayState, g: number): void {
      const trickDone = next.plays.length % 4 === 0;
      set({ play: next, botThinking: false, trickPause: trickDone });
      if (!trickDone) {
        void step(g);
        return;
      }
      // Work out the next position while the finished trick is on show.
      if (!isComplete(next)) prefetch(next, g);
      void wait(get().pace.trickMs).then(() => {
        if (g !== gen) return;
        set({ trickPause: false });
        void step(g);
      });
    }

    return {
      hand: null,
      dealCode: null,
      play: null,
      analyses: {},
      botThinking: false,
      trickPause: false,
      error: null,
      notice: null,
      dealing: false,
      dealError: null,
      pace: options.pace ?? BOT_PACE.normal,

      startHand(hand) {
        const g = nextGeneration();
        seed = dealSeed(hand.deal);
        set({
          hand,
          dealCode: encodeDeal(hand.deal),
          play: newPlayState(hand.deal, hand.contract),
          analyses: {},
          botThinking: false,
          trickPause: false,
          error: null,
        });
        void step(g);
      },

      playCard(card) {
        const { play, trickPause } = get();
        if (!play || trickPause || get().error) return false;
        const seat = toPlay(play);
        if (seat === null || sideOf(seat) !== 'NS' || illegalReason(play, card)) return false;
        // The DD value before this card comes from this position's analysis.
        prefetch(play, gen);
        commit(applyPlay(play, card), gen);
        return true;
      },

      async dealNew(settings) {
        dealAbort?.abort();
        const ctrl = new AbortController();
        dealAbort = ctrl;
        set({ dealing: true, dealError: null });
        let result: NewHand;
        try {
          result = await newHand(settings, {
            ddTable: (deal, o) => solver.ddTable(deal, o),
            signal: ctrl.signal,
          });
        } catch (err) {
          if (dealAbort !== ctrl) return false; // replaced by a newer deal
          dealAbort = null;
          set({
            dealing: false,
            dealError: isAbort(err) ? null : `แจกไพ่ไม่สำเร็จ (${message(err)})`,
          });
          return false;
        }
        if (dealAbort !== ctrl) return false;
        dealAbort = null;
        const notice = result.relaxed
          ? `หามือแบบ "${CONTRACT_TYPE_LABEL[settings.contractType]}" ไม่เจอใน 30 มือ ` +
            `เลยแจกแบบ "${CONTRACT_TYPE_LABEL[result.contractType]}" แทน`
          : null;
        set({ dealing: false, notice });
        get().startHand({
          deal: result.deal,
          contract: result.contract,
          vulnerability: settings.vulnerability,
        });
        return true;
      },

      cancelDeal() {
        dealAbort?.abort();
      },

      retry() {
        if (!get().error) return;
        set({ error: null });
        void step(gen);
      },

      dismissNotice() {
        set({ notice: null });
      },

      setPace(pace) {
        set({ pace });
      },

      leave() {
        nextGeneration();
        set({
          hand: null,
          dealCode: null,
          play: null,
          analyses: {},
          botThinking: false,
          trickPause: false,
          error: null,
          notice: null,
        });
      },
    };
  });

  return store;
}

export type PlayStore = ReturnType<typeof createPlayStore>;
