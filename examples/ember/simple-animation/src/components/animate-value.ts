/**
 * Ember Modifier: applies an animated tween value to a DOM element's style.
 *
 * Usage in template:
 *   <div {{animate-value this.tweenedDisplay.value property="transform" template="scale({v})"}} />
 *
 * This is a conceptual modifier. In a real Ember app, you would register it
 * using ember-modifier or @ember/render-modifiers.
 */

import { modifier } from 'ember-modifier'

interface AnimateValueArgs {
  positional: [number]
  named: {
    property: string
    template?: string
  }
}

/**
 * Modifier that applies a numeric value to a CSS property on the element.
 * Useful for driving DOM animations from TrackedTween or TrackedSpring values.
 */
const animateValue = modifier(
  (
    element: HTMLElement,
    [value]: [number],
    { property, template }: { property: string; template?: string },
  ) => {
    const formatted = template
      ? template.replace('{v}', String(value))
      : String(value)

    element.style.setProperty(property, formatted)
  },
)

export default animateValue
