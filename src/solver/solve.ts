// Public solver API (SPEC §5.1).

import type { Card, Deal, Strain } from '../engine';
import { STRAINS, assertValidDeal, sortHand } from '../engine';
import { cardToCode, packPosition } from './bits';
import type { Position } from './position';
import { assertValidPosition, legalCards } from './position';
import { DDSearch } from './search';
import { TransTable } from './tt';

export type CardAnalysis = { card: Card; nsTricks: number };
export type DDTable = Record<Strain, number>;

export type SolverOptions = {
  /**
   * Size of the transposition table: `2 ** ttBits` entries of 49 bytes (default 19, about
   * 25 MB, allocated on first use).
   */
  ttBits?: number;
  /**
   * Search without the transposition table and the sure-trick bounds (for cross-checking the
   * optimizations in tests; far slower).
   */
  plain?: boolean;
};

/**
 * A double-dummy solver. Keeping one instance across calls lets later calls reuse earlier work
 * (the Web Worker keeps one per hand, SPEC §5.5).
 */
export class Solver {
  /** Nodes searched since the solver was created (for benchmarks). */
  get nodes(): number {
    return this.nodeCount;
  }

  private nodeCount = 0;
  private tt: TransTable | null = null;
  private readonly ttBits: number;
  private readonly plain: boolean;

  constructor(options: SolverOptions = {}) {
    this.ttBits = options.ttBits ?? 19;
    this.plain = options.plain ?? false;
  }

  /** Transposition-table lookups and hits so far (for benchmarks). */
  get ttStats(): { probes: number; hits: number } {
    return { probes: this.tt?.probes ?? 0, hits: this.tt?.hits ?? 0 };
  }

  /**
   * Forget cached results. Cached entries are valid for any deal, so this is only needed to
   * start fresh (benchmarks) or to make room when moving on to a different hand.
   */
  clear(): void {
    this.tt?.clear();
  }

  /**
   * Most tricks NS can take from `pos` to the end of play (not counting tricks already won)
   * with best play by both sides.
   */
  solve(pos: Position): number {
    const search = this.prepare(pos);
    try {
      return search.value(search.root);
    } finally {
      this.nodeCount += search.nodes;
    }
  }

  /**
   * Every legal card for the seat to play, with the tricks NS take if it is played and everyone
   * plays best from then on. Cards come in hand order (suit ♠ ♥ ♦ ♣, high to low).
   */
  analyze(pos: Position): CardAnalysis[] {
    const search = this.prepare(pos);
    const cards = sortHand(legalCards(pos), 'rank');
    // Equivalent cards (same representative) share one search.
    const byRep = new Map<number, number>();
    let guess: number | undefined;
    try {
      return cards.map((card) => {
        const rep = search.representative(cardToCode(card));
        let nsTricks = byRep.get(rep);
        if (nsTricks === undefined) {
          nsTricks = search.valueAfter(rep, guess);
          byRep.set(rep, nsTricks);
          guess = nsTricks;
        }
        return { card, nsTricks };
      });
    } finally {
      this.nodeCount += search.nodes;
    }
  }

  /** Tricks South (declarer) takes in each strain with West on lead. */
  ddTable(deal: Deal): DDTable {
    assertValidDeal(deal);
    const table = {} as DDTable;
    for (const trump of STRAINS) {
      table[trump] = this.solve({ hands: deal, trump, trick: [], toPlay: 'W' });
    }
    return table;
  }

  private prepare(pos: Position) {
    assertValidPosition(pos);
    const packed = packPosition(pos);
    this.tt ??= new TransTable(this.ttBits);
    return new DDSearch(
      packed.hands,
      packed.trump,
      packed.toPlay,
      packed.trick,
      this.tt,
      this.plain,
    );
  }
}

let shared: Solver | null = null;
const sharedSolver = (): Solver => (shared ??= new Solver());

/** `Solver.solve` on a shared solver instance. */
export function solve(pos: Position): number {
  return sharedSolver().solve(pos);
}

/** `Solver.analyze` on a shared solver instance. */
export function analyze(pos: Position): CardAnalysis[] {
  return sharedSolver().analyze(pos);
}

/** `Solver.ddTable` on a shared solver instance. */
export function ddTable(deal: Deal): DDTable {
  return sharedSolver().ddTable(deal);
}
