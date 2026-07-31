/**
 * mulberry32 — a fast, seedable 32-bit PRNG.
 * Given the same seed, produces identical sequences every time.
 *
 * Original algorithm by Tommy Ettinger (public domain).
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    // Ensure positive 32-bit integer
    this.state = (seed >>> 0) || 0x6d2b79f5;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let z = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  }

  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns a random element from a non-empty array */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Returns a new shuffled copy of the array (Fisher-Yates) */
  shuffle<T>(arr: readonly T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Returns a small random tiebreaker value in [0, 0.0001) */
  tieBreaker(): number {
    return this.next() * 0.0001;
  }
}
