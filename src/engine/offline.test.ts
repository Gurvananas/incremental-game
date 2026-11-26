import { describe, expect, it } from 'vitest';
import { RESOURCE_IDS } from '../data/resources';
import { SPECIES_IDS } from '../data/species';
import { OFFLINE_MAX_SECONDS, SECONDS_PER_DAY } from '../data/time';
import { simulateOffline } from './offline';
import { getCaps } from './production';
import { createInitialState } from './state';
import { makeState } from './testing';
import { advance } from './tick';

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

describe('coarse offline steps', () => {
  it('stay close to real-time play', () => {
    const state = makeState({
      plants: { grass: 30, moss: 20, lichen: 20, clover: 20, flowers: 20, brambles: 10, hazel: 8 },
      assignments: { earthworm: 10, ant: 10, bee: 20, butterfly: 20, tit: 18, hedgehog: 10 },
      animals: { earthworm: 5, ant: 5, bee: 10, butterfly: 10, tit: 9, hedgehog: 5 },
      resources: { water: 500, litter: 50, nectar: 100, insects: 50, berries: 50 },
      discoveries: [
        'symbiosis',
        'rooting',
        'flowering',
        'pollination',
        'dispersal',
        'fruiting',
        'foodChain',
      ],
    });
    const realTime = advance(state, 3600);
    const offline = simulateOffline(state, 3600).state;
    // Coarse steps are an approximation: hungry populations and fast flows such as
    // rotting berries drift the most, so the margin also scales with storage.
    const close = (actual: number, expected: number, cap = 0): boolean =>
      Math.abs(actual - expected) <= Math.max(1, 0.25 * Math.abs(expected), 0.05 * cap);
    const caps = getCaps(realTime);
    for (const id of RESOURCE_IDS) {
      expect(close(offline.resources[id], realTime.resources[id], caps[id]), id).toBe(true);
    }
    for (const id of SPECIES_IDS) {
      expect(close(offline.animals[id], realTime.animals[id]), id).toBe(true);
    }
  });
});
