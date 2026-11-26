import { describe, expect, it } from 'vitest';
import { ADAPTATIONS } from '../data/adaptations';
import { CALL_COST } from '../data/actions';
import { LAND_SURFACE, SHADE_BASE, YOUNG_PRODUCTION } from '../data/forest';
import { PLANTS } from '../data/plants';
import { RESOURCES } from '../data/resources';
import { BEETLE_RISK_DAYS, DROUGHT_WATER_SHARE } from '../data/threats';
import { DAYS_PER_SEASON, DAYS_PER_YEAR } from '../data/time';
import { MAST_SEED_MULTIPLIER, WEATHER } from '../data/weather';
import { adapt, getCallCost } from './actions';
import { runDay } from './daily';
import { getCanopy } from './forest';
import { getNiches } from './habitat';
import { getCaps, getProduction } from './production';
import { createInitialState } from './state';
import { makeState } from './testing';

const SUMMER = DAYS_PER_SEASON;
const AUTUMN = 2 * DAYS_PER_SEASON;
const WINTER = 3 * DAYS_PER_SEASON;
const sapOf = (state: Parameters<typeof getProduction>[0]): number =>
  getProduction(state).rates.sap;

describe('weather', () => {
  it('moves to the forecast weather when the current one ends, and draws the next', () => {
    const state = {
      ...createInitialState(7),
      weather: { kind: 'clear', daysLeft: 1, next: 'rain', nextDays: 4 } as const,
    };
    const next = runDay(state, 1);
    expect(next.weather.kind).toBe('rain');
    expect(next.weather.daysLeft).toBe(4);
    expect(next.rng).not.toBe(state.rng);
  });

  it('announces notable weather the day before', () => {
    const state = {
      ...createInitialState(7),
      weather: { kind: 'clear', daysLeft: 2, next: 'storm', nextDays: 1 } as const,
    };
    const next = runDay(state, 1);
    expect(next.events.at(-1)).toMatchObject({ kind: 'forecast', weather: 'storm' });
  });

  it('is reproducible from the seed', () => {
    const a = runDay(createInitialState(3), 1);
    const b = runDay(createInitialState(3), 1);
    expect(a).toEqual(b);
  });

  it('rain doubles the water from the sky', () => {
    const dry = getProduction(makeState({ weather: 'clear' })).rates.water;
    const wet = getProduction(makeState({ weather: 'rain' })).rates.water;
    expect(wet).toBeCloseTo(dry * WEATHER.rain.rain);
  });

  it('late frost stops nectar, unless flowers bloom late', () => {
    const frost = makeState({ plants: { flowers: 5 }, weather: 'lateFrost' });
    expect(getProduction(frost).rates.nectar).toBe(0);
    const proof = { ...frost, adaptations: ['lateBlooming'] as const };
    expect(getProduction(proof).rates.nectar).toBeGreaterThan(0);
  });
});

describe('mast years', () => {
  it('triple the seeds', () => {
    const normal = makeState({ plants: { flowers: 5 } });
    const mast = { ...normal, mastYear: 1 };
    expect(getProduction(mast).rates.seeds).toBeCloseTo(
      getProduction(normal).rates.seeds * MAST_SEED_MULTIPLIER,
    );
  });

  it('are announced when the year begins, and the next one is drawn after', () => {
    const state = { ...createInitialState(1), mastYear: 2 };
    expect(runDay(state, DAYS_PER_YEAR).events.at(-1)).toMatchObject({ kind: 'mast', year: 2 });
    const after = runDay({ ...state, days: 2 * DAYS_PER_YEAR }, 2 * DAYS_PER_YEAR);
    expect(after.mastYear).toBeGreaterThan(3);
  });
});

describe('canopy and growth stages', () => {
  it('is the share of land under crowns', () => {
    const state = makeState({ plants: { birch: 10, pine: 10 } });
    expect(getCanopy(state)).toBeCloseTo(
      (10 * PLANTS.birch.crown + 10 * PLANTS.pine.crown) / LAND_SURFACE,
    );
  });

  it('shades sun plants and feeds shade plants', () => {
    const open = makeState({ plants: { grass: 10, moss: 10 } });
    const shaded = makeState({ plants: { grass: 10, moss: 10, pine: 20 } });
    const canopy = getCanopy(shaded);
    const grassSap = (state: typeof open): number =>
      getProduction(state).lines.sap.find((l) => l.source === 'grass')?.amount ?? 0;
    expect(grassSap(shaded)).toBeCloseTo(grassSap(open) * (1 - canopy));
    const mossWater = (state: typeof open): number =>
      getProduction(state).lines.water.find((l) => l.source === 'moss')?.amount ?? 0;
    expect(mossWater(shaded)).toBeCloseTo(mossWater(open) * ((SHADE_BASE + canopy) / SHADE_BASE));
  });

  it('young seedlings already produce half', () => {
    const half = PLANTS.grass.growthDays / 2;
    const young = { ...makeState(), seedlings: [{ plant: 'grass' as const, daysLeft: half }] };
    const adult = makeState({ plants: { grass: 1 } });
    expect(sapOf(young)).toBeCloseTo(sapOf(adult) * YOUNG_PRODUCTION);
  });

  it('old trees offer cavities and drop dead wood', () => {
    const state = makeState({ plants: { birch: 4 }, old: { birch: 2 } });
    expect(getNiches(state).cavity).toBe(2 * (PLANTS.birch.oldNiches.cavity ?? 0));
    const young = makeState({ plants: { birch: 4 } });
    expect(getProduction(state).rates.deadwood).toBeGreaterThan(
      getProduction(young).rates.deadwood,
    );
  });
});

describe('threats', () => {
  it('storms bring down old trees and leave dead wood', () => {
    const state = makeState({
      plants: { birch: 50 },
      old: { birch: 50 },
      days: AUTUMN,
      weather: 'storm',
    });
    const after = runDay(state, AUTUMN + 1);
    expect(after.plants.birch).toBeLessThan(50);
    expect(after.resources.deadwood).toBeGreaterThan(0);
    expect(after.events.some((e) => e.kind === 'fell' && e.cause === 'storm')).toBe(true);
  });

  it('summer drought halves thirsty plants', () => {
    const wet = makeState({ plants: { grass: 10 }, days: SUMMER, resources: { water: 90 } });
    const dry = makeState({
      plants: { grass: 10 },
      days: SUMMER,
      resources: { water: RESOURCES.water.baseCap * DROUGHT_WATER_SHARE * 0.5 },
    });
    expect(getProduction(dry).modifiers.drought).toBe(true);
    expect(sapOf(dry)).toBeCloseTo(sapOf(wet) / 2);
  });

  it('bark beetles break out after a few risky days in a pine monoculture', () => {
    let state = makeState({ plants: { pine: 40 }, days: SUMMER, weather: 'heatwave' });
    const phases: string[] = [];
    for (let day = 1; day <= BEETLE_RISK_DAYS; day++) {
      state = runDay(
        { ...state, weather: { ...state.weather, kind: 'heatwave', daysLeft: 5 } },
        SUMMER + day,
      );
    }
    for (const event of state.events) {
      if (event.kind === 'beetles') {
        phases.push(event.phase);
      }
    }
    expect(phases).toEqual(['risk', 'start']);
    expect(state.outbreak).toBe(true);
  });

  it('lightning can burn plantations on thunderstorm days, ponds make it rarer', () => {
    let burned = 0;
    let shieldedBurned = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const storm = {
        ...makeState({ plants: { grass: 30 }, weather: 'thunderstorm', days: SUMMER }),
        rng: seed,
      };
      burned += 30 - runDay(storm, SUMMER + 1).plants.grass;
      const wet = { ...storm, plants: { ...storm.plants, pond: 20 } };
      shieldedBurned += 30 - runDay(wet, SUMMER + 1).plants.grass;
    }
    expect(burned).toBeGreaterThan(0);
    expect(shieldedBurned).toBeLessThan(burned);
  });
});

describe('animals planting trees', () => {
  it('jays and squirrels forget some seeds, which become free seedlings', () => {
    const state = makeState({ animals: { jay: 4000 } });
    const after = runDay(state, 1);
    expect(after.seedlings.some((s) => s.plant === 'hazel')).toBe(true);
  });
});

describe('adaptations', () => {
  const rich = makeState({
    discoveries: ['lignification'],
    resources: { humus: 150, sap: 50, songs: 100 },
  });

  it('are paid once and kept', () => {
    const adopted = adapt(
      { ...rich, resources: { ...rich.resources, humus: 300, sap: 200 } },
      'taproots',
    );
    expect(adopted.adaptations).toEqual(['taproots']);
    expect(getCaps(adopted).water).toBeCloseTo(RESOURCES.water.baseCap * 1.25);
    expect(adapt(adopted, 'taproots')).toBe(adopted);
  });

  it('dormant buds double winter sap', () => {
    const winter = makeState({ plants: { grass: 10 }, days: WINTER });
    const buds = { ...winter, adaptations: ['dormantBuds'] as const };
    expect(sapOf(buds)).toBeCloseTo(sapOf(winter) * ADAPTATIONS.dormantBuds.winterSap);
  });

  it('territorial song makes Calls cheaper', () => {
    const singing = { ...rich, adaptations: ['territorialSong'] as const };
    expect(getCallCost(singing).songs).toBeCloseTo(CALL_COST.songs * 0.8);
  });

  it('mycorrhizae double the spores', () => {
    const lichens = makeState({ plants: { lichen: 10 } });
    const linked = { ...lichens, discoveries: ['mycorrhizae'] as const };
    expect(getProduction(linked).rates.spores).toBeCloseTo(getProduction(lichens).rates.spores * 2);
  });
});
