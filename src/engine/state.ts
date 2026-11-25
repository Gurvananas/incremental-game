import { RESOURCE_IDS, RESOURCES, type ResourceId } from '../data/resources';

export type Resources = Readonly<Record<ResourceId, number>>;

/**
 * The whole game state. It must stay a plain, JSON-serialisable object:
 * no classes, no functions, no Maps. Engine functions never mutate it;
 * they return a new state.
 */
export interface GameState {
  /** Game days elapsed since the start of the run (fractional). */
  readonly days: number;
  readonly resources: Resources;
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

export function createInitialState(seed: number): GameState {
  return { days: 0, resources: initialResources(), rng: seed >>> 0 };
}
