import type { EventType, PulseEvent, Rule } from './types.js'

let globalSeq = 0

// ---- Object Pool for Events (hot-path optimization) ----
const POOL_MAX = 512
let poolHead: PulseEvent | null = null
let poolSize = 0

function allocEvent<T>(type: EventType<T>, payload: T, seq: number): PulseEvent<T> {
  let ev: PulseEvent<T>
  if (poolHead !== null) {
    ev = poolHead as PulseEvent<T>
    poolHead = ev._poolNext
    poolSize--
    ev.type = type
    ev.payload = payload
    ev.seq = seq
    ev._pendingConsumers.clear()
    ev._poolNext = null
  } else {
    ev = {
      type,
      payload,
      seq,
      _pendingConsumers: new Set<Rule>(),
      _poolNext: null,
    }
  }
  return ev
}

function releaseEvent(ev: PulseEvent): void {
  if (poolSize < POOL_MAX) {
    ev._poolNext = poolHead
    ev.payload = undefined
    ev._pendingConsumers.clear()
    poolHead = ev
    poolSize++
  }
}

/**
 * Create a new Event instance with a monotonic sequence number.
 * Consumers are populated from the event type's registered consumers.
 */
export function createEvent<T>(type: EventType<T>, payload: T): PulseEvent<T> {
  const seq = globalSeq++
  const ev = allocEvent(type, payload, seq)
  // Copy all consumers from the event type
  for (const rule of type._consumers) {
    if (!rule._disposed) {
      ev._pendingConsumers.add(rule)
    }
  }
  return ev
}

/** Return an event to the pool when all consumers have processed it */
export function recycleEvent(ev: PulseEvent): void {
  releaseEvent(ev)
}

/** Reset the global sequence (for testing) */
export function resetSequence(): void {
  globalSeq = 0
}

/** Get the current sequence value (for devtools) */
export function currentSequence(): number {
  return globalSeq
}
