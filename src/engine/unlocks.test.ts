import { describe, expect, it } from 'vitest';
import { getEra, isPlantUnlocked, isResourceVisible } from './unlocks';
import { makeState } from './testing';

describe('unlocks', () => {
  it('reveals plants as the forest grows', () => {
    expect(isPlantUnlocked(makeState(), 'grass')).toBe(true);
    expect(isPlantUnlocked(makeState(), 'moss')).toBe(false);
    expect(isPlantUnlocked(makeState({ plants: { grass: 1 } }), 'moss')).toBe(true);
  });

  it('counts seedlings toward requirements', () => {
    const state = { ...makeState(), seedlings: [{ plant: 'grass' as const, daysLeft: 3 }] };
    expect(isPlantUnlocked(state, 'moss')).toBe(true);
  });

  it('opens clover with Symbiosis', () => {
    expect(isPlantUnlocked({ ...makeState(), discoveries: ['symbiosis'] }, 'clover')).toBe(true);
  });

  it('shows a resource once something produces it', () => {
    expect(isResourceVisible(makeState(), 'spores')).toBe(false);
    expect(isResourceVisible(makeState({ plants: { lichen: 1 } }), 'spores')).toBe(true);
  });

  it('moves to Era II with Flowering', () => {
    expect(getEra(makeState())).toBe(1);
    expect(getEra({ ...makeState(), discoveries: ['symbiosis', 'rooting', 'flowering'] })).toBe(2);
  });
});
