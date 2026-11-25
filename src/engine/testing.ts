import type { PlantId } from '../data/plants';
import type { DiscoveryId } from '../data/discoveries';
import type { ResourceId } from '../data/resources';
import type { SpeciesId } from '../data/species';
import { createInitialState, type GameState } from './state';

/** Test helper: a fresh state with some resources and adult plants set. */
export function makeState(
  overrides: {
    resources?: Partial<Record<ResourceId, number>>;
    plants?: Partial<Record<PlantId, number>>;
    animals?: Partial<Record<SpeciesId, number>>;
    assignments?: Partial<Record<SpeciesId, number>>;
    discoveries?: readonly DiscoveryId[];
    days?: number;
  } = {},
): GameState {
  const state = createInitialState(1);
  return {
    ...state,
    days: overrides.days ?? 0,
    resources: { ...state.resources, ...overrides.resources },
    plants: { ...state.plants, ...overrides.plants },
    animals: { ...state.animals, ...overrides.animals },
    assignments: { ...state.assignments, ...overrides.assignments },
    discoveries: overrides.discoveries ?? [],
  };
}
