import { describe, it, expect, beforeEach } from 'vitest'
import { Engine } from '../engine.js'

describe('Signal', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should create a signal with initial value', () => {
    const increment = engine.event<number>('increment')
    const counter = engine.signal(increment, 0, (prev, n) => prev + n)

    expect(counter.value).toBe(0)
  })

  it('should update signal value when event fires', () => {
    const increment = engine.event<number>('increment')
    const counter = engine.signal(increment, 0, (prev, n) => prev + n)

    engine.emit(increment, 5)
    expect(counter.value).toBe(5)

    engine.emit(increment, 3)
    expect(counter.value).toBe(8)
  })

  it('should support signal subscription', () => {
    const set = engine.event<string>('set')
    const name = engine.signal(set, 'initial', (_prev, val) => val)

    const changes: Array<{ value: string; prev: string }> = []
    name.subscribe((value, prev) => {
      changes.push({ value, prev })
    })

    engine.emit(set, 'Alice')
    engine.emit(set, 'Bob')

    expect(changes).toEqual([
      { value: 'Alice', prev: 'initial' },
      { value: 'Bob', prev: 'Alice' },
    ])
  })

  it('should support signal unsubscribe', () => {
    const set = engine.event<number>('set')
    const sig = engine.signal(set, 0, (_prev, val) => val)

    const values: number[] = []
    const unsub = sig.subscribe((v) => values.push(v))

    engine.emit(set, 1)
    expect(values).toEqual([1])

    unsub()
    engine.emit(set, 2)
    expect(values).toEqual([1])
  })

  it('should not notify when value does not change', () => {
    const set = engine.event<number>('set')
    const sig = engine.signal(set, 5, (_prev, val) => val)

    const values: number[] = []
    sig.subscribe((v) => values.push(v))

    engine.emit(set, 5) // same value
    expect(values).toEqual([]) // no notification
  })

  it('should support signalUpdate to add event sources', () => {
    const add = engine.event<number>('add')
    const multiply = engine.event<number>('multiply')
    const sig = engine.signal(add, 10, (prev, n) => prev + n)

    engine.signalUpdate(sig, multiply, (prev, factor) => prev * factor)

    engine.emit(add, 5)
    expect(sig.value).toBe(15) // 10 + 5

    engine.emit(multiply, 2)
    expect(sig.value).toBe(30) // 15 * 2
  })

  it('should work with engine.when() to bridge signal to event', () => {
    const increment = engine.event<number>('increment')
    const threshold = engine.event<number>('threshold')
    const counter = engine.signal(increment, 0, (prev, n) => prev + n)
    const alerts: number[] = []

    engine.when(counter, (v) => v >= 10, threshold)
    engine.on(threshold, (v) => alerts.push(v))

    engine.emit(increment, 3)
    expect(alerts).toEqual([])

    engine.emit(increment, 4)
    expect(alerts).toEqual([])

    engine.emit(increment, 5)
    expect(alerts).toEqual([12]) // 3+4+5=12 >= 10
  })

  it('should support when() with exact value match', () => {
    const set = engine.event<string>('set')
    const matched = engine.event<string>('matched')
    const sig = engine.signal(set, 'init', (_prev, val) => val)
    const results: string[] = []

    engine.when(sig, 'done', matched)
    engine.on(matched, (v) => results.push(v))

    engine.emit(set, 'loading')
    expect(results).toEqual([])

    engine.emit(set, 'done')
    expect(results).toEqual(['done'])
  })

  it('should derive complex state from events', () => {
    interface TodoState {
      items: string[]
      count: number
    }
    const addTodo = engine.event<string>('addTodo')
    const removeTodo = engine.event<string>('removeTodo')

    const todos = engine.signal<TodoState>(addTodo, { items: [], count: 0 }, (prev, text) => ({
      items: [...prev.items, text],
      count: prev.count + 1,
    }))

    engine.signalUpdate(todos, removeTodo, (prev, text) => ({
      items: prev.items.filter(t => t !== text),
      count: prev.count - 1,
    }))

    engine.emit(addTodo, 'Buy milk')
    engine.emit(addTodo, 'Write code')
    expect(todos.value).toEqual({ items: ['Buy milk', 'Write code'], count: 2 })

    engine.emit(removeTodo, 'Buy milk')
    expect(todos.value).toEqual({ items: ['Write code'], count: 1 })
  })
})
