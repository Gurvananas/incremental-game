/** Tiny DOM helpers. The UI is built once, then only changed values are written. */

interface ElementProps {
  readonly className?: string;
  readonly text?: string;
  readonly title?: string;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps = {},
  children: readonly (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (props.className !== undefined) {
    element.className = props.className;
  }
  if (props.text !== undefined) {
    element.textContent = props.text;
  }
  if (props.title !== undefined) {
    element.title = props.title;
  }
  element.append(...children);
  return element;
}

/** Calls `apply` only when the value differs from the last one. */
export function slot<T>(apply: (value: T) => void): (value: T) => void {
  let initialised = false;
  let last: T;
  return (value) => {
    if (!initialised || value !== last) {
      apply(value);
      last = value;
      initialised = true;
    }
  };
}

/** A text node that is only written when its value actually changes. */
export function textSlot(parent: HTMLElement): (value: string) => void {
  const node = document.createTextNode('');
  parent.append(node);
  return slot((value: string) => {
    node.data = value;
  });
}

export function hiddenSlot(element: HTMLElement): (hidden: boolean) => void {
  return slot((hidden: boolean) => {
    element.hidden = hidden;
  });
}

export function classSlot(element: HTMLElement, className: string): (on: boolean) => void {
  return slot((on: boolean) => {
    element.classList.toggle(className, on);
  });
}

export function button(
  props: ElementProps,
  children: readonly (Node | string)[],
  onClick: () => void,
): HTMLButtonElement {
  const element = h('button', props, children);
  element.type = 'button';
  element.addEventListener('click', onClick);
  return element;
}
