import { describe, it, expect, beforeEach } from 'vitest'
import { Engine, Skip } from '../engine.js'

describe('Engine', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should create event types with unique names', () => {
    const a = engine.event('click')
    const b = engine.event('click')
    expect(a.name).not.toBe(b.name)
    expect(a.name).toContain('click')
  })

  it('should emit and receive events via on()', () => {
    const ev = engine.event<number>('num')
    const results: number[] = []

    engine.on(ev, (n) => results.push(n))

    engine.emit(ev, 42)
    expect(results).toEqual([42])
  })

  it('should support on() with unsubscribe', () => {
    const ev = engine.event<string>('msg')
    const results: string[] = []

    const unsub = engine.on(ev, (msg) => results.push(msg))

    engine.emit(ev, 'hello')
    expect(results).toEqual(['hello'])

    unsub()

    engine.emit(ev, 'world')
    expect(results).toEqual(['hello']) // no change
  })

  it('should support multiple handlers on the same event type', () => {
    const ev = engine.event<number>('num')
    const r1: number[] = []
    const r2: number[] = []

    engine.on(ev, (n) => r1.push(n))
    engine.on(ev, (n) => r2.push(n * 2))

    engine.emit(ev, 3)
    expect(r1).toEqual([3])
    expect(r2).toEqual([6])
  })

  it('should handle events with no consumers gracefully', () => {
    const orphan = engine.event<number>('orphan')
    expect(() => engine.emit(orphan, 99)).not.toThrow()
  })

  it('should handle nested emit during propagation', () => {
    const a = engine.event<number>('a')
    const results: number[] = []

    engine.on(a, (val) => {
      results.push(val)
      if (val < 3) {
        engine.emit(a, val + 1)
      }
    })

    engine.emit(a, 1)
    expect(results).toContain(1)
    expect(results).toContain(2)
    expect(results).toContain(3)
  })

  it('should chain events via emit inside on()', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const results: number[] = []

    engine.on(a, (x) => {
      engine.emit(b, x + 1)
    })
    engine.on(b, (x) => {
      engine.emit(c, x * 10)
    })
    engine.on(c, (val) => results.push(val))

    engine.emit(a, 1)
    expect(results).toEqual([20]) // (1+1)*10
  })

  it('should handle fan-out (one event, two on() handlers emitting to different events)', () => {
    const src = engine.event<number>('src')
    const out1 = engine.event<number>('out1')
    const out2 = engine.event<number>('out2')
    const r1: number[] = []
    const r2: number[] = []

    engine.on(src, (x) => engine.emit(out1, x + 10))
    engine.on(src, (x) => engine.emit(out2, x + 20))
    engine.on(out1, (v) => r1.push(v))
    engine.on(out2, (v) => r2.push(v))

    engine.emit(src, 1)
    expect(r1).toEqual([11])
    expect(r2).toEqual([21])
  })

  it('should expose getRules()', () => {
    const a = engine.event('a')
    engine.on(a, () => {})
    expect(engine.getRules().length).toBeGreaterThanOrEqual(1)
  })

  it('should expose getMailboxes()', () => {
    const a = engine.event<number>('a')
    engine.emit(a, 1)
    expect(engine.getMailboxes()).toBeDefined()
  })

  it('should expose getDAG()', () => {
    const a = engine.event('a')
    engine.on(a, () => {})
    const dag = engine.getDAG()
    expect(dag.nodes.length).toBeGreaterThanOrEqual(1)
  })

  it('should handle multiple sequential emits independently', () => {
    const ev = engine.event<number>('ev')
    const results: number[] = []

    engine.on(ev, (v) => results.push(v))

    engine.emit(ev, 1)
    engine.emit(ev, 2)
    engine.emit(ev, 3)

    expect(results).toEqual([1, 2, 3])
  })

  it('should export Skip sentinel', () => {
    expect(Skip).toBe(Symbol.for('pulse.skip'))
  })

  it('should destroy and stop processing', () => {
    const ev = engine.event<number>('ev')
    const results: number[] = []
    engine.on(ev, (v) => results.push(v))

    engine.emit(ev, 1)
    expect(results).toEqual([1])

    engine.destroy()

    // After destroy, emit should not call handler (no consumers registered)
    engine.emit(ev, 2)
    expect(results).toEqual([1])
  })

  it('should support on([A, B]) join syntax', () => {
    const a = engine.event<number>('a')
    const b = engine.event<string>('b')
    const results: string[] = []

    engine.on([a, b], (numVal: number, strVal: string) => {
      results.push(`${numVal}-${strVal}`)
    })

    // Only emit a — join should not fire
    engine.emit(a, 42)
    expect(results).toEqual([])

    // Now emit b — join should fire
    engine.emit(b, 'hello')
    expect(results).toEqual(['42-hello'])
  })

  it('should not leak events when emitting to event with no consumers', () => {
    const orphan = engine.event<number>('orphan')
    // No on() registered for orphan — zero consumers
    // This should not leak pool slots
    for (let i = 0; i < 100; i++) {
      engine.emit(orphan, i)
    }
    // If pool leak existed, 100 events would be lost from the pool
    // No assertion needed — this verifies no throw and no unbounded growth
    // The mailbox for orphan should be empty (no consumers = no enqueue)
    const mb = engine.getMailboxes().get(orphan)
    expect(mb).toBeUndefined() // never even created a mailbox
  })
})
