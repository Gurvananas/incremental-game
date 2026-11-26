import { PLANT_IDS } from '../data/plants';
import { SPECIES_IDS } from '../data/species';
import { DAYS_PER_SEASON } from '../data/time';
import { getCalendar } from '../engine/calendar';
import { getProduction } from '../engine/production';
import type { GameState } from '../engine/state';
import {
  getEra,
  isBalanceActive,
  isResourceVisible,
  isSpeciesUnlocked,
  ownedCount,
} from '../engine/unlocks';
import { t } from '../i18n';
import { discoveryName, plantName, speciesName } from './describe';
import type { Journal } from './journal';

export interface Narrator {
  /** Writes into the journal what changed since the last state it saw. */
  observe(state: GameState): void;
  /** Starts again from this state without telling anything (load, import, reset). */
  rebase(state: GameState): void;
}

/** Engine events, told in the journal. Some kinds are told at most once a season. */
function tellEvent(event: GameState['events'][number]): string | undefined {
  switch (event.kind) {
    case 'forecast':
      return t(`journal.forecast.${event.weather}`);
    case 'mast':
      return t('journal.mast');
    case 'fell':
      return t(`journal.fell.${event.cause}`, { name: plantName(event.plant), count: event.count });
    case 'lightning':
      return t('journal.lightning', { name: plantName(event.plant), count: event.count });
    case 'beetles':
      return t(`journal.beetles.${event.phase}`);
    case 'seedlingsLost':
      return t('journal.seedlingsLost', { count: event.count });
    case 'planted':
      return t('journal.planted', {
        species: speciesName(event.species),
        name: plantName(event.plant),
        count: event.count,
      });
  }
}

/** Kinds of event that would flood the journal: told once per season at most. */
const SEASONAL_EVENTS = new Set(['planted', 'seedlingsLost', 'beetles-risk', 'fell-age']);

/**
 * Watches the state between renders and writes what changed into the journal:
 * new seasons, first plantations, arrivals, discoveries, eras, troubles.
 * The first state it sees only sets the baseline, so loading a save is silent.
 */
export function createNarrator(journal: Journal): Narrator {
  let previous: GameState | undefined;
  // At most one message of each kind of trouble per season.
  const lastWarned = { drought: -1, overgrazing: -1, pests: -1 };
  const lastTold = new Map<string, number>();
  let lastEvent = 0;

  const observe = (state: GameState): void => {
    const before = previous;
    previous = state;
    if (before === undefined) {
      lastEvent = state.eventCount;
      return;
    }
    if (before === state) {
      return;
    }

    const season = getCalendar(state.days).season;
    if (season !== getCalendar(before.days).season) {
      journal.add(t(`journal.season.${season}`));
    }

    for (const plant of PLANT_IDS) {
      if (ownedCount(before, plant) === 0 && ownedCount(state, plant) > 0) {
        journal.add(t(`journal.first.${plant}`));
      }
    }

    if (!isResourceVisible(before, 'spores') && isResourceVisible(state, 'spores')) {
      journal.add(t('journal.mycelium'));
    }

    for (const id of state.discoveries.slice(before.discoveries.length)) {
      journal.add(t('journal.discovery', { name: discoveryName(id) }));
    }

    for (const id of SPECIES_IDS) {
      if (!isSpeciesUnlocked(before, id) && isSpeciesUnlocked(state, id)) {
        journal.add(t('journal.unlocked', { name: speciesName(id) }));
      }
      if (before.animals[id] < 1 && state.animals[id] >= 1) {
        journal.add(t(`journal.arrival.${id}`));
      }
    }

    const eraBefore = getEra(before);
    const era = getEra(state);
    if (eraBefore < 2 && era >= 2) {
      journal.add(t('journal.era.2'));
    }
    if (eraBefore < 3 && era >= 3) {
      journal.add(t('journal.era.3'));
    }
    if (eraBefore < 4 && era >= 4) {
      journal.add(t('journal.era.4'));
    }
    if (eraBefore < 5 && era >= 5) {
      journal.add(t('journal.era.5'));
    }

    if (!isBalanceActive(before) && isBalanceActive(state)) {
      journal.add(t('journal.balance'));
    }

    const seasonIndex = Math.floor(state.days / DAYS_PER_SEASON);
    for (const event of state.events) {
      if (event.id <= lastEvent) {
        continue;
      }
      lastEvent = event.id;
      const key =
        event.kind === 'beetles'
          ? `beetles-${event.phase}`
          : event.kind === 'fell'
            ? `fell-${event.cause}`
            : event.kind;
      if (SEASONAL_EVENTS.has(key)) {
        if (lastTold.get(key) === seasonIndex) {
          continue;
        }
        lastTold.set(key, seasonIndex);
      }
      const text = tellEvent(event);
      if (text !== undefined) {
        journal.add(text);
      }
    }

    const { waterSupply, grazing, pests } = getProduction(state).modifiers;
    const warn = (kind: keyof typeof lastWarned, active: boolean, text: string): void => {
      if (active && lastWarned[kind] !== seasonIndex) {
        lastWarned[kind] = seasonIndex;
        journal.add(text);
      }
    };
    warn('drought', waterSupply < 1, t('journal.drought'));
    warn('overgrazing', grazing < 1, t('journal.overgrazing'));
    warn('pests', pests < 1, t('journal.pests'));
  };

  return {
    observe,
    rebase(state) {
      previous = state;
      lastEvent = state.eventCount;
    },
  };
}
