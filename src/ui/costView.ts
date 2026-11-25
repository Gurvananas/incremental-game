import { RESOURCE_IDS, type Amounts, type ResourceId } from '../data/resources';
import { getAffordability } from '../engine/costs';
import { getCaps } from '../engine/production';
import type { GameState } from '../engine/state';
import { getLocale, t } from '../i18n';
import { resourceName } from './describe';
import { classSlot, h, textSlot } from './dom';
import { formatDuration, formatNumber } from './format';

export interface CostView {
  readonly element: HTMLElement;
  /** Updates the amounts and their colours; returns true when affordable now. */
  update(state: GameState, cost: Amounts): boolean;
}

/** "15.2 Sap · 3 Humus · in 12 s": short amounts are dimmed, impossible ones red. */
export function createCostView(resources: readonly ResourceId[]): CostView {
  const items = RESOURCE_IDS.filter((id) => resources.includes(id)).map((id) => {
    const element = h('span', { className: 'cost-item' });
    return {
      id,
      element,
      setText: textSlot(element),
      setShort: classSlot(element, 'short'),
      setOver: classSlot(element, 'over'),
    };
  });
  const note = h('span', { className: 'cost-note' });
  const setNote = textSlot(note);
  const setNoteOver = classSlot(note, 'over');
  const element = h('span', { className: 'cost' }, [...items.map((item) => item.element), note]);

  return {
    element,
    update(state, cost) {
      const locale = getLocale();
      const caps = getCaps(state);
      for (const item of items) {
        const needed = cost[item.id] ?? 0;
        item.setText(`${formatNumber(needed, { locale })} ${resourceName(item.id)}`);
        item.setShort(state.resources[item.id] < needed);
        item.setOver(needed > caps[item.id]);
      }
      const affordability = getAffordability(state, cost);
      setNoteOver(affordability.kind === 'over-cap');
      switch (affordability.kind) {
        case 'now':
          setNote('');
          return true;
        case 'wait':
          setNote(t('cost.wait', { duration: formatDuration(affordability.seconds) }));
          return false;
        case 'over-cap':
          setNote(t('cost.overCap', { resource: resourceName(affordability.resource) }));
          return false;
        case 'stalled':
          setNote('');
          return false;
      }
    },
  };
}

export function costResources(cost: Amounts): ResourceId[] {
  return RESOURCE_IDS.filter((id) => cost[id] !== undefined);
}
