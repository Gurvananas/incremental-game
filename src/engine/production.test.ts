import { describe, expect, it } from 'vitest';
import {
  BASE_RAIN_PER_SECOND,
  SEASON_PRODUCTION_MULTIPLIER,
  SEASON_RAIN_MULTIPLIER,
} from '../data/climate';
import { PLANTS } from '../data/plants';
import { RESOURCES } from '../data/resources';
import { DAYS_PER_SEASON } from '../data/time';
import { getCaps, getProduction, getRates } from './production';
import { makeState } from './testing';

const springSap = SEASON_PRODUCTION_MULTIPLIER.sap?.spring ?? 1;

describe('getRates', () => {
  it('starts with rain only', () => {
    const rates = getRates(makeState());
    expect(rates.water).toBeCloseTo(BASE_RAIN_PER_SECOND * SEASON_RAIN_MULTIPLIER.spring);
    expect(rates.sap).toBe(0);
  });

  it('makes adult grass produce sap, scaled by the season', () => {
    const rates = getRates(makeState({ plants: { grass: 4 } }));
    expect(rates.sap).toBeCloseTo(4 * (PLANTS.grass.produces.sap ?? 0) * springSap);
  });

  it('uses the winter multiplier in winter', () => {
    const winter = getRates(makeState({ plants: { grass: 4 }, days: 3 * DAYS_PER_SEASON }));
    expect(winter.sap).toBeCloseTo(
      4 * (PLANTS.grass.produces.sap ?? 0) * (SEASON_PRODUCTION_MULTIPLIER.sap?.winter ?? 1),
    );
  });

  it('subtracts what plants drink from the water rate', () => {
    const rates = getRates(makeState({ plants: { grass: 4 } }));
    const rain = BASE_RAIN_PER_SECOND * SEASON_RAIN_MULTIPLIER.spring;
    expect(rates.water).toBeCloseTo(rain - 4 * PLANTS.grass.drinks);
  });

  it('adds the clover nitrogen bonus to sap', () => {
    const rates = getRates(makeState({ plants: { grass: 4, clover: 2 } }));
    const bonus = 1 + 2 * PLANTS.clover.sapBonus;
    expect(rates.sap).toBeCloseTo(4 * (PLANTS.grass.produces.sap ?? 0) * springSap * bonus);
  });
});

describe('water shortage', () => {
  // 40 grass drink 2/s against 0.3/s of summer rain.
  const dry = makeState({ plants: { grass: 40 }, resources: { water: 0 }, days: DAYS_PER_SEASON });

  it('only gives thirsty plants the share of water that comes in', () => {
    const { modifiers } = getProduction(dry);
    const rain = BASE_RAIN_PER_SECOND * SEASON_RAIN_MULTIPLIER.summer;
    expect(modifiers.waterSupply).toBeCloseTo(rain / (40 * PLANTS.grass.drinks));
  });

  it('slows their production and keeps water at zero', () => {
    const { modifiers, rates } = getProduction(dry);
    const fullSap =
      40 * (PLANTS.grass.produces.sap ?? 0) * (SEASON_PRODUCTION_MULTIPLIER.sap?.summer ?? 1);
    expect(rates.sap).toBeCloseTo(fullSap * modifiers.waterSupply);
    expect(rates.water).toBeCloseTo(0);
  });

  it('does not apply while water is in stock', () => {
    const wet = { ...dry, resources: { ...dry.resources, water: 10 } };
    expect(getProduction(wet).modifiers.waterSupply).toBe(1);
  });
});

describe('getCaps', () => {
  it('adds the storage of adult plants', () => {
    const caps = getCaps(makeState({ plants: { moss: 3 } }));
    expect(caps.water).toBe(RESOURCES.water.baseCap + 3 * (PLANTS.moss.storage.water ?? 0));
  });

  it('applies discovery multipliers', () => {
    const state = { ...makeState(), discoveries: ['symbiosis', 'rooting'] as const };
    expect(getCaps(state).sap).toBe(RESOURCES.sap.baseCap * 2);
  });
});
