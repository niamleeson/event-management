import { describe, it, expect, beforeEach } from 'vitest'
import { Engine, Skip } from '../engine.js'

describe('on().emit() chaining', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should forward payload with on(A).emit(B)', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const results: number[] = []

    engine.on(a).emit(b)
    engine.on(b, (v) => results.push(v))

    engine.emit(a, 42)
    expect(results).toEqual([42])
  })

  it('should transform payload with on(A).emit(B, fn)', () => {
    const a = engine.event<number>('a')
    const b = engine.event<string>('b')
    const results: string[] = []

    engine.on(a).emit(b, (n) => `val:${n}`)
    engine.on(b, (v) => results.push(v))

    engine.emit(a, 7)
    expect(results).toEqual(['val:7'])
  })

  it('should skip output when transform returns Skip', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const results: number[] = []

    engine.on(a).emit(b, (n) => n > 5 ? n : Skip as any)
    engine.on(b, (v) => results.push(v))

    engine.emit(a, 3)
    expect(results).toEqual([])

    engine.emit(a, 10)
    expect(results).toEqual([10])
  })

  it('should chain multiple .emit() on same on()', () => {
    const src = engine.event<number>('src')
    const doubled = engine.event<number>('doubled')
    const tripled = engine.event<number>('tripled')
    const r1: number[] = []
    const r2: number[] = []

    engine.on(src)
      .emit(doubled, (n) => n * 2)
      .emit(tripled, (n) => n * 3)

    engine.on(doubled, (v) => r1.push(v))
    engine.on(tripled, (v) => r2.push(v))

    engine.emit(src, 5)
    expect(r1).toEqual([10])
    expect(r2).toEqual([15])
  })

  it('should build DAG edges statically', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')

    engine.on(a).emit(b)
    engine.on(b).emit(c)
    engine.on(c, () => {})

    const dag = engine.getDAG()
    // Should have 3 rules and 2 edges: rule(a→b) → rule(b→c) → rule(c handler)
    expect(dag.nodes.length).toBe(3)
    expect(dag.edges.length).toBe(2)
  })

  it('should support conditional routing with Skip', () => {
    const input = engine.event<number>('input')
    const positive = engine.event<number>('positive')
    const negative = engine.event<number>('negative')
    const rPos: number[] = []
    const rNeg: number[] = []

    engine.on(input).emit(positive, (n) => n > 0 ? n : Skip as any)
    engine.on(input).emit(negative, (n) => n < 0 ? n : Skip as any)
    engine.on(positive, (v) => rPos.push(v))
    engine.on(negative, (v) => rNeg.push(v))

    engine.emit(input, 5)
    engine.emit(input, -3)

    expect(rPos).toEqual([5])
    expect(rNeg).toEqual([-3])
  })

  it('should dispose via .dispose()', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const results: number[] = []

    const builder = engine.on(a).emit(b)
    engine.on(b, (v) => results.push(v))

    engine.emit(a, 1)
    expect(results).toEqual([1])

    builder.dispose()

    engine.emit(a, 2)
    expect(results).toEqual([1]) // no change
  })

  it('should work with join syntax: on([A, B]).emit(C)', () => {
    const a = engine.event<number>('a')
    const b = engine.event<string>('b')
    const c = engine.event<string>('c')
    const results: string[] = []

    engine.on([a, b]).emit(c, (payloads) => `${payloads[0]}-${payloads[1]}`)
    engine.on(c, (v) => results.push(v))

    engine.emit(a, 42)
    expect(results).toEqual([]) // not yet, b hasn't fired

    engine.emit(b, 'hello')
    expect(results).toEqual(['42-hello'])
  })

  it('should chain through multiple levels: A → B → C → D', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const d = engine.event<number>('d')
    const results: number[] = []

    engine.on(a).emit(b, (n) => n + 1)
    engine.on(b).emit(c, (n) => n * 2)
    engine.on(c).emit(d, (n) => n + 100)
    engine.on(d, (v) => results.push(v))

    engine.emit(a, 1)
    expect(results).toEqual([104]) // ((1+1)*2)+100
  })

  it('should mix chaining and handler-based on()', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const results: number[] = []

    // Chaining: A → B
    engine.on(a).emit(b, (n) => n * 10)

    // Handler with emit inside: B → C
    engine.on(b, (val) => {
      engine.emit(c, val + 1)
    })

    engine.on(c, (v) => results.push(v))

    engine.emit(a, 3)
    expect(results).toEqual([31]) // 3*10 + 1
  })
})
