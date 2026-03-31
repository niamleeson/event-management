import type { Signal } from './types.js'

/**
 * Create a Signal — a reactive value.
 * Call it to read: signal()
 * Call .set() to write: signal.set(newValue)
 */
export function createSignal<T>(initialValue: T): Signal<T> {
  const subscribers = new Set<(value: T, prev: T) => void>()

  let currentValue = initialValue

  // The signal itself is a function that returns the current value
  const signal = function () {
    return currentValue
  } as Signal<T>

  Object.defineProperty(signal, 'value', {
    get() { return currentValue },
    set(v: T) { currentValue = v },
    enumerable: true,
    configurable: true,
  })

  signal._subscribers = subscribers

  signal.subscribe = function (callback: (value: T, prev: T) => void): () => void {
    subscribers.add(callback)
    return () => {
      subscribers.delete(callback)
    }
  }

  signal.set = function (next: T): void {
    const prev = currentValue
    if (Object.is(prev, next)) return
    currentValue = next
    for (const cb of subscribers) {
      cb(next, prev)
    }
  }

  signal._set = function (next: T): void {
    signal.set(next)
  }

  return signal
}
