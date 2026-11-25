import {
  BASE_RAIN_PER_SECOND,
  SEASON_PRODUCTION_MULTIPLIER,
  SEASON_RAIN_MULTIPLIER,
} from '../data/climate';
import { DISCOVERIES } from '../data/discoveries';
import {
  BALANCE_BONUS_PER_POINT,
  MAX_PREDATION_PER_DAY,
  OVERGRAZING_MAX_SLOWDOWN,
  OVERGRAZING_THRESHOLD,
  PEST_MAX_SAP_LOSS,
  PEST_THRESHOLD,
} from '../data/ecology';
import { PLANTS, PLANT_IDS, type PlantId } from '../data/plants';
import { RESOURCE_IDS, RESOURCES, type ResourceId } from '../data/resources';
import { SPECIES, SPECIES_IDS, type Food, type SpeciesId } from '../data/species';
import { SECONDS_PER_DAY, type Season } from '../data/time';
import { getCalendar } from './calendar';
import { capacityFrom, getNiches } from './habitat';
import type { GameState } from './state';
import { isBalanceActive } from './unlocks';

export type PerResource = Record<ResourceId, number>;
export type PerSpecies<T> = Record<SpeciesId, T>;

/** Who produces or consumes a resource, for the breakdown shown to the player. */
export type RateSource = 'rain' | 'decay' | PlantId | SpeciesId;

/** One line of a resource's breakdown. */
export interface RateLine {
  readonly source: RateSource;
  /** Plantations or individuals behind this line. */
  readonly count: number;
  /** Per real second; negative for consumption. */
  readonly amount: number;
}

/** The multipliers behind the numbers, shown to the player. */
export interface Modifiers {
  /** Seasonal multiplier on Sap. */
  readonly sapSeason: number;
  /** Nitrogen bonus on Sap (1 = none). */
  readonly sapBonus: number;
  /** Share of the water demand that is met (1 = no shortage). */
  readonly waterSupply: number;
  /** Effective number of species (Hill number of the Shannon index). */
  readonly balance: number;
  /** Multiplier from the Balance on everything living things produce (1 until revealed). */
  readonly balanceMultiplier: number;
  /** Multiplier on Sap from pests (1 = no pests). */
  readonly pests: number;
  /** Multiplier on Seeds from pollinators and ants. */
  readonly seedBonus: number;
  /** Multiplier on seedling growth from overgrazing (1 = none). */
  readonly grazing: number;
}

export interface Production {
  /** Net change per real second. */
  readonly rates: PerResource;
  readonly lines: Readonly<Record<ResourceId, readonly RateLine[]>>;
  readonly modifiers: Modifiers;
  /** Share of each species' food that is met (1 = fed). */
  readonly fed: Readonly<PerSpecies<number>>;
  /** Prey individuals eaten per game day, per prey species. */
  readonly eaten: Readonly<PerSpecies<number>>;
  /** Species asleep right now (hibernation). */
  readonly asleep: Readonly<PerSpecies<boolean>>;
  /** Storage caps, computed once per step. */
  readonly caps: Readonly<PerResource>;
  /** How many individuals each species' niches can hold. */
  readonly capacity: Readonly<PerSpecies<number>>;
}

function perResource(value: number): PerResource {
  const values = {} as PerResource;
  for (const id of RESOURCE_IDS) {
    values[id] = value;
  }
  return values;
}

function perSpecies<T>(value: T): PerSpecies<T> {
  const values = {} as PerSpecies<T>;
  for (const id of SPECIES_IDS) {
    values[id] = value;
  }
  return values;
}

/** Storage caps: base, plus plantations and animals, times discovery multipliers. */
export function getCaps(state: GameState): PerResource {
  const caps = perResource(0);
  for (const id of RESOURCE_IDS) {
    let cap: number = RESOURCES[id].baseCap;
    for (const plant of PLANT_IDS) {
      cap += state.plants[plant] * (PLANTS[plant].storage[id] ?? 0);
    }
    for (const species of SPECIES_IDS) {
      cap += state.animals[species] * (SPECIES[species].storage[id] ?? 0);
    }
    for (const discovery of state.discoveries) {
      cap *= DISCOVERIES[discovery].storageMultiplier[id] ?? 1;
    }
    caps[id] = cap;
  }
  return caps;
}

/**
 * Balance index: the effective number of species. Plants count by biomass,
 * animals by population (at least one individual), each group for half.
 */
export function getBalance(state: GameState): number {
  const plants = PLANT_IDS.map((id) => state.plants[id] * PLANTS[id].biomass);
  const animals = SPECIES_IDS.map((id) =>
    state.animals[id] >= 1 ? state.animals[id] * SPECIES[id].balanceWeight : 0,
  );
  const groups = [plants, animals]
    .map((weights) => weights.filter((w) => w > 0))
    .filter((weights) => weights.length > 0);
  let entropy = 0;
  for (const weights of groups) {
    const total = weights.reduce((sum, w) => sum + w, 0);
    for (const weight of weights) {
      const share = weight / total / groups.length;
      entropy -= share * Math.log(share);
    }
  }
  return Math.exp(entropy);
}

function seasonFactor(resource: ResourceId, season: Season): number {
  return SEASON_PRODUCTION_MULTIPLIER[resource]?.[season] ?? 1;
}

/** Share of a need that is met: everything while there is stock, else what flows in. */
function satisfaction(stock: number, income: number, demand: number): number {
  if (stock > 0 || demand <= 0) {
    return 1;
  }
  return Math.min(1, Math.max(0, income) / demand);
}

/** Adults plus seedlings, for every plant, in one pass over the seedlings. */
function ownedCounts(state: GameState): Record<PlantId, number> {
  const owned = { ...state.plants } as Record<PlantId, number>;
  for (const seedling of state.seedlings) {
    owned[seedling.plant] += 1;
  }
  return owned;
}

export function getProduction(state: GameState): Production {
  const { season } = getCalendar(state.days);
  const caps = getCaps(state);
  const niches = getNiches(state);
  const owned = ownedCounts(state);
  const capacity = perSpecies(0);
  for (const id of SPECIES_IDS) {
    capacity[id] = capacityFrom(state, id, niches);
  }
  const lines = {} as Record<ResourceId, RateLine[]>;
  for (const id of RESOURCE_IDS) {
    lines[id] = [];
  }
  const income = (id: ResourceId): number =>
    lines[id].reduce((sum, line) => sum + Math.max(0, line.amount), 0);

  // Multipliers that depend only on the state.
  const balance = getBalance(state);
  const balanceMultiplier = isBalanceActive(state)
    ? 1 + BALANCE_BONUS_PER_POINT * (balance - 1)
    : 1;
  const insectShare = caps.insects > 0 ? state.resources.insects / caps.insects : 0;
  const pests =
    insectShare > PEST_THRESHOLD
      ? 1 - PEST_MAX_SAP_LOSS * Math.min(1, (insectShare - PEST_THRESHOLD) / (1 - PEST_THRESHOLD))
      : 1;
  let sapBonus = 1;
  let shield = 0;
  for (const plant of PLANT_IDS) {
    sapBonus += state.plants[plant] * PLANTS[plant].sapBonus;
    shield += state.plants[plant] * PLANTS[plant].grazingShield;
  }
  const grazers = SPECIES_IDS.reduce(
    (sum, id) => sum + (SPECIES[id].grazer ? state.animals[id] : 0),
    0,
  );
  const grazed = niches.grassland > 0 ? grazers / niches.grassland : 0;
  const slowdown =
    grazed > OVERGRAZING_THRESHOLD
      ? OVERGRAZING_MAX_SLOWDOWN *
        Math.min(1, (grazed - OVERGRAZING_THRESHOLD) / (1 - OVERGRAZING_THRESHOLD))
      : 0;
  const grazing = 1 - slowdown * (1 - Math.min(1, shield));

  // Rain, then what plants drink against what comes in.
  const rain = BASE_RAIN_PER_SECOND * SEASON_RAIN_MULTIPLIER[season];
  lines.water.push({ source: 'rain', count: 0, amount: rain });
  let waterIncome = rain;
  let waterDemand = 0;
  for (const plant of PLANT_IDS) {
    waterIncome += state.plants[plant] * (PLANTS[plant].produces.water ?? 0);
    waterDemand += owned[plant] * PLANTS[plant].drinks;
  }
  const waterSupply = satisfaction(state.resources.water, waterIncome, waterDemand);

  // What plants produce.
  const sapSeason = seasonFactor('sap', season);
  for (const plant of PLANT_IDS) {
    const def = PLANTS[plant];
    const adults = state.plants[plant];
    if (adults > 0) {
      const thirst = def.drinks > 0 ? waterSupply : 1;
      for (const id of RESOURCE_IDS) {
        const base = def.produces[id];
        if (base === undefined) {
          continue;
        }
        let amount = adults * base * thirst * seasonFactor(id, season) * balanceMultiplier;
        if (id === 'sap') {
          amount *= sapBonus * pests;
        }
        lines[id].push({ source: plant, count: adults, amount });
      }
    }
    const count = owned[plant];
    if (def.drinks > 0 && count > 0) {
      lines.water.push({ source: plant, count, amount: -count * def.drinks * waterSupply });
    }
  }

  // What animals eat. A second food only covers what the first one could not.
  const asleep = perSpecies(false);
  const active = SPECIES_IDS.filter((id) => {
    asleep[id] = SPECIES[id].hibernates && season === 'winter';
    return state.animals[id] > 0 && !asleep[id];
  });
  const preyNeed = perSpecies(0);
  for (const id of active) {
    const first = SPECIES[id].diet[0];
    if (first !== undefined && 'prey' in first) {
      preyNeed[first.prey] += state.animals[id] * first.perDay;
    }
  }
  const preySupply = (prey: SpeciesId): number =>
    preyNeed[prey] <= 0
      ? 1
      : Math.min(1, (MAX_PREDATION_PER_DAY * state.animals[prey]) / preyNeed[prey]);

  const demandFor = (share: (id: SpeciesId) => number): PerResource => {
    const demand = perResource(0);
    for (const id of active) {
      const [first, second] = SPECIES[id].diet;
      const n = state.animals[id];
      if (first !== undefined && 'resource' in first) {
        demand[first.resource] += (n * first.perDay) / SECONDS_PER_DAY;
      }
      if (second !== undefined && 'resource' in second) {
        demand[second.resource] += (n * second.perDay * (1 - share(id))) / SECONDS_PER_DAY;
      }
    }
    return demand;
  };
  const supplyOf = (demand: PerResource): PerResource => {
    const supply = perResource(1);
    for (const id of RESOURCE_IDS) {
      supply[id] = satisfaction(state.resources[id], income(id), demand[id]);
    }
    return supply;
  };
  const foodSupply = (food: Food | undefined, supply: PerResource): number => {
    if (food === undefined) {
      return 0;
    }
    return 'prey' in food ? preySupply(food.prey) : supply[food.resource];
  };
  // First pass with the first foods only, to know how much falls back on the second ones.
  const firstSupply = supplyOf(demandFor(() => 1));
  const firstShare = (id: SpeciesId): number => foodSupply(SPECIES[id].diet[0], firstSupply);
  const supply = supplyOf(demandFor(firstShare));

  const fed = perSpecies(1);
  const eaten = perSpecies(0);
  let seedBonus = 1;
  for (const id of active) {
    const def = SPECIES[id];
    const n = state.animals[id];
    const [first, second] = def.diet;
    const fromFirst = first === undefined ? 1 : foodSupply(first, supply);
    const fromSecond = (1 - fromFirst) * foodSupply(second, supply);
    fed[id] = Math.min(1, fromFirst + fromSecond);

    // `share` is the part of the whole need this food covers, so the amount eaten
    // is that share of a full ration of this food.
    for (const [food, share] of [
      [first, fromFirst],
      [second, fromSecond],
    ] as const) {
      if (food === undefined || share <= 0) {
        continue;
      }
      if ('prey' in food) {
        eaten[food.prey] += n * food.perDay * share;
      } else {
        const amount = (n * food.perDay * share) / SECONDS_PER_DAY;
        lines[food.resource].push({ source: id, count: n, amount: -amount });
      }
    }

    for (const resource of RESOURCE_IDS) {
      const base = def.produces[resource];
      if (base !== undefined) {
        const amount = n * base * fed[id] * balanceMultiplier;
        lines[resource].push({ source: id, count: n, amount });
      }
    }
    seedBonus += n * def.seedBonus * fed[id];
  }

  // Pollinators and ants multiply the seeds plants make.
  if (seedBonus !== 1) {
    lines.seeds = lines.seeds.map((line) =>
      line.amount > 0 && (PLANT_IDS as readonly string[]).includes(line.source)
        ? { ...line, amount: line.amount * seedBonus }
        : line,
    );
  }

  // Perishable resources rot.
  for (const id of RESOURCE_IDS) {
    const decay = RESOURCES[id].decayPerDay;
    if (decay > 0 && state.resources[id] > 0) {
      lines[id].push({
        source: 'decay',
        count: 0,
        amount: (-state.resources[id] * decay) / SECONDS_PER_DAY,
      });
    }
  }

  const rates = perResource(0);
  for (const id of RESOURCE_IDS) {
    rates[id] = lines[id].reduce((sum, line) => sum + line.amount, 0);
  }
  return {
    rates,
    lines,
    modifiers: {
      sapSeason,
      sapBonus,
      waterSupply,
      balance,
      balanceMultiplier,
      pests,
      seedBonus,
      grazing,
    },
    fed,
    eaten,
    asleep,
    caps,
    capacity,
  };
}

/** Net change per real second for every resource. */
export function getRates(state: GameState): PerResource {
  return getProduction(state).rates;
}
