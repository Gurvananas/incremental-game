import { describe, expect, it } from 'vitest';
import { runSimulation } from './simulate';

describe('runSimulation', () => {
  it('is deterministic for a given seed', () => {
    expect(runSimulation({ seed: 5, days: 200 })).toEqual(runSimulation({ seed: 5, days: 200 }));
  });

  it('keeps every invariant over two years', () => {
    expect(runSimulation({ seed: 1, days: 800 }).violations).toEqual([]);
  });

  it('samples the start of each season', () => {
    const { samples } = runSimulation({ seed: 1, days: 400 });
    expect(samples.map((s) => s.date.season)).toEqual([
      'spring',
      'summer',
      'autumn',
      'winter',
      'spring',
    ]);
  });
});
