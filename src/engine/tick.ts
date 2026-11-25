import { RESOURCE_IDS, type ResourceId } from '../data/resources';
import { SECONDS_PER_DAY } from '../data/time';
import { getCaps, getRates } from './production';
import type { GameState } from './state';

/** Fixed simulation step, in real seconds (5 ticks per second). */
export const STEP_SECONDS = 0.2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Advances the game by `dt` real seconds. Pure: returns a new state. */
export function step(state: GameState, dt: number): GameState {
  const rates = getRates(state);
  const caps = getCaps(state);
  const resources = { ...state.resources } as Record<ResourceId, number>;
  for (const id of RESOURCE_IDS) {
    resources[id] = clamp(resources[id] + rates[id] * dt, 0, caps[id]);
  }
  return { ...state, days: state.days + dt / SECONDS_PER_DAY, resources };
}

/**
 * Advances the game by `seconds` real seconds in fixed steps of `stepSeconds`.
 * The remainder, if any, is applied as one last shorter step.
 */
export function advance(
  state: GameState,
  seconds: number,
  stepSeconds: number = STEP_SECONDS,
): GameState {
  if (seconds <= 0) {
    return state;
  }
  const fullSteps = Math.floor(seconds / stepSeconds + 1e-9);
  let next = state;
  for (let i = 0; i < fullSteps; i++) {
    next = step(next, stepSeconds);
  }
  const remainder = seconds - fullSteps * stepSeconds;
  if (remainder > 1e-9) {
    next = step(next, remainder);
  }
  return next;
}
