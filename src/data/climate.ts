import type { Season } from './time';

/**
 * Placeholder climate: bare ground catches rain, nothing else happens yet.
 * Values come from docs/design.md ("Pluie" column) and will be tuned in v0.1.
 */

/** Water gained per real second from rain, before seasonal multipliers. */
export const BASE_RAIN_PER_SECOND = 0.5;

export const SEASON_RAIN_MULTIPLIER: Readonly<Record<Season, number>> = {
  spring: 1.25,
  summer: 0.6,
  autumn: 1.25,
  winter: 1,
};
