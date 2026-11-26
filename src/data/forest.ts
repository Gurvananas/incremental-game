/** Canopy and growth stages (docs/design.md, "Stades de croissance" and "Canopée"). */

/** The land's surface: crowns are measured against it. Territory will extend it. */
export const LAND_SURFACE = 100;

/** The canopy never closes completely. */
export const MAX_CANOPY = 0.95;

/** Shade plants produce (SHADE_BASE + canopy): a little even in full sun. */
export const SHADE_BASE = 0.3;

/** A seedling past half its growth time is young and produces this share. */
export const YOUNG_PRODUCTION = 0.5;

/** The engine keeps this many recent events for the journal. */
export const EVENT_LOG_SIZE = 30;
