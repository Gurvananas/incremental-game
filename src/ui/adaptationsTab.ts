import { ADAPTATIONS, ADAPTATION_IDS } from '../data/adaptations';
import { adapt } from '../engine/actions';
import type { GameState } from '../engine/state';
import { hasAdaptation, isAdaptationAvailable } from '../engine/unlocks';
import { t } from '../i18n';
import { costResources, createCostView } from './costView';
import { adaptationName, describeAdaptationEffects } from './describe';
import { button, h, hiddenSlot, slot } from './dom';
import type { Act } from './forestTab';

export function createAdaptationsTab(act: Act): {
  element: HTMLElement;
  render: (state: GameState) => void;
} {
  const cards = ADAPTATION_IDS.map((id) => {
    const cost = createCostView(costResources(ADAPTATIONS[id].cost));
    const element = button(
      { className: 'card', title: t(`adaptation.${id}.desc`) },
      [
        h('span', { className: 'card-name', text: adaptationName(id) }),
        cost.element,
        h('span', { className: 'card-effect', text: describeAdaptationEffects(id).join(' · ') }),
      ],
      () => act((state) => adapt(state, id)),
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
  const done = ADAPTATION_IDS.map((id) => {
    const element = h('li', { text: adaptationName(id), title: t(`adaptation.${id}.desc`) });
    return { id, setHidden: hiddenSlot(element), element };
  });
  const doneSection = h('section', { className: 'done' }, [
    h('h3', { text: t('adaptations.done') }),
    h(
      'ul',
      {},
      done.map((item) => item.element),
    ),
  ]);
  const setDoneHidden = hiddenSlot(doneSection);

  const element = h('div', {}, [
    h('p', { className: 'muted intro', text: t('adaptations.intro') }),
    h(
      'div',
      { className: 'cards' },
      cards.map((card) => card.element),
    ),
    doneSection,
  ]);

  return {
    element,
    render(state) {
      for (const card of cards) {
        const show = isAdaptationAvailable(state, card.id);
        card.setHidden(!show);
        if (show) {
          card.setDisabled(!card.cost.update(state, ADAPTATIONS[card.id].cost));
        }
      }
      for (const item of done) {
        item.setHidden(!hasAdaptation(state, item.id));
      }
      setDoneHidden(state.adaptations.length === 0);
    },
  };
}
