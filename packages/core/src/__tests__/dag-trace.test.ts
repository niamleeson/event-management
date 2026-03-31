import { describe, it, expect, beforeEach } from 'vitest'
import { Engine } from '../engine.js'

describe('DAG runtime tracing', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should discover DAG edges when on() handler emits an event', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')

    engine.on(a, (x) => {
      engine.emit(b, x * 2)
    })
    engine.on(b, () => {})

    // Before any emit, the DAG has no edges (outputs are discovered at runtime)
    const dagBefore = engine.getDAG()
    // Rules exist but no edges yet
    expect(dagBefore.nodes.length).toBe(2)

    // After emit, DAG should have discovered the edge
    engine.emit(a, 5)

    const dagAfter = engine.getDAG()
    expect(dagAfter.edges.length).toBe(1)
    // Edge should go from the on(a) rule to the on(b) rule
    const [from, to] = dagAfter.edges[0]
    expect(from.name).toContain('a')
    expect(to.name).toContain('b')
  })

  it('should discover multi-level DAG edges through chain of handlers', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')

    engine.on(a, (x) => engine.emit(b, x + 1))
    engine.on(b, (x) => engine.emit(c, x + 1))
    engine.on(c, () => {})

    engine.emit(a, 1)

    const dag = engine.getDAG()
    // Should have 2 edges: on(a)->on(b) and on(b)->on(c)
    expect(dag.edges.length).toBe(2)
  })

  it('should not add duplicate edges on repeated emits', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')

    engine.on(a, (x) => engine.emit(b, x))
    engine.on(b, () => {})

    engine.emit(a, 1)
    engine.emit(a, 2)
    engine.emit(a, 3)

    const dag = engine.getDAG()
    expect(dag.edges.length).toBe(1) // Still just 1 edge
  })

  it('should handle conditional emit (some calls emit, some do not)', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const results: number[] = []

    engine.on(a, (x) => {
      if (x > 5) {
        engine.emit(b, x)
      }
    })
    engine.on(b, (x) => results.push(x))

    // First emit does not trigger b
    engine.emit(a, 3)
    expect(results).toEqual([])

    // Second emit triggers b — edge gets discovered
    engine.emit(a, 10)
    expect(results).toEqual([10])

    const dag = engine.getDAG()
    expect(dag.edges.length).toBe(1)
  })

  it('should track outputs on rule objects', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')

    engine.on(a, (x) => {
      engine.emit(b, x)
      engine.emit(c, x)
    })
    engine.on(b, () => {})
    engine.on(c, () => {})

    engine.emit(a, 1)

    // The on(a) rule should have both b and c as outputs
    const rules = engine.getRules()
    const ruleA = rules.find(r => r.name.includes('a'))!
    expect(ruleA.outputs).toContain(b)
    expect(ruleA.outputs).toContain(c)
  })
})
