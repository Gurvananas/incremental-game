/**
 * Time settings. Every gameplay number lives in src/data, never in the engine.
 * See docs/design.md, "Cycles : saisons, météo, années".
 */

/** Real seconds per game day. */
export const SECONDS_PER_DAY = 2;

export const DAYS_PER_SEASON = 100;

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

export const DAYS_PER_YEAR = DAYS_PER_SEASON * SEASONS.length;

/** Offline progress is simulated up to this many real seconds (48 h). */
export const OFFLINE_MAX_SECONDS = 48 * 3600;

/** Offline progress is simulated in coarse steps of one game day. */
export const OFFLINE_STEP_SECONDS = SECONDS_PER_DAY;
