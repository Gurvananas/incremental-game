import { RESOURCE_IDS } from '../data/resources';
import { getCalendar } from '../engine/calendar';
import { getCaps, getRates } from '../engine/production';
import type { GameState } from '../engine/state';
import { getLocale, t } from '../i18n';
import { h, textSlot } from './dom';
import { formatNumber, formatRate } from './format';
import type { Journal } from './journal';

/** Builds the screen once and returns a render function that only writes what changed. */
export function mountApp(root: HTMLElement, journal: Journal): (state: GameState) => void {
  const date = h('p', { className: 'date' });
  const setDate = textSlot(date);

  const rows = RESOURCE_IDS.map((id) => {
    const amount = h('span', { className: 'amount' });
    const rate = h('span', { className: 'rate' });
    const fill = h('div', { className: 'bar-fill' });
    const element = h('li', { className: 'resource' }, [
      h('span', { className: 'name', text: t(`resource.${id}`) }),
      amount,
      rate,
      h('div', { className: 'bar' }, [fill]),
    ]);
    return {
      id,
      element,
      fill,
      setAmount: textSlot(amount),
      setRate: textSlot(rate),
      lastFill: -1,
    };
  });

  root.append(
    h('header', { className: 'top' }, [
      h('h1', { text: t('game.title') }),
      h('p', { className: 'tagline', text: t('game.tagline') }),
      date,
    ]),
    h('main', { className: 'layout' }, [
      h('aside', { className: 'panel resources' }, [
        h('h2', { text: t('panel.resources') }),
        h(
          'ul',
          {},
          rows.map((row) => row.element),
        ),
      ]),
      h('section', { className: 'panel forest' }, [
        h('h2', { text: t('panel.forest') }),
        h('p', { className: 'muted', text: t('forest.empty') }),
      ]),
      h('aside', { className: 'panel journal' }, [
        h('h2', { text: t('panel.journal') }),
        journal.element,
      ]),
    ]),
  );

  return (state) => {
    const locale = getLocale();
    const calendar = getCalendar(state.days);
    setDate(
      t('calendar.date', {
        season: t(`season.${calendar.season}`),
        day: calendar.dayOfSeason,
        year: calendar.year,
      }),
    );

    const caps = getCaps(state);
    const rates = getRates(state);
    for (const row of rows) {
      const amount = state.resources[row.id];
      const cap = caps[row.id];
      const rate = rates[row.id];
      row.setAmount(`${formatNumber(amount, { locale })} / ${formatNumber(cap, { locale })}`);
      row.setRate(rate === 0 ? '' : formatRate(rate, { locale }));
      const fill = cap > 0 ? Math.round((amount / cap) * 200) / 2 : 0;
      if (fill !== row.lastFill) {
        row.fill.style.width = `${fill}%`;
        row.lastFill = fill;
      }
    }
  };
}
