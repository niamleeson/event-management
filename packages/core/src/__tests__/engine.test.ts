import { describe, it, expect, beforeEach } from 'vitest'
import { Engine } from '../engine.js'

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

  it('should pipe events from input to output', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    engine.pipe(input, output, (x) => x * 2)
    engine.on(output, (val) => results.push(val))

    engine.emit(input, 5)
    expect(results).toEqual([10])
  })

  it('should chain multiple pipes', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const results: number[] = []

    engine.pipe(a, b, (x) => x + 1)
    engine.pipe(b, c, (x) => x * 10)
    engine.on(c, (val) => results.push(val))

    engine.emit(a, 1)
    expect(results).toEqual([20]) // (1+1)*10
  })

  it('should handle pipe returning undefined (no output emitted)', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    engine.pipe(input, output, (x) => {
      if (x > 0) return x
      return undefined as any
    })
    engine.on(output, (val) => results.push(val))

    engine.emit(input, -1)
    expect(results).toEqual([])

    engine.emit(input, 5)
    expect(results).toEqual([5])
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

  it('should resolve entire graph synchronously in a single emit', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const d = engine.event<number>('d')
    const trace: string[] = []

    engine.pipe(a, b, (x) => { trace.push('a->b'); return x + 1 })
    engine.pipe(b, c, (x) => { trace.push('b->c'); return x + 1 })
    engine.pipe(b, d, (x) => { trace.push('b->d'); return x * 2 })
    engine.on(c, () => trace.push('c'))
    engine.on(d, () => trace.push('d'))

    engine.emit(a, 0)
    expect(trace).toContain('a->b')
    expect(trace).toContain('b->c')
    expect(trace).toContain('b->d')
    expect(trace).toContain('c')
    expect(trace).toContain('d')
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

  it('should handle pipe to multiple outputs', () => {
    const input = engine.event<number>('input')
    const outA = engine.event<number>('outA')
    const outB = engine.event<number>('outB')
    const resA: number[] = []
    const resB: number[] = []

    engine.pipe(input, [outA, outB], (x) => [x + 1, x + 2])
    engine.on(outA, (v) => resA.push(v))
    engine.on(outB, (v) => resB.push(v))

    engine.emit(input, 10)
    expect(resA).toEqual([11])
    expect(resB).toEqual([12])
  })

  it('should expose getRules()', () => {
    const a = engine.event('a')
    const b = engine.event('b')
    engine.pipe(a, b, (x) => x)
    expect(engine.getRules().length).toBeGreaterThanOrEqual(1)
  })

  it('should expose getMailboxes()', () => {
    const a = engine.event<number>('a')
    engine.emit(a, 1)
    // Should exist in mailboxes even if no consumers
    expect(engine.getMailboxes()).toBeDefined()
  })

  it('should expose getDAG()', () => {
    const a = engine.event('a')
    const b = engine.event('b')
    engine.pipe(a, b, (x) => x)
    const dag = engine.getDAG()
    expect(dag.nodes.length).toBeGreaterThanOrEqual(1)
  })

  it('should handle events with no consumers gracefully', () => {
    const orphan = engine.event<number>('orphan')
    // Should not throw
    expect(() => engine.emit(orphan, 99)).not.toThrow()
  })

  it('should handle pipe unsubscribe', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const results: number[] = []

    const unsub = engine.pipe(a, b, (x) => x * 2)
    engine.on(b, (v) => results.push(v))

    engine.emit(a, 5)
    expect(results).toEqual([10])

    unsub()
    engine.emit(a, 5)
    // b should not receive a new event since pipe was unsubscribed
    expect(results).toEqual([10])
  })
})
