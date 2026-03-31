import type { EventType, PulseEvent, Rule } from './types.js'
import { recycleEvent } from './event.js'

/**
 * Mailbox — holds pending events for a given EventType.
 * Events remain in the mailbox until all registered consumers have processed them.
 * Stale events (older than TTL) are evicted to prevent unbounded growth from incomplete joins.
 */
export class Mailbox<T = any> {
  type: EventType<T>
  queue: PulseEvent<T>[] = []

  constructor(type: EventType<T>) {
    this.type = type
  }

  /** Add an event to this mailbox */
  enqueue(event: PulseEvent<T>): void {
    this.queue.push(event)
  }

  /** Evict orphaned events whose pending consumers have all been disposed */
  evictOrphans(): void {
    let i = 0
    while (i < this.queue.length) {
      const ev = this.queue[i]
      // Remove disposed consumers
      for (const rule of ev._pendingConsumers) {
        if (rule._disposed) {
          ev._pendingConsumers.delete(rule)
        }
      }
      // If no consumers remain, event is orphaned
      if (ev._pendingConsumers.size === 0) {
        this.queue.splice(i, 1)
        recycleEvent(ev)
      } else {
        i++
      }
    }
  }

  /** Check if there is at least one event ready for the given rule */
  hasReadyEvent(rule: Rule): boolean {
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i]._pendingConsumers.has(rule)) {
        return true
      }
    }
    return false
  }

  /** Count how many events are ready for the given rule */
  countReadyEvents(rule: Rule): number {
    let count = 0
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i]._pendingConsumers.has(rule)) {
        count++
      }
    }
    return count
  }

  /** Peek at the first event ready for the given rule (without consuming) */
  peek(rule: Rule): PulseEvent<T> | null {
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i]._pendingConsumers.has(rule)) {
        return this.queue[i]
      }
    }
    return null
  }

  /**
   * Consume the first event ready for the given rule.
   * Marks the event as consumed by this rule.
   * If all consumers have processed the event, it is removed and recycled.
   */
  consume(rule: Rule): PulseEvent<T> {
    for (let i = 0; i < this.queue.length; i++) {
      const ev = this.queue[i]
      if (ev._pendingConsumers.has(rule)) {
        ev._pendingConsumers.delete(rule)
        // GC: if no more pending consumers, remove from queue.
        // Do NOT recycle here — the caller still needs the payload.
        if (ev._pendingConsumers.size === 0) {
          this.queue.splice(i, 1)
        }
        return ev
      }
    }
    throw new Error(`Mailbox(${this.type.name}): no ready event for rule ${rule.id}`)
  }

  /**
   * Reverse a consumption — put events back as pending for this rule.
   * Used when a guard fails after consumption.
   */
  unconsumeAll(rule: Rule, events: PulseEvent[]): void {
    for (const ev of events) {
      ev._pendingConsumers.add(rule)
      // If the event was already removed from the queue (recycled), re-add it.
      // This happens when the consuming rule was the last consumer.
      if (!this.queue.includes(ev)) {
        this.queue.push(ev)
      }
    }
  }

  /** Get the number of events in the queue */
  get size(): number {
    return this.queue.length
  }

  /** Clear all events */
  clear(): void {
    for (const ev of this.queue) {
      recycleEvent(ev)
    }
    this.queue.length = 0
  }
}
