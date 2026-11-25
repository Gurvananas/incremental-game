import { getCalendar } from '../engine/calendar';
import type { GameState } from '../engine/state';
import { getEra, isResourceVisible } from '../engine/unlocks';
import { t } from '../i18n';
import { button, classSlot, h, hiddenSlot, textSlot } from './dom';
import { createForestTab, type Act } from './forestTab';
import { roman } from './format';
import type { Journal } from './journal';
import { createMyceliumTab } from './myceliumTab';
import { createNarrator } from './narrator';
import { createResourcesPanel } from './resourcesPanel';

type TabId = 'forest' | 'mycelium';

/** Builds the screen once and returns a render function that only writes what changed. */
export function mountApp(
  root: HTMLElement,
  journal: Journal,
  act: Act,
): (state: GameState) => void {
  const era = h('p', { className: 'era' });
  const setEra = textSlot(era);
  const date = h('p', { className: 'date' });
  const setDate = textSlot(date);

  const resources = createResourcesPanel();
  const forest = createForestTab(act);
  const mycelium = createMyceliumTab(act);
  const narrate = createNarrator(journal);

  let active: TabId = 'forest';
  let myceliumOpen = false;
  const applyTabs = (): void => {
    for (const tab of tabs) {
      tab.setHidden(tab.id === 'mycelium' && !myceliumOpen);
      tab.setActive(tab.id === active);
      tab.setPanelHidden(tab.id !== active);
    }
  };
  const tabs = (
    [
      { id: 'forest', label: t('tab.forest'), panel: forest.element },
      { id: 'mycelium', label: t('tab.mycelium'), panel: mycelium.element },
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

  return (state) => {
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

    myceliumOpen = isResourceVisible(state, 'spores');
    if (!myceliumOpen && active === 'mycelium') {
      active = 'forest';
    }
    applyTabs();

    // Both tabs are kept up to date, so switching tabs never shows stale buttons.
    resources.render(state);
    forest.render(state);
    mycelium.render(state);
    narrate(state);
  };
}
