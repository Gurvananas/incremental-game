import { DISCOVERY_IDS } from '../src/data/discoveries';
import { PLANT_IDS, type PlantId } from '../src/data/plants';
import { discover, murmur, plant } from '../src/engine/actions';
import { canAfford, getAffordability, getPlantCost } from '../src/engine/costs';
import { getCaps } from '../src/engine/production';
import type { GameState } from '../src/engine/state';
import { isDiscoveryAvailable, isPlantUnlocked, ownedCount } from '../src/engine/unlocks';

/** How the simulated player behaves. */
export interface BotProfile {
  /** Clicks on Murmur per real second, while it still clicks. */
  readonly clicksPerSecond: number;
  /** It stops clicking after this many real seconds, like most players. */
  readonly clickForSeconds: number;
  /** It saves up for a plantation only if it can afford it within this many seconds. */
  readonly patienceSeconds: number;
}

/** A reasonable first-time player: clicks for two minutes, then lets the game run. */
export const ACTIVE_PLAYER: BotProfile = {
  clicksPerSecond: 2,
  clickForSeconds: 120,
  patienceSeconds: 60,
};

/** Moss only stores and gathers water: worth it only when water runs low. */
function isUseful(state: GameState, id: PlantId): boolean {
  return id !== 'moss' || state.resources.water < getCaps(state).water / 2;
}

/** Picks the plantation to save for: the one owned the least, among those useful and reachable soon. */
function target(state: GameState, profile: BotProfile): PlantId | undefined {
  const candidates = PLANT_IDS.filter((id) => {
    if (!isPlantUnlocked(state, id) || !isUseful(state, id)) {
      return false;
    }
    const affordability = getAffordability(state, getPlantCost(state, id));
    return (
      affordability.kind === 'now' ||
      (affordability.kind === 'wait' && affordability.seconds <= profile.patienceSeconds)
    );
  });
  candidates.sort((a, b) => ownedCount(state, a) - ownedCount(state, b));
  return candidates[0];
}

/** One real second of decisions: click, research everything possible, then plant. */
export function botTurn(state: GameState, elapsedSeconds: number, profile: BotProfile): GameState {
  let next = state;
  if (elapsedSeconds < profile.clickForSeconds) {
    for (let i = 0; i < profile.clicksPerSecond; i++) {
      next = murmur(next);
    }
  }
  for (const id of DISCOVERY_IDS) {
    if (isDiscoveryAvailable(next, id)) {
      next = discover(next, id);
    }
  }
  for (let i = 0; i < 20; i++) {
    const id = target(next, profile);
    if (id === undefined || !canAfford(next, getPlantCost(next, id))) {
      break;
    }
    next = plant(next, id);
  }
  return next;
}
