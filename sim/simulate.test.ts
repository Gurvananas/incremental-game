import { describe, expect, it } from 'vitest';
import { runSimulation } from './simulate';

/** One long run shared by the pacing checks: a first game, played for 8 hours. */
const report = runSimulation({ seed: 1, seconds: 480 * 60 });
const { milestones } = report;
const minutes = (value: number | undefined): number => (value ?? Number.POSITIVE_INFINITY) / 60;

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

/** Pacing targets from docs/design.md ("Règles de rythme" and the era table). */
describe('pacing (simulated active player)', () => {
  it('makes the first purchase within 10 seconds', () => {
    expect(milestones.firstPlant).toBeLessThan(10);
  });

  it('makes the first discovery within 5 minutes', () => {
    expect(minutes(milestones.discoveries.symbiosis)).toBeLessThanOrEqual(5);
  });

  it('opens Era II at about 15 minutes', () => {
    expect(minutes(milestones.eras[2])).toBeGreaterThanOrEqual(12);
    expect(minutes(milestones.eras[2])).toBeLessThanOrEqual(18);
  });

  it('opens Era III at about one hour', () => {
    expect(minutes(milestones.eras[3])).toBeGreaterThanOrEqual(50);
    expect(minutes(milestones.eras[3])).toBeLessThanOrEqual(90);
  });

  it('opens Era IV at about three hours', () => {
    expect(minutes(milestones.eras[4])).toBeGreaterThanOrEqual(150);
    expect(minutes(milestones.eras[4])).toBeLessThanOrEqual(210);
  });

  it('reaches Canopy, the gate of Era V (end of v0.3 content), in 6 to 8 hours', () => {
    expect(minutes(milestones.eras[5])).toBeGreaterThanOrEqual(360);
    expect(minutes(milestones.eras[5])).toBeLessThanOrEqual(480);
  });

  it('never leaves the player more than 10 minutes without anything to buy', () => {
    expect(minutes(milestones.longestWait)).toBeLessThanOrEqual(10);
  });

  it('brings every species of Eras I to III, and the seed planters of Era IV', () => {
    const arrived = Object.keys(milestones.species);
    for (const id of [
      'ant',
      'bee',
      'butterfly',
      'earthworm',
      'fox',
      'hedgehog',
      'rabbit',
      'tit',
      'jay',
      'squirrel',
    ]) {
      expect(arrived, id).toContain(id);
    }
  });
});
