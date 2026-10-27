// The DDS double-dummy solver compiled to WebAssembly (SPEC §5.4 fallback; see DECISIONS.md M4).
// Same answers as `Solver` (SPEC §5.1), loaded once with `loadDds()`; after that every call
// is synchronous.

import type { Card, Deal, Rank, Seat, Strain } from '../engine';
import { SEATS, STRAINS, SUITS, assertValidDeal, sideOf, sortHand } from '../engine';
import type { DdsModule } from './dds/dds-wasm.mjs';
import createDdsModule from './dds/dds-wasm.mjs';
import type { Position } from './position';
import { assertValidPosition } from './position';
import type { CardAnalysis, DDTable } from './solve';

// DDS encodings: hand 0..3 = N E S W (= SEATS), suit 0..3 = S H D C (= SUITS), strain 4 = NT.
const hand = (seat: Seat): number => SEATS.indexOf(seat);
const strainCode = (s: Strain): number => (s === 'NT' ? 4 : SUITS.indexOf(s));

const IN_INTS = 24;
const OUT_INTS = 1 + 13 * 3;

/** Holdings as DDS bitmasks, `holdings[hand * 4 + suit]`, bit `rank` set for each card. */
function holdings(hands: Readonly<Record<Seat, readonly Card[]>>): number[] {
  const bits = new Array<number>(16).fill(0);
  for (const seat of SEATS) {
    for (const c of hands[seat]) bits[hand(seat) * 4 + SUITS.indexOf(c.suit)]! |= 1 << c.rank;
  }
  return bits;
}

export class DdsSolver {
  private readonly inPtr: number;
  private readonly outPtr: number;

  private constructor(private readonly mod: DdsModule) {
    this.inPtr = mod._malloc(IN_INTS * 4);
    this.outPtr = mod._malloc(OUT_INTS * 4);
  }

  /** Instantiates the wasm module (about 0.4 MB, embedded in the JS). */
  static async load(): Promise<DdsSolver> {
    return new DdsSolver(await createDdsModule());
  }

  /** Most tricks NS take from `pos` to the end of play (not counting tricks already won). */
  solve(pos: Position): number {
    assertValidPosition(pos);
    const remaining = tricksLeft(pos);
    if (remaining === 0) return 0;
    const [first] = this.run(pos, 1);
    return toNs(pos.toPlay, first!.score, remaining);
  }

  /**
   * Every legal card for the seat to play, with the tricks NS take if it is played and everyone
   * plays best from then on. Cards come in hand order (suit ♠ ♥ ♦ ♣, high to low).
   */
  analyze(pos: Position): CardAnalysis[] {
    assertValidPosition(pos);
    const remaining = tricksLeft(pos);
    if (remaining === 0) return [];
    const byCard = new Map<string, number>();
    for (const r of this.run(pos, 3)) {
      byCard.set(`${r.card.suit}${r.card.rank}`, toNs(pos.toPlay, r.score, remaining));
    }
    return sortHand([...byCard.keys()].map(parseKey), 'rank').map((card) => ({
      card,
      nsTricks: byCard.get(`${card.suit}${card.rank}`)!,
    }));
  }

  /** Tricks South (declarer) takes in each strain with West on lead. */
  ddTable(deal: Deal): DDTable {
    assertValidDeal(deal);
    const table = {} as DDTable;
    if (deal.N.length < 13) {
      // DDS's table call wants full hands; end positions go through solve.
      for (const trump of STRAINS) {
        table[trump] = this.solve({ hands: deal, trump, trick: [], toPlay: 'W' });
      }
      return table;
    }
    const { mod, inPtr, outPtr } = this;
    mod.HEAP32.set(holdings(deal), inPtr >> 2);
    check(mod._bt_calc_table(inPtr, outPtr));
    const out = mod.HEAP32.subarray(outPtr >> 2, (outPtr >> 2) + 20);
    for (const trump of STRAINS) table[trump] = out[strainCode(trump) * 4 + hand('S')]!;
    return table;
  }

  /** Runs DDS on `pos`; scores are tricks for the side to play, including the current trick. */
  private run(pos: Position, solutions: 1 | 3): { card: Card; score: number }[] {
    const { mod, inPtr, outPtr } = this;
    const leader = pos.trick[0]?.seat ?? pos.toPlay;
    const input = [strainCode(pos.trump), hand(leader), 0, 0, 0, 0, 0, 0, ...holdings(pos.hands)];
    pos.trick.forEach((p, i) => {
      input[2 + i] = SUITS.indexOf(p.card.suit);
      input[5 + i] = p.card.rank;
    });
    mod.HEAP32.set(input, inPtr >> 2);
    check(mod._bt_solve(inPtr, solutions, outPtr));
    const heap = mod.HEAP32;
    const base = outPtr >> 2;
    const n = heap[base]!;
    const result: { card: Card; score: number }[] = [];
    for (let i = 0; i < n; i++) {
      const suit = SUITS[heap[base + 1 + 3 * i]!]!;
      const rank = heap[base + 2 + 3 * i]! as Rank;
      result.push({ card: { suit, rank }, score: heap[base + 3 + 3 * i]! });
    }
    return result;
  }
}

/** Tricks still to be decided, the current one included. */
function tricksLeft(pos: Position): number {
  const held = SEATS.reduce((n, s) => n + pos.hands[s].length, 0);
  return (held + pos.trick.length) / 4;
}

function toNs(toPlay: Seat, score: number, remaining: number): number {
  return sideOf(toPlay) === 'NS' ? score : remaining - score;
}

function parseKey(key: string): Card {
  return { suit: key[0] as Card['suit'], rank: Number(key.slice(1)) as Rank };
}

function check(code: number): void {
  if (code !== 1) throw new Error(`DDS error ${code}`);
}

let loading: Promise<DdsSolver> | null = null;

/** The shared DDS solver, instantiated on first use. */
export function loadDds(): Promise<DdsSolver> {
  return (loading ??= DdsSolver.load());
}
