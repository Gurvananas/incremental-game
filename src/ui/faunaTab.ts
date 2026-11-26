import { NICHE_IDS } from '../data/niches';
import { assignNiches, callSize, callSpecies, getCallCost } from '../engine/actions';
import { canAfford } from '../engine/costs';
import { freeNiches, getCapacity, getNiches, speciesIn } from '../engine/habitat';
import { getProduction } from '../engine/production';
import type { GameState } from '../engine/state';
import { isResourceVisible, isSpeciesUnlocked } from '../engine/unlocks';
import { getLocale, t } from '../i18n';
import { costResources, createCostView } from './costView';
import { describeSpeciesEffects, nicheName, speciesName } from './describe';
import { button, classSlot, h, hiddenSlot, slot, textSlot } from './dom';
import type { Act } from './forestTab';
import { formatNumber, formatPercent } from './format';

function disabledSlot(element: HTMLButtonElement): (disabled: boolean) => void {
  return slot((disabled: boolean) => {
    element.disabled = disabled;
  });
}

/** One block per niche type, one row per species living there. */
export function createFaunaTab(act: Act): {
  element: HTMLElement;
  render: (state: GameState) => void;
} {
  const sections = NICHE_IDS.map((niche) => {
    const count = h('span', { className: 'niche-count' });
    const rows = speciesIn(niche).map((id) => {
      const population = h('span', { className: 'population' });
      const status = h('span', { className: 'species-status' });
      const less = button({ className: 'step', text: '−', title: t('fauna.less') }, [], () =>
        act((state) => assignNiches(state, id, -1)),
      );
      const more = button({ className: 'step', text: '+', title: t('fauna.more') }, [], () =>
        act((state) => assignNiches(state, id, 1)),
      );
      less.setAttribute('aria-label', `${t('fauna.less')}: ${speciesName(id)}`);
      more.setAttribute('aria-label', `${t('fauna.more')}: ${speciesName(id)}`);
      const callLabel = h('span');
      const cost = createCostView(costResources({ songs: 1 }));
      const call = button(
        { className: 'call', title: t('fauna.callHint') },
        [callLabel, cost.element],
        () => act((state) => callSpecies(state, id)),
      );
      const element = h('div', { className: 'species' }, [
        h('div', { className: 'species-head' }, [
          h('span', {
            className: 'card-name',
            text: speciesName(id),
            title: t(`species.${id}.desc`),
          }),
          population,
          status,
        ]),
        h('div', { className: 'card-effect', text: describeSpeciesEffects(id).join(' · ') }),
        h('div', { className: 'species-controls' }, [less, more, call]),
      ]);
      return {
        id,
        element,
        cost,
        setHidden: hiddenSlot(element),
        setPopulation: textSlot(population),
        setStatus: textSlot(status),
        setHungry: classSlot(status, 'hungry'),
        setLessDisabled: disabledSlot(less),
        setMoreDisabled: disabledSlot(more),
        setCallHidden: hiddenSlot(call),
        setCallDisabled: disabledSlot(call),
        setCallLabel: textSlot(callLabel),
      };
    });
    const element = h('section', { className: 'niche' }, [
      h('h3', {}, [nicheName(niche), ' ', count]),
      ...rows.map((row) => row.element),
    ]);
    return { niche, element, rows, setHidden: hiddenSlot(element), setCount: textSlot(count) };
  });

  const element = h('div', {}, [
    h('p', { className: 'muted intro', text: t('fauna.intro') }),
    ...sections.map((section) => section.element),
  ]);

  return {
    element,
    render(state) {
      const locale = getLocale();
      const niches = getNiches(state);
      const production = getProduction(state);
      const songsVisible = isResourceVisible(state, 'songs');
      for (const section of sections) {
        const unlocked = section.rows.filter((row) => isSpeciesUnlocked(state, row.id));
        section.setHidden(unlocked.length === 0);
        if (unlocked.length === 0) {
          continue;
        }
        const free = freeNiches(state, section.niche);
        section.setCount(t('fauna.niches', { free, total: niches[section.niche] }));
        for (const row of section.rows) {
          const visible = isSpeciesUnlocked(state, row.id);
          row.setHidden(!visible);
          if (!visible) {
            continue;
          }
          const n = state.animals[row.id];
          row.setPopulation(
            t('fauna.population', {
              count: formatNumber(Math.round(n), { locale }),
              capacity: formatNumber(Math.round(getCapacity(state, row.id) * 10) / 10, { locale }),
            }),
          );
          const fed = production.fed[row.id];
          const asleep = production.asleep[row.id] && n > 0;
          const hungry = !asleep && n >= 0.5 && fed < 0.99;
          row.setStatus(
            asleep
              ? t('fauna.asleep')
              : hungry
                ? t('fauna.hungry', { percent: formatPercent(fed, { locale }) })
                : '',
          );
          row.setHungry(hungry);
          row.setLessDisabled(state.assignments[row.id] === 0);
          row.setMoreDisabled(free === 0);
          // A Call only shows when Songs exist and the species has room for newcomers.
          const size = callSize(state, row.id);
          row.setCallHidden(!songsVisible || size < 1);
          if (songsVisible && size >= 1) {
            row.setCallLabel(t('fauna.call', { count: Math.floor(size) }));
            const callCost = getCallCost(state);
            row.cost.update(state, callCost);
            row.setCallDisabled(size < 1 || !canAfford(state, callCost));
          }
        }
      }
    },
  };
}
