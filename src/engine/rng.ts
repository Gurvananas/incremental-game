/**
 * Seeded pseudo-random generator (mulberry32). The engine never calls
 * Math.random: the RNG state lives in GameState.rng, so a run is fully
 * reproducible from its seed, which makes weather and events testable.
 */

/** Returns a float in [0, 1) and the next RNG state. */
export function nextRandom(rngState: number): [value: number, nextState: number] {
  const nextState = (rngState + 0x6d2b79f5) >>> 0;
  let t = nextState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, nextState];
}
