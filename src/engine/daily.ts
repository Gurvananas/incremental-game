import { ADAPTATIONS } from '../data/adaptations';
import { EVENT_LOG_SIZE } from '../data/forest';
import { PLANTS, PLANT_IDS, type PlantId } from '../data/plants';
import { SPECIES, SPECIES_IDS } from '../data/species';
import {
  BEETLE_CALM_DAYS,
  BEETLE_DEATH_PER_DAY,
  BEETLE_MAX_SHIELD,
  BEETLE_PINE_SHARE,
  BEETLE_RISK_DAYS,
  DROUGHT_SEEDLING_DEATH_PER_DAY,
  DROUGHT_WATER_SHARE,
  LIGHTNING_CHANCE_PER_DAY,
  LIGHTNING_MAX_BURNED,
  LIGHTNING_MAX_SHIELD,
  LIGHTNING_POND_SHIELD,
  STORM_FALL_ADULT_PER_DAY,
  STORM_FALL_OLD_PER_DAY,
} from '../data/threats';
import { DAYS_PER_YEAR, type Season } from '../data/time';
import {
  MAST_YEARS_MAX,
  MAST_YEARS_MIN,
  WEATHER,
  WEATHER_KINDS,
  type WeatherKind,
} from '../data/weather';
import { getCalendar } from './calendar';
import { getCaps } from './production';
import { nextRandom } from './rng';
import type { GameEvent, GameState, Seedling, Weather } from './state';

type EventBody = GameEvent extends infer E
  ? E extends GameEvent
    ? Omit<E, 'id' | 'day'>
    : never
  : never;

/** A tiny random source over the state's seed, for one day of events. */
class Dice {
  constructor(public state: number) {}

  /** A float in [0, 1). */
  next(): number {
    const [value, next] = nextRandom(this.state);
    this.state = next;
    return value;
  }

  /** A whole number between min and max, both included. */
  between(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** How many of `count` independent trials of chance `p` succeed. */
  trials(count: number, p: number): number {
    if (count <= 0 || p <= 0) {
      return 0;
    }
    if (count > 200) {
      // Large counts: the expected value, with the fraction rounded at random.
      const expected = count * p;
      return Math.min(count, Math.floor(expected) + (this.next() < expected % 1 ? 1 : 0));
    }
    let hits = 0;
    for (let i = 0; i < count; i++) {
      if (this.next() < p) {
        hits += 1;
      }
    }
    return hits;
  }

  pick<T>(weighted: readonly (readonly [T, number])[]): T | undefined {
    const total = weighted.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = this.next() * total;
    for (const [item, weight] of weighted) {
      roll -= weight;
      if (roll < 0 && weight > 0) {
        return item;
      }
    }
    return undefined;
  }
}

export function drawWeather(dice: Dice, season: Season): { kind: WeatherKind; days: number } {
  const kind =
    dice.pick(WEATHER_KINDS.map((id) => [id, WEATHER[id].weight[season]] as const)) ?? 'clear';
  return { kind, days: dice.between(WEATHER[kind].minDays, WEATHER[kind].maxDays) };
}

/**
 * Everything that happens once a day, with the seeded RNG: weather, mast years,
 * trees ageing and falling, storms, drought, bark beetles, lightning, and seeds
 * that animals forget in the ground. `day` is the whole day that just began.
 */
export function runDay(state: GameState, day: number): GameState {
  const dice = new Dice(state.rng);
  const { season, year } = getCalendar(day);
  const events: EventBody[] = [];
  const plants = { ...state.plants } as Record<PlantId, number>;
  const old = { ...state.old } as Record<PlantId, number>;
  let seedlings: Seedling[] = [...state.seedlings];
  let deadwood = 0;
  const adopted = state.adaptations.map((id) => ADAPTATIONS[id]);

  // Weather moves on; the next one is drawn ahead and announced the day before.
  let weather: Weather;
  if (state.weather.daysLeft > 1) {
    weather = { ...state.weather, daysLeft: state.weather.daysLeft - 1 };
  } else {
    const next = drawWeather(dice, season);
    weather = {
      kind: state.weather.next,
      daysLeft: state.weather.nextDays,
      next: next.kind,
      nextDays: next.days,
    };
  }
  if (weather.daysLeft === 1 && WEATHER[weather.next].notable && weather.next !== weather.kind) {
    events.push({ kind: 'forecast', weather: weather.next });
  }

  // Mast years: announced when the year begins, the next one drawn when it ends.
  let mastYear = state.mastYear;
  if (day % DAYS_PER_YEAR === 0) {
    if (year > mastYear) {
      mastYear = mastYear + dice.between(MAST_YEARS_MIN, MAST_YEARS_MAX);
    }
    if (year === mastYear) {
      events.push({ kind: 'mast', year });
    }
  }

  const fell = (
    plant: PlantId,
    count: number,
    fromOld: number,
    cause: 'age' | 'storm' | 'beetles',
  ): void => {
    if (count <= 0) {
      return;
    }
    plants[plant] -= count;
    old[plant] -= fromOld;
    deadwood += count * PLANTS[plant].fallDeadwood;
    events.push({ kind: 'fell', plant, count, cause });
  };

  // Trees grow old, old trees fall; storms bring old ones down, and some adults.
  const storm = WEATHER[weather.kind].windfall;
  for (const plant of PLANT_IDS) {
    const def = PLANTS[plant];
    if (def.lifespanDays <= 0 || plants[plant] === 0) {
      continue;
    }
    old[plant] += dice.trials(plants[plant] - old[plant], 1 / def.lifespanDays);
    const byAge = dice.trials(old[plant], 1 / def.oldAgeDays);
    fell(plant, byAge, byAge, 'age');
    if (storm) {
      const oldDown = dice.trials(old[plant], STORM_FALL_OLD_PER_DAY);
      const adultsDown = dice.trials(plants[plant] - old[plant], STORM_FALL_ADULT_PER_DAY);
      fell(plant, oldDown + adultsDown, oldDown, 'storm');
    }
  }

  // Summer drought: some seedlings dry out.
  const caps = getCaps(state);
  const drought = season === 'summer' && state.resources.water < DROUGHT_WATER_SHARE * caps.water;
  if (drought && seedlings.length > 0) {
    const before = seedlings.length;
    seedlings = seedlings.filter(() => dice.next() >= DROUGHT_SEEDLING_DEATH_PER_DAY);
    if (seedlings.length < before) {
      events.push({ kind: 'seedlingsLost', count: before - seedlings.length });
    }
  }

  // Bark beetles: too many pines, plus drought or heat, for a few days in a row.
  const trees = PLANT_IDS.reduce((sum, p) => sum + (PLANTS[p].crown > 0 ? plants[p] : 0), 0);
  const risky =
    plants.pine >= 5 &&
    plants.pine / trees >= BEETLE_PINE_SHARE &&
    (drought || weather.kind === 'heatwave');
  // Positive: risky days in a row; negative: calm days in a row (so it does not flicker).
  const streak = state.beetleRiskDays;
  const beetleRiskDays = risky ? Math.max(0, streak) + 1 : Math.min(0, streak) - 1;
  let outbreak = state.outbreak;
  if (risky && beetleRiskDays === 1 && !outbreak) {
    events.push({ kind: 'beetles', phase: 'risk' });
  }
  if (beetleRiskDays >= BEETLE_RISK_DAYS && !outbreak) {
    outbreak = true;
    events.push({ kind: 'beetles', phase: 'start' });
  }
  if (beetleRiskDays <= -BEETLE_CALM_DAYS && outbreak) {
    outbreak = false;
    events.push({ kind: 'beetles', phase: 'end' });
  }
  if (outbreak) {
    const protection = Math.min(
      BEETLE_MAX_SHIELD,
      SPECIES_IDS.reduce((sum, id) => sum + state.animals[id] * SPECIES[id].beetleShield, 0) +
        adopted.reduce((sum, a) => sum + a.beetleShield, 0),
    );
    const dead = dice.trials(plants.pine, BEETLE_DEATH_PER_DAY * (1 - protection));
    const deadOld = Math.min(old.pine, Math.round((dead * old.pine) / Math.max(1, plants.pine)));
    fell('pine', dead, deadOld, 'beetles');
  }

  // Lightning on thunderstorm days; ponds and wetlands make fires rarer.
  if (WEATHER[weather.kind].lightning) {
    const shield = Math.min(LIGHTNING_MAX_SHIELD, plants.pond * LIGHTNING_POND_SHIELD);
    if (dice.next() < LIGHTNING_CHANCE_PER_DAY * (1 - shield)) {
      const target = dice.pick(
        PLANT_IDS.filter((p) => PLANTS[p].biomass > 0).map((p) => [p, plants[p]] as const),
      );
      if (target !== undefined) {
        const burned = Math.min(plants[target], dice.between(1, LIGHTNING_MAX_BURNED));
        const burnedOld = Math.min(
          old[target],
          Math.round((burned * old[target]) / Math.max(1, plants[target])),
        );
        plants[target] -= burned;
        old[target] -= burnedOld;
        events.push({ kind: 'lightning', plant: target, count: burned });
      }
    }
  }

  // Squirrels and jays bury seeds and forget some: free seedlings.
  for (const species of SPECIES_IDS) {
    const n = state.animals[species];
    for (const plant of PLANT_IDS) {
      const rate = SPECIES[species].plantsPerDay[plant] ?? 0;
      if (rate <= 0 || n <= 0) {
        continue;
      }
      const expected = n * rate;
      const count = Math.floor(expected) + (dice.next() < expected % 1 ? 1 : 0);
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          seedlings.push({ plant, daysLeft: PLANTS[plant].growthDays });
        }
        events.push({ kind: 'planted', species, plant, count });
      }
    }
  }

  const resources = {
    ...state.resources,
    deadwood: Math.min(caps.deadwood, state.resources.deadwood + deadwood),
  };
  let eventCount = state.eventCount;
  const logged = events.map((event) => ({ ...event, id: ++eventCount, day }));
  return {
    ...state,
    plants,
    old,
    seedlings,
    resources,
    weather,
    mastYear,
    beetleRiskDays,
    outbreak,
    events: [...state.events, ...logged].slice(-EVENT_LOG_SIZE),
    eventCount,
    rng: dice.state,
  };
}
