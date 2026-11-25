import { describe, expect, it } from 'vitest';
import { BASE_RAIN_PER_SECOND, SEASON_RAIN_MULTIPLIER } from '../data/climate';
import { RESOURCES } from '../data/resources';
import { DAYS_PER_SEASON, SECONDS_PER_DAY } from '../data/time';
import { createInitialState, type GameState } from './state';
import { advance, step, STEP_SECONDS } from './tick';

function withWater(water: number, days = 0): GameState {
  const state = createInitialState(1);
  return { ...state, days, resources: { ...state.resources, water } };
}

function deepFreeze<T extends object>(value: T): T {
  for (const child of Object.values(value)) {
    if (typeof child === 'object' && child !== null) {
      deepFreeze(child as object);
    }
  }
  return Object.freeze(value);
}

describe('step', () => {
  it('adds spring rain to water', () => {
    const next = step(withWater(0), 1);
    expect(next.resources.water).toBeCloseTo(BASE_RAIN_PER_SECOND * SEASON_RAIN_MULTIPLIER.spring);
  });

  it('uses the summer multiplier in summer', () => {
    const next = step(withWater(0, DAYS_PER_SEASON), 1);
    expect(next.resources.water).toBeCloseTo(BASE_RAIN_PER_SECOND * SEASON_RAIN_MULTIPLIER.summer);
  });

  it('never goes above the cap', () => {
    const next = step(withWater(RESOURCES.water.baseCap - 0.1), 1000);
    expect(next.resources.water).toBe(RESOURCES.water.baseCap);
  });

  it('advances the calendar by dt / seconds per day', () => {
    expect(step(createInitialState(1), SECONDS_PER_DAY).days).toBe(1);
  });

  it('does not mutate its input', () => {
    const state = deepFreeze(createInitialState(1));
    expect(() => step(state, 1)).not.toThrow();
    expect(state.days).toBe(0);
  });
});

describe('advance', () => {
  it('gives the same result as repeated fixed steps', () => {
    const start = withWater(0);
    let stepped = start;
    for (let i = 0; i < 5; i++) {
      stepped = step(stepped, STEP_SECONDS);
    }
    expect(advance(start, 5 * STEP_SECONDS)).toEqual(stepped);
  });

  it('applies the remainder as one shorter step', () => {
    expect(advance(createInitialState(1), 0.5).days).toBeCloseTo(0.5 / SECONDS_PER_DAY);
  });

  it('returns the same state for zero or negative time', () => {
    const state = createInitialState(1);
    expect(advance(state, 0)).toBe(state);
    expect(advance(state, -3)).toBe(state);
  });
});
