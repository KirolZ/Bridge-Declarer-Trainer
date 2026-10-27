// Transposition table for positions at the start of a trick (SPEC §5.2), with partial-rank
// matching (a simple form of partition search).
//
// A search below a trick start also reports which cards' ranks its answer depended on (see
// `DDSearch`). The entry keeps, per suit, only the owners of the cards at those positions in
// the suit's order (position 0 = highest card in play), plus how many cards of each suit every
// hand holds. Any position with the same leader, trump and suit lengths per hand, and the same
// owners at the kept positions, has the same result. Ranks are relative (order among the cards
// still in play), so an entry is valid for every deal, not only the one being solved.
//
// Value: lower and upper bounds on the tricks NS take from that position to the end, plus the
// lead that last caused a cutoff (suit << 4 | number of cards in play above it in that suit).

const WAYS = 32;

/** Owner bits of a suit word (see `suitKey`). */
const OWNERS = 0x3ffffff;

export class TransTable {
  /** Lookups / lookups that settled the question (for benchmarks). */
  probes = 0;
  hits = 0;
  /** Best lead from the last `lookup` (relative form), or -1. */
  hint = -1;

  private readonly bucketMask: number;
  /** Suit lengths of N and E / of S and W, 4 bits per hand per suit. */
  private readonly len0: Int32Array;
  private readonly len1: Int32Array;
  /**
   * Leader (bits 0–1) and trump (bits 2–4), then per suit (4 bits each from bit 5) how many top
   * cards were kept as a block ("floor", see `DDSearch`); 0 = empty slot (a stored entry always
   * has cards, so leader + trump + floors is never all zero... see `store`).
   */
  private readonly meta: Int32Array;
  /** Per suit: kept positions (2 bits each, like the owners in a suit word). */
  private readonly m0: Int32Array;
  private readonly m1: Int32Array;
  private readonly m2: Int32Array;
  private readonly m3: Int32Array;
  /** Per suit: owners at the kept positions. */
  private readonly o0: Int32Array;
  private readonly o1: Int32Array;
  private readonly o2: Int32Array;
  private readonly o3: Int32Array;
  private readonly lo: Int8Array;
  private readonly hi: Int8Array;
  /** Tricks left at the entry: deeper entries are kept in preference to shallow ones. */
  private readonly depth: Int8Array;
  private readonly best: Int8Array;
  /** 1 = slot in use. */
  private readonly used: Int8Array;

  /** `2 ** bits` entries of 49 bytes (bits = 18 → 13 MB). */
  constructor(bits = 18) {
    const size = 1 << bits;
    this.bucketMask = size / WAYS - 1;
    this.len0 = new Int32Array(size);
    this.len1 = new Int32Array(size);
    this.meta = new Int32Array(size);
    this.m0 = new Int32Array(size);
    this.m1 = new Int32Array(size);
    this.m2 = new Int32Array(size);
    this.m3 = new Int32Array(size);
    this.o0 = new Int32Array(size);
    this.o1 = new Int32Array(size);
    this.o2 = new Int32Array(size);
    this.o3 = new Int32Array(size);
    this.lo = new Int8Array(size);
    this.hi = new Int8Array(size);
    this.depth = new Int8Array(size);
    this.best = new Int8Array(size);
    this.used = new Int8Array(size);
  }

  clear(): void {
    this.used.fill(0);
    this.probes = 0;
    this.hits = 0;
  }

  /**
   * Find an entry matching the position (suit words `w0`–`w3` from `suitKey`) whose bounds
   * settle "NS take ≥ target?". Returns its slot, or -1. Sets `hint` from any matching entry.
   */
  lookup(
    len0: number,
    len1: number,
    lt: number,
    w0: number,
    w1: number,
    w2: number,
    w3: number,
    target: number,
  ): number {
    this.probes++;
    this.hint = -1;
    const start = this.bucket(len0, len1, lt, w0, w1, w2, w3) * WAYS;
    for (let i = start; i < start + WAYS; i++) {
      if (this.used[i] === 0) break; // slots fill in order
      if (
        ((this.meta[i] as number) & 31) !== lt ||
        this.len0[i] !== len0 ||
        this.len1[i] !== len1 ||
        (w0 & (this.m0[i] as number)) !== this.o0[i] ||
        (w1 & (this.m1[i] as number)) !== this.o1[i] ||
        (w2 & (this.m2[i] as number)) !== this.o2[i] ||
        (w3 & (this.m3[i] as number)) !== this.o3[i]
      ) {
        continue;
      }
      if ((this.best[i] as number) >= 0) this.hint = this.best[i] as number;
      if ((this.lo[i] as number) >= target || (this.hi[i] as number) < target) {
        this.hits++;
        return i;
      }
    }
    return -1;
  }

  lower(slot: number): number {
    return this.lo[slot] as number;
  }

  /** Kept positions of `suit` in an entry (2-bit form). */
  keptPositions(slot: number, suit: number): number {
    const m = suit === 0 ? this.m0 : suit === 1 ? this.m1 : suit === 2 ? this.m2 : this.m3;
    return m[slot] as number;
  }

  /** How many top cards of `suit` an entry kept as a block. */
  floor(slot: number, suit: number): number {
    return ((this.meta[slot] as number) >>> (5 + 4 * suit)) & 15;
  }

  /**
   * Record that NS take between `lo` and `hi` tricks from every position matching on the kept
   * positions `p0`–`p3` (2-bit form), of which the top `floors` (4 bits per suit) form blocks:
   * narrows an identical entry, or replaces the shallowest one in the bucket. `best`
   * (-1 = none) is the cutoff lead.
   */
  store(
    len0: number,
    len1: number,
    lt: number,
    w0: number,
    w1: number,
    w2: number,
    w3: number,
    p0: number,
    p1: number,
    p2: number,
    p3: number,
    floors: number,
    depth: number,
    lo: number,
    hi: number,
    best: number,
  ): void {
    const meta = lt | (floors << 5);
    const t0 = w0 & p0;
    const t1 = w1 & p1;
    const t2 = w2 & p2;
    const t3 = w3 & p3;
    const start = this.bucket(len0, len1, lt, w0, w1, w2, w3) * WAYS;
    let victim = start;
    let i = start;
    for (; i < start + WAYS; i++) {
      if (this.used[i] === 0) break;
      if (
        this.meta[i] === meta &&
        this.len0[i] === len0 &&
        this.len1[i] === len1 &&
        this.m0[i] === p0 &&
        this.m1[i] === p1 &&
        this.m2[i] === p2 &&
        this.m3[i] === p3 &&
        this.o0[i] === t0 &&
        this.o1[i] === t1 &&
        this.o2[i] === t2 &&
        this.o3[i] === t3
      ) {
        if (lo > (this.lo[i] as number)) this.lo[i] = lo;
        if (hi < (this.hi[i] as number)) this.hi[i] = hi;
        if (best >= 0) this.best[i] = best;
        return;
      }
      if ((this.depth[i] as number) < (this.depth[victim] as number)) victim = i;
    }
    if (i < start + WAYS) victim = i; // a free slot
    this.used[victim] = 1;
    this.meta[victim] = meta;
    this.len0[victim] = len0;
    this.len1[victim] = len1;
    this.m0[victim] = p0;
    this.m1[victim] = p1;
    this.m2[victim] = p2;
    this.m3[victim] = p3;
    this.o0[victim] = t0;
    this.o1[victim] = t1;
    this.o2[victim] = t2;
    this.o3[victim] = t3;
    this.lo[victim] = lo;
    this.hi[victim] = hi;
    this.depth[victim] = depth;
    this.best[victim] = best;
  }

  /**
   * Bucket from the suit lengths, leader, trump and the owner of the top card of each suit
   * (every entry keeps the top card of each non-empty suit, so that is always known).
   */
  private bucket(
    len0: number,
    len1: number,
    lt: number,
    w0: number,
    w1: number,
    w2: number,
    w3: number,
  ): number {
    const tops = topOwner(w0) | (topOwner(w1) << 2) | (topOwner(w2) << 4) | (topOwner(w3) << 6);
    let h = Math.imul(len0 ^ (lt << 27), 0x9e3779b1);
    h = Math.imul(h ^ len1 ^ (h >>> 15), 0x85ebca77);
    h = Math.imul(h ^ tops ^ (h >>> 13), 0xc2b2ae3d);
    h ^= h >>> 16;
    return h & this.bucketMask;
  }
}

/** Owner of the highest card in a suit word (0 for an empty suit). */
function topOwner(w: number): number {
  const n = w >>> 26;
  return n === 0 ? 0 : ((w & OWNERS) >>> (2 * (n - 1))) & 3;
}

/**
 * TT key word for one suit: card count in bits 26–29, owners (seat 0–3) of the cards in play
 * from high to low in bits 0–25 (the card at position j uses bits 2(n−1−j) and 2(n−1−j)+1).
 */
export function suitKey(h0: number, h1: number, h2: number, h3: number): number {
  let all = h0 | h1 | h2 | h3;
  let w = 0;
  let n = 0;
  while (all !== 0) {
    const bit = 1 << (31 - Math.clz32(all));
    all ^= bit;
    w = (w << 2) | ((h1 & bit) !== 0 ? 1 : (h2 & bit) !== 0 ? 2 : (h3 & bit) !== 0 ? 3 : 0);
    n++;
  }
  return w | (n << 26);
}

/** Suit lengths of seats `seatA` and `seatA + 1`, 4 bits per hand per suit. */
export function lengthsKey(hands: Int32Array, seatA: number): number {
  let key = 0;
  for (let i = seatA * 4; i < seatA * 4 + 8; i++) key = (key << 4) | popcount13(hands[i] as number);
  return key;
}

function popcount13(x: number): number {
  x -= (x >>> 1) & 0x5555;
  x = (x & 0x3333) + ((x >>> 2) & 0x3333);
  x = (x + (x >>> 4)) & 0x0f0f;
  return (x + (x >>> 8)) & 0x1f;
}

/** Kept positions (2-bit form) for the cards `ranks` of a suit whose cards in play are `inPlay`. */
export function ranksToPositions(inPlay: number, ranks: number): number {
  let m = 0;
  let all = inPlay;
  while (all !== 0) {
    const bit = 1 << (31 - Math.clz32(all));
    all ^= bit;
    m = (m << 2) | ((ranks & bit) !== 0 ? 3 : 0);
  }
  return m;
}

/** Inverse of `ranksToPositions`: the cards of `inPlay` at the kept positions `m`. */
export function positionsToRanks(inPlay: number, m: number): number {
  let ranks = 0;
  let all = inPlay;
  let shift = 2 * (popcount13(inPlay) - 1);
  while (all !== 0) {
    const bit = 1 << (31 - Math.clz32(all));
    all ^= bit;
    if (((m >>> shift) & 3) !== 0) ranks |= bit;
    shift -= 2;
  }
  return ranks;
}
