import { describe, expect, it } from 'vitest';
import { CALL_COST, CALL_INDIVIDUALS } from '../data/actions';
import { DISCOVERIES } from '../data/discoveries';
import {
  BALANCE_BONUS_PER_POINT,
  MAX_PREDATION_PER_DAY,
  STARVATION_PER_DAY,
} from '../data/ecology';
import { PLANTS } from '../data/plants';
import { RESOURCES } from '../data/resources';
import { SPECIES } from '../data/species';
import { DAYS_PER_SEASON, SECONDS_PER_DAY } from '../data/time';
import { assignNiches, callSpecies, discover } from './actions';
import { freeNiches, getCapacity, getNiches } from './habitat';
import { getBalance, getCaps, getProduction } from './production';
import { makeState } from './testing';
import { advance } from './tick';

const WINTER = 3 * DAYS_PER_SEASON;

describe('niches', () => {
  it('come from adult plantations', () => {
    const state = makeState({ plants: { clover: 3, flowers: 2 } });
    expect(getNiches(state).soil).toBe(3);
    expect(getNiches(state).flower).toBe(4);
  });

  it('can be assigned to an unlocked species, up to what is free', () => {
    const state = makeState({ plants: { clover: 3 }, discoveries: ['symbiosis'] });
    const assigned = assignNiches(state, 'earthworm', 5);
    expect(assigned.assignments.earthworm).toBe(3);
    expect(freeNiches(assigned, 'soil')).toBe(0);
    expect(assignNiches(assigned, 'earthworm', -1).assignments.earthworm).toBe(2);
  });

  it('cannot be given to a locked species', () => {
    const state = makeState({ plants: { clover: 3 } });
    expect(assignNiches(state, 'earthworm', 1)).toBe(state);
  });

  it('shrink every species in proportion when plantations are gone', () => {
    const state = makeState({ plants: { clover: 2 }, assignments: { earthworm: 2, ant: 2 } });
    expect(getCapacity(state, 'earthworm')).toBe(1);
  });
});

describe('populations', () => {
  // 40 grass drop enough litter in spring to feed 10 worms.
  const worms = makeState({
    plants: { clover: 10, grass: 40 },
    assignments: { earthworm: 10 },
    resources: { litter: 100 },
    discoveries: ['symbiosis'],
  });

  it('settle into their niches when fed, and never overshoot them', () => {
    const later = advance(worms, 90 * SECONDS_PER_DAY, SECONDS_PER_DAY);
    expect(later.animals.earthworm).toBeGreaterThan(9);
    expect(later.animals.earthworm).toBeLessThanOrEqual(10);
  });

  it('decline when their food runs out', () => {
    const hungry = { ...worms, animals: { ...worms.animals, earthworm: 10 } };
    const starving = {
      ...hungry,
      plants: { ...hungry.plants, grass: 0 },
      resources: { ...hungry.resources, litter: 0 },
    };
    expect(getProduction(starving).fed.earthworm).toBe(0);
    const later = advance(starving, SECONDS_PER_DAY, SECONDS_PER_DAY);
    expect(later.animals.earthworm).toBeCloseTo(10 * (1 - STARVATION_PER_DAY));
  });

  it('leave gradually when their niches are taken back', () => {
    const crowded = { ...worms, animals: { ...worms.animals, earthworm: 10 } };
    const fewer = assignNiches(crowded, 'earthworm', -5);
    const later = advance(fewer, 50 * SECONDS_PER_DAY, SECONDS_PER_DAY);
    expect(later.animals.earthworm).toBeLessThan(10);
    expect(later.animals.earthworm).toBeGreaterThan(5);
  });

  it('eat food and give back what they make', () => {
    const fed = { ...worms, animals: { ...worms.animals, earthworm: 4 } };
    const { lines } = getProduction(fed);
    const eaten = lines.litter.find((line) => line.source === 'earthworm')?.amount ?? 0;
    const diet = SPECIES.earthworm.diet[0];
    expect(eaten).toBeCloseTo(-(4 * (diet?.perDay ?? 0)) / SECONDS_PER_DAY);
    const made = lines.humus.find((line) => line.source === 'earthworm')?.amount ?? 0;
    expect(made).toBeCloseTo(4 * (SPECIES.earthworm.produces.humus ?? 0));
  });

  it('add their storage to the caps', () => {
    const fed = { ...worms, animals: { ...worms.animals, earthworm: 4 } };
    expect(getCaps(fed).humus).toBeCloseTo(
      RESOURCES.humus.baseCap +
        10 * (PLANTS.clover.storage.humus ?? 0) +
        4 * (SPECIES.earthworm.storage.humus ?? 0),
    );
  });

  it('sleep through winter when they hibernate', () => {
    const bees = makeState({
      plants: { flowers: 5 },
      assignments: { bee: 10 },
      animals: { bee: 4 },
      days: WINTER,
    });
    const production = getProduction(bees);
    expect(production.asleep.bee).toBe(true);
    expect(production.modifiers.seedBonus).toBe(1);
    expect(advance(bees, 10 * SECONDS_PER_DAY, SECONDS_PER_DAY).animals.bee).toBe(4);
  });

  it('fall back on their second food', () => {
    // Hazel offers thickets but no insects, so tits turn to berries.
    const tits = makeState({
      plants: { hazel: 3 },
      assignments: { tit: 5 },
      animals: { tit: 5 },
      resources: { insects: 0, berries: 50 },
    });
    const production = getProduction(tits);
    expect(production.fed.tit).toBe(1);
    expect(production.lines.berries.some((line) => line.source === 'tit')).toBe(true);
  });
});

describe('predation', () => {
  const field = makeState({
    plants: { grass: 40, bank: 2 },
    assignments: { rabbit: 40, fox: 4 },
    animals: { rabbit: 30, fox: 4 },
    resources: { sap: 50 },
  });

  it('makes foxes eat rabbits', () => {
    const { eaten, fed } = getProduction(field);
    const ration = SPECIES.fox.diet[0]?.perDay ?? 0;
    expect(eaten.rabbit).toBeCloseTo(4 * ration);
    expect(fed.fox).toBe(1);
  });

  it('never takes more than a share of the prey each day', () => {
    const few = { ...field, animals: { ...field.animals, rabbit: 1 } };
    expect(getProduction(few).eaten.rabbit).toBeCloseTo(MAX_PREDATION_PER_DAY);
  });
});

describe('Balance', () => {
  it('is 1 for a single species and grows with diversity', () => {
    expect(getBalance(makeState({ plants: { grass: 10 } }))).toBeCloseTo(1);
    const two = getBalance(makeState({ plants: { grass: 10, clover: 10 } }));
    expect(two).toBeCloseTo(2);
  });

  it('gives animals half of the weight', () => {
    const state = makeState({ plants: { grass: 10 }, animals: { earthworm: 5 } });
    expect(getBalance(state)).toBeCloseTo(2);
  });

  it('only multiplies production once Food chain is discovered', () => {
    const state = makeState({ plants: { grass: 10, clover: 10 } });
    expect(getProduction(state).modifiers.balanceMultiplier).toBe(1);
    const revealed = { ...state, discoveries: ['foodChain'] as const };
    expect(getProduction(revealed).modifiers.balanceMultiplier).toBeCloseTo(
      1 + BALANCE_BONUS_PER_POINT * (2 - 1),
    );
  });
});

describe('pressures', () => {
  it('pests cut sap once insects fill more than half of their storage', () => {
    const calm = makeState({ plants: { grass: 4 }, resources: { insects: 40 } });
    expect(getProduction(calm).modifiers.pests).toBe(1);
    const swarm = makeState({ plants: { grass: 4 }, resources: { insects: 100 } });
    expect(getProduction(swarm).modifiers.pests).toBeLessThan(1);
  });

  it('too many grazers slow seedlings, and brambles protect them', () => {
    const grazed = makeState({ plants: { grass: 10 }, animals: { rabbit: 10 } });
    expect(getProduction(grazed).modifiers.grazing).toBeLessThan(1);
    const shielded = makeState({ plants: { grass: 10, brambles: 20 }, animals: { rabbit: 10 } });
    expect(getProduction(shielded).modifiers.grazing).toBe(1);
  });

  it('berries rot a little every day', () => {
    const state = makeState({ resources: { berries: 50 } });
    const line = getProduction(state).lines.berries.find((l) => l.source === 'decay');
    expect(line?.amount).toBeCloseTo((-50 * RESOURCES.berries.decayPerDay) / SECONDS_PER_DAY);
  });
});

describe('calls and gifts', () => {
  it('a Call brings a few individuals for some Songs', () => {
    const state = makeState({
      plants: { brambles: 10 },
      assignments: { tit: 10 },
      resources: { songs: 50 },
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
    const called = callSpecies(state, 'tit');
    expect(called.animals.tit).toBe(CALL_INDIVIDUALS);
    expect(called.resources.songs).toBe(50 - CALL_COST.songs);
  });

  it('Flowering gives the first seeds', () => {
    const state = makeState({ resources: { spores: 100 }, discoveries: ['symbiosis', 'rooting'] });
    expect(discover(state, 'flowering').resources.seeds).toBe(DISCOVERIES.flowering.grants.seeds);
  });
});
