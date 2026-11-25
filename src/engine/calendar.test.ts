import { describe, expect, it } from 'vitest';
import { DAYS_PER_SEASON, DAYS_PER_YEAR, SECONDS_PER_DAY } from '../data/time';
import { getCalendar } from './calendar';
import { createInitialState } from './state';
import { advance } from './tick';

describe('getCalendar', () => {
  it('starts on spring, day 1, year 1', () => {
    expect(getCalendar(0)).toEqual({ year: 1, season: 'spring', dayOfSeason: 1 });
  });

  it('keeps a partly elapsed day as the current day', () => {
    expect(getCalendar(0.99).dayOfSeason).toBe(1);
  });

  it('moves to summer after one season', () => {
    expect(getCalendar(DAYS_PER_SEASON)).toEqual({ year: 1, season: 'summer', dayOfSeason: 1 });
  });

  it('ends the year on the last day of winter', () => {
    expect(getCalendar(DAYS_PER_YEAR - 1)).toEqual({
      year: 1,
      season: 'winter',
      dayOfSeason: DAYS_PER_SEASON,
    });
  });

  it('starts year 2 after a full year', () => {
    expect(getCalendar(DAYS_PER_YEAR)).toEqual({ year: 2, season: 'spring', dayOfSeason: 1 });
  });

  it('lands exactly on summer after a season of real ticks despite float drift', () => {
    const state = advance(createInitialState(1), DAYS_PER_SEASON * SECONDS_PER_DAY);
    expect(getCalendar(state.days)).toEqual({ year: 1, season: 'summer', dayOfSeason: 1 });
  });
});
