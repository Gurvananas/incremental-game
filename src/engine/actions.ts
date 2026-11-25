import { MURMUR_SAP } from '../data/actions';
import { DISCOVERIES, type DiscoveryId } from '../data/discoveries';
import { PLANTS, type PlantId } from '../data/plants';
import { canAfford, getPlantCost, pay } from './costs';
import { getCaps } from './production';
import type { GameState } from './state';
import { isDiscoveryAvailable, isPlantUnlocked } from './unlocks';

/**
 * Player actions. Each returns a new state, or the very same state object when
 * the action is not possible, so callers can test `next === state`.
 */

export function murmur(state: GameState): GameState {
  const cap = getCaps(state).sap;
  const sap = Math.min(cap, state.resources.sap + MURMUR_SAP);
  return sap === state.resources.sap ? state : { ...state, resources: { ...state.resources, sap } };
}

export function plant(state: GameState, id: PlantId): GameState {
  const cost = getPlantCost(state, id);
  if (!isPlantUnlocked(state, id) || !canAfford(state, cost)) {
    return state;
  }
  const paid = pay(state, cost);
  if (PLANTS[id].growthDays === 0) {
    return { ...paid, plants: { ...paid.plants, [id]: paid.plants[id] + 1 } };
  }
  return {
    ...paid,
    seedlings: [...paid.seedlings, { plant: id, daysLeft: PLANTS[id].growthDays }],
  };
}

export function discover(state: GameState, id: DiscoveryId): GameState {
  const cost = DISCOVERIES[id].cost;
  if (!isDiscoveryAvailable(state, id) || !canAfford(state, cost)) {
    return state;
  }
  const paid = pay(state, cost);
  return { ...paid, discoveries: [...paid.discoveries, id] };
}
