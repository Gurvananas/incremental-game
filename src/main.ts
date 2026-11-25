import { simulateOffline } from './engine/offline';
import { SaveError, decodeSave, deserialize, encodeSave, serialize } from './engine/save';
import { createInitialState, type GameState } from './engine/state';
import { getLocale, isLocale, setLocale, t } from './i18n';
import { mountApp } from './ui/app';
import { mountDebugPanel } from './ui/debug';
import { formatDuration } from './ui/format';
import { createJournal } from './ui/journal';
import { startLoop } from './ui/loop';
import { clearSave, loadSave, writeSave } from './ui/storage';
import './ui/style.css';

const AUTOSAVE_MS = 30_000;
/** Only mention time away when it is long enough to matter. */
const WELCOME_BACK_MIN_SECONDS = 60;

const params = new URLSearchParams(window.location.search);
const lang = params.get('lang');
if (lang !== null && isLocale(lang)) {
  setLocale(lang);
}
document.documentElement.lang = getLocale();
document.title = t('game.title');

function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}

const journal = createJournal();
let state: GameState;
let speed = 1;

const loaded = loadSave();
if (loaded.kind === 'loaded') {
  const away = simulateOffline(loaded.save.state, (Date.now() - loaded.save.savedAt) / 1000);
  state = away.state;
  if (away.simulatedSeconds >= WELCOME_BACK_MIN_SECONDS) {
    journal.add(t('journal.welcomeBack', { duration: formatDuration(away.simulatedSeconds) }));
  }
} else {
  state = createInitialState(newSeed());
  if (loaded.kind === 'error') {
    journal.add(t(loaded.reason === 'too-new' ? 'journal.tooNew' : 'journal.loadError'));
  }
  journal.add(t('journal.newGame'));
}

const root = document.getElementById('app');
if (root === null) {
  throw new Error('Missing #app element');
}

const app = mountApp(root, journal, (update) => {
  const next = update(state);
  if (next !== state) {
    state = next;
    save();
    app.render(state);
  }
});
const render = (current: GameState): void => app.render(current);
const save = (): void => writeSave(state, Date.now());

if (import.meta.env.DEV || params.has('debug')) {
  mountDebugPanel(root, {
    getState: () => state,
    setState: (next) => {
      state = next;
      render(state);
    },
    getSpeed: () => speed,
    setSpeed: (next) => {
      speed = next;
    },
    exportCode: () => encodeSave(serialize(state, Date.now())),
    importCode: (code) => {
      try {
        state = deserialize(decodeSave(code)).state;
        save();
        journal.add(t('journal.imported'));
      } catch (error) {
        if (!(error instanceof SaveError)) {
          throw error;
        }
        journal.add(t('journal.importFailed'));
      }
      app.replace(state);
    },
    reset: () => {
      clearSave();
      state = createInitialState(newSeed());
      save();
      journal.add(t('journal.newGame'));
      app.replace(state);
    },
  });
}

render(state);
startLoop({
  getState: () => state,
  setState: (next) => {
    state = next;
  },
  getSpeed: () => speed,
  render: () => render(state),
  onCatchUp: (seconds) => {
    if (seconds >= WELCOME_BACK_MIN_SECONDS) {
      journal.add(t('journal.welcomeBack', { duration: formatDuration(seconds) }));
    }
  },
});

setInterval(save, AUTOSAVE_MS);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    save();
  }
});
window.addEventListener('pagehide', save);
