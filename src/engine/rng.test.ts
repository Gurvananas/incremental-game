import { describe, expect, it } from 'vitest';
import { nextRandom } from './rng';

function sequence(seed: number, count: number): number[] {
  const values: number[] = [];
  let state = seed;
  for (let i = 0; i < count; i++) {
    const [value, next] = nextRandom(state);
    values.push(value);
    state = next;
  }
  return values;
}

describe('nextRandom', () => {
  it('is reproducible from its seed', () => {
    expect(sequence(42, 20)).toEqual(sequence(42, 20));
  });

  it('gives different sequences for different seeds', () => {
    expect(sequence(1, 5)).not.toEqual(sequence(2, 5));
  });

  it('stays in [0, 1) with a mean close to 0.5', () => {
    const values = sequence(7, 10_000);
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    expect(mean).toBeGreaterThan(0.48);
    expect(mean).toBeLessThan(0.52);
  });
});
