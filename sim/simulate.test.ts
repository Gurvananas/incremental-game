import { describe, expect, it } from 'vitest';
import { runSimulation } from './simulate';

const report = runSimulation({ seed: 1, seconds: 25 * 60 });

describe('runSimulation', () => {
  it('is deterministic for a given seed', () => {
    expect(runSimulation({ seed: 5, seconds: 300 })).toEqual(
      runSimulation({ seed: 5, seconds: 300 }),
    );
  });

  it('keeps every invariant', () => {
    expect(report.violations).toEqual([]);
  });

  it('samples the start of each season', () => {
    expect(report.samples.slice(0, 5).map((s) => s.date.season)).toEqual([
      'spring',
      'summer',
      'autumn',
      'winter',
      'spring',
    ]);
  });
});

/** Pacing targets from docs/design.md ("Règles de rythme", Era I in about 15 minutes). */
describe('pacing (simulated active player)', () => {
  it('makes the first purchase within 10 seconds', () => {
    expect(report.milestones.firstPlant).toBeLessThan(10);
  });

  it('reaches Flowering, and Era II, in 12 to 18 minutes', () => {
    const flowering = report.milestones.discoveries.flowering;
    expect(flowering).toBeGreaterThanOrEqual(12 * 60);
    expect(flowering).toBeLessThanOrEqual(18 * 60);
    expect(report.milestones.eras[2]).toBe(flowering);
  });

  it('makes the first discovery within 5 minutes', () => {
    expect(report.milestones.discoveries.symbiosis).toBeLessThanOrEqual(5 * 60);
  });
});
