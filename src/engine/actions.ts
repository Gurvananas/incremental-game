import { CALL_COST, CALL_INDIVIDUALS, MURMUR_SAP } from '../data/actions';
import { DISCOVERIES, type DiscoveryId } from '../data/discoveries';
import { PLANTS, type PlantId } from '../data/plants';
import { RESOURCE_IDS, type ResourceId } from '../data/resources';
import { SPECIES, type SpeciesId } from '../data/species';
import { canAfford, getPlantCost, pay } from './costs';
import { freeNiches, getCapacity } from './habitat';
import { getCaps } from './production';
import type { GameState } from './state';
import { isDiscoveryAvailable, isPlantUnlocked, isSpeciesUnlocked } from './unlocks';

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
  const def = DISCOVERIES[id];
  if (!isDiscoveryAvailable(state, id) || !canAfford(state, def.cost)) {
    return state;
  }
  const paid = pay(state, def.cost);
  const learned = { ...paid, discoveries: [...paid.discoveries, id] };
  // One-off gifts, within the new storage caps.
  const caps = getCaps(learned);
  const resources = { ...learned.resources } as Record<ResourceId, number>;
  for (const resource of RESOURCE_IDS) {
    resources[resource] = Math.min(
      caps[resource],
      resources[resource] + (def.grants[resource] ?? 0),
    );
  }
  return { ...learned, resources };
}

/**
 * Gives (positive delta) or takes back (negative delta) niches from a species.
 * Taking niches back does not remove animals at once: the extra ones leave over a season.
 */
export function assignNiches(state: GameState, id: SpeciesId, delta: number): GameState {
  if (!isSpeciesUnlocked(state, id) || delta === 0) {
    return state;
  }
  const current = state.assignments[id];
  const max = current + freeNiches(state, SPECIES[id].niche);
  const next = Math.max(0, Math.min(max, current + Math.trunc(delta)));
  return next === current ? state : { ...state, assignments: { ...state.assignments, [id]: next } };
}

/** How many individuals a Call would bring right now. */
export function callSize(state: GameState, id: SpeciesId): number {
  return Math.max(0, Math.min(CALL_INDIVIDUALS, getCapacity(state, id) - state.animals[id]));
}

/** A Call, paid in Songs, brings a few individuals at once into free assigned niches. */
export function callSpecies(state: GameState, id: SpeciesId): GameState {
  const size = callSize(state, id);
  if (!isSpeciesUnlocked(state, id) || size < 1 || !canAfford(state, CALL_COST)) {
    return state;
  }
  const paid = pay(state, CALL_COST);
  return { ...paid, animals: { ...paid.animals, [id]: paid.animals[id] + size } };
}
