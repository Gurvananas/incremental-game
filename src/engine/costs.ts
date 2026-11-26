import { PLANTS, type PlantId } from '../data/plants';
import { RESOURCE_IDS, type Amounts, type ResourceId } from '../data/resources';
import { getProduction, type Production } from './production';
import type { GameState } from './state';
import { ownedCount } from './unlocks';

/** Cost of the next plantation: base × growth^owned. */
export function getPlantCost(state: GameState, plant: PlantId): Amounts {
  const def = PLANTS[plant];
  const factor = def.costGrowth ** ownedCount(state, plant);
  const cost: Amounts = {};
  for (const id of RESOURCE_IDS) {
    const base = def.cost[id];
    if (base !== undefined) {
      cost[id] = base * factor;
    }
  }
  return cost;
}

export function canAfford(state: GameState, cost: Amounts): boolean {
  return RESOURCE_IDS.every((id) => state.resources[id] >= (cost[id] ?? 0));
}

export function pay(state: GameState, cost: Amounts): GameState {
  const resources = { ...state.resources } as Record<ResourceId, number>;
  for (const id of RESOURCE_IDS) {
    resources[id] -= cost[id] ?? 0;
  }
  return { ...state, resources };
}

export type Affordability =
  | { readonly kind: 'now' }
  /** Affordable later at current rates. */
  | { readonly kind: 'wait'; readonly seconds: number }
  /** A resource is short and nothing produces it right now. */
  | { readonly kind: 'stalled' }
  /** A resource costs more than its storage can ever hold. */
  | { readonly kind: 'over-cap'; readonly resource: ResourceId };

/** `production` can be passed in when it is already computed for this state. */
export function getAffordability(
  state: GameState,
  cost: Amounts,
  production: Production = getProduction(state),
): Affordability {
  const { caps, rates } = production;
  let seconds = 0;
  for (const id of RESOURCE_IDS) {
    const needed = cost[id] ?? 0;
    if (needed > caps[id]) {
      return { kind: 'over-cap', resource: id };
    }
    const missing = needed - state.resources[id];
    if (missing > 0) {
      if (rates[id] <= 0) {
        return { kind: 'stalled' };
      }
      seconds = Math.max(seconds, missing / rates[id]);
    }
  }
  return seconds === 0 ? { kind: 'now' } : { kind: 'wait', seconds };
}
