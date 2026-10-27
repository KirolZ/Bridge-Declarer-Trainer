// Double-dummy search on the bitmask representation (SPEC §5.2).
//
// The core is a null-window test — "can NS take at least `target` of the tricks still to be
// played?" — and the exact value is found by stepping the target up or down (MTD(f)).
// Hot-loop state is passed as plain numbers; nothing is allocated per node.
//
// Every test also reports which cards' ranks its answer depended on (`relEx` / `relFl`, rank
// masks per suit): cards that were compared in a trick, or top cards counted by a bound.
// The transposition table uses this to share results between positions that differ only in
// cards whose ranks never mattered (see `tt.ts`).

import { NT, handLength, popcount } from './bits';
import type { TransTable } from './tt';
import { lengthsKey, positionsToRanks, ranksToPositions, suitKey } from './tt';

const ALL_RANKS = 0x1fff;
/** Positions with fewer tricks left are not looked up or stored in the table. */
const MIN_TT_TRICKS = 3;

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

/** Highest set bit of a non-zero mask. */
const topBit = (m: number): number => 1 << (31 - Math.clz32(m));

/** The `k`-th highest set bit of `m` (k ≥ 1), or 0 if `m` has fewer bits. */
function kthTop(m: number, k: number): number {
  for (let i = 1; i < k && m !== 0; i++) m ^= topBit(m);
  return m === 0 ? 0 : topBit(m);
}

export class DDSearch {
  /** Nodes visited, for benchmarks. */
  nodes = 0;

  /**
   * Per suit, the ranks played to finished tricks. Cards in the trick in progress still count
   * as in play: until the trick is over they decide who wins it.
   */
  private readonly gone = new Int32Array(4);
  /** Card codes played to each trick: `[tricksLeft * 4 + position in trick]`. */
  private readonly trickCards = new Int32Array(14 * 4);
  /** Candidate cards and their ordering scores, 13 slots per ply. */
  private readonly moves = new Int32Array(52 * 13);
  private readonly scores = new Int32Array(52 * 13);
  /** Card that decided the last `tryCards` call, or -1 (see `tryCards`). */
  private cut = -1;
  /**
   * Ranks (per suit) the last `reaches` / `tryCards` answer depended on. `relEx`: cards whose
   * order among themselves mattered. `relFl` ("floors"): cards where it mattered that nothing
   * above them was held by anyone else — so every card above them matters too, including cards
   * played between an earlier trick start and here.
   */
  private readonly relEx = new Int32Array(4);
  private readonly relFl = new Int32Array(4);
  /** Floors the last `quickTricks` count depended on. */
  private readonly quickFl = new Int32Array(4);
  /** Scratch for `quickTricks`. */
  private readonly viaPartner = new Int32Array(8);
  readonly root: Node;

  /**
   * `hands` is modified during a search and restored before each call returns. `trick` holds
   * the codes of the cards already played to the current trick, the last one just before
   * `toPlay`.
   */
  constructor(
    readonly hands: Int32Array,
    readonly trump: number,
    toPlay: number,
    trick: readonly number[],
    private readonly tt: TransTable,
    /** Skip the transposition table and the sure-trick bounds (cross-checking only). */
    private readonly plain = false,
  ) {
    for (let suit = 0; suit < 4; suit++) {
      let inPlay = 0;
      for (let seat = 0; seat < 4; seat++) inPlay |= hands[seat * 4 + suit] as number;
      for (const c of trick) if (c >> 4 === suit) inPlay |= 1 << (c & 15);
      this.gone[suit] = ALL_RANKS & ~inPlay;
    }
    const pos = trick.length;
    const tricksLeft = handLength(hands, toPlay);
    let winSeat = -1;
    let winCard = -1;
    trick.forEach((c, i) => {
      this.trickCards[tricksLeft * 4 + i] = c;
      if (i === 0 || this.beats(c, winCard)) {
        winSeat = (toPlay - pos + i + 4) & 3;
        winCard = c;
      }
    });
    const led = pos > 0 ? (trick[0] as number) >> 4 : -1;
    this.root = { seat: toPlay, pos, led, winSeat, winCard, tricksLeft };
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

  /**
   * The card that stands for `card` in the root seat's hand: the top of its run of cards that
   * are adjacent among the cards still in play. Cards with the same representative are
   * interchangeable and have the same value.
   */
  representative(card: number): number {
    const suit = card >> 4;
    const held = this.hands[this.root.seat * 4 + suit] as number;
    const alive = ALL_RANKS & ~(this.gone[suit] as number);
    let bit = 1 << (card & 15);
    for (;;) {
      const above = alive & ~((bit << 1) - 1);
      const next = above & -above;
      if (next === 0 || (next & held) === 0) break;
      bit = next;
    }
    return (suit << 4) | (31 - Math.clz32(bit));
  }

  /** NS tricks from the root once the seat to play plays `card` (which must be legal). */
  valueAfter(card: number, guess?: number): number {
    const node = this.root;
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
    this.trickCards[node.tricksLeft * 4 + node.pos] = card;
    try {
      if (node.pos === 3) {
        const won = (winSeat & 1) === 0 ? 1 : 0;
        this.retireTrick(node.tricksLeft, 1);
        try {
          const next: Node = {
            seat: winSeat,
            pos: 0,
            led: -1,
            winSeat: -1,
            winCard: -1,
            tricksLeft: node.tricksLeft - 1,
          };
          return won + this.value(next, guess === undefined ? undefined : guess - won);
        } finally {
          this.retireTrick(node.tricksLeft, 0);
        }
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

  /** All cards in play of `suit` at the start of a trick (the union of the four hands). */
  private suitInPlay(suit: number): number {
    const h = this.hands;
    return (
      (h[suit] as number) |
      (h[4 + suit] as number) |
      (h[8 + suit] as number) |
      (h[12 + suit] as number)
    );
  }

  /**
   * Tricks the leader's side is sure to take by cashing top cards: the leader's run of highest
   * cards in each suit (each wins and keeps the lead), then possibly one suit run from
   * partner's hand after a low lead to it. In a suit contract a side suit only counts as far
   * as an opponent who holds trumps can follow. Fills `quickFl` with the top cards counted.
   */
  private quickTricks(seat: number): number {
    const h = this.hands;
    const trump = this.trump;
    const suitGame = trump !== NT;
    const me = seat * 4;
    const p = ((seat + 2) & 3) * 4;
    const lho = ((seat + 1) & 3) * 4;
    const rho = ((seat + 3) & 3) * 4;
    const lhoTrumps = suitGame ? (h[lho + trump] as number) : 0;
    const rhoTrumps = suitGame ? (h[rho + trump] as number) : 0;
    const partnerLen = handLength(h, (seat + 2) & 3);
    const partnerTrumps = suitGame ? popcount(h[p + trump] as number) : 0;
    // A partner holding nothing but trumps must ruff our side-suit winners and take the lead,
    // so side suits cannot be cashed one after another.
    const partnerOnlyTrumps = partnerTrumps > 0 && partnerTrumps === partnerLen;
    const rel = this.quickFl;
    rel.fill(0);

    let q = 0;
    // Per suit, tricks partner could run after a low lead to them (0 = none), and how many
    // spare cards partner has to play on our own winners first.
    const via = this.viaPartner;
    via.fill(0);
    for (let s = 0; s < 4; s++) {
      const mine = h[me + s] as number;
      const theirs = h[p + s] as number;
      const inPlay = this.suitInPlay(s);
      if (inPlay === 0) continue;
      const first = topBit(inPlay);
      const held = (mine & first) !== 0 ? mine : (theirs & first) !== 0 ? theirs : 0;
      if (held === 0) continue;
      // The run of highest cards in play held by one of us.
      let k = 0;
      let rest = inPlay;
      while (rest !== 0 && (held & topBit(rest)) !== 0) {
        k++;
        rest ^= topBit(rest);
      }
      if (suitGame && s !== trump) {
        const l = popcount(h[lho + s] as number);
        if (l < k && lhoTrumps !== 0) k = l;
        const r = popcount(h[rho + s] as number);
        if (r < k && rhoTrumps !== 0) k = r;
      }
      if (k === 0) continue;
      if (held === mine) {
        if (!partnerOnlyTrumps || s === trump) {
          q += k;
          rel[s] = kthTop(inPlay, k);
        }
      } else if (mine !== 0) {
        // In a suit contract we follow every round, so we are never forced to ruff partner.
        if (suitGame && popcount(mine) < k) k = popcount(mine);
        via[s] = k;
        // Partner needs a spare card (not this suit, not a trump) for each of our winners.
        via[4 + s] = partnerLen - popcount(theirs) - (s === trump ? 0 : partnerTrumps);
      }
    }
    let bestSuit = -1;
    for (let s = 0; s < 4; s++) {
      const k = via[s] as number;
      if (k > 0 && (via[4 + s] as number) >= q && (bestSuit < 0 || k > (via[bestSuit] as number))) {
        bestSuit = s;
      }
    }
    if (bestSuit < 0) return q;
    const k = via[bestSuit] as number;
    rel[bestSuit] = kthTop(this.suitInPlay(bestSuit), k);
    return q + k;
  }

  /**
   * In a suit contract, the run of top trumps held by a single player wins that many tricks
   * whatever happens. Returns the run (positive for NS, negative for EW), or 0.
   */
  private topTrumps(): number {
    const trump = this.trump;
    if (trump === NT) return 0;
    const h = this.hands;
    let all = this.suitInPlay(trump);
    if (all === 0) return 0;
    const first = topBit(all);
    let owner = 0;
    while (((h[owner * 4 + trump] as number) & first) === 0) owner++;
    const held = h[owner * 4 + trump] as number;
    let run = 0;
    while (all !== 0 && (held & topBit(all)) !== 0) {
      run++;
      all ^= topBit(all);
    }
    return (owner & 1) === 0 ? run : -run;
  }

  /** Relative form of a lead at the start of a trick: suit << 4 | cards in play above it. */
  private relativeCard(card: number): number {
    const s = card >> 4;
    return (s << 4) | popcount(this.suitInPlay(s) & ~((2 << (card & 15)) - 1));
  }

  /** Inverse of `relativeCard` for the seat on lead, or -1 if that seat does not hold it. */
  private absoluteCard(rel: number, seat: number): number {
    const s = rel >> 4;
    const bit = kthTop(this.suitInPlay(s), (rel & 15) + 1);
    if (bit === 0 || ((this.hands[seat * 4 + s] as number) & bit) === 0) return -1;
    return (s << 4) | (31 - Math.clz32(bit));
  }

  /** Ordering score for leading `card` (higher is tried first). */
  private scoreLead(seat: number, card: number): number {
    const h = this.hands;
    const trump = this.trump;
    const suit = card >> 4;
    const rank = card & 15;
    const partner = ((seat + 2) & 3) * 4 + suit;
    const lho = ((seat + 1) & 3) * 4;
    const rho = ((seat + 3) & 3) * 4;
    const first = topBit(this.suitInPlay(suit));
    let score = 0;
    if (trump !== NT && suit !== trump) {
      // Opponents ruff it / partner ruffs it.
      if (
        ((h[lho + suit] as number) === 0 && (h[lho + trump] as number) !== 0) ||
        ((h[rho + suit] as number) === 0 && (h[rho + trump] as number) !== 0)
      ) {
        score -= 30;
      }
      if ((h[partner] as number) === 0 && (h[partner - suit + trump] as number) !== 0) score += 25;
    }
    if (1 << rank === first) {
      score += 40; // cash a winner
    } else if (((h[partner] as number) & first) !== 0) {
      score += 30 - rank; // low to partner's winner
    } else {
      score += 3 * popcount(h[seat * 4 + suit] as number) - rank; // low from length
    }
    return score;
  }

  /** Ordering score for playing `card` to a trick already led (higher is tried first). */
  private scoreFollow(
    seat: number,
    pos: number,
    led: number,
    winSeat: number,
    winCard: number,
    card: number,
  ): number {
    const suit = card >> 4;
    const rank = card & 15;
    const partnerWins = ((winSeat ^ seat) & 1) === 0;
    const wins = this.beats(card, winCard);
    if (suit !== led) {
      if (wins) return partnerWins ? -60 - rank : 40 - rank; // ruff cheaply, don't overruff partner
      return suit === this.trump ? -40 - rank : -rank; // discard low, keep trumps
    }
    if (pos === 3) return wins && !partnerWins ? 60 - rank : -rank;
    if (pos === 2) {
      // Will the last player (our left-hand opponent) be able to beat the trick?
      const h = this.hands;
      const lho = ((seat + 1) & 3) * 4;
      const lhoSuit = h[lho + led] as number;
      const lhoTop = lhoSuit === 0 ? -1 : 31 - Math.clz32(lhoSuit);
      const lhoRuffs =
        lhoSuit === 0 && this.trump !== NT && led !== this.trump && h[lho + this.trump] !== 0;
      if (partnerWins && !lhoRuffs && (winCard >> 4 !== led || (winCard & 15) > lhoTop)) {
        return -rank;
      }
      if (wins) return !lhoRuffs && rank > lhoTop ? 60 - rank : 30 - rank;
      return -rank;
    }
    return -rank; // second hand low
  }

  /** Move the four cards of a finished trick into (`on` = 1) or out of (0) `gone`. */
  private retireTrick(tricksLeft: number, on: number): void {
    const gone = this.gone;
    const t = this.trickCards;
    for (let i = tricksLeft * 4; i < tricksLeft * 4 + 4; i++) {
      const c = t[i] as number;
      const s = c >> 4;
      const b = 1 << (c & 15);
      gone[s] = on ? (gone[s] as number) | b : (gone[s] as number) & ~b;
    }
  }

  /**
   * Null-window test: can NS take at least `target` of the `tricksLeft` tricks still to be
   * played (counting the trick in progress)? Sets `relEx` / `relFl` to the ranks the answer
   * depended on.
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
    const relEx = this.relEx;
    const relFl = this.relFl;
    if (target <= 0 || target > tricksLeft) {
      relEx.fill(0);
      relFl.fill(0);
      return target <= 0;
    }
    if (pos !== 0 || tricksLeft < 2 || this.plain) {
      return this.tryCards(seat, pos, led, winSeat, winCard, tricksLeft, target, -1);
    }

    // Start of a trick. Cheap bound first: top trumps win tricks for their side.
    const trump = this.trump;
    const run = this.topTrumps();
    if ((run > 0 && run >= target) || (run < 0 && tricksLeft + run < target)) {
      relEx.fill(0);
      relFl.fill(0);
      relFl[trump] = kthTop(this.suitInPlay(trump), run > 0 ? run : -run);
      return run > 0;
    }

    // Sure tricks for the side on lead.
    const quick = this.quickTricks(seat);
    if ((seat & 1) === 0 ? quick >= target : tricksLeft - quick < target) {
      relEx.fill(0);
      relFl.set(this.quickFl);
      return (seat & 1) === 0;
    }

    // Short endings are cheaper to search again than to keep in the table.
    if (tricksLeft < MIN_TT_TRICKS) {
      return this.tryCards(seat, 0, -1, -1, -1, tricksLeft, target, -1);
    }

    // Then the transposition table.
    const h = this.hands;
    const tt = this.tt;
    const len0 = lengthsKey(h, 0);
    const len1 = lengthsKey(h, 2);
    const lt = seat | (trump << 2);
    const w0 = suitKey(h[0] as number, h[4] as number, h[8] as number, h[12] as number);
    const w1 = suitKey(h[1] as number, h[5] as number, h[9] as number, h[13] as number);
    const w2 = suitKey(h[2] as number, h[6] as number, h[10] as number, h[14] as number);
    const w3 = suitKey(h[3] as number, h[7] as number, h[11] as number, h[15] as number);
    const slot = tt.lookup(len0, len1, lt, w0, w1, w2, w3, target);
    if (slot >= 0) {
      for (let s = 0; s < 4; s++) {
        const inPlay = this.suitInPlay(s);
        const f = tt.floor(slot, s);
        relEx[s] = positionsToRanks(inPlay, tt.keptPositions(slot, s));
        relFl[s] = f > 0 ? kthTop(inPlay, f) : 0;
      }
      return tt.lower(slot) >= target;
    }
    const first = tt.hint >= 0 ? this.absoluteCard(tt.hint, seat) : -1;

    const ok = this.tryCards(seat, 0, -1, -1, -1, tricksLeft, target, first);
    const best = this.cut >= 0 ? this.relativeCard(this.cut) : -1;

    // Positions to keep per suit: the cards that mattered, every card above a floor, and the
    // top card (so the table can bucket on it).
    const p0 = this.keptPositions(0);
    let floors = this.lastFloor;
    const p1 = this.keptPositions(1);
    floors |= this.lastFloor << 4;
    const p2 = this.keptPositions(2);
    floors |= this.lastFloor << 8;
    const p3 = this.keptPositions(3);
    floors |= this.lastFloor << 12;
    const lo = ok ? target : 0;
    const hi = ok ? tricksLeft : target - 1;
    tt.store(len0, len1, lt, w0, w1, w2, w3, p0, p1, p2, p3, floors, tricksLeft, lo, hi, best);
    return ok;
  }

  /** Block size set by the last `keptPositions` call. */
  private lastFloor = 0;

  /** At a trick start: positions (2-bit form) of `suit` that the last result depended on. */
  private keptPositions(suit: number): number {
    const inPlay = this.suitInPlay(suit);
    this.lastFloor = 0;
    if (inPlay === 0) return 0;
    let ranks = ((this.relEx[suit] as number) & inPlay) | topBit(inPlay);
    const fl = (this.relFl[suit] as number) & inPlay;
    if (fl !== 0) {
      const block = inPlay & ~((fl & -fl) - 1);
      ranks |= block;
      this.lastFloor = popcount(block);
    }
    return ranksToPositions(inPlay, ranks);
  }

  /**
   * `reaches` without the table lookup: try the seat's cards, most promising first (`first`,
   * if not -1, before all others). Sets `cut` to the card that decided the result, or -1, and
   * `relEx` / `relFl` to the ranks the result depended on.
   */
  private tryCards(
    seat: number,
    pos: number,
    led: number,
    winSeat: number,
    winCard: number,
    tricksLeft: number,
    target: number,
    first: number,
  ): boolean {
    const hands = this.hands;
    const relEx = this.relEx;
    const relFl = this.relFl;
    const ns = (seat & 1) === 0;
    const base = seat * 4;
    let from = 0;
    let to = 3;
    if (pos > 0 && hands[base + led] !== 0) from = to = led;

    // Collect the candidate cards for this ply, sorted by score (insertion sort, ≤ 13 cards).
    const moves = this.moves;
    const scores = this.scores;
    const start = ((13 - tricksLeft) * 4 + pos) * 13;
    let end = start;
    for (let suit = from; suit <= to; suit++) {
      const held = hands[base + suit] as number;
      const alive = ALL_RANKS & ~(this.gone[suit] as number);
      let m = held;
      while (m !== 0) {
        const bit = m & -m;
        m ^= bit;
        // Skip a card when the next higher card in play is ours too: same value (SPEC §5.2).
        const above = alive & ~((bit << 1) - 1);
        if ((above & -above & held) !== 0) continue;
        const card = (suit << 4) | (31 - Math.clz32(bit));
        const score =
          card === first
            ? 1 << 20
            : pos === 0
              ? this.scoreLead(seat, card)
              : this.scoreFollow(seat, pos, led, winSeat, winCard, card);
        let j = end++;
        while (j > start && (scores[j - 1] as number) < score) {
          moves[j] = moves[j - 1] as number;
          scores[j] = scores[j - 1] as number;
          j--;
        }
        moves[j] = card;
        scores[j] = score;
      }
    }

    // Union of the children's relevant ranks, for when no card decides the result.
    let e0 = 0;
    let e1 = 0;
    let e2 = 0;
    let e3 = 0;
    let f0 = 0;
    let f1 = 0;
    let f2 = 0;
    let f3 = 0;
    for (let i = start; i < end; i++) {
      const card = moves[i] as number;
      const suit = card >> 4;
      const bit = 1 << (card & 15);
      const idx = base + suit;
      const held = hands[idx] as number;
      let ws = winSeat;
      let wc = winCard;
      if (pos === 0 || this.beats(card, wc)) {
        ws = seat;
        wc = card;
      }

      hands[idx] = held ^ bit;
      const t = tricksLeft * 4;
      this.trickCards[t + pos] = card;
      let ok: boolean;
      if (pos === 3) {
        this.retireTrick(tricksLeft, 1);
        ok = this.reaches(ws, 0, -1, -1, -1, tricksLeft - 1, (ws & 1) === 0 ? target - 1 : target);
        this.retireTrick(tricksLeft, 0);
        this.markTrickWinner(t, wc);
      } else {
        ok = this.reaches(
          (seat + 1) & 3,
          pos + 1,
          pos === 0 ? suit : led,
          ws,
          wc,
          tricksLeft,
          target,
        );
      }
      hands[idx] = held;

      // NS need one card that works; EW need one card that stops them.
      if (ok === ns) {
        this.cut = card;
        return ok;
      }
      // This card stood for its lower equivalents too. If its own rank mattered, they must all
      // keep their ranks for the result to carry over to other positions.
      const fl = relFl[suit] as number;
      if (((relEx[suit] as number) & bit) !== 0 || (fl & ((bit << 1) - 1)) !== 0) {
        const alive = ALL_RANKS & ~(this.gone[suit] as number);
        let b = bit;
        let cls = 0;
        for (;;) {
          const below = alive & (b - 1);
          if (below === 0) break;
          const next = topBit(below);
          if ((held & next) === 0) break;
          b = next;
          cls |= b;
        }
        relEx[suit] = (relEx[suit] as number) | cls;
      }
      e0 |= relEx[0] as number;
      e1 |= relEx[1] as number;
      e2 |= relEx[2] as number;
      e3 |= relEx[3] as number;
      f0 |= relFl[0] as number;
      f1 |= relFl[1] as number;
      f2 |= relFl[2] as number;
      f3 |= relFl[3] as number;
    }
    relEx[0] = e0;
    relEx[1] = e1;
    relEx[2] = e2;
    relEx[3] = e3;
    relFl[0] = f0;
    relFl[1] = f1;
    relFl[2] = f2;
    relFl[3] = f3;
    this.cut = -1;
    return !ns;
  }

  /**
   * After a finished trick (cards at `trickCards[t..t+3]`, winner `wc`): if the winner beat
   * another card of its suit, its rank mattered. When it was the highest card of its suit
   * still in play, "it is the top card" is all that mattered (a floor); otherwise the order of
   * the cards of that suit in the trick did.
   */
  private markTrickWinner(t: number, wc: number): void {
    const suit = wc >> 4;
    const tc = this.trickCards;
    let same = 0;
    for (let j = t; j < t + 4; j++) {
      const c = tc[j] as number;
      if (c >> 4 === suit) same |= 1 << (c & 15);
    }
    const wbit = 1 << (wc & 15);
    if (same === wbit) return; // the only card of its suit: won without comparing ranks
    // Either "nothing above the winner is held by another player" (a floor at the winner) or
    // "the cards of this suit in the trick keep their order" — whichever keeps fewer cards.
    const alive = ALL_RANKS & ~(this.gone[suit] as number);
    const above = popcount(alive & ~((wbit << 1) - 1));
    if (above <= popcount(same) - 1) this.relFl[suit] = (this.relFl[suit] as number) | wbit;
    else this.relEx[suit] = (this.relEx[suit] as number) | same;
  }
}
