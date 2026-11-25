import { DAYS_PER_SEASON, DAYS_PER_YEAR, SEASONS, type Season } from '../data/time';

export interface CalendarDate {
  /** Starts at 1. */
  readonly year: number;
  readonly season: Season;
  /** Starts at 1. */
  readonly dayOfSeason: number;
}

/**
 * Time is accumulated in small float steps (0.1 day at a time), so 100 days can
 * come out as 99.99999999. This tolerance keeps day boundaries exact.
 */
const DAY_EPSILON = 1e-6;

export function getCalendar(days: number): CalendarDate {
  const whole = Math.floor(days + DAY_EPSILON);
  const dayOfYear = whole % DAYS_PER_YEAR;
  const season = SEASONS[Math.floor(dayOfYear / DAYS_PER_SEASON)];
  if (season === undefined) {
    throw new Error(`Invalid day count: ${days}`);
  }
  return {
    year: Math.floor(whole / DAYS_PER_YEAR) + 1,
    season,
    dayOfSeason: (dayOfYear % DAYS_PER_SEASON) + 1,
  };
}
