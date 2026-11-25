import {
  BASE_RAIN_PER_SECOND,
  SEASON_PRODUCTION_MULTIPLIER,
  SEASON_RAIN_MULTIPLIER,
} from '../data/climate';
import { DISCOVERIES } from '../data/discoveries';
import { PLANTS, PLANT_IDS, type PlantId } from '../data/plants';
import { RESOURCE_IDS, RESOURCES, type ResourceId } from '../data/resources';
import { getCalendar } from './calendar';
import type { GameState } from './state';
import { ownedCount } from './unlocks';

export type PerResource = Record<ResourceId, number>;

/** One line of a resource's breakdown: what produces or consumes it. */
export interface RateLine {
  readonly source: 'rain' | PlantId;
  /** Plantations counted for this line (adults, or all for drinking). */
  readonly count: number;
  /** Per real second; negative for consumption. */
  readonly amount: number;
}

export interface Production {
  /** Net change per real second. */
  readonly rates: PerResource;
  readonly lines: Readonly<Record<ResourceId, readonly RateLine[]>>;
  /** The multipliers behind the numbers, shown to the player. */
  readonly modifiers: {
    /** Seasonal multiplier on Sap. */
    readonly sapSeason: number;
    /** Nitrogen bonus on Sap (1 = none). */
    readonly sapBonus: number;
    /** Share of the water demand that is met (1 = no shortage). */
    readonly waterSupply: number;
  };
}

function zeroes(): PerResource {
  const values = {} as PerResource;
  for (const id of RESOURCE_IDS) {
    values[id] = 0;
  }
  return values;
}

/** Storage caps: base, plus each adult's storage, times discovery multipliers. */
export function getCaps(state: GameState): PerResource {
  const caps = zeroes();
  for (const id of RESOURCE_IDS) {
    let cap: number = RESOURCES[id].baseCap;
    for (const plant of PLANT_IDS) {
      cap += state.plants[plant] * (PLANTS[plant].storage[id] ?? 0);
    }
    for (const discovery of state.discoveries) {
      cap *= DISCOVERIES[discovery].storageMultiplier[id] ?? 1;
    }
    caps[id] = cap;
  }
  return caps;
}

export function getProduction(state: GameState): Production {
  const { season } = getCalendar(state.days);
  const lines = {} as Record<ResourceId, RateLine[]>;
  for (const id of RESOURCE_IDS) {
    lines[id] = [];
  }

  const rain = BASE_RAIN_PER_SECOND * SEASON_RAIN_MULTIPLIER[season];
  lines.water.push({ source: 'rain', count: 0, amount: rain });

  // Water: what comes in (rain, dew) against what plants drink.
  let waterIncome = rain;
  let waterDemand = 0;
  for (const plant of PLANT_IDS) {
    waterIncome += state.plants[plant] * (PLANTS[plant].produces.water ?? 0);
    waterDemand += ownedCount(state, plant) * PLANTS[plant].drinks;
  }
  const waterSupply =
    state.resources.water > 0 || waterDemand === 0 ? 1 : Math.min(1, waterIncome / waterDemand);

  let sapBonus = 1;
  for (const plant of PLANT_IDS) {
    sapBonus += state.plants[plant] * PLANTS[plant].sapBonus;
  }
  const sapSeason = SEASON_PRODUCTION_MULTIPLIER.sap?.[season] ?? 1;

  for (const plant of PLANT_IDS) {
    const def = PLANTS[plant];
    const adults = state.plants[plant];
    // Plants that drink only produce as much as their water allows.
    const thirst = def.drinks > 0 ? waterSupply : 1;
    for (const id of RESOURCE_IDS) {
      const base = def.produces[id];
      if (base === undefined || adults === 0) {
        continue;
      }
      let amount = adults * base * thirst * (SEASON_PRODUCTION_MULTIPLIER[id]?.[season] ?? 1);
      if (id === 'sap') {
        amount *= sapBonus;
      }
      lines[id].push({ source: plant, count: adults, amount });
    }
    const owned = ownedCount(state, plant);
    if (def.drinks > 0 && owned > 0) {
      lines.water.push({ source: plant, count: owned, amount: -owned * def.drinks * waterSupply });
    }
  }

  const rates = zeroes();
  for (const id of RESOURCE_IDS) {
    rates[id] = lines[id].reduce((sum, line) => sum + line.amount, 0);
  }
  return { rates, lines, modifiers: { sapSeason, sapBonus, waterSupply } };
}

/** Net change per real second for every resource. */
export function getRates(state: GameState): PerResource {
  return getProduction(state).rates;
}
