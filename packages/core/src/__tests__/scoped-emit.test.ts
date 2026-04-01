import { describe, it, expect, beforeEach } from 'vitest'
import { Engine } from '../engine.js'

describe('Bound emitters (array and object outputs)', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('array outputs: bound emitter fires correct event', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const results: number[] = []

    engine.on(a, [b], (val, emitB) => emitB(val * 2))
    engine.on(b, (v) => results.push(v))

    engine.emit(a, 5)
    expect(results).toEqual([10])
  })

  it('object outputs: bound emitter fires correct event', () => {
    const a = engine.event<number>('a')
    const B = engine.event<number>('B')
    const results: number[] = []

    engine.on(a, { B }, (val, { B }) => B(val * 2))
    engine.on(B, (v) => results.push(v))

    engine.emit(a, 5)
    expect(results).toEqual([10])
  })

  it('multiple array outputs create correct DAG before any events', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const c = engine.event<number>('c')

    engine.on(a, [b, c], (val, emitB, emitC) => {
      emitB(val)
      emitC(val)
    })
    engine.on(b, () => {})
    engine.on(c, () => {})

    // DAG edges exist BEFORE any events fired
    const dag = engine.getDAG()
    expect(dag.nodes.length).toBe(3)
    expect(dag.edges.length).toBe(2)
  })

  it('async handler with array outputs delivers events after await', async () => {
    const trigger = engine.event<string>('trigger')
    const loading = engine.event<boolean>('loading')
    const done = engine.event<string>('done')
    const loadingResults: boolean[] = []
    const doneResults: string[] = []

    engine.on(trigger, [loading, done], async (query, setLoading, setDone) => {
      setLoading(true)
      await new Promise((r) => setTimeout(r, 10))
      setDone(`result:${query}`)
      setLoading(false)
    })
    engine.on(loading, (v) => loadingResults.push(v))
    engine.on(done, (v) => doneResults.push(v))

    // DAG edges exist before firing
    const triggerRule = engine.getDAG().nodes.find(n => n.name.includes('trigger'))!
    expect(triggerRule.outputs).toContain(loading)
    expect(triggerRule.outputs).toContain(done)

    engine.emit(trigger, 'test')
    await new Promise((r) => setTimeout(r, 50))

    expect(loadingResults).toEqual([true, false])
    expect(doneResults).toEqual(['result:test'])
  })

  it('join with array outputs', () => {
    const a = engine.event<number>('a')
    const b = engine.event<string>('b')
    const c = engine.event<string>('c')
    const results: string[] = []

    engine.on([a, b], [c], (numVal: number, strVal: string, emitC: any) => {
      emitC(`${numVal}-${strVal}`)
    })
    engine.on(c, (v) => results.push(v))

    engine.emit(a, 42)
    engine.emit(b, 'hello')
    expect(results).toEqual(['42-hello'])

    const joinRule = engine.getDAG().nodes.find(n => n.name.includes(','))!
    expect(joinRule.outputs).toContain(c)
  })

  it('multiple concurrent async handlers with separate outputs', async () => {
    const trigger = engine.event<number>('trigger')
    const resultA = engine.event<number>('resultA')
    const resultB = engine.event<number>('resultB')
    const aResults: number[] = []
    const bResults: number[] = []

    engine.on(trigger, [resultA], async (val, emitA) => {
      await new Promise((r) => setTimeout(r, 30))
      emitA(val * 10)
    })

    engine.on(trigger, [resultB], async (val, emitB) => {
      await new Promise((r) => setTimeout(r, 10))
      emitB(val + 100)
    })

    engine.on(resultA, (v) => aResults.push(v))
    engine.on(resultB, (v) => bResults.push(v))

    engine.emit(trigger, 5)
    await new Promise((r) => setTimeout(r, 60))

    expect(aResults).toEqual([50])
    expect(bResults).toEqual([105])

    const rules = engine.getDAG().nodes.filter(n => n.name.includes('trigger'))
    const handlerA = rules.find(r => r.outputs.includes(resultA))
    const handlerB = rules.find(r => r.outputs.includes(resultB))
    expect(handlerA).toBeDefined()
    expect(handlerB).toBeDefined()
    expect(handlerA).not.toBe(handlerB)
  })

  it('terminal handler (no outputs) works', () => {
    const a = engine.event<number>('a')
    const results: number[] = []

    engine.on(a, (val) => results.push(val))
    engine.emit(a, 42)
    expect(results).toEqual([42])
  })

  it('RuleHandle is callable as dispose', () => {
    const a = engine.event<number>('a')
    const results: number[] = []

    const handle = engine.on(a, (v) => results.push(v))
    engine.emit(a, 1)
    handle()
    engine.emit(a, 2)
    expect(results).toEqual([1])
  })

  it('RuleHandle.dispose() works', () => {
    const a = engine.event<number>('a')
    const results: number[] = []

    const handle = engine.on(a, [a], (v, emitA) => results.push(v))
    engine.emit(a, 1)
    handle.dispose()
    engine.emit(a, 2)
    expect(results).toEqual([1])
  })
})
