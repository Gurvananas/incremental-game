import { describe, expect, it } from 'vitest';
import { OFFLINE_MAX_SECONDS, SECONDS_PER_DAY } from '../data/time';
import { simulateOffline } from './offline';
import { createInitialState } from './state';

describe('simulateOffline', () => {
  it('simulates the time spent away', () => {
    const result = simulateOffline(createInitialState(1), 3600);
    expect(result.simulatedSeconds).toBe(3600);
    expect(result.state.days).toBeCloseTo(3600 / SECONDS_PER_DAY);
  });

  it('caps the simulated time at 48 hours', () => {
    const result = simulateOffline(createInitialState(1), 10 * OFFLINE_MAX_SECONDS);
    expect(result.simulatedSeconds).toBe(OFFLINE_MAX_SECONDS);
    expect(result.state.days).toBeCloseTo(OFFLINE_MAX_SECONDS / SECONDS_PER_DAY);
  });

  it('ignores negative time (a clock moved backwards)', () => {
    const state = createInitialState(1);
    expect(simulateOffline(state, -500)).toEqual({ state, simulatedSeconds: 0 });
  });
});
