import { ADAPTATIONS, type AdaptationId } from '../data/adaptations';
import { DISCOVERIES, type DiscoveryId } from '../data/discoveries';
import type { Era } from '../data/eras';
import { PLANTS, PLANT_IDS, type PlantId, type Requirement } from '../data/plants';
import { RESOURCES, type ResourceId } from '../data/resources';
import { SPECIES, SPECIES_IDS, type SpeciesId } from '../data/species';
import type { GameState } from './state';

/** Adults plus seedlings. Prices grow with this count. */
export function ownedCount(state: GameState, plant: PlantId): number {
  let count = state.plants[plant];
  for (const seedling of state.seedlings) {
    if (seedling.plant === plant) {
      count += 1;
    }
  }
  return count;
}

export function hasDiscovery(state: GameState, id: DiscoveryId): boolean {
  return state.discoveries.includes(id);
}

export function meetsRequirement(state: GameState, requirement: Requirement): boolean {
  for (const plant of PLANT_IDS) {
    const needed = requirement.plants?.[plant];
    if (needed !== undefined && ownedCount(state, plant) < needed) {
      return false;
    }
  }
  return (requirement.discoveries ?? []).every((id) => hasDiscovery(state, id));
}

export function isPlantUnlocked(state: GameState, plant: PlantId): boolean {
  return meetsRequirement(state, PLANTS[plant].requires);
}

/** Not made yet, and every prerequisite made. */
export function isDiscoveryAvailable(state: GameState, id: DiscoveryId): boolean {
  return (
    !hasDiscovery(state, id) && DISCOVERIES[id].requires.every((req) => hasDiscovery(state, req))
  );
}

export function getEra(state: GameState): Era {
  let era: Era = 1;
  for (const id of state.discoveries) {
    const opened = DISCOVERIES[id].era;
    if (opened !== undefined && opened > era) {
      era = opened;
    }
  }
  return era;
}

export function hasAdaptation(state: GameState, id: AdaptationId): boolean {
  return state.adaptations.includes(id);
}

/** Not adopted yet, and every discovery it needs made. */
export function isAdaptationAvailable(state: GameState, id: AdaptationId): boolean {
  return (
    !hasAdaptation(state, id) && ADAPTATIONS[id].requires.every((req) => hasDiscovery(state, req))
  );
}

export function isSpeciesUnlocked(state: GameState, id: SpeciesId): boolean {
  return SPECIES[id].requires.every((req) => hasDiscovery(state, req));
}

/** The Balance index counts once a discovery reveals it (Food chain). */
export function isBalanceActive(state: GameState): boolean {
  return state.discoveries.some((id) => DISCOVERIES[id].revealsBalance === true);
}

/** A resource shows once it exists or something produces it, and stays visible after. */
export function isResourceVisible(state: GameState, id: ResourceId): boolean {
  if (RESOURCES[id].startsVisible || state.resources[id] > 0) {
    return true;
  }
  return (
    PLANT_IDS.some((plant) => ownedCount(state, plant) > 0 && PLANTS[plant].produces[id]) ||
    SPECIES_IDS.some((species) => state.animals[species] > 0 && SPECIES[species].produces[id])
  );
}
