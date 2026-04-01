import { describe, it, expect, beforeEach } from 'vitest'
import { Engine } from '../engine.js'

describe('Static DAG via output declarations', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should build DAG edges via array outputs', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')

    engine.on(a, [b], (val, emitB) => emitB(val * 2))
    engine.on(b, () => {})

    const dag = engine.getDAG()
    expect(dag.edges.length).toBe(1)
    const [from, to] = dag.edges[0]
    expect(from.name).toContain('a')
    expect(to.name).toContain('b')
  })

  it('should build DAG edges via object outputs', () => {
    const a = engine.event<number>('a')
    const B = engine.event<number>('B')

    engine.on(a, { B }, (val, { B }) => B(val * 2))
    engine.on(B, () => {})

    const dag = engine.getDAG()
    expect(dag.edges.length).toBe(1)
  })

  it('should build multi-level DAG edges', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')

    engine.on(a, [b], (val, emitB) => emitB(val))
    engine.on(b, [c], (val, emitC) => emitC(val))
    engine.on(c, () => {})

    const dag = engine.getDAG()
    expect(dag.edges.length).toBe(2)
  })

  it('should track all declared outputs on rule objects', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<string>('c')

    engine.on(a, [b, c], (val, emitB, emitC) => {
      emitB(val)
      emitC(String(val))
    })

    const rules = engine.getRules()
    const ruleA = rules.find(r => r.name.includes('a'))!
    expect(ruleA.outputs).toContain(b)
    expect(ruleA.outputs).toContain(c)
  })

  it('should NOT discover edges at runtime (no runtime tracing)', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')

    // No outputs declared — handler uses engine.emit directly
    engine.on(a, (val) => engine.emit(b, val))
    engine.on(b, () => {})

    engine.emit(a, 1)

    const dag = engine.getDAG()
    expect(dag.edges.length).toBe(0)
  })
})
