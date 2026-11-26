import { RESOURCE_IDS, type ResourceId } from '../data/resources';
import { MAST_SEED_MULTIPLIER } from '../data/weather';
import { getCaps, getProduction, type Production } from '../engine/production';
import type { GameState } from '../engine/state';
import { isResourceVisible } from '../engine/unlocks';
import { getLocale, t } from '../i18n';
import { isPlantSource, plantName, resourceName, speciesName } from './describe';
import { h, hiddenSlot, slot, textSlot } from './dom';
import { formatNumber, formatPercent, formatRate } from './format';

/** Tooltip lines: every source of the resource, then the multipliers behind them. */
function breakdown(id: ResourceId, production: Production): string {
  const locale = getLocale();
  const lines = production.lines[id].map((line) => {
    let source: string;
    if (line.source === 'rain') {
      source = t('breakdown.rain');
    } else if (line.source === 'decay') {
      source = t('breakdown.decay');
    } else {
      const name = isPlantSource(line.source) ? plantName(line.source) : speciesName(line.source);
      source = t('breakdown.plant', {
        name,
        count: formatNumber(Math.floor(line.count), { locale }),
      });
    }
    return `${source}: ${formatRate(line.amount, { locale })}`;
  });
  const { sapSeason, sapBonus, waterSupply, balanceMultiplier, pests, seedBonus } =
    production.modifiers;
  const factor = (value: number): string => formatNumber(value, { locale });
  if (id === 'sap' && production.lines.sap.length > 0) {
    lines.push(t('breakdown.season', { factor: factor(sapSeason) }));
    if (sapBonus > 1) {
      lines.push(t('breakdown.sapBonus', { factor: factor(sapBonus) }));
    }
    if (pests < 1) {
      lines.push(t('breakdown.pests', { factor: factor(pests) }));
    }
  }
  if (id === 'seeds' && seedBonus > 1) {
    lines.push(t('breakdown.seedBonus', { factor: factor(seedBonus) }));
  }
  if (
    balanceMultiplier !== 1 &&
    production.lines[id].some((line) => line.amount > 0 && line.source !== 'rain')
  ) {
    lines.push(t('breakdown.balance', { factor: factor(balanceMultiplier) }));
  }
  if (production.modifiers.drought && (id === 'sap' || id === 'water')) {
    lines.push(t('breakdown.drought'));
  }
  if (id === 'seeds' && production.modifiers.mast) {
    lines.push(t('breakdown.mast', { factor: factor(MAST_SEED_MULTIPLIER) }));
  }
  if (id === 'water' && waterSupply < 1) {
    lines.push(t('breakdown.waterShortage', { percent: formatPercent(waterSupply, { locale }) }));
  }
  return lines.join('\n');
}

export function createResourcesPanel(): {
  element: HTMLElement;
  render: (state: GameState) => void;
} {
  const rows = RESOURCE_IDS.map((id) => {
    const amount = h('span', { className: 'amount' });
    const rate = h('span', { className: 'rate' });
    const fill = h('div', { className: 'bar-fill' });
    const element = h('li', { className: 'resource' }, [
      h('span', { className: 'name', text: resourceName(id) }),
      amount,
      rate,
      h('div', { className: 'bar' }, [fill]),
    ]);
    return {
      id,
      element,
      setHidden: hiddenSlot(element),
      setAmount: textSlot(amount),
      setRate: textSlot(rate),
      setTitle: slot((title: string) => {
        element.title = title;
      }),
      setFill: slot((percent: number) => {
        fill.style.width = `${percent}%`;
      }),
    };
  });

  const element = h('aside', { className: 'panel resources' }, [
    h('h2', { text: t('panel.resources') }),
    h(
      'ul',
      {},
      rows.map((row) => row.element),
    ),
  ]);

  return {
    element,
    render(state) {
      const locale = getLocale();
      const caps = getCaps(state);
      const production = getProduction(state);
      for (const row of rows) {
        const visible = isResourceVisible(state, row.id);
        row.setHidden(!visible);
        if (!visible) {
          continue;
        }
        const amount = state.resources[row.id];
        const cap = caps[row.id];
        const rate = production.rates[row.id];
        row.setAmount(`${formatNumber(amount, { locale })} / ${formatNumber(cap, { locale })}`);
        row.setRate(Math.abs(rate) < 1e-9 ? '' : formatRate(rate, { locale }));
        row.setTitle(breakdown(row.id, production));
        row.setFill(cap > 0 ? Math.round((amount / cap) * 200) / 2 : 0);
      }
    },
  };
}
