import { describe, expect, it } from 'vitest';
import { MURMUR_SAP } from '../data/actions';
import { PLANTS } from '../data/plants';
import { RESOURCES } from '../data/resources';
import { discover, murmur, plant } from './actions';
import { makeState } from './testing';

describe('murmur', () => {
  it('adds sap', () => {
    expect(murmur(makeState()).resources.sap).toBe(MURMUR_SAP);
  });

  it('stops at the storage cap', () => {
    const full = makeState({ resources: { sap: RESOURCES.sap.baseCap } });
    expect(murmur(full)).toBe(full);
  });
});

describe('plant', () => {
  it('pays the cost and plants a seedling for slow plants', () => {
    const next = plant(makeState({ resources: { sap: 25 } }), 'grass');
    expect(next.resources.sap).toBeCloseTo(25 - (PLANTS.grass.cost.sap ?? 0));
    expect(next.plants.grass).toBe(0);
    expect(next.seedlings).toEqual([{ plant: 'grass', daysLeft: PLANTS.grass.growthDays }]);
  });

  it('adds an adult at once for plants with no growth time', () => {
    const next = plant(makeState({ resources: { sap: 50 }, plants: { grass: 1 } }), 'moss');
    expect(next.plants.moss).toBe(1);
    expect(next.seedlings).toEqual([]);
  });

  it('refuses when the cost is not met', () => {
    const poor = makeState({ resources: { sap: 5 } });
    expect(plant(poor, 'grass')).toBe(poor);
  });

  it('refuses a plant that is still locked', () => {
    const rich = makeState({ resources: { sap: 50, humus: 50 } });
    expect(plant(rich, 'clover')).toBe(rich);
  });
});

describe('discover', () => {
  it('pays in spores and records the discovery', () => {
    const next = discover(makeState({ resources: { spores: 15 } }), 'symbiosis');
    expect(next.discoveries).toEqual(['symbiosis']);
    expect(next.resources.spores).toBeCloseTo(5);
  });

  it('needs its prerequisites', () => {
    const state = makeState({ resources: { spores: 100 } });
    expect(discover(state, 'rooting')).toBe(state);
  });

  it('cannot be made twice', () => {
    const once = discover(makeState({ resources: { spores: 50 } }), 'symbiosis');
    expect(discover(once, 'symbiosis')).toBe(once);
  });
});
