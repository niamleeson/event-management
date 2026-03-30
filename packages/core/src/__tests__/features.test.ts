import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Engine } from '../engine.js'
import { createSignal } from '../signal.js'

describe('Feature 1: pipeIf (conditional pipe)', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should emit when handler returns a non-null value', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    engine.pipeIf(input, output, (x) => x > 0 ? x * 2 : null)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 5)
    expect(results).toEqual([10])
  })

  it('should NOT emit when handler returns null', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    engine.pipeIf(input, output, (x) => x > 0 ? x * 2 : null)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, -1)
    expect(results).toEqual([])
  })

  it('should NOT emit when handler returns undefined', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    engine.pipeIf(input, output, (x) => x > 0 ? x : undefined)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, -5)
    expect(results).toEqual([])
  })

  it('should be unsubscribable', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    const unsub = engine.pipeIf(input, output, (x) => x)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 1)
    expect(results).toEqual([1])

    unsub()
    engine.emit(input, 2)
    expect(results).toEqual([1])
  })
})

describe('Feature 2: Debounce', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce events by the specified delay', () => {
    const input = engine.event<string>('input')
    const output = engine.event<string>('output')
    const results: string[] = []

    engine.debounce(input, 100, output)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 'a')
    engine.emit(input, 'b')
    engine.emit(input, 'c')

    expect(results).toEqual([])

    vi.advanceTimersByTime(100)
    expect(results).toEqual(['c']) // only last value
  })

  it('should reset timer on each new input', () => {
    const input = engine.event<string>('input')
    const output = engine.event<string>('output')
    const results: string[] = []

    engine.debounce(input, 100, output)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 'a')
    vi.advanceTimersByTime(50)
    engine.emit(input, 'b')
    vi.advanceTimersByTime(50)
    // 100ms total but only 50ms since last emit
    expect(results).toEqual([])

    vi.advanceTimersByTime(50)
    expect(results).toEqual(['b'])
  })

  it('should be cleanable', () => {
    const input = engine.event<string>('input')
    const output = engine.event<string>('output')
    const results: string[] = []

    const cleanup = engine.debounce(input, 100, output)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 'a')
    cleanup()
    vi.advanceTimersByTime(200)
    expect(results).toEqual([])
  })
})

describe('Feature 3: Throttle', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should emit immediately on first call', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    engine.throttle(input, 100, output)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 1)
    expect(results).toEqual([1])
  })

  it('should drop intermediate events within the window', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    engine.throttle(input, 100, output)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 1) // immediate
    engine.emit(input, 2) // buffered
    engine.emit(input, 3) // replaces buffered

    expect(results).toEqual([1])
  })

  it('should emit trailing event when window expires', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    engine.throttle(input, 100, output)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 1) // immediate
    engine.emit(input, 2) // buffered
    engine.emit(input, 3) // replaces buffered

    vi.advanceTimersByTime(100)
    expect(results).toEqual([1, 3]) // trailing fires
  })

  it('should be cleanable', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    const cleanup = engine.throttle(input, 100, output)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 1)
    engine.emit(input, 2)
    cleanup()
    vi.advanceTimersByTime(200)
    expect(results).toEqual([1]) // no trailing after cleanup
  })
})

describe('Feature 4: Computed signals', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should compute initial value from dependencies', () => {
    const ev1 = engine.event<number>('ev1')
    const ev2 = engine.event<number>('ev2')
    const a = engine.signal(ev1, 2, (_prev, val) => val)
    const b = engine.signal(ev2, 3, (_prev, val) => val)

    const sum = engine.computed([a, b], (aVal, bVal) => aVal + bVal)
    expect(sum.value).toBe(5)
  })

  it('should recompute when any dependency changes', () => {
    const ev1 = engine.event<number>('ev1')
    const ev2 = engine.event<number>('ev2')
    const a = engine.signal(ev1, 2, (_prev, val) => val)
    const b = engine.signal(ev2, 3, (_prev, val) => val)

    const sum = engine.computed([a, b], (aVal, bVal) => aVal + bVal)
    expect(sum.value).toBe(5)

    engine.emit(ev1, 10)
    expect(sum.value).toBe(13) // 10 + 3

    engine.emit(ev2, 20)
    expect(sum.value).toBe(30) // 10 + 20
  })

  it('should notify subscribers when computed value changes', () => {
    const ev = engine.event<number>('ev')
    const a = engine.signal(ev, 1, (_prev, val) => val)

    const doubled = engine.computed([a], (aVal) => aVal * 2)
    const values: number[] = []
    doubled.subscribe((v) => values.push(v))

    engine.emit(ev, 5)
    expect(values).toEqual([10])
  })
})

describe('Feature 5: Signal.set() — imperative set', () => {
  it('should expose set() as a public method', () => {
    const sig = createSignal(0)
    expect(typeof sig.set).toBe('function')
  })

  it('should update value and notify subscribers', () => {
    const sig = createSignal(0)
    const values: number[] = []
    sig.subscribe((v) => values.push(v))

    sig.set(42)
    expect(sig.value).toBe(42)
    expect(values).toEqual([42])
  })

  it('should not notify if value is the same', () => {
    const sig = createSignal(5)
    const values: number[] = []
    sig.subscribe((v) => values.push(v))

    sig.set(5) // same value
    expect(values).toEqual([])
  })

  it('_set should still work as backward compatibility', () => {
    const sig = createSignal(0)
    sig._set(10)
    expect(sig.value).toBe(10)
  })
})

describe('Feature 6: Time-windowed joins (joinWithin)', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should fire when all inputs arrive within the window', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const out = engine.event<number>('out')
    const results: number[] = []

    engine.joinWithin([a, b], out, 200, {
      do: (aVal, bVal) => aVal + bVal,
    })
    engine.on(out, (v) => results.push(v))

    engine.emit(a, 10)
    vi.advanceTimersByTime(50)
    engine.emit(b, 20)
    expect(results).toEqual([30])
  })

  it('should discard when window expires before all inputs arrive', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const out = engine.event<number>('out')
    const results: number[] = []

    engine.joinWithin([a, b], out, 100, {
      do: (aVal, bVal) => aVal + bVal,
    })
    engine.on(out, (v) => results.push(v))

    engine.emit(a, 10)
    vi.advanceTimersByTime(200) // window expires
    engine.emit(b, 20)
    expect(results).toEqual([])
  })

  it('should support guards', () => {
    const a = engine.event<number>('a')
    const b = engine.event<number>('b')
    const out = engine.event<number>('out')
    const results: number[] = []

    engine.joinWithin([a, b], out, 200, {
      guard: (aVal, bVal) => aVal + bVal > 100,
      do: (aVal, bVal) => aVal + bVal,
    })
    engine.on(out, (v) => results.push(v))

    engine.emit(a, 10)
    engine.emit(b, 20)
    expect(results).toEqual([]) // 10+20=30 not > 100
  })
})

describe('Feature 7: Event coalescing', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should batch events and emit only the latest on tick', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    engine.coalesce(input, output)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 1)
    engine.emit(input, 2)
    engine.emit(input, 3)

    // Nothing emitted yet — waiting for frame tick
    expect(results).toEqual([])

    // Tick to flush coalesced events
    engine.tick(0)
    engine.tick(16)
    expect(results).toEqual([3]) // only latest
  })

  it('should be cleanable', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []

    const cleanup = engine.coalesce(input, output)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 1)
    cleanup()
    engine.tick(0)
    engine.tick(16)
    expect(results).toEqual([])
  })
})

describe('Feature 8: Tween sequencing', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should create a sequence of tweens', () => {
    const start = engine.event('start')
    const done = engine.event('done')

    const tweens = engine.sequence(start, [
      { start, from: 0, to: 100, duration: 500, easing: 'linear' },
      { start, from: 100, to: 200, duration: 500, easing: 'linear' },
    ], done)

    expect(tweens.length).toBe(2)
  })

  it('should chain tweens — second starts after first completes', () => {
    const start = engine.event<void>('start')
    const done = engine.event<void>('done')
    const doneResults: any[] = []
    const secondStarted: boolean[] = []

    const tweens = engine.sequence(start, [
      { start, from: 0, to: 100, duration: 500, easing: 'linear' },
      { start, from: 100, to: 200, duration: 1000, easing: 'linear' },
    ], done)

    engine.on(done, () => doneResults.push(true))

    // Start the sequence
    engine.emit(start, undefined as any)

    // First tween should be active
    expect(tweens[0].active).toBe(true)
    expect(tweens[1].active).toBe(false)

    // Tick through first tween partially
    engine.tick(0)
    engine.tick(250) // halfway through first tween
    expect(tweens[0].active).toBe(true)
    expect(tweens[1].active).toBe(false)

    // Complete first tween — second tween starts and gets remainder of dt applied
    engine.tick(500) // first tween completes (dt=250), second starts

    expect(tweens[0].active).toBe(false)
    // Second tween is active and was advanced within same tick, but has longer duration (1000ms)
    // so it's still active
    expect(tweens[1].active).toBe(true)

    // Complete the second tween
    engine.tick(1600) // enough time for second tween (1000ms duration)

    // Done event should have fired
    expect(tweens[1].active).toBe(false)
    expect(doneResults.length).toBe(1)
  })

  it('should return empty array for empty configs', () => {
    const start = engine.event('start')
    const tweens = engine.sequence(start, [])
    expect(tweens).toEqual([])
  })
})

describe('Feature 9: Error boundaries', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should catch errors when onError is set', () => {
    const input = engine.event<number>('input')
    const errors: any[] = []

    engine.onError = (err, rule, event) => {
      errors.push({ message: err.message, ruleName: rule.name, event })
    }

    engine.on(input, () => {
      throw new Error('rule boom')
    })

    engine.emit(input, 42)

    expect(errors.length).toBe(1)
    expect(errors[0].message).toBe('rule boom')
    expect(errors[0].event).toBe(42)
  })

  it('should continue propagation after error', () => {
    const input = engine.event<number>('input')
    const output = engine.event<number>('output')
    const results: number[] = []
    const errors: any[] = []

    engine.onError = (err) => {
      errors.push(err.message)
    }

    // This handler throws
    engine.on(input, () => {
      throw new Error('first handler error')
    })

    // This pipe should still work
    engine.pipe(input, output, (x) => x * 2)
    engine.on(output, (v) => results.push(v))

    engine.emit(input, 5)

    expect(errors).toEqual(['first handler error'])
    expect(results).toEqual([10])
  })

  it('should throw if onError is not set', () => {
    const input = engine.event<number>('input')

    engine.on(input, () => {
      throw new Error('unhandled')
    })

    expect(() => engine.emit(input, 1)).toThrow('unhandled')
  })
})

describe('Feature 10: engine.destroy()', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should clear all signals', () => {
    const ev = engine.event<number>('ev')
    engine.signal(ev, 0, (prev, n) => prev + n)
    expect(engine.getSignals().length).toBe(1)

    engine.destroy()
    expect(engine.getSignals().length).toBe(0)
  })

  it('should clear all tweens', () => {
    const start = engine.event('start')
    engine.tween({ start, from: 0, to: 100, duration: 1000 })
    expect(engine.getTweens().length).toBe(1)

    engine.destroy()
    expect(engine.getTweens().length).toBe(0)
  })

  it('should clear all springs', () => {
    const ev = engine.event<number>('ev')
    const sig = engine.signal(ev, 0, (_prev, val) => val)
    engine.spring(sig)
    expect(engine.getSprings().length).toBe(1)

    engine.destroy()
    expect(engine.getSprings().length).toBe(0)
  })

  it('should clear all rules', () => {
    const a = engine.event('a')
    const b = engine.event('b')
    engine.pipe(a, b, (x) => x)
    expect(engine.getRules().length).toBeGreaterThan(0)

    engine.destroy()
    expect(engine.getRules().length).toBe(0)
  })

  it('should clear all mailboxes', () => {
    const a = engine.event<number>('a')
    engine.on(a, () => {})
    engine.emit(a, 1)

    engine.destroy()
    expect(engine.getMailboxes().size).toBe(0)
  })

  it('should be idempotent', () => {
    engine.destroy()
    expect(() => engine.destroy()).not.toThrow()
  })
})

describe('Feature 11: Snapshot / Restore', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should capture signal values in a snapshot', () => {
    const ev = engine.event<number>('ev')
    engine.signal(ev, 42, (_prev, val) => val)
    const snap = engine.snapshot()
    expect(snap.size).toBe(1)
    // The value should be 42
    const values = Array.from(snap.values())
    expect(values).toContain(42)
  })

  it('should restore signal values from a snapshot', () => {
    const ev = engine.event<number>('ev')
    const sig = engine.signal(ev, 0, (_prev, val) => val)
    engine.emit(ev, 100)
    expect(sig.value).toBe(100)

    const snap = engine.snapshot()
    engine.emit(ev, 999)
    expect(sig.value).toBe(999)

    engine.restore(snap)
    expect(sig.value).toBe(100)
  })

  it('should reset tweens on restore', () => {
    const start = engine.event('start')
    const tw = engine.tween({ start, from: 0, to: 100, duration: 1000, easing: 'linear' })
    engine.emit(start, undefined as any)
    expect(tw.active).toBe(true)

    const snap = engine.snapshot()
    engine.restore(snap)
    expect(tw.active).toBe(false)
    expect(tw.progress).toBe(0)
  })
})

describe('Feature 12: Middleware', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should allow middleware to modify event payloads', () => {
    const ev = engine.event<number>('ev')
    const results: number[] = []

    engine.use((event) => ({
      type: event.type,
      payload: event.payload * 10,
    }))

    engine.on(ev, (v) => results.push(v))
    engine.emit(ev, 5)
    expect(results).toEqual([50])
  })

  it('should allow middleware to block events', () => {
    const ev = engine.event<number>('ev')
    const results: number[] = []

    engine.use((event) => {
      if (event.payload < 0) return null
      return event
    })

    engine.on(ev, (v) => results.push(v))
    engine.emit(ev, -1)
    expect(results).toEqual([])
    engine.emit(ev, 5)
    expect(results).toEqual([5])
  })

  it('should chain multiple middlewares in order', () => {
    const ev = engine.event<number>('ev')
    const results: number[] = []

    engine.use((event) => ({ type: event.type, payload: event.payload + 1 }))
    engine.use((event) => ({ type: event.type, payload: event.payload * 2 }))

    engine.on(ev, (v) => results.push(v))
    engine.emit(ev, 5)
    // (5+1)*2 = 12
    expect(results).toEqual([12])
  })

  it('should return unsubscribe function', () => {
    const ev = engine.event<number>('ev')
    const results: number[] = []

    const unsub = engine.use((event) => ({
      type: event.type,
      payload: event.payload * 10,
    }))

    engine.on(ev, (v) => results.push(v))
    engine.emit(ev, 5)
    expect(results).toEqual([50])

    unsub()
    engine.emit(ev, 5)
    expect(results).toEqual([50, 5]) // no longer modified
  })
})

describe('Feature 13: Nested engines (sub-engines)', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should create a child engine', () => {
    const child = engine.createChild()
    expect(child).toBeInstanceOf(Engine)
  })

  it('should destroy children when parent is destroyed', () => {
    const child = engine.createChild()
    const childEv = child.event<number>('ev')
    child.signal(childEv, 0, (_prev, val) => val)
    expect(child.getSignals().length).toBe(1)

    engine.destroy()
    expect(child.getSignals().length).toBe(0) // child was destroyed
  })

  it('child should tick when parent ticks', () => {
    const child = engine.createChild()
    const frameValues: number[] = []

    child.on(child.frame, (data) => {
      frameValues.push(data.time)
    })

    engine.tick(0)
    engine.tick(16)
    expect(frameValues).toContain(16)
  })

  it('child engine should be independent for events', () => {
    const child = engine.createChild()

    const parentEv = engine.event<number>('parentEv')
    const childEv = child.event<number>('childEv')
    const parentResults: number[] = []
    const childResults: number[] = []

    engine.on(parentEv, (v) => parentResults.push(v))
    child.on(childEv, (v) => childResults.push(v))

    engine.emit(parentEv, 1)
    child.emit(childEv, 2)

    expect(parentResults).toEqual([1])
    expect(childResults).toEqual([2])
  })
})

describe('Feature 14: Event replay', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should record events with timestamps', () => {
    const ev = engine.event<number>('ev')
    engine.on(ev, () => {}) // need a consumer

    engine.startRecording()
    engine.emit(ev, 1)
    engine.emit(ev, 2)
    const recording = engine.stopRecording()

    expect(recording.length).toBe(2)
    expect(recording[0].payload).toBe(1)
    expect(recording[1].payload).toBe(2)
    expect(recording[0].type).toBe(ev)
    expect(typeof recording[0].timestamp).toBe('number')
  })

  it('should not record when not started', () => {
    const ev = engine.event<number>('ev')
    engine.on(ev, () => {})

    engine.emit(ev, 1)
    const recording = engine.stopRecording()
    expect(recording.length).toBe(0)
  })

  it('should replay events', async () => {
    vi.useFakeTimers()
    const ev = engine.event<number>('ev')
    const results: number[] = []
    engine.on(ev, (v) => results.push(v))

    // Create a synthetic recording
    const recording = [
      { type: ev, payload: 10, timestamp: 0 },
      { type: ev, payload: 20, timestamp: 50 },
      { type: ev, payload: 30, timestamp: 100 },
    ]

    engine.replay(recording)

    // First event fires immediately
    expect(results).toEqual([10])

    vi.advanceTimersByTime(50)
    expect(results).toEqual([10, 20])

    vi.advanceTimersByTime(50)
    expect(results).toEqual([10, 20, 30])

    vi.useRealTimers()
  })

  it('should roundtrip record and replay', () => {
    vi.useFakeTimers()
    const ev = engine.event<string>('ev')
    const results: string[] = []
    engine.on(ev, (v) => results.push(v))

    engine.startRecording()
    engine.emit(ev, 'hello')
    engine.emit(ev, 'world')
    const recording = engine.stopRecording()

    // Clear results
    results.length = 0

    // Replay
    engine.replay(recording)
    // The first event fires immediately (delay=0)
    // The second event may have a small delay relative to the first
    // Advance timers to ensure all are replayed
    vi.advanceTimersByTime(100)
    expect(results).toContain('hello')
    expect(results).toContain('world')

    vi.useRealTimers()
  })
})

// Need to import afterEach
import { afterEach } from 'vitest'
