// Worker-side request handling, kept free of Worker globals so it can be tested in Node.

import type { Card, Deal, Seat } from '../engine';
import { SEATS, cardIndex } from '../engine';
import type { CardAnalysis, DDTable, Position } from '../solver';
import type { SolverRequest, SolverResponse } from './protocol';

/** What the worker needs from a solver: `DdsSolver`, or the TS `Solver` in tests. */
export type SolverEngine = {
  solve(pos: Position): number;
  analyze(pos: Position): CardAnalysis[];
  ddTable(deal: Deal): DDTable;
  clear(): void;
};

/**
 * Remembers which seat held each card in the positions seen so far. Positions of one deal never
 * move a card to another seat, whether play goes forward or back (undo); a new deal almost always
 * does. When it does not (a new end position that fits the old cards), reusing cached results is
 * still correct, because the solver's cache is valid for any deal.
 */
export class DealTracker {
  private readonly owner = new Int8Array(52).fill(-1);

  /** Records `pos`; false when a card has changed seat, i.e. a new deal began (tracker restarts). */
  observe(pos: Position): boolean {
    const cards: [Seat, Card][] = [];
    for (const seat of SEATS) for (const c of pos.hands[seat]) cards.push([seat, c]);
    for (const p of pos.trick) cards.push([p.seat, p.card]);

    const same = cards.every(([seat, c]) => {
      const known = this.owner[cardIndex(c)];
      return known === -1 || known === SEATS.indexOf(seat);
    });
    if (!same) this.owner.fill(-1);
    for (const [seat, c] of cards) this.owner[cardIndex(c)] = SEATS.indexOf(seat);
    return same;
  }
}

/**
 * Runs solver jobs. The solver's cache is kept between `solve` / `analyze` calls on the same deal
 * and cleared when a new deal shows up (SPEC §5.5).
 */
export class SolverHost {
  private readonly deal = new DealTracker();
  private started = false;
  /** How many times the cache was cleared for a new deal (for tests and the dev page). */
  clears = 0;

  constructor(private readonly engine: SolverEngine) {}

  handle(req: SolverRequest): SolverResponse {
    try {
      switch (req.type) {
        case 'solve':
          this.enter(req.payload);
          return { id: req.id, ok: true, result: this.engine.solve(req.payload) };
        case 'analyze':
          this.enter(req.payload);
          return { id: req.id, ok: true, result: this.engine.analyze(req.payload) };
        case 'ddTable':
          return { id: req.id, ok: true, result: this.engine.ddTable(req.payload) };
        default:
          return { id: (req as { id: number }).id, ok: false, error: 'unknown job type' };
      }
    } catch (err) {
      return { id: req.id, ok: false, error: errorMessage(err) };
    }
  }

  private enter(pos: Position): void {
    const same = this.deal.observe(pos);
    if (this.started && !same) {
      this.engine.clear();
      this.clears++;
    }
    this.started = true;
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
