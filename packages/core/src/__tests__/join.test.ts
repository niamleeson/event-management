import { describe, it, expect, beforeEach } from 'vitest'
import { Engine } from '../engine.js'

describe('Join patterns (on([...]))', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should fire join only when all inputs are ready', () => {
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

  it('should consume one event from each input type per join', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const results: number[] = []

    engine.on([a, b], (av: number, bv: number) => {
      results.push(av + bv)
    })

    engine.emit(a, 1)
    engine.emit(a, 2)
    engine.emit(b, 10)
    // Should use first a (1) + b (10)
    expect(results).toContain(11)
  })

  it('should handle join in a diamond DAG via nested emits', () => {
    const src = engine.event<number>('src')
    const left = engine.event<number>('left')
    const right = engine.event<number>('right')
    const results: number[] = []

    engine.on(src, (x) => engine.emit(left, x * 2))
    engine.on(src, (x) => engine.emit(right, x * 3))
    engine.on([left, right], (l: number, r: number) => {
      results.push(l + r)
    })

    engine.emit(src, 10)
    expect(results).toEqual([50]) // 10*2 + 10*3
  })

  it('should handle join with cascading output via emit', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const joined = engine.event<number>('joined')
    const final = engine.event<string>('final')
    const results: string[] = []

    engine.on([a, b], (av: number, bv: number) => {
      engine.emit(joined, av + bv)
    })
    engine.on(joined, (v) => {
      engine.emit(final, `result:${v}`)
    })
    engine.on(final, (v) => results.push(v))

    engine.emit(a, 3)
    engine.emit(b, 7)
    expect(results).toEqual(['result:10'])
  })

  it('should not fire join when only some inputs are available', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')
    const results: number[] = []

    engine.on([a, b, c], (av: number, bv: number, cv: number) => {
      results.push(av + bv + cv)
    })

    engine.emit(a, 1)
    engine.emit(b, 2)
    expect(results).toEqual([])

    engine.emit(c, 3)
    expect(results).toEqual([6])
  })

  it('should handle multiple join firings as events accumulate', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const results: number[] = []

    engine.on([a, b], (av: number, bv: number) => {
      results.push(av + bv)
    })

    engine.emit(a, 1)
    engine.emit(b, 10)
    expect(results).toEqual([11])

    engine.emit(a, 2)
    engine.emit(b, 20)
    expect(results).toEqual([11, 22])
  })

  it('should unsubscribe join handler', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const results: number[] = []

    const unsub = engine.on([a, b], (av: number, bv: number) => {
      results.push(av + bv)
    })

    engine.emit(a, 1)
    engine.emit(b, 10)
    expect(results).toEqual([11])

    unsub()

    engine.emit(a, 2)
    engine.emit(b, 20)
    // Should not fire again
    expect(results).toEqual([11])
  })
})
