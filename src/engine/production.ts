import { BASE_RAIN_PER_SECOND, SEASON_RAIN_MULTIPLIER } from '../data/climate';
import { RESOURCE_IDS, RESOURCES, type ResourceId } from '../data/resources';
import { getCalendar } from './calendar';
import type { GameState } from './state';

export type PerResource = Record<ResourceId, number>;

function zeroes(): PerResource {
  const values = {} as PerResource;
  for (const id of RESOURCE_IDS) {
    values[id] = 0;
  }
  return values;
}

/** Storage caps. Plantations and upgrades will raise them. */
export function getCaps(_state: GameState): PerResource {
  const caps = zeroes();
  for (const id of RESOURCE_IDS) {
    caps[id] = RESOURCES[id].baseCap;
  }
  return caps;
}

/** Net change per real second for every resource. */
export function getRates(state: GameState): PerResource {
  const rates = zeroes();
  const { season } = getCalendar(state.days);
  rates.water += BASE_RAIN_PER_SECOND * SEASON_RAIN_MULTIPLIER[season];
  return rates;
}
