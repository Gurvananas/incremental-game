import type { AdaptationId } from '../data/adaptations';
import type { DiscoveryId } from '../data/discoveries';
import { PLANT_IDS, type PlantId } from '../data/plants';
import { RESOURCE_IDS, RESOURCES, type ResourceId } from '../data/resources';
import { SPECIES_IDS, type SpeciesId } from '../data/species';
import type { WeatherKind } from '../data/weather';

export type Resources = Readonly<Record<ResourceId, number>>;
export type PlantCounts = Readonly<Record<PlantId, number>>;
export type SpeciesCounts = Readonly<Record<SpeciesId, number>>;

export interface Seedling {
  readonly plant: PlantId;
  /** Game days left before adulthood. */
  readonly daysLeft: number;
}

export interface Weather {
  readonly kind: WeatherKind;
  /** Game days left, the current one included. */
  readonly daysLeft: number;
  /** Already drawn, so it can be announced the day before. */
  readonly next: WeatherKind;
  readonly nextDays: number;
}

/** Something the engine did on its own, for the journal to tell. */
export type GameEvent = { readonly id: number; readonly day: number } & (
  | { readonly kind: 'forecast'; readonly weather: WeatherKind }
  | { readonly kind: 'mast'; readonly year: number }
  | {
      readonly kind: 'fell';
      readonly plant: PlantId;
      readonly count: number;
      readonly cause: 'age' | 'storm' | 'beetles';
    }
  | { readonly kind: 'lightning'; readonly plant: PlantId; readonly count: number }
  | { readonly kind: 'beetles'; readonly phase: 'risk' | 'start' | 'end' }
  | { readonly kind: 'seedlingsLost'; readonly count: number }
  | {
      readonly kind: 'planted';
      readonly species: SpeciesId;
      readonly plant: PlantId;
      readonly count: number;
    }
);

/**
 * The whole game state. It must stay a plain, JSON-serialisable object:
 * no classes, no functions, no Maps. Engine functions never mutate it;
 * they return a new state.
 */
export interface GameState {
  /** Game days elapsed since the start of the run (fractional). */
  readonly days: number;
  readonly resources: Resources;
  /** Adult plantations, old ones included. */
  readonly plants: PlantCounts;
  /** How many of the adults are old (trees only). */
  readonly old: PlantCounts;
  /** Plantations still growing. */
  readonly seedlings: readonly Seedling[];
  /** In the order they were made. */
  readonly discoveries: readonly DiscoveryId[];
  readonly adaptations: readonly AdaptationId[];
  /** Population of each species (fractional: individuals come and go gradually). */
  readonly animals: SpeciesCounts;
  /** Niches the player gave to each species (whole numbers). */
  readonly assignments: SpeciesCounts;
  readonly weather: Weather;
  /** The year of the current or next mast (seeds ×3 all that year). */
  readonly mastYear: number;
  /** Days in a row with bark beetle conditions (negative: calm days in a row). */
  readonly beetleRiskDays: number;
  readonly outbreak: boolean;
  /** Recent events, oldest first, for the journal. */
  readonly events: readonly GameEvent[];
  /** Id of the last event ever logged. */
  readonly eventCount: number;
  /** Internal state of the seeded RNG (see engine/rng.ts). */
  readonly rng: number;
}

export function initialResources(): Record<ResourceId, number> {
  const resources = {} as Record<ResourceId, number>;
  for (const id of RESOURCE_IDS) {
    resources[id] = RESOURCES[id].initial;
  }
  return resources;
}

export function noPlants(): Record<PlantId, number> {
  const plants = {} as Record<PlantId, number>;
  for (const id of PLANT_IDS) {
    plants[id] = 0;
  }
  return plants;
}

export function noAnimals(): Record<SpeciesId, number> {
  const animals = {} as Record<SpeciesId, number>;
  for (const id of SPECIES_IDS) {
    animals[id] = 0;
  }
  return animals;
}

export const INITIAL_WEATHER: Weather = {
  kind: 'clear',
  daysLeft: 5,
  next: 'rain',
  nextDays: 3,
};

/** The first mast comes in year 3. */
export const FIRST_MAST_YEAR = 3;

export function createInitialState(seed: number): GameState {
  return {
    days: 0,
    resources: initialResources(),
    plants: noPlants(),
    old: noPlants(),
    seedlings: [],
    discoveries: [],
    adaptations: [],
    animals: noAnimals(),
    assignments: noAnimals(),
    weather: INITIAL_WEATHER,
    mastYear: FIRST_MAST_YEAR,
    beetleRiskDays: 0,
    outbreak: false,
    events: [],
    eventCount: 0,
    rng: seed >>> 0,
  };
}
