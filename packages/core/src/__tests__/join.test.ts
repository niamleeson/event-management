import { describe, it, expect, beforeEach } from 'vitest'
import { Engine } from '../engine.js'

describe('Join patterns', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should fire join only when all inputs are ready', () => {
    const a = engine.event<number>('a')
    const b = engine.event<string>('b')
    const out = engine.event<string>('out')
    const results: string[] = []

    engine.join([a, b], out, {
      do: (numVal, strVal) => `${numVal}-${strVal}`,
    })
    engine.on(out, (v) => results.push(v))

    // Only emit a — join should not fire
    engine.emit(a, 42)
    expect(results).toEqual([])

    // Now emit b — join should fire
    engine.emit(b, 'hello')
    expect(results).toEqual(['42-hello'])
  })

  it('should consume one event from each input type per join', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const out = engine.event<number>('out')
    const results: number[] = []

    engine.join([a, b], out, {
      do: (av, bv) => av + bv,
    })
    engine.on(out, (v) => results.push(v))

    engine.emit(a, 1)
    engine.emit(a, 2)
    engine.emit(b, 10)
    // Should use first a (1) + b (10)
    expect(results).toContain(11)
  })

  it('should support guard on join — passing guard', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const out = engine.event<number>('out')
    const results: number[] = []

    engine.join([a, b], out, {
      guard: (av, bv) => av + bv > 10,
      do: (av, bv) => av + bv,
    })
    engine.on(out, (v) => results.push(v))

    // Emit pair that passes guard
    engine.emit(a, 8)
    engine.emit(b, 5)
    expect(results).toEqual([13])
  })

  it('should support guard on join — failing guard blocks join', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const out = engine.event<number>('out')
    const results: number[] = []

    engine.join([a, b], out, {
      guard: (av, bv) => av + bv > 100,
      do: (av, bv) => av + bv,
    })
    engine.on(out, (v) => results.push(v))

    engine.emit(a, 2)
    engine.emit(b, 3)
    // Guard fails: 2+3=5, not > 100
    expect(results).toEqual([])
  })

  it('should handle join in a diamond DAG', () => {
    const src = engine.event<number>('src')
    const left = engine.event<number>('left')
    const right = engine.event<number>('right')
    const merged = engine.event<number>('merged')
    const results: number[] = []

    engine.pipe(src, left, (x) => x * 2)
    engine.pipe(src, right, (x) => x * 3)
    engine.join([left, right], merged, {
      do: (l, r) => l + r,
    })
    engine.on(merged, (v) => results.push(v))

    engine.emit(src, 10)
    expect(results).toEqual([50]) // 10*2 + 10*3
  })

  it('should handle join with cascading output', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const joined = engine.event<number>('joined')
    const final = engine.event<string>('final')
    const results: string[] = []

    engine.join([a, b], joined, {
      do: (av, bv) => av + bv,
    })
    engine.pipe(joined, final, (v) => `result:${v}`)
    engine.on(final, (v) => results.push(v))

    engine.emit(a, 3)
    engine.emit(b, 7)
    expect(results).toEqual(['result:10'])
  })

  it('should not fire join when only some inputs are available', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const out = engine.event<number>('out')
    const results: number[] = []

    engine.join([a, b, c], out, {
      do: (av, bv, cv) => av + bv + cv,
    })
    engine.on(out, (v) => results.push(v))

    engine.emit(a, 1)
    engine.emit(b, 2)
    expect(results).toEqual([])

    engine.emit(c, 3)
    expect(results).toEqual([6])
  })
})
