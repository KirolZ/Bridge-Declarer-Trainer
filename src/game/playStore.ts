// State of the hand being played (SPEC §4.2, §6, §7.2–§7.5): a vanilla Zustand store that the
// UI reads with `useStore`. The store drives the defenders: whenever East or West is to play it
// asks the solver for `analyze`, waits out the bot's pace, and plays the bot's card. It also keeps
// the `analyze` result of every position it saw, so the DD value before and after each of the
// player's cards is known for the post-hand analysis (M10), and hints and claims are answered
// from it.
//
// Async work belongs to a "generation": starting a hand, undo, restart (or leaving) bumps the
// generation and aborts its solver jobs and timers, and every continuation checks that its
// generation is still current before touching state.

import { createStore } from 'zustand/vanilla';
import type { Card, Contract, Deal, PlayState, Seat, Vulnerability } from '../engine';
import {
  applyPlay,
  completedTricks,
  encodeContract,
  encodeDeal,
  illegalReason,
  isComplete,
  newPlayState,
  sideOf,
  toPlay,
  totalTricks,
  tricksWon,
} from '../engine';
import { chooseDefenderCard, dealSeed } from '../bot';
import type { CardAnalysis, DDTable, Position } from '../solver';
import { positionFromPlayState } from '../solver/position';
import type { ContractType, DealSettings, Pace } from './settings';
import { BOT_PACE } from './settings';
import type { NewHand } from './newHand';
import { newHand } from './newHand';
import { reviewKeys } from './review';

/** What the store needs from the solver (the app passes the worker client). */
export type PlaySolver = {
  analyze(pos: Position, options: { signal: AbortSignal }): Promise<CardAnalysis[]>;
  ddTable(deal: Deal, options: { signal?: AbortSignal; timeoutMs: number }): Promise<DDTable>;
};

export type HandSetup = {
  readonly deal: Deal;
  readonly contract: Contract;
  readonly vulnerability: Vulnerability;
  /** Who leads first (default: West, the opening leader). Set for guide exercises. */
  readonly leader?: Seat;
  /**
   * Cards already played when play starts (guide exercises start from an end position, maybe
   * in the middle of a trick). Undo, restart and rewinds never go back before them.
   */
  readonly plays?: readonly Card[];
};

/** Best cards for the player's position after `at` cards (SPEC §7.2). */
export type Hint = {
  readonly at: number;
  readonly cards: readonly Card[];
  /** NS tricks for the whole hand if one of `cards` is played and play stays best. */
  readonly tricks: number;
};

export type ClaimOutcome = 'accepted' | 'rejected' | 'cancelled';

/**
 * An error or notice for the player, as data: the UI words it in the player's language
 * (src/i18n). `detail` is the solver's own error text.
 */
export type StoreMessage =
  | {
      readonly kind: 'botFailed' | 'hintFailed' | 'claimFailed' | 'dealFailed';
      readonly detail: string;
    }
  | { readonly kind: 'dealRelaxed'; readonly wanted: ContractType; readonly got: ContractType };

export type PlayStoreState = {
  readonly hand: HandSetup | null;
  /** `encodeDeal(hand.deal)`, for links (null for an end position, which has no code). */
  readonly dealCode: string | null;
  readonly play: PlayState | null;
  /** Number of cards `hand.plays` put on the table at the start; play never goes back before. */
  readonly startPlays: number;
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
  readonly error: StoreMessage | null;
  /** One-off message for the table (e.g. the contract type was relaxed). */
  readonly notice: StoreMessage | null;
  /** `newHand` is running. */
  readonly dealing: boolean;
  readonly dealError: StoreMessage | null;
  readonly pace: Pace;
  /** The hint on show (cleared as soon as play moves on). */
  readonly hint: Hint | null;
  /** A hint is waiting for the solver. */
  readonly hintLoading: boolean;
  /** Hints asked for in this attempt at the hand (at most one per position). */
  readonly hintsUsed: number;
  /** NS tricks for the whole hand once a claim was accepted; the hand is then over. */
  readonly claimed: number | null;
  /** A claim is waiting for the solver. */
  readonly claimChecking: boolean;
  /** Show the defenders' cards while playing (SPEC §7.6). */
  readonly studyMode: boolean;
  /** Study mode was on at some point of this attempt: it does not count for the stats (M11). */
  readonly studied: boolean;
  /** Bumped whenever play starts over or is rewound, so the table can skip animations. */
  readonly epoch: number;
  /**
   * Bumped by `startHand` only (not by undo, rewinds or "play again"), so the stats count the
   * first finish of each hand started (M11).
   */
  readonly handSerial: number;

  /** Starts playing `hand` from the opening lead (or from `hand.leader` / `hand.plays`). */
  startHand(hand: HandSetup): void;
  /** The player plays `card` from South or North. False (and no change) if not allowed now. */
  playCard(card: Card): boolean;
  /** Shows the best cards for the player's turn. False if not the player's turn. */
  showHint(): Promise<boolean>;
  /**
   * Takes back the player's last card and the bots' cards after it (or an accepted claim).
   * Works at any time, also while a bot is thinking. False if there is nothing to undo.
   */
  undo(): boolean;
  /** Plays the same hand again from the opening lead (or the start position). */
  restart(): void;
  /**
   * Cuts play back to its first `n` cards ("play again from here", SPEC §7.5) and lets the bots
   * carry on. False (and no change) if `n` is out of range.
   */
  rewindTo(n: number): boolean;
  /**
   * Fetches the analyses the post-hand review still lacks (`reviewKeys`). True once all are in;
   * false on a solver error or when play moved on meanwhile.
   */
  completeReview(): Promise<boolean>;
  /**
   * The player claims `tricks` more tricks (SPEC §7.4). Accepted, and the hand ends, if NS can
   * still take that many against best defence; otherwise play goes on.
   */
  claim(tricks: number): Promise<ClaimOutcome>;
  setStudyMode(on: boolean): void;
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

/** The hand is finished: all tricks played (and the last one gathered), or a claim accepted. */
export function isHandOver(state: PlayStoreState): boolean {
  if (!state.play) return false;
  return state.claimed !== null || (isComplete(state.play) && !state.trickPause);
}

/** NS tricks at the end of the hand (counting an accepted claim). */
export function finalNsTricks(state: PlayStoreState): number {
  if (!state.play) return 0;
  return state.claimed ?? tricksWon(state.play).NS;
}

/** The player may act now: their turn, no finished trick on show, no error, hand not over. */
export function isPlayerTurn(state: PlayStoreState): boolean {
  const { play } = state;
  if (!play || state.trickPause || state.error || state.claimed !== null) return false;
  const seat = toPlay(play);
  return seat !== null && sideOf(seat) === 'NS';
}

/** Index in `play.plays` of the player's last card, or -1. */
function lastPlayerCard(play: PlayState): number {
  for (let i = play.plays.length - 1; i >= 0; i--) {
    if (sideOf(play.plays[i]!.seat) === 'NS') return i;
  }
  return -1;
}

export function canUndo(state: PlayStoreState): boolean {
  if (!state.play) return false;
  return state.claimed !== null || lastPlayerCard(state.play) >= state.startPlays;
}

/** Tricks not yet won by either side (the current trick included). */
export function tricksLeft(play: PlayState): number {
  return totalTricks(play) - completedTricks(play).length;
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
        set({ botThinking: false, error: { kind: 'botFailed', detail: message(err) } });
        return;
      }
      if (g !== gen) return;
      const card = chooseDefenderCard(positionFromPlayState(play), analysis, seed);
      commit(applyPlay(play, card), g);
    }

    /** Cuts play back to its first `n` cards and lets the bots carry on from there. */
    function rewind(n: number, extra: Partial<PlayStoreState> = {}): void {
      const { play, analyses, epoch } = get();
      if (!play) return;
      const g = nextGeneration();
      // Analyses of positions still on the line of play stay valid.
      const kept: Record<number, readonly CardAnalysis[]> = {};
      for (const [k, v] of Object.entries(analyses)) if (Number(k) <= n) kept[Number(k)] = v;
      set({
        play: { ...play, plays: play.plays.slice(0, n) },
        analyses: kept,
        botThinking: false,
        trickPause: false,
        error: null,
        hint: null,
        hintLoading: false,
        claimed: null,
        claimChecking: false,
        epoch: epoch + 1,
        ...extra,
      });
      void step(g);
    }

    function commit(next: PlayState, g: number): void {
      const trickDone = next.plays.length % 4 === 0;
      set({ play: next, botThinking: false, trickPause: trickDone, hint: null });
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
      startPlays: 0,
      analyses: {},
      botThinking: false,
      trickPause: false,
      error: null,
      notice: null,
      dealing: false,
      dealError: null,
      pace: options.pace ?? BOT_PACE.normal,
      hint: null,
      hintLoading: false,
      hintsUsed: 0,
      claimed: null,
      claimChecking: false,
      studyMode: false,
      studied: false,
      epoch: 0,
      handSerial: 0,

      startHand(hand) {
        const g = nextGeneration();
        seed = dealSeed(hand.deal);
        let play = newPlayState(hand.deal, hand.contract, hand.leader);
        for (const card of hand.plays ?? []) play = applyPlay(play, card);
        set({
          hand,
          dealCode: hand.deal.N.length === 13 ? encodeDeal(hand.deal) : null,
          play,
          startPlays: play.plays.length,
          analyses: {},
          botThinking: false,
          trickPause: false,
          error: null,
          hint: null,
          hintLoading: false,
          hintsUsed: 0,
          claimed: null,
          claimChecking: false,
          studied: get().studyMode,
          epoch: get().epoch + 1,
          handSerial: get().handSerial + 1,
        });
        void step(g);
      },

      playCard(card) {
        const state = get();
        const { play } = state;
        if (!play || !isPlayerTurn(state) || state.claimChecking) return false;
        if (illegalReason(play, card)) return false;
        // The DD value before this card comes from this position's analysis.
        prefetch(play, gen);
        commit(applyPlay(play, card), gen);
        return true;
      },

      async showHint() {
        const state = get();
        const { play } = state;
        if (!play || !isPlayerTurn(state)) return false;
        const at = play.plays.length;
        if (state.hint?.at === at || state.hintLoading) return true;
        const g = gen;
        set({ hintLoading: true });
        let lines: readonly CardAnalysis[];
        try {
          lines = await analysisOf(play, g);
        } catch (err) {
          if (g !== gen) return false;
          set({
            hintLoading: false,
            notice: isAbort(err) ? get().notice : { kind: 'hintFailed', detail: message(err) },
          });
          return false;
        }
        // Dropped if play moved on (or was rewound) meanwhile.
        if (g !== gen || get().play?.plays.length !== at) {
          if (g === gen) set({ hintLoading: false });
          return false;
        }
        const best = Math.max(...lines.map((l) => l.nsTricks));
        set({
          hintLoading: false,
          hintsUsed: get().hintsUsed + 1,
          hint: {
            at,
            cards: lines.filter((l) => l.nsTricks === best).map((l) => l.card),
            tricks: tricksWon(play).NS + best,
          },
        });
        return true;
      },

      undo() {
        const state = get();
        const { play } = state;
        if (!play || !canUndo(state)) return false;
        // An accepted claim was the player's last action: taking it back resumes play there.
        rewind(state.claimed !== null ? play.plays.length : lastPlayerCard(play));
        return true;
      },

      restart() {
        if (!get().play) return;
        rewind(get().startPlays, { hintsUsed: 0, studied: get().studyMode });
      },

      rewindTo(n) {
        const { play, startPlays } = get();
        if (!play || !Number.isInteger(n) || n < startPlays || n > play.plays.length) return false;
        rewind(n);
        return true;
      },

      async completeReview() {
        const { play, claimed, analyses } = get();
        if (!play) return false;
        const g = gen;
        const missing = reviewKeys(play, claimed !== null).filter((k) => !analyses[k]);
        try {
          await Promise.all(
            missing.map((k) => analysisOf({ ...play, plays: play.plays.slice(0, k) }, g)),
          );
        } catch {
          return false;
        }
        return g === gen;
      },

      async claim(tricks) {
        const state = get();
        const { play } = state;
        if (!play || !isPlayerTurn(state) || state.claimChecking) return 'cancelled';
        if (!Number.isInteger(tricks) || tricks < 0 || tricks > tricksLeft(play)) {
          return 'cancelled';
        }
        const g = gen;
        const at = play.plays.length;
        set({ claimChecking: true });
        let lines: readonly CardAnalysis[];
        try {
          // NS is to play, so the best line of `analyze` is the `solve` value (SPEC §5.3).
          lines = await analysisOf(play, g);
        } catch (err) {
          if (g !== gen) return 'cancelled';
          set({
            claimChecking: false,
            notice: isAbort(err) ? get().notice : { kind: 'claimFailed', detail: message(err) },
          });
          return 'cancelled';
        }
        if (g !== gen) return 'cancelled';
        if (get().play?.plays.length !== at) {
          set({ claimChecking: false });
          return 'cancelled';
        }
        const best = Math.max(...lines.map((l) => l.nsTricks));
        if (best < tricks) {
          set({ claimChecking: false });
          return 'rejected';
        }
        set({ claimChecking: false, claimed: tricksWon(play).NS + tricks, hint: null });
        return 'accepted';
      },

      setStudyMode(on) {
        set({ studyMode: on, studied: get().studied || (on && get().play !== null) });
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
            dealError: isAbort(err) ? null : { kind: 'dealFailed', detail: message(err) },
          });
          return false;
        }
        if (dealAbort !== ctrl) return false;
        dealAbort = null;
        const notice: StoreMessage | null = result.relaxed
          ? { kind: 'dealRelaxed', wanted: settings.contractType, got: result.contractType }
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
          startPlays: 0,
          analyses: {},
          botThinking: false,
          trickPause: false,
          error: null,
          notice: null,
          hint: null,
          hintLoading: false,
          hintsUsed: 0,
          claimed: null,
          claimChecking: false,
          studied: false,
        });
      },
    };
  });

  return store;
}

export type PlayStore = ReturnType<typeof createPlayStore>;
