import { RESOURCE_IDS } from '../src/data/resources';
import { SECONDS_PER_DAY } from '../src/data/time';
import { getCalendar, type CalendarDate } from '../src/engine/calendar';
import { getCaps } from '../src/engine/production';
import { createInitialState, type GameState, type Resources } from '../src/engine/state';
import { advance } from '../src/engine/tick';

export interface SimulationOptions {
  readonly seed: number;
  readonly days: number;
}

export interface Sample {
  readonly date: CalendarDate;
  readonly resources: Resources;
}

export interface SimulationReport {
  readonly final: GameState;
  /** One sample at the start of each season. */
  readonly samples: readonly Sample[];
  /** Broken invariants: a non-empty list fails the run. */
  readonly violations: readonly string[];
}

/**
 * Plays the game without any UI, one game day at a time, with the real fixed step.
 * For now it only checks invariants. It will grow a simple strategy (buy what is
 * useful and cheapest) and pacing targets: time to reach each era (docs/design.md).
 */
export function runSimulation({ seed, days }: SimulationOptions): SimulationReport {
  let state = createInitialState(seed);
  const samples: Sample[] = [{ date: getCalendar(0), resources: state.resources }];
  const violations: string[] = [];

  for (let day = 1; day <= days; day++) {
    state = advance(state, SECONDS_PER_DAY);
    const caps = getCaps(state);
    for (const id of RESOURCE_IDS) {
      const amount = state.resources[id];
      if (!Number.isFinite(amount) || amount < 0 || amount > caps[id] + 1e-9) {
        violations.push(`day ${day}: ${id} = ${amount} (cap ${caps[id]})`);
      }
    }
    const date = getCalendar(state.days);
    if (date.dayOfSeason === 1) {
      samples.push({ date, resources: state.resources });
    }
  }

  return { final: state, samples, violations };
}
