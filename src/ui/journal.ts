import { h } from './dom';

const MAX_ENTRIES = 50;

export interface Journal {
  readonly element: HTMLElement;
  add(text: string): void;
}

/** The journal shows the newest entry first. */
export function createJournal(): Journal {
  const list = h('ol', { className: 'journal-list' });
  return {
    element: list,
    add(text) {
      list.prepend(h('li', { text }));
      while (list.children.length > MAX_ENTRIES) {
        list.lastElementChild?.remove();
      }
    },
  };
}
