import { describe, it, expect, beforeEach } from 'vitest'
import { Mailbox } from '../mailbox.js'
import { createEvent, resetSequence } from '../event.js'
import { createEventType, resetEventTypeCounter } from '../event-type.js'
import { createRule, resetRuleCounter } from '../rule.js'
import type { Rule, EventType } from '../types.js'

describe('Mailbox', () => {
  let eventType: EventType<number>
  let rule1: Rule
  let rule2: Rule

  beforeEach(() => {
    resetSequence()
    resetEventTypeCounter()
    resetRuleCounter()

    eventType = createEventType<number>('test')
    rule1 = createRule({
      name: 'r1',
      triggers: [eventType],
      mode: 'each',
      action: () => {},
      outputs: [],
    })
    rule2 = createRule({
      name: 'r2',
      triggers: [eventType],
      mode: 'each',
      action: () => {},
      outputs: [],
    })
    eventType._consumers.add(rule1)
    eventType._consumers.add(rule2)
  })

  it('should enqueue and retrieve events', () => {
    const mb = new Mailbox(eventType)
    const ev = createEvent(eventType, 42)
    mb.enqueue(ev)

    expect(mb.size).toBe(1)
    expect(mb.hasReadyEvent(rule1)).toBe(true)
    expect(mb.hasReadyEvent(rule2)).toBe(true)
  })

  it('should peek without consuming', () => {
    const mb = new Mailbox(eventType)
    const ev = createEvent(eventType, 42)
    mb.enqueue(ev)

    const peeked = mb.peek(rule1)
    expect(peeked).toBe(ev)
    expect(mb.hasReadyEvent(rule1)).toBe(true) // still ready
  })

  it('should consume an event for a specific rule', () => {
    const mb = new Mailbox(eventType)
    const ev = createEvent(eventType, 42)
    mb.enqueue(ev)

    const consumed = mb.consume(rule1)
    expect(consumed.payload).toBe(42)
    expect(mb.hasReadyEvent(rule1)).toBe(false)
    // rule2 should still be able to see it
    expect(mb.hasReadyEvent(rule2)).toBe(true)
  })

  it('should remove event from queue when all consumers have consumed', () => {
    const mb = new Mailbox(eventType)
    const ev = createEvent(eventType, 42)
    mb.enqueue(ev)

    mb.consume(rule1)
    expect(mb.size).toBe(1) // still in queue for rule2

    mb.consume(rule2)
    expect(mb.size).toBe(0) // fully consumed, removed
  })

  it('should count ready events for a rule', () => {
    const mb = new Mailbox(eventType)
    mb.enqueue(createEvent(eventType, 1))
    mb.enqueue(createEvent(eventType, 2))
    mb.enqueue(createEvent(eventType, 3))

    expect(mb.countReadyEvents(rule1)).toBe(3)
    mb.consume(rule1)
    expect(mb.countReadyEvents(rule1)).toBe(2)
  })

  it('should unconsume events on guard failure', () => {
    const mb = new Mailbox(eventType)
    const ev = createEvent(eventType, 42)
    mb.enqueue(ev)

    const consumed = mb.consume(rule1)
    expect(mb.hasReadyEvent(rule1)).toBe(false)

    mb.unconsumeAll(rule1, [consumed])
    expect(mb.hasReadyEvent(rule1)).toBe(true)
  })

  it('should handle unconsume of fully-consumed event', () => {
    const mb = new Mailbox(eventType)
    const ev = createEvent(eventType, 42)
    mb.enqueue(ev)

    // Both consume it
    mb.consume(rule1)
    const consumed2 = mb.consume(rule2) // this removes from queue
    expect(mb.size).toBe(0)

    // Unconsume for rule2 — should re-add to queue
    mb.unconsumeAll(rule2, [consumed2])
    expect(mb.size).toBe(1)
    expect(mb.hasReadyEvent(rule2)).toBe(true)
  })

  it('should throw when consuming from empty mailbox', () => {
    const mb = new Mailbox(eventType)
    expect(() => mb.consume(rule1)).toThrow()
  })

  it('should clear all events', () => {
    const mb = new Mailbox(eventType)
    mb.enqueue(createEvent(eventType, 1))
    mb.enqueue(createEvent(eventType, 2))
    expect(mb.size).toBe(2)

    mb.clear()
    expect(mb.size).toBe(0)
  })

  it('should handle single-consumer ref counting', () => {
    // Only rule1 as consumer
    const singleType = createEventType<number>('single')
    singleType._consumers.add(rule1)

    const mb = new Mailbox(singleType)
    const ev = createEvent(singleType, 99)
    mb.enqueue(ev)

    mb.consume(rule1)
    // Should be removed since it was the only consumer
    expect(mb.size).toBe(0)
  })

  it('should evict orphaned events whose consumers are all disposed', () => {
    const mb = new Mailbox(eventType)
    const ev = createEvent(eventType, 42)
    mb.enqueue(ev)
    expect(mb.size).toBe(1)

    // Dispose all consumers
    for (const rule of ev._pendingConsumers) {
      rule._disposed = true
    }

    mb.evictOrphans()
    expect(mb.size).toBe(0)
  })

  it('should not evict events with active consumers', () => {
    const mb = new Mailbox(eventType)
    const ev = createEvent(eventType, 42)
    mb.enqueue(ev)
    expect(mb.size).toBe(1)

    mb.evictOrphans()
    expect(mb.size).toBe(1) // consumers still active
  })
})
