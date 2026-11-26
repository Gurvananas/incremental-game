import { MURMUR_SAP } from '../data/actions';
import { PLANTS, PLANT_IDS } from '../data/plants';
import { murmur, plant } from '../engine/actions';
import { getPlantCost } from '../engine/costs';
import type { GameState } from '../engine/state';
import { isPlantUnlocked } from '../engine/unlocks';
import { getLocale, t } from '../i18n';
import { costResources, createCostView } from './costView';
import { describePlantEffects, plantName, resourceName } from './describe';
import { button, h, hiddenSlot, slot, textSlot } from './dom';
import { formatNumber } from './format';

export type Act = (update: (state: GameState) => GameState) => void;

export function createForestTab(act: Act): {
  element: HTMLElement;
  render: (state: GameState) => void;
} {
  const murmurButton = button(
    { className: 'card murmur', title: t('action.murmur.desc') },
    [
      h('span', { className: 'card-name', text: t('action.murmur') }),
      h('span', {
        className: 'card-effect',
        text: t('action.murmur.effect', {
          amount: formatNumber(MURMUR_SAP, { locale: getLocale() }),
          resource: resourceName('sap'),
        }),
      }),
    ],
    () => act(murmur),
  );

  const cards = PLANT_IDS.map((id) => {
    const count = h('span', { className: 'card-count' });
    const cost = createCostView(costResources(PLANTS[id].cost));
    const element = button(
      { className: 'card', title: t(`plant.${id}.desc`) },
      [
        h('span', { className: 'card-head' }, [
          h('span', { className: 'card-name', text: plantName(id) }),
          count,
        ]),
        cost.element,
        h('span', { className: 'card-effect', text: describePlantEffects(id).join(' · ') }),
      ],
      () => act((state) => plant(state, id)),
    );
    return {
      id,
      element,
      cost,
      setCount: textSlot(count),
      setHidden: hiddenSlot(element),
      setDisabled: slot((disabled: boolean) => {
        element.disabled = disabled;
      }),
    };
  });

  const element = h('div', { className: 'cards' }, [
    murmurButton,
    ...cards.map((card) => card.element),
  ]);

  return {
    element,
    render(state) {
      for (const card of cards) {
        const unlocked = isPlantUnlocked(state, card.id);
        card.setHidden(!unlocked);
        if (!unlocked) {
          continue;
        }
        const growing = state.seedlings.filter((s) => s.plant === card.id).length;
        const parts = [t('plant.owned', { count: state.plants[card.id] })];
        if (growing > 0) {
          parts.push(`(${t('plant.growing', { count: growing })})`);
        }
        if (state.old[card.id] > 0) {
          parts.push(`· ${t('plant.old', { count: state.old[card.id] })}`);
        }
        card.setCount(parts.join(' '));
        card.setDisabled(!card.cost.update(state, getPlantCost(state, card.id)));
      }
    },
  };
}
