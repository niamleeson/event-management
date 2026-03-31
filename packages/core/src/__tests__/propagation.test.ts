import { describe, it, expect, beforeEach } from 'vitest'
import { Engine } from '../engine.js'

describe('Propagation', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine({ maxPropagationRounds: 50 })
  })

  it('should propagate through a linear chain via nested emits', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const results: number[] = []

    engine.on(a, (x) => engine.emit(b, x * 2))
    engine.on(b, (x) => engine.emit(c, x + 1))
    engine.on(c, (v) => results.push(v))

    engine.emit(a, 3)
    expect(results).toEqual([7]) // 3*2+1
  })

  it('should handle fan-out (one event, multiple consumers)', () => {
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

  it('should handle diamond-shaped DAG with join', () => {
    const a = engine.event<number>('a')
    const left = engine.event<number>('left')
    const right = engine.event<number>('right')
    const results: number[] = []

    engine.on(a, (x) => engine.emit(left, x * 2))
    engine.on(a, (x) => engine.emit(right, x * 3))
    engine.on([left, right], (l: number, r: number) => {
      results.push(l + r)
    })

    engine.emit(a, 10)
    expect(results).toEqual([50]) // 10*2 + 10*3
  })

  it('should throw on excessive propagation rounds from nested emits', () => {
    const smallEngine = new Engine({ maxPropagationRounds: 5 })
    const a = smallEngine.event<number>('a')

    // Create a self-feeding loop via nested emit
    smallEngine.on(a, (val) => {
      smallEngine.emit(a, val + 1)
    })

    expect(() => smallEngine.emit(a, 0)).toThrow(/Propagation exceeded/)
  })

  it('should process events deposited during action execution', () => {
    const trigger = engine.event<number>('trigger')
    const sideEffect = engine.event<string>('sideEffect')
    const results: string[] = []

    engine.on(trigger, (val) => {
      engine.emit(sideEffect, `from-trigger-${val}`)
    })
    engine.on(sideEffect, (msg) => results.push(msg))

    engine.emit(trigger, 42)
    expect(results).toEqual(['from-trigger-42'])
  })

  it('should handle events with no consumers gracefully', () => {
    const orphan = engine.event<number>('orphan')
    expect(() => engine.emit(orphan, 99)).not.toThrow()
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

  it('should maintain synchronous propagation within a single emit call', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const trace: string[] = []

    engine.on(a, (x) => {
      trace.push(`a:${x}`)
      engine.emit(b, x + 1)
    })
    engine.on(b, (x) => {
      trace.push(`b:${x}`)
      engine.emit(c, x + 1)
    })
    engine.on(c, (x) => {
      trace.push(`c:${x}`)
    })

    engine.emit(a, 1)
    // Everything should have been processed synchronously
    expect(trace).toEqual(['a:1', 'b:2', 'c:3'])
  })
})
