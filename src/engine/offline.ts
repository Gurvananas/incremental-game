import { OFFLINE_MAX_SECONDS, OFFLINE_STEP_SECONDS } from '../data/time';
import type { GameState } from './state';
import { advance } from './tick';

export interface OfflineResult {
  readonly state: GameState;
  /** Real seconds actually simulated, after the cap. */
  readonly simulatedSeconds: number;
}

/**
 * Catches up on time spent away (closed tab, throttled background tab).
 * Uses coarse steps so 48 h stay fast to compute.
 */
export function simulateOffline(state: GameState, elapsedSeconds: number): OfflineResult {
  const simulatedSeconds = Math.min(Math.max(0, elapsedSeconds), OFFLINE_MAX_SECONDS);
  return {
    state: advance(state, simulatedSeconds, OFFLINE_STEP_SECONDS),
    simulatedSeconds,
  };
}
