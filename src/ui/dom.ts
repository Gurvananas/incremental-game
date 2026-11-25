/** Tiny DOM helpers. The UI is built once, then only changed values are written. */

interface ElementProps {
  readonly className?: string;
  readonly text?: string;
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
  element.append(...children);
  return element;
}

/** A text node that is only written when its value actually changes. */
export function textSlot(parent: HTMLElement): (value: string) => void {
  const node = document.createTextNode('');
  parent.append(node);
  let last = '';
  return (value) => {
    if (value !== last) {
      node.data = value;
      last = value;
    }
  };
}
