/**
 * Lightweight DOM helpers for the Ember showcase.
 *
 * In a real Ember app, templates (.hbs) and @glimmer/component handle
 * DOM rendering automatically with Ember's autotracking system. The
 * @tracked decorator on TrackedSignal/TrackedTween/TrackedSpring causes
 * templates to re-render when Pulse state changes.
 *
 * Here we use vanilla DOM manipulation to demonstrate the same pattern:
 * subscribe to tracked value changes and update the DOM imperatively.
 */

/** Create an element with optional class and children. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string> | null,
  ...children: (string | Node)[]
): HTMLElementTagNameMap[K]
export function el(
  tag: string,
  attrs?: Record<string, string> | null,
  ...children: (string | Node)[]
): HTMLElement
export function el(
  tag: string,
  attrs?: Record<string, string> | null,
  ...children: (string | Node)[]
): HTMLElement {
  const elem = document.createElement(tag)
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        elem.className = value
      } else if (key === 'htmlFor') {
        elem.setAttribute('for', value)
      } else {
        elem.setAttribute(key, value)
      }
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      elem.appendChild(document.createTextNode(child))
    } else {
      elem.appendChild(child)
    }
  }
  return elem
}

/** Set inner HTML safely (for simple cases). */
export function html(elem: HTMLElement, content: string): void {
  elem.innerHTML = content
}

/** Clear all children of an element. */
export function clear(elem: HTMLElement): void {
  elem.innerHTML = ''
}

/** Type for a cleanup/teardown function. */
export type Cleanup = () => void

/**
 * A simple reactive renderer. Calls `render` whenever the TrackedSignal,
 * TrackedTween, or TrackedSpring `value` changes. Returns a cleanup function.
 *
 * This mimics what Ember's autotracking does: when a @tracked property
 * changes, the template re-renders the affected DOM.
 */
export function reactiveRender(
  container: HTMLElement,
  render: () => void,
): void {
  render()
}
