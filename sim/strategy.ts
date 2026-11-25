import { DISCOVERIES, DISCOVERY_IDS } from '../src/data/discoveries';
import { NICHE_IDS } from '../src/data/niches';
import { PLANTS, PLANT_IDS, type PlantId } from '../src/data/plants';
import { RESOURCE_IDS, type Amounts, type ResourceId } from '../src/data/resources';
import { SPECIES_IDS } from '../src/data/species';
import {
  assignNiches,
  callSize,
  callSpecies,
  discover,
  murmur,
  plant,
} from '../src/engine/actions';
import { canAfford, getAffordability, getPlantCost } from '../src/engine/costs';
import { freeNiches, getNiches, speciesIn } from '../src/engine/habitat';
import { getCaps } from '../src/engine/production';
import type { GameState } from '../src/engine/state';
import {
  isDiscoveryAvailable,
  isPlantUnlocked,
  isSpeciesUnlocked,
  ownedCount,
} from '../src/engine/unlocks';

/** How the simulated player behaves. */
export interface BotProfile {
  /** Clicks on Murmur per real second, while it still clicks. */
  readonly clicksPerSecond: number;
  /** It stops clicking after this many real seconds, like most players. */
  readonly clickForSeconds: number;
  /** It saves up for a plantation only if it can afford it within this many seconds. */
  readonly patienceSeconds: number;
  /** Share of the grassland it lets rabbits have (more means overgrazing). */
  readonly rabbitShare: number;
}

/** A reasonable first-time player: clicks for two minutes, then lets the game run. */
export const ACTIVE_PLAYER: BotProfile = {
  clicksPerSecond: 2,
  clickForSeconds: 120,
  patienceSeconds: 60,
  rabbitShare: 0.5,
};

/** Resources whose storage is too small for something the player wants now. */
function blockedStorage(state: GameState): Set<ResourceId> {
  const caps = getCaps(state);
  const wanted: Amounts[] = [
    ...PLANT_IDS.filter((id) => isPlantUnlocked(state, id)).map((id) => getPlantCost(state, id)),
    ...DISCOVERY_IDS.filter((id) => isDiscoveryAvailable(state, id)).map(
      (id) => DISCOVERIES[id].cost,
    ),
  ];
  const blocked = new Set<ResourceId>();
  for (const cost of wanted) {
    for (const id of RESOURCE_IDS) {
      if ((cost[id] ?? 0) > caps[id]) {
        blocked.add(id);
      }
    }
  }
  return blocked;
}

/** A plantation is worth buying if it produces, houses animals, or unblocks storage. */
function isUseful(state: GameState, id: PlantId, blocked: Set<ResourceId>): boolean {
  const def = PLANTS[id];
  if (RESOURCE_IDS.some((r) => blocked.has(r) && (def.storage[r] ?? 0) > 0)) {
    return true;
  }
  switch (id) {
    case 'moss':
    case 'pond':
      return state.resources.water < getCaps(state).water / 2;
    case 'bank':
      return isSpeciesUnlocked(state, 'fox') && getNiches(state).burrow < 4;
    default:
      return true;
  }
}

/** Picks the plantation to save for: the one owned the least, among those useful and reachable soon. */
function target(state: GameState, profile: BotProfile): PlantId | undefined {
  const blocked = blockedStorage(state);
  const candidates = PLANT_IDS.filter((id) => {
    if (!isPlantUnlocked(state, id) || !isUseful(state, id, blocked)) {
      return false;
    }
    const affordability = getAffordability(state, getPlantCost(state, id));
    return (
      affordability.kind === 'now' ||
      (affordability.kind === 'wait' && affordability.seconds <= profile.patienceSeconds)
    );
  });
  // Storage that unblocks something comes first.
  const unblocking = candidates.filter((id) =>
    RESOURCE_IDS.some((r) => blocked.has(r) && (PLANTS[id].storage[r] ?? 0) > 0),
  );
  const pool = unblocking.length > 0 ? unblocking : candidates;
  pool.sort((a, b) => ownedCount(state, a) - ownedCount(state, b));
  return pool[0];
}

/** Shares free niches between the species that can use them, rabbits kept in check. */
function assignAll(state: GameState, profile: BotProfile): GameState {
  let next = state;
  for (const niche of NICHE_IDS) {
    const species = speciesIn(niche).filter((id) => isSpeciesUnlocked(next, id));
    for (let i = 0; i < 100 && species.length > 0 && freeNiches(next, niche) > 0; i++) {
      species.sort((a, b) => next.assignments[a] - next.assignments[b]);
      const id = species[0];
      if (id === undefined) {
        break;
      }
      if (
        id === 'rabbit' &&
        next.assignments.rabbit >= getNiches(next).grassland * profile.rabbitShare
      ) {
        break;
      }
      const assigned = assignNiches(next, id, 1);
      if (assigned === next) {
        break;
      }
      next = assigned;
    }
  }
  return next;
}

/** One real second of decisions. Returns the new state and whether anything was bought. */
export function botTurn(
  state: GameState,
  elapsedSeconds: number,
  profile: BotProfile,
): { state: GameState; bought: boolean } {
  let next = state;
  let bought = false;
  if (elapsedSeconds < profile.clickForSeconds) {
    for (let i = 0; i < profile.clicksPerSecond; i++) {
      next = murmur(next);
    }
  }
  for (const id of DISCOVERY_IDS) {
    if (isDiscoveryAvailable(next, id) && canAfford(next, DISCOVERIES[id].cost)) {
      next = discover(next, id);
      bought = true;
    }
  }
  next = assignAll(next, profile);
  for (const id of SPECIES_IDS) {
    if (callSize(next, id) >= 1) {
      const called = callSpecies(next, id);
      bought ||= called !== next;
      next = called;
    }
  }
  for (let i = 0; i < 20; i++) {
    const id = target(next, profile);
    if (id === undefined || !canAfford(next, getPlantCost(next, id))) {
      break;
    }
    next = plant(next, id);
    bought = true;
  }
  return { state: next, bought };
}
