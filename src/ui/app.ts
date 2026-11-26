import { getCalendar } from '../engine/calendar';
import type { GameState } from '../engine/state';
import { ADAPTATION_IDS } from '../data/adaptations';
import { SPECIES_IDS } from '../data/species';
import { adultTrees } from '../engine/forest';
import { getProduction } from '../engine/production';
import {
  getEra,
  isAdaptationAvailable,
  isBalanceActive,
  isResourceVisible,
  isSpeciesUnlocked,
} from '../engine/unlocks';
import { getLocale, t } from '../i18n';
import { button, classSlot, h, hiddenSlot, slot, textSlot } from './dom';
import { createAdaptationsTab } from './adaptationsTab';
import { createFaunaTab } from './faunaTab';
import { createForestTab, type Act } from './forestTab';
import { formatNumber, formatPercent, roman } from './format';
import type { Journal } from './journal';
import { createMyceliumTab } from './myceliumTab';
import { createNarrator } from './narrator';
import { createResourcesPanel } from './resourcesPanel';

type TabId = 'forest' | 'mycelium' | 'fauna' | 'adaptations';

export interface App {
  /** Writes only what changed since the last render. */
  render(state: GameState): void;
  /** Replaces the whole state (import, reset) without narrating the difference. */
  replace(state: GameState): void;
}

/** Builds the screen once; rendering then only writes what changed. */
export function mountApp(root: HTMLElement, journal: Journal, act: Act): App {
  const era = h('p', { className: 'era' });
  const setEra = textSlot(era);
  const date = h('p', { className: 'date' });
  const setDate = textSlot(date);
  const sky = h('p', { className: 'sky' });
  const setSky = textSlot(sky);
  const balance = h('p', { className: 'balance' });
  const setBalance = textSlot(balance);
  const setBalanceHidden = hiddenSlot(balance);
  const setBalanceTitle = slot((title: string) => {
    balance.title = title;
  });

  const resources = createResourcesPanel();
  const forest = createForestTab(act);
  const mycelium = createMyceliumTab(act);
  const fauna = createFaunaTab(act);
  const adaptations = createAdaptationsTab(act);
  const narrate = createNarrator(journal);

  let active: TabId = 'forest';
  const open: Record<TabId, boolean> = {
    forest: true,
    mycelium: false,
    fauna: false,
    adaptations: false,
  };
  const applyTabs = (): void => {
    for (const tab of tabs) {
      tab.setHidden(!open[tab.id]);
      tab.setActive(tab.id === active);
      tab.setPanelHidden(tab.id !== active);
    }
  };
  const tabs = (
    [
      { id: 'forest', label: t('tab.forest'), panel: forest.element },
      { id: 'mycelium', label: t('tab.mycelium'), panel: mycelium.element },
      { id: 'fauna', label: t('tab.fauna'), panel: fauna.element },
      { id: 'adaptations', label: t('tab.adaptations'), panel: adaptations.element },
    ] as const
  ).map((tab) => {
    const element = button({ className: 'tab', text: tab.label }, [], () => {
      active = tab.id;
      applyTabs();
    });
    element.setAttribute('role', 'tab');
    return {
      ...tab,
      element,
      setHidden: hiddenSlot(element),
      setActive: classSlot(element, 'active'),
      setPanelHidden: hiddenSlot(tab.panel),
    };
  });

  root.append(
    h('header', { className: 'top' }, [
      h('h1', { text: t('game.title') }),
      era,
      balance,
      sky,
      date,
      h('span', { className: 'version', text: `v${__APP_VERSION__}` }),
    ]),
    h('main', { className: 'layout' }, [
      resources.element,
      h('section', { className: 'panel center' }, [
        h(
          'nav',
          { className: 'tabs' },
          tabs.map((tab) => tab.element),
        ),
        ...tabs.map((tab) => tab.panel),
      ]),
      h('aside', { className: 'panel journal' }, [
        h('h2', { text: t('panel.journal') }),
        journal.element,
      ]),
    ]),
  );

  const render = (state: GameState): void => {
    const calendar = getCalendar(state.days);
    const currentEra = getEra(state);
    setEra(t('era.label', { numeral: roman(currentEra), name: t(`era.${currentEra}`) }));
    setDate(
      t('calendar.date', {
        season: t(`season.${calendar.season}`),
        day: calendar.dayOfSeason,
        year: calendar.year,
      }),
    );

    const locale = getLocale();
    const modifiers = getProduction(state).modifiers;
    const skyParts = [t(`weather.${state.weather.kind}`)];
    if (adultTrees(state) > 0) {
      skyParts.push(t('canopy.label', { percent: formatPercent(modifiers.canopy, { locale }) }));
    }
    if (modifiers.mast) {
      skyParts.push(t('mast.label'));
    }
    setSky(skyParts.join(' · '));
    if (isBalanceActive(state)) {
      const { balance: value, balanceMultiplier } = modifiers;
      setBalance(
        t('balance.label', { value: formatNumber(Math.round(value * 10) / 10, { locale }) }),
      );
      setBalanceTitle(
        t('balance.tooltip', { percent: formatPercent(balanceMultiplier - 1, { locale }) }),
      );
    }
    setBalanceHidden(!isBalanceActive(state));

    open.mycelium = isResourceVisible(state, 'spores');
    open.fauna = SPECIES_IDS.some((id) => isSpeciesUnlocked(state, id));
    open.adaptations =
      state.adaptations.length > 0 || ADAPTATION_IDS.some((id) => isAdaptationAvailable(state, id));
    if (!open[active]) {
      active = 'forest';
    }
    applyTabs();

    // Both tabs are kept up to date, so switching tabs never shows stale buttons.
    resources.render(state);
    forest.render(state);
    mycelium.render(state);
    fauna.render(state);
    adaptations.render(state);
    narrate.observe(state);
  };

  return {
    render,
    replace(state) {
      narrate.rebase(state);
      render(state);
    },
  };
}
