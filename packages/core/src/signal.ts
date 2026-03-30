import type { Signal } from './types.js'

/**
 * Create a Signal — a reactive value that can be subscribed to.
 */
export function createSignal<T>(initialValue: T): Signal<T> {
  const subscribers = new Set<(value: T, prev: T) => void>()

  const signal: Signal<T> = {
    value: initialValue,
    _subscribers: subscribers,

    subscribe(callback: (value: T, prev: T) => void): () => void {
      subscribers.add(callback)
      return () => {
        subscribers.delete(callback)
      }
    },

    set(next: T): void {
      const prev = signal.value
      if (Object.is(prev, next)) return
      signal.value = next
      for (const cb of subscribers) {
        cb(next, prev)
      }
    },

    _set(next: T): void {
      signal.set(next)
    },
  }

  return signal
}
