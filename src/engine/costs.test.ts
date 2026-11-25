import { describe, expect, it } from 'vitest';
import { PLANTS } from '../data/plants';
import { getAffordability, getPlantCost } from './costs';
import { makeState } from './testing';

describe('getPlantCost', () => {
  it('starts at the base cost', () => {
    expect(getPlantCost(makeState(), 'grass')).toEqual(PLANTS.grass.cost);
  });

  it('grows by 15% for each one owned, seedlings included', () => {
    const state = {
      ...makeState({ plants: { grass: 2 } }),
      seedlings: [{ plant: 'grass' as const, daysLeft: 5 }],
    };
    expect(getPlantCost(state, 'grass').sap).toBeCloseTo((PLANTS.grass.cost.sap ?? 0) * 1.15 ** 3);
  });
});

describe('getAffordability', () => {
  it('is immediate when every resource is there', () => {
    expect(getAffordability(makeState({ resources: { sap: 20 } }), { sap: 10 })).toEqual({
      kind: 'now',
    });
  });

  it('estimates the wait from the current rates', () => {
    // 4 grass in spring: 4 × 0.2 × 1.25 = 1 sap/s.
    const state = makeState({ plants: { grass: 4 }, resources: { sap: 5 } });
    const result = getAffordability(state, { sap: 15 });
    expect(result.kind).toBe('wait');
    expect(result.kind === 'wait' && result.seconds).toBeCloseTo(10);
  });

  it('says when nothing produces the missing resource', () => {
    expect(getAffordability(makeState(), { humus: 5 })).toEqual({ kind: 'stalled' });
  });

  it('says when the cost is more than storage can hold', () => {
    expect(getAffordability(makeState(), { sap: 1000 })).toEqual({
      kind: 'over-cap',
      resource: 'sap',
    });
  });
});
