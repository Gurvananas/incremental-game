import { PLANT_IDS } from '../data/plants';
import { DAYS_PER_SEASON } from '../data/time';
import { getCalendar } from '../engine/calendar';
import { getProduction } from '../engine/production';
import type { GameState } from '../engine/state';
import { getEra, isResourceVisible, ownedCount } from '../engine/unlocks';
import { t } from '../i18n';
import { discoveryName } from './describe';
import type { Journal } from './journal';

/**
 * Watches the state between renders and writes what changed into the journal:
 * new seasons, first plantations, discoveries, eras, droughts.
 * The first state it sees only sets the baseline, so loading a save is silent.
 */
export function createNarrator(journal: Journal): (state: GameState) => void {
  let previous: GameState | undefined;
  let lastDroughtSeason = -1;

  return (state) => {
    const before = previous;
    previous = state;
    if (before === undefined || before === state) {
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

    if (getEra(before) < 2 && getEra(state) >= 2) {
      journal.add(t('journal.era.2'));
    }

    // At most one drought message per season.
    const seasonIndex = Math.floor(state.days / DAYS_PER_SEASON);
    if (getProduction(state).modifiers.waterSupply < 1 && seasonIndex !== lastDroughtSeason) {
      lastDroughtSeason = seasonIndex;
      journal.add(t('journal.drought'));
    }
  };
}
