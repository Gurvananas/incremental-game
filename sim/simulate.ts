import type { DiscoveryId } from '../src/data/discoveries';
import type { Era } from '../src/data/eras';
import { PLANT_IDS } from '../src/data/plants';
import { RESOURCE_IDS } from '../src/data/resources';
import { getCalendar, type CalendarDate } from '../src/engine/calendar';
import { getCaps } from '../src/engine/production';
import { createInitialState, type GameState } from '../src/engine/state';
import { advance } from '../src/engine/tick';
import { getEra, ownedCount } from '../src/engine/unlocks';
import { ACTIVE_PLAYER, botTurn, type BotProfile } from './strategy';

export interface SimulationOptions {
  readonly seed: number;
  /** Real seconds to play. */
  readonly seconds: number;
  readonly profile?: BotProfile;
}

/** Real seconds from the start of the run at which something first happened. */
export interface Milestones {
  readonly firstPlant?: number;
  readonly discoveries: Partial<Record<DiscoveryId, number>>;
  readonly eras: Partial<Record<Era, number>>;
}

export interface Sample {
  readonly second: number;
  readonly date: CalendarDate;
  readonly state: GameState;
}

export interface SimulationReport {
  readonly final: GameState;
  readonly milestones: Milestones;
  /** One sample at the start of each season. */
  readonly samples: readonly Sample[];
  /** Broken invariants: a non-empty list fails the run. */
  readonly violations: readonly string[];
}

function checkInvariants(state: GameState, second: number, violations: string[]): void {
  const caps = getCaps(state);
  for (const id of RESOURCE_IDS) {
    const amount = state.resources[id];
    if (!Number.isFinite(amount) || amount < -1e-9 || amount > caps[id] + 1e-9) {
      violations.push(`t=${second}s: ${id} = ${amount} (cap ${caps[id]})`);
    }
  }
  for (const id of PLANT_IDS) {
    if (!Number.isInteger(state.plants[id]) || state.plants[id] < 0) {
      violations.push(`t=${second}s: ${id} count = ${state.plants[id]}`);
    }
  }
}

/**
 * Plays the game without any UI: each real second the bot decides, then the
 * engine advances one second with the real fixed step. Measures when the
 * milestones happen, to check pacing against docs/design.md.
 */
export function runSimulation({
  seed,
  seconds,
  profile = ACTIVE_PLAYER,
}: SimulationOptions): SimulationReport {
  let state = createInitialState(seed);
  let firstPlant: number | undefined;
  const discoveries: Partial<Record<DiscoveryId, number>> = {};
  const eras: Partial<Record<Era, number>> = { 1: 0 };
  const samples: Sample[] = [{ second: 0, date: getCalendar(0), state }];
  const violations: string[] = [];
  let lastSeason = getCalendar(0).season;

  for (let second = 0; second < seconds; second++) {
    state = botTurn(state, second, profile);
    if (firstPlant === undefined && PLANT_IDS.some((id) => ownedCount(state, id) > 0)) {
      firstPlant = second;
    }
    for (const id of state.discoveries) {
      discoveries[id] ??= second;
    }
    eras[getEra(state)] ??= second;

    state = advance(state, 1);
    checkInvariants(state, second + 1, violations);
    const date = getCalendar(state.days);
    if (date.season !== lastSeason) {
      samples.push({ second: second + 1, date, state });
      lastSeason = date.season;
    }
  }

  const milestones: Milestones =
    firstPlant === undefined ? { discoveries, eras } : { firstPlant, discoveries, eras };
  return { final: state, milestones, samples, violations };
}
