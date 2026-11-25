import { RESOURCE_IDS, type ResourceId } from '../data/resources';
import { getCaps } from './production';
import type { GameState } from './state';

/** Debug helper: fills every resource up to its cap. */
export function fillResources(state: GameState): GameState {
  const caps = getCaps(state);
  const resources = {} as Record<ResourceId, number>;
  for (const id of RESOURCE_IDS) {
    resources[id] = caps[id];
  }
  return { ...state, resources };
}
