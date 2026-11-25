import { DISCOVERIES, DISCOVERY_IDS } from '../data/discoveries';
import { discover } from '../engine/actions';
import type { GameState } from '../engine/state';
import { hasDiscovery, isDiscoveryAvailable } from '../engine/unlocks';
import { t } from '../i18n';
import { costResources, createCostView } from './costView';
import { describeDiscoveryEffects, discoveryName } from './describe';
import { button, h, hiddenSlot, slot } from './dom';
import type { Act } from './forestTab';

export function createMyceliumTab(act: Act): {
  element: HTMLElement;
  render: (state: GameState) => void;
} {
  const cards = DISCOVERY_IDS.map((id) => {
    const cost = createCostView(costResources(DISCOVERIES[id].cost));
    const element = button(
      { className: 'card', title: t(`discovery.${id}.desc`) },
      [
        h('span', { className: 'card-name', text: discoveryName(id) }),
        cost.element,
        h('span', { className: 'card-effect', text: describeDiscoveryEffects(id).join(' · ') }),
      ],
      () => act((state) => discover(state, id)),
    );
    return {
      id,
      element,
      cost,
      setHidden: hiddenSlot(element),
      setDisabled: slot((disabled: boolean) => {
        element.disabled = disabled;
      }),
    };
  });

  const done = DISCOVERY_IDS.map((id) => {
    const element = h('li', { text: discoveryName(id), title: t(`discovery.${id}.desc`) });
    return { id, element, setHidden: hiddenSlot(element) };
  });
  const doneSection = h('section', { className: 'done' }, [
    h('h3', { text: t('mycelium.done') }),
    h(
      'ul',
      {},
      done.map((item) => item.element),
    ),
  ]);
  const setDoneHidden = hiddenSlot(doneSection);
  const nothing = h('p', { className: 'muted', text: t('mycelium.nothing') });
  const setNothingHidden = hiddenSlot(nothing);

  const element = h('div', {}, [
    h('p', { className: 'muted intro', text: t('mycelium.intro') }),
    h(
      'div',
      { className: 'cards' },
      cards.map((card) => card.element),
    ),
    nothing,
    doneSection,
  ]);

  return {
    element,
    render(state) {
      let available = 0;
      for (const card of cards) {
        const show = isDiscoveryAvailable(state, card.id);
        card.setHidden(!show);
        if (show) {
          available += 1;
          card.setDisabled(!card.cost.update(state, DISCOVERIES[card.id].cost));
        }
      }
      setNothingHidden(available > 0);
      for (const item of done) {
        item.setHidden(!hasDiscovery(state, item.id));
      }
      setDoneHidden(state.discoveries.length === 0);
    },
  };
}
