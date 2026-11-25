import { simulateOffline } from '../engine/offline';
import type { GameState } from '../engine/state';
import { advance, STEP_SECONDS } from '../engine/tick';

/** The screen refreshes 10 times per second; the simulation runs in fixed 0.2 s steps. */
const FRAME_MS = 100;

/**
 * Browsers throttle background tabs, so time is always measured, never counted
 * in ticks. A gap longer than this is caught up in coarse offline steps.
 */
const CATCH_UP_THRESHOLD_SECONDS = 5;

export interface LoopHooks {
  readonly getState: () => GameState;
  readonly setState: (state: GameState) => void;
  /** Debug time multiplier (1 in normal play). */
  readonly getSpeed: () => number;
  readonly render: () => void;
  readonly onCatchUp?: (simulatedSeconds: number) => void;
}

export function startLoop(hooks: LoopHooks): () => void {
  let last = performance.now();
  let pending = 0;

  const frame = (): void => {
    const now = performance.now();
    const realElapsed = (now - last) / 1000;
    last = now;
    let state = hooks.getState();

    if (realElapsed > CATCH_UP_THRESHOLD_SECONDS) {
      const result = simulateOffline(state, realElapsed * hooks.getSpeed());
      state = result.state;
      hooks.onCatchUp?.(result.simulatedSeconds);
    } else {
      pending += realElapsed * hooks.getSpeed();
      const steps = Math.floor(pending / STEP_SECONDS);
      if (steps > 0) {
        state = advance(state, steps * STEP_SECONDS);
        pending -= steps * STEP_SECONDS;
      }
    }

    hooks.setState(state);
    hooks.render();
  };

  const id = setInterval(frame, FRAME_MS);
  return () => clearInterval(id);
}
