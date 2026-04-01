import type { EventType, Rule } from './types.js'

let eventTypeCounter = 0

/**
 * Create a named EventType declaration.
 * EventType is a channel — not an instance.
 */
export function createEventType<T = any>(name: string): EventType<T> {
  return {
    name: `${name}#${eventTypeCounter++}`,
    _consumers: new Set<Rule>(),
    _solo: null,
  }
}

/** Reset the counter (for testing) */
export function resetEventTypeCounter(): void {
  eventTypeCounter = 0
}
