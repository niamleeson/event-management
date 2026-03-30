import { describe, it, expect, beforeEach } from 'vitest'
import { DAG } from '../dag.js'
import { createEventType, resetEventTypeCounter } from '../event-type.js'
import { createRule, registerRuleConsumers, resetRuleCounter } from '../rule.js'
import type { Rule, EventType } from '../types.js'

describe('DAG', () => {
  let dag: DAG

  beforeEach(() => {
    dag = new DAG()
    resetEventTypeCounter()
    resetRuleCounter()
  })

  function makeType(name: string): EventType {
    return createEventType(name)
  }

  function makeRule(name: string, triggers: EventType[], outputs: EventType[]): Rule {
    const rule = createRule({
      name,
      triggers,
      mode: 'each',
      action: () => {},
      outputs,
    })
    registerRuleConsumers(rule)
    return rule
  }

  it('should add and retrieve rules', () => {
    const a = makeType('a')
    const b = makeType('b')
    const rule = makeRule('r1', [a], [b])
    dag.addRule(rule)

    expect(dag.getRules()).toContain(rule)
  })

  it('should compute topological order for a linear chain', () => {
    const a = makeType('a')
    const b = makeType('b')
    const c = makeType('c')

    const r1 = makeRule('r1', [a], [b])
    const r2 = makeRule('r2', [b], [c])

    dag.addRule(r1)
    dag.addRule(r2)

    const order = dag.getTopologicalOrder()
    const idx1 = order.indexOf(r1)
    const idx2 = order.indexOf(r2)
    expect(idx1).toBeLessThan(idx2)
  })

  it('should detect cycles', () => {
    const a = makeType('a')
    const b = makeType('b')

    const r1 = makeRule('r1', [a], [b])
    const r2 = makeRule('r2', [b], [a])

    dag.addRule(r1)
    // Cycle detected either at addRule or getTopologicalOrder
    expect(() => {
      dag.addRule(r2)
      dag.getTopologicalOrder()
    }).toThrow(/Cycle detected/)
  })

  it('should handle diamond-shaped DAG without detecting false cycle', () => {
    const src = makeType('src')
    const left = makeType('left')
    const right = makeType('right')
    const merged = makeType('merged')

    const r1 = makeRule('src->left', [src], [left])
    const r2 = makeRule('src->right', [src], [right])
    const r3 = makeRule('join', [left, right], [merged])

    dag.addRule(r1)
    dag.addRule(r2)
    dag.addRule(r3)

    const order = dag.getTopologicalOrder()
    const i1 = order.indexOf(r1)
    const i2 = order.indexOf(r2)
    const i3 = order.indexOf(r3)

    expect(i3).toBeGreaterThan(i1)
    expect(i3).toBeGreaterThan(i2)
  })

  it('should remove rules and update order', () => {
    const a = makeType('a')
    const b = makeType('b')
    const c = makeType('c')

    const r1 = makeRule('r1', [a], [b])
    const r2 = makeRule('r2', [b], [c])

    dag.addRule(r1)
    dag.addRule(r2)

    dag.removeRule(r2)
    const order = dag.getTopologicalOrder()
    expect(order).toContain(r1)
    expect(order).not.toContain(r2)
  })

  it('should return edges', () => {
    const a = makeType('a')
    const b = makeType('b')

    const r1 = makeRule('r1', [a], [b])
    const r2 = makeRule('r2', [b], [])

    dag.addRule(r1)
    dag.addRule(r2)

    const edges = dag.getEdges()
    expect(edges.length).toBe(1)
    expect(edges[0][0]).toBe(r1)
    expect(edges[0][1]).toBe(r2)
  })

  it('should return graph for introspection', () => {
    const a = makeType('a')
    const b = makeType('b')

    const r1 = makeRule('r1', [a], [b])
    dag.addRule(r1)

    const graph = dag.getGraph()
    expect(graph.nodes).toContain(r1)
    expect(graph.edges).toBeDefined()
  })

  it('should handle parallel independent rules', () => {
    const a = makeType('a')
    const b = makeType('b')
    const c = makeType('c')
    const d = makeType('d')

    const r1 = makeRule('r1', [a], [b])
    const r2 = makeRule('r2', [c], [d])

    dag.addRule(r1)
    dag.addRule(r2)

    // No cycle, both should be in order
    const order = dag.getTopologicalOrder()
    expect(order).toContain(r1)
    expect(order).toContain(r2)
  })

  it('should handle long chain without error', () => {
    const types: EventType[] = []
    for (let i = 0; i <= 20; i++) {
      types.push(makeType(`t${i}`))
    }

    for (let i = 0; i < 20; i++) {
      const rule = makeRule(`r${i}`, [types[i]], [types[i + 1]])
      dag.addRule(rule)
    }

    const order = dag.getTopologicalOrder()
    expect(order.length).toBe(20)
  })
})
