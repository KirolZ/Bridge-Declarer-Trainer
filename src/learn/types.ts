// Data types of the beginner's guide (SPEC §7.7): chapters, glossary and exercises. Everything
// here is plain data, so the content can be checked by tests (every exercise against the solver).
//
// The guide is written in two languages (M18): in the data files every text is `{ th, en }`
// (`Bilingual`); `localize` (localize.ts) turns the data into one language, with plain strings, for
// the screens. The types take the text type as a parameter: `Chapter<Bilingual>` is the data,
// `Chapter` (= `Chapter<Rich>`) is one language. Cards, hands and answers are shared.

import type { Seat, Strain } from '../engine';

/**
 * Text with inline markup (see `markup.ts`): `[[trick]]` or `[[trick|label]]` links a glossary
 * term, `{SA}` shows a card, `{S}` a suit symbol, `**text**` is bold.
 */
export type Rich = string;

/** A text of the guide in both languages, same markup in each. */
export type Bilingual = { readonly th: Rich; readonly en: Rich };

/** The text type of the guide: one language (`Rich`) or both (`Bilingual`). */
export type Text = Rich | Bilingual;

/** Card codes separated by spaces, e.g. `"SA SK HT"` (suit letter + rank, T = 10). */
export type CardList = string;

/** One hand per seat in PBN form, e.g. `"AK3.Q2..T9"` (♠.♥.♦.♣). */
export type Hands = Readonly<Record<Seat, string>>;

export type Block<T extends Text = Rich> =
  | { readonly kind: 'p'; readonly text: T }
  /** A sub-heading inside the chapter. */
  | { readonly kind: 'h'; readonly text: T }
  | { readonly kind: 'list'; readonly items: readonly T[] }
  /** A highlighted tip. */
  | { readonly kind: 'note'; readonly text: T }
  /** A row of cards, as given (e.g. the rank order). */
  | { readonly kind: 'cards'; readonly cards: CardList; readonly caption?: T }
  /** One hand, sorted and fanned like a hand of cards. */
  | {
      readonly kind: 'hand';
      readonly hand: string;
      readonly seat?: Seat;
      readonly caption?: T;
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
      readonly caption?: T;
    }
  /** A bridge diagram: the given hands around the table (any of the four may be left out). */
  | {
      readonly kind: 'deal';
      readonly hands: Partial<Hands>;
      /** Shown in the middle when given (left out before trumps are taught). */
      readonly trump?: Strain;
      readonly caption?: T;
    };

export type Chapter<T extends Text = Rich> = {
  /** 1–14, also the URL: `#/learn/<n>`. */
  readonly n: number;
  readonly title: T;
  /** One line for the chapter list. */
  readonly topic: T;
  /** Empty while the chapter is not written yet. */
  readonly blocks: readonly Block<T>[];
};

/**
 * A part of the guide (M21): the chapters a new player must read to play (`rules`), the ways to
 * play well (`technique`, folded until the rules are read) and how to use this game (`app`).
 */
export type PartId = 'rules' | 'technique' | 'app';

export type Part<T extends Text = Rich> = {
  readonly id: PartId;
  /** Short, also shown above a chapter's title. */
  readonly title: T;
  /** One line under the title in the chapter list. */
  readonly note: T;
  /** Chapter numbers, in reading order. */
  readonly chapters: readonly number[];
};

export type GlossaryEntry<T extends Text = Rich> = {
  /** Used in links: `[[id]]`, `#/learn/glossary?t=<id>`. */
  readonly id: string;
  /** The word as written in the game (English bridge term). */
  readonly term: string;
  /** Short Thai gloss, e.g. "ตา" (shown with the Thai screens only). */
  readonly thai: string;
  /** Other English words this entry explains, e.g. "vul" (vulnerable), "small slam" (slam). */
  readonly aliases?: readonly string[];
  readonly text: T;
  /** Chapter that teaches it, if any. */
  readonly chapter?: number;
};

type ExerciseCommon<T extends Text> = {
  /** Unique, used in the URL: `#/learn/ex/<id>`. */
  readonly id: string;
  readonly chapter: number;
  readonly title: T;
  /** What to do. */
  readonly instruction: T;
  /** Why the answer is right; shown after answering (right or wrong). */
  readonly explanation: T;
  /** A nudge shown on request. */
  readonly hint: T;
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
export type LegalExercise<T extends Text = Rich> = ExerciseCommon<T> &
  Layout & { readonly kind: 'legal' };

/** Who wins the trick? `plays` ends with a complete trick; the engine knows the answer. */
export type WinnerExercise<T extends Text = Rich> = ExerciseCommon<T> &
  Layout & { readonly kind: 'winner' };

/** A question with one right option. */
export type ChoiceExercise<T extends Text = Rich> = ExerciseCommon<T> & {
  readonly kind: 'choice';
  readonly options: readonly T[];
  /** Index of the right option. */
  readonly answer: number;
  /** Cards to show with the question. */
  readonly cards?: CardList;
};

/** A card the explanation says is wrong: playing it makes the goal impossible (checked by test). */
export type WrongCard<T extends Text = Rich> = {
  /** Cards played since the exercise started (along the solution line) when it is played. */
  readonly at: number;
  readonly card: string;
  readonly why: T;
};

/**
 * Play the end position out against the double-dummy defenders. Passed with `goal.nsTricks` or
 * more NS tricks, by any line.
 */
export type PlayExercise<T extends Text = Rich> = ExerciseCommon<T> &
  Layout & {
    readonly kind: 'play';
    /** NS tricks to take, counted from the start of the position. */
    readonly goal: { readonly nsTricks: number };
    /** NS cards of a winning line, in order ("show the answer" plays these). */
    readonly solution: readonly string[];
    readonly wrong: readonly WrongCard<T>[];
  };

export type Exercise<T extends Text = Rich> =
  LegalExercise<T> | WinnerExercise<T> | ChoiceExercise<T> | PlayExercise<T>;
export type CardExercise<T extends Text = Rich> =
  LegalExercise<T> | WinnerExercise<T> | PlayExercise<T>;
