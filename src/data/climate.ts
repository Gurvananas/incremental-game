import type { ResourceId } from './resources';
import type { Season } from './time';

/** Seasons values from docs/design.md ("Cycles : saisons, météo, années"). */

/** Water gained per real second from rain, before the seasonal multiplier. */
export const BASE_RAIN_PER_SECOND = 0.5;

export const SEASON_RAIN_MULTIPLIER: Readonly<Record<Season, number>> = {
  spring: 1.25,
  summer: 0.6,
  autumn: 1.25,
  winter: 1,
};

/** Seasonal multiplier applied to what plants produce, per resource. Missing = ×1. */
export const SEASON_PRODUCTION_MULTIPLIER: Readonly<
  Partial<Record<ResourceId, Readonly<Record<Season, number>>>>
> = {
  sap: { spring: 1.25, summer: 1.5, autumn: 0.75, winter: 0.1 },
};

/** Seasons when seedlings stop growing (winter dormancy). */
export const GROWTH_PAUSED_SEASONS: readonly Season[] = ['winter'];
