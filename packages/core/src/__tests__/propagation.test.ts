import { describe, it, expect, beforeEach } from 'vitest'
import { Engine } from '../engine.js'

describe('Propagation', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine({ maxPropagationRounds: 50 })
  })

  it('should propagate through a linear chain', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const results: number[] = []

    engine.pipe(a, b, (x) => x * 2)
    engine.pipe(b, c, (x) => x + 1)
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

    engine.pipe(src, out1, (x) => x + 10)
    engine.pipe(src, out2, (x) => x + 20)
    engine.on(out1, (v) => r1.push(v))
    engine.on(out2, (v) => r2.push(v))

    engine.emit(src, 1)
    expect(r1).toEqual([11])
    expect(r2).toEqual([21])
  })

  it('should handle diamond-shaped DAG', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const d = engine.event<number>('d')
    const results: number[] = []

    engine.pipe(a, b, (x) => x + 1)
    engine.pipe(a, c, (x) => x + 2)
    engine.join([b, c], d, {
      do: (bv, cv) => bv + cv,
    })
    engine.on(d, (v) => results.push(v))

    engine.emit(a, 10)
    expect(results).toEqual([23]) // (10+1)+(10+2)
  })

  it('should detect cycle in DAG when rules form a cycle', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')

    engine.pipe(a, b, (x) => x + 1)
    // Adding the second pipe creates a cycle — detected at registration or first propagation
    expect(() => {
      engine.pipe(b, a, (x) => x + 1)
      engine.emit(a, 0)
    }).toThrow(/Cycle detected/)
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

  it('should maintain topological order across fan-in', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const d = engine.event<number>('d')
    const trace: string[] = []

    engine.pipe(a, b, (x) => { trace.push('a->b'); return x })
    engine.pipe(a, c, (x) => { trace.push('a->c'); return x })
    engine.join([b, c], d, {
      do: (bv, cv) => { trace.push('join->d'); return bv + cv },
    })

    engine.emit(a, 1)
    const joinIdx = trace.indexOf('join->d')
    const abIdx = trace.indexOf('a->b')
    const acIdx = trace.indexOf('a->c')
    expect(joinIdx).toBeGreaterThan(abIdx)
    expect(joinIdx).toBeGreaterThan(acIdx)
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
})
