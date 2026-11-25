import { DAYS_PER_SEASON, OFFLINE_STEP_SECONDS, SECONDS_PER_DAY } from '../data/time';
import { fillResources } from '../engine/debug';
import type { GameState } from '../engine/state';
import { advance } from '../engine/tick';
import { t } from '../i18n';
import { h } from './dom';

export interface DebugControls {
  getState(): GameState;
  setState(state: GameState): void;
  getSpeed(): number;
  setSpeed(speed: number): void;
  exportCode(): string;
  importCode(code: string): void;
  reset(): void;
}

const SPEEDS = [1, 10, 100] as const;

function button(label: string, onClick: () => void): HTMLButtonElement {
  const element = h('button', { text: label });
  element.type = 'button';
  element.addEventListener('click', onClick);
  return element;
}

/** Shown in dev mode or with ?debug in the URL. Lets you test late eras without waiting. */
export function mountDebugPanel(root: HTMLElement, controls: DebugControls): void {
  const speedButtons = SPEEDS.map((speed) =>
    button(`×${speed}`, () => {
      controls.setSpeed(speed);
      refresh();
    }),
  );
  const refresh = (): void => {
    speedButtons.forEach((element, i) => {
      element.setAttribute('aria-pressed', String(SPEEDS[i] === controls.getSpeed()));
    });
  };
  refresh();

  root.append(
    h('details', { className: 'debug' }, [
      h('summary', { text: t('debug.title') }),
      h('div', { className: 'debug-row' }, [
        h('span', { text: t('debug.speed') }),
        ...speedButtons,
      ]),
      h('div', { className: 'debug-row' }, [
        button(t('debug.skipSeason'), () => {
          const seconds = DAYS_PER_SEASON * SECONDS_PER_DAY;
          controls.setState(advance(controls.getState(), seconds, OFFLINE_STEP_SECONDS));
        }),
        button(t('debug.fill'), () => controls.setState(fillResources(controls.getState()))),
      ]),
      h('div', { className: 'debug-row' }, [
        button(t('debug.export'), () => {
          window.prompt(t('debug.exportPrompt'), controls.exportCode());
        }),
        button(t('debug.import'), () => {
          const code = window.prompt(t('debug.importPrompt'));
          if (code !== null && code.trim() !== '') {
            controls.importCode(code);
          }
        }),
        button(t('debug.reset'), () => {
          if (window.confirm(t('debug.resetConfirm'))) {
            controls.reset();
          }
        }),
      ]),
    ]),
  );
}
