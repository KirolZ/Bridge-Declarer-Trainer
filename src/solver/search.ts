// Double-dummy search on the bitmask representation (SPEC §5.2).
//
// The core is a null-window test — "can NS take at least `target` of the tricks still to be
// played?" — and the exact value is found by stepping the target up or down (MTD(f)).
// Hot-loop state is passed as plain numbers; nothing is allocated per node.

import { handLength } from './bits';

/** A point in the play: who is to play and the state of the trick in progress. */
export type Node = {
  readonly seat: number;
  /** Cards already played to this trick (0–3). */
  readonly pos: number;
  /** Suit led to this trick, or -1 when `pos` is 0. */
  readonly led: number;
  /** Seat and card code currently winning this trick, or -1 when `pos` is 0. */
  readonly winSeat: number;
  readonly winCard: number;
  /** Tricks still to be played, counting the one in progress. */
  readonly tricksLeft: number;
};

export class DDSearch {
  /** Nodes visited, for benchmarks. */
  nodes = 0;

  /** `hands` is modified during a search and restored before each call returns. */
  constructor(
    readonly hands: Int32Array,
    readonly trump: number,
  ) {}

  /** Root node for a trick in progress with cards `trick` (codes) played before `toPlay`. */
  rootNode(toPlay: number, trick: readonly number[]): Node {
    const pos = trick.length;
    let winSeat = -1;
    let winCard = -1;
    trick.forEach((c, i) => {
      if (i === 0 || this.beats(c, winCard)) {
        winSeat = (toPlay - pos + i + 4) & 3;
        winCard = c;
      }
    });
    const led = pos > 0 ? (trick[0] as number) >> 4 : -1;
    return { seat: toPlay, pos, led, winSeat, winCard, tricksLeft: handLength(this.hands, toPlay) };
  }

  /** Exact number of tricks NS take from `node` with best play by both sides. */
  value(node: Node, guess = Math.ceil(node.tricksLeft / 2)): number {
    const { seat, pos, led, winSeat, winCard, tricksLeft } = node;
    let lo = 0;
    let hi = tricksLeft;
    let g = guess;
    while (lo < hi) {
      const t = Math.min(Math.max(g, lo + 1), hi);
      if (this.reaches(seat, pos, led, winSeat, winCard, tricksLeft, t)) {
        lo = t;
        g = t + 1;
      } else {
        hi = t - 1;
        g = t - 1;
      }
    }
    return lo;
  }

  /** NS tricks from `node` once its seat plays `card` (which must be legal). */
  valueAfter(node: Node, card: number, guess?: number): number {
    const suit = card >> 4;
    const idx = node.seat * 4 + suit;
    const bit = 1 << (card & 15);
    let winSeat = node.winSeat;
    let winCard = node.winCard;
    if (node.pos === 0 || this.beats(card, winCard)) {
      winSeat = node.seat;
      winCard = card;
    }
    this.hands[idx] = (this.hands[idx] as number) ^ bit;
    try {
      if (node.pos === 3) {
        const won = (winSeat & 1) === 0 ? 1 : 0;
        const next: Node = {
          seat: winSeat,
          pos: 0,
          led: -1,
          winSeat: -1,
          winCard: -1,
          tricksLeft: node.tricksLeft - 1,
        };
        return won + this.value(next, guess === undefined ? undefined : guess - won);
      }
      const next: Node = {
        seat: (node.seat + 1) & 3,
        pos: node.pos + 1,
        led: node.pos === 0 ? suit : node.led,
        winSeat,
        winCard,
        tricksLeft: node.tricksLeft,
      };
      return this.value(next, guess);
    } finally {
      this.hands[idx] = (this.hands[idx] as number) ^ bit;
    }
  }

  /** Does card `a` beat the card `b` that is currently winning the trick? */
  private beats(a: number, b: number): boolean {
    const sa = a >> 4;
    return sa === b >> 4 ? a > b : sa === this.trump;
  }

  /**
   * Null-window test: can NS take at least `target` of the `tricksLeft` tricks still to be
   * played (counting the trick in progress)?
   */
  private reaches(
    seat: number,
    pos: number,
    led: number,
    winSeat: number,
    winCard: number,
    tricksLeft: number,
    target: number,
  ): boolean {
    this.nodes++;
    if (target <= 0) return true;
    if (target > tricksLeft) return false;

    const hands = this.hands;
    const ns = (seat & 1) === 0;
    const base = seat * 4;
    let from = 0;
    let to = 3;
    if (pos > 0 && hands[base + led] !== 0) from = to = led;

    for (let suit = from; suit <= to; suit++) {
      const idx = base + suit;
      let m = hands[idx] as number;
      while (m !== 0) {
        const bit = m & -m;
        m ^= bit;
        const card = (suit << 4) | (31 - Math.clz32(bit));

        let ws = winSeat;
        let wc = winCard;
        if (pos === 0 || this.beats(card, wc)) {
          ws = seat;
          wc = card;
        }

        hands[idx] = (hands[idx] as number) ^ bit;
        const ok =
          pos === 3
            ? this.reaches(ws, 0, -1, -1, -1, tricksLeft - 1, (ws & 1) === 0 ? target - 1 : target)
            : this.reaches(
                (seat + 1) & 3,
                pos + 1,
                pos === 0 ? suit : led,
                ws,
                wc,
                tricksLeft,
                target,
              );
        hands[idx] = (hands[idx] as number) ^ bit;

        // NS need one card that works; EW need one card that stops them.
        if (ok === ns) return ok;
      }
    }
    return !ns;
  }
}
