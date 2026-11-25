import type { PlantId } from '../data/plants';
import type { ResourceId } from '../data/resources';
import { createInitialState, type GameState } from './state';

/** Test helper: a fresh state with some resources and adult plants set. */
export function makeState(
  overrides: {
    resources?: Partial<Record<ResourceId, number>>;
    plants?: Partial<Record<PlantId, number>>;
    days?: number;
  } = {},
): GameState {
  const state = createInitialState(1);
  return {
    ...state,
    days: overrides.days ?? 0,
    resources: { ...state.resources, ...overrides.resources },
    plants: { ...state.plants, ...overrides.plants },
  };
}
