// Data types of the beginner's guide (SPEC §7.7): chapters, glossary and exercises. Everything
// here is plain data, so the content can be checked by tests (every exercise against the solver).

import type { Seat, Strain } from '../engine';

/**
 * Text with inline markup (see `markup.ts`): `[[trick]]` or `[[trick|label]]` links a glossary
 * term, `{SA}` shows a card, `{S}` a suit symbol, `**text**` is bold.
 */
export type Rich = string;

/** Card codes separated by spaces, e.g. `"SA SK HT"` (suit letter + rank, T = 10). */
export type CardList = string;

/** One hand per seat in PBN form, e.g. `"AK3.Q2..T9"` (♠.♥.♦.♣). */
export type Hands = Readonly<Record<Seat, string>>;

export type Block =
  | { readonly kind: 'p'; readonly text: Rich }
  /** A sub-heading inside the chapter. */
  | { readonly kind: 'h'; readonly text: string }
  | { readonly kind: 'list'; readonly items: readonly Rich[] }
  /** A highlighted tip. */
  | { readonly kind: 'note'; readonly text: Rich }
  /** A row of cards, as given (e.g. the rank order). */
  | { readonly kind: 'cards'; readonly cards: CardList; readonly caption?: Rich }
  /** One hand, sorted and fanned like a hand of cards. */
  | {
      readonly kind: 'hand';
      readonly hand: string;
      readonly seat?: Seat;
      readonly caption?: Rich;
    }
  /**
   * A trick laid out around the table, numbered in play order. The winner is worked out by the
   * rules engine and highlighted once the trick has four cards.
   */
  | {
      readonly kind: 'trick';
      readonly leader: Seat;
      readonly cards: CardList;
      readonly trump: Strain;
      readonly caption?: Rich;
    }
  /** A bridge diagram: the given hands around the table (any of the four may be left out). */
  | {
      readonly kind: 'deal';
      readonly hands: Partial<Hands>;
      /** Shown in the middle when given (left out before trumps are taught). */
      readonly trump?: Strain;
      readonly caption?: Rich;
    };

export type Chapter = {
  /** 1–14, also the URL: `#/learn/<n>`. */
  readonly n: number;
  readonly title: string;
  /** One line for the chapter list. */
  readonly topic: string;
  /** Empty while the chapter is not written yet. */
  readonly blocks: readonly Block[];
};

export type GlossaryEntry = {
  /** Used in links: `[[id]]`, `#/learn/glossary?t=<id>`. */
  readonly id: string;
  /** The word as written in the game (English bridge term). */
  readonly term: string;
  /** Short Thai gloss, e.g. "ตา". */
  readonly thai: string;
  /** Other English words this entry explains, e.g. "vul" (vulnerable), "small slam" (slam). */
  readonly aliases?: readonly string[];
  readonly text: Rich;
  /** Chapter that teaches it, if any. */
  readonly chapter?: number;
};

type ExerciseCommon = {
  /** Unique, used in the URL: `#/learn/ex/<id>`. */
  readonly id: string;
  readonly chapter: number;
  readonly title: string;
  /** What to do. */
  readonly instruction: Rich;
  /** Why the answer is right; shown after answering (right or wrong). */
  readonly explanation: Rich;
  /** A nudge shown on request. */
  readonly hint: Rich;
};

/** A position on the table: hands of equal size, trump, first leader, cards already played. */
export type Layout = {
  readonly hands: Hands;
  readonly trump: Strain;
  readonly leader: Seat;
  /** Cards played so far, in play order starting with `leader` (card codes). */
  readonly plays?: readonly string[];
};

/** Pick every card the seat to play may play. The answer comes from the rules engine. */
export type LegalExercise = ExerciseCommon & Layout & { readonly kind: 'legal' };

/** Who wins the trick? `plays` ends with a complete trick; the engine knows the answer. */
export type WinnerExercise = ExerciseCommon & Layout & { readonly kind: 'winner' };

/** A question with one right option. */
export type ChoiceExercise = ExerciseCommon & {
  readonly kind: 'choice';
  readonly options: readonly Rich[];
  /** Index of the right option. */
  readonly answer: number;
  /** Cards to show with the question. */
  readonly cards?: CardList;
};

/** A card the explanation says is wrong: playing it makes the goal impossible (checked by test). */
export type WrongCard = {
  /** Cards played since the exercise started (along the solution line) when it is played. */
  readonly at: number;
  readonly card: string;
  readonly why: Rich;
};

/**
 * Play the end position out against the double-dummy defenders. Passed with `goal.nsTricks` or
 * more NS tricks, by any line.
 */
export type PlayExercise = ExerciseCommon &
  Layout & {
    readonly kind: 'play';
    /** NS tricks to take, counted from the start of the position. */
    readonly goal: { readonly nsTricks: number };
    /** NS cards of a winning line, in order ("show the answer" plays these). */
    readonly solution: readonly string[];
    readonly wrong: readonly WrongCard[];
  };

export type Exercise = LegalExercise | WinnerExercise | ChoiceExercise | PlayExercise;
export type CardExercise = LegalExercise | WinnerExercise | PlayExercise;
