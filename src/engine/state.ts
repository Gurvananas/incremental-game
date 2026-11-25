import type { DiscoveryId } from '../data/discoveries';
import { PLANT_IDS, type PlantId } from '../data/plants';
import { RESOURCE_IDS, RESOURCES, type ResourceId } from '../data/resources';
import { SPECIES_IDS, type SpeciesId } from '../data/species';

export type Resources = Readonly<Record<ResourceId, number>>;
export type PlantCounts = Readonly<Record<PlantId, number>>;
export type SpeciesCounts = Readonly<Record<SpeciesId, number>>;

export interface Seedling {
  readonly plant: PlantId;
  /** Game days left before adulthood. */
  readonly daysLeft: number;
}

/**
 * The whole game state. It must stay a plain, JSON-serialisable object:
 * no classes, no functions, no Maps. Engine functions never mutate it;
 * they return a new state.
 */
export interface GameState {
  /** Game days elapsed since the start of the run (fractional). */
  readonly days: number;
  readonly resources: Resources;
  /** Adult plantations. */
  readonly plants: PlantCounts;
  /** Plantations still growing. */
  readonly seedlings: readonly Seedling[];
  /** In the order they were made. */
  readonly discoveries: readonly DiscoveryId[];
  /** Population of each species (fractional: individuals come and go gradually). */
  readonly animals: SpeciesCounts;
  /** Niches the player gave to each species (whole numbers). */
  readonly assignments: SpeciesCounts;
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

export function createInitialState(seed: number): GameState {
  return {
    days: 0,
    resources: initialResources(),
    plants: noPlants(),
    seedlings: [],
    discoveries: [],
    animals: noAnimals(),
    assignments: noAnimals(),
    rng: seed >>> 0,
  };
}
