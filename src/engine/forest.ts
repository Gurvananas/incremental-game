import { LAND_SURFACE, MAX_CANOPY } from '../data/forest';
import { PLANTS, PLANT_IDS, type PlantId } from '../data/plants';
import type { GameState } from './state';

export function isTree(plant: PlantId): boolean {
  return PLANTS[plant].crown > 0;
}

/** Share of the land covered by crowns, at most 95%. */
export function getCanopy(state: GameState): number {
  let crowns = 0;
  for (const plant of PLANT_IDS) {
    crowns += state.plants[plant] * PLANTS[plant].crown;
  }
  return Math.min(MAX_CANOPY, crowns / LAND_SURFACE);
}

/** Seedlings past half their growth time, per plant: they already produce a little. */
export function youngCounts(state: GameState): Record<PlantId, number> {
  const young = {} as Record<PlantId, number>;
  for (const plant of PLANT_IDS) {
    young[plant] = 0;
  }
  for (const seedling of state.seedlings) {
    if (seedling.daysLeft <= PLANTS[seedling.plant].growthDays / 2) {
      young[seedling.plant] += 1;
    }
  }
  return young;
}

export function adultTrees(state: GameState): number {
  return PLANT_IDS.reduce((sum, plant) => sum + (isTree(plant) ? state.plants[plant] : 0), 0);
}
