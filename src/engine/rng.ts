// Random sources for dealing (SPEC §4.1). An Rng returns a float in [0, 1).

export type Rng = () => number;

/** Deterministic RNG for tests and reproducible deals (mulberry32). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// engine is type-checked without DOM types, so declare the bit of Web Crypto we use.
type CryptoLike = { getRandomValues<T extends Uint32Array>(array: T): T };

/** Cryptographically strong RNG (Web Crypto; available in browsers, workers and Node ≥ 19). */
export function cryptoRng(): Rng {
  const crypto = (globalThis as { crypto?: CryptoLike }).crypto;
  if (!crypto) throw new Error('Web Crypto is not available');
  const buf = new Uint32Array(64);
  let i = buf.length;
  return () => {
    if (i === buf.length) {
      crypto.getRandomValues(buf);
      i = 0;
    }
    return (buf[i++] as number) / 4294967296;
  };
}

/** Uniform integer in [0, n). */
export function randomInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}
