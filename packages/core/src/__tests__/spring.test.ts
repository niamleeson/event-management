import { describe, it, expect, beforeEach } from 'vitest'
import { Engine } from '../engine.js'
import { createSignal } from '../signal.js'

describe('Spring', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should create a spring from a signal', () => {
    const set = engine.event<number>('set')
    const target = engine.signal(set, 0, (_prev, val) => val)
    const sp = engine.spring(target)

    expect(sp.value).toBe(0)
    expect(sp.velocity).toBe(0)
    expect(sp.settled).toBe(true)
  })

  it('should chase the target value when it changes', () => {
    const set = engine.event<number>('set')
    const target = engine.signal(set, 0, (_prev, val) => val)
    const sp = engine.spring(target, {
      stiffness: 200,
      damping: 15,
      restThreshold: 0.5,
    })

    // Change target
    engine.emit(set, 100)
    expect(sp.settled).toBe(false)

    // Simulate several frames
    let time = 0
    for (let i = 0; i < 200; i++) {
      time += 16
      engine.tick(time)
    }

    // Should have settled near the target
    expect(sp.value).toBeCloseTo(100, 0)
    expect(sp.settled).toBe(true)
  })

  it('should notify subscribers during animation', () => {
    const set = engine.event<number>('set')
    const target = engine.signal(set, 0, (_prev, val) => val)
    const sp = engine.spring(target, {
      stiffness: 200,
      damping: 15,
      restThreshold: 0.5,
    })

    const values: number[] = []
    sp.subscribe((v) => values.push(v))

    engine.emit(set, 50)

    let time = 0
    for (let i = 0; i < 10; i++) {
      time += 16
      engine.tick(time)
    }

    expect(values.length).toBeGreaterThan(0)
  })

  it('should emit done event when settled', () => {
    const set = engine.event<number>('set')
    const done = engine.event('springDone')
    const target = engine.signal(set, 0, (_prev, val) => val)
    const doneResults: any[] = []

    const sp = engine.spring(target, {
      stiffness: 300,
      damping: 30,
      restThreshold: 1,
      done,
    })

    engine.on(done, (v) => doneResults.push(v))

    engine.emit(set, 10)

    let time = 0
    for (let i = 0; i < 500; i++) {
      time += 16
      engine.tick(time)
    }

    expect(sp.settled).toBe(true)
    expect(doneResults.length).toBeGreaterThanOrEqual(1)
  })

  it('should overshoot with low damping', () => {
    const set = engine.event<number>('set')
    const target = engine.signal(set, 0, (_prev, val) => val)
    const sp = engine.spring(target, {
      stiffness: 300,
      damping: 5, // underdamped
      restThreshold: 0.5,
    })

    engine.emit(set, 100)

    let maxValue = 0
    let time = 0
    for (let i = 0; i < 300; i++) {
      time += 16
      engine.tick(time)
      if (sp.value > maxValue) maxValue = sp.value
    }

    // With low damping, the spring should overshoot the target
    expect(maxValue).toBeGreaterThan(100)
  })

  it('should re-animate when target changes again', () => {
    const set = engine.event<number>('set')
    const target = engine.signal(set, 0, (_prev, val) => val)
    const sp = engine.spring(target, {
      stiffness: 200,
      damping: 20,
      restThreshold: 0.5,
    })

    engine.emit(set, 100)

    // Run to settled
    let time = 0
    for (let i = 0; i < 500; i++) {
      time += 16
      engine.tick(time)
    }
    expect(sp.settled).toBe(true)

    // Change target again
    engine.emit(set, 0)
    expect(sp.settled).toBe(false)

    for (let i = 0; i < 500; i++) {
      time += 16
      engine.tick(time)
    }
    expect(sp.value).toBeCloseTo(0, 0)
    expect(sp.settled).toBe(true)
  })

  it('should work with a TweenValue as target', () => {
    const start = engine.event('start')
    const tw = engine.tween({
      start,
      from: 0,
      to: 100,
      duration: 1000,
      easing: 'linear',
    })

    const sp = engine.spring(tw, {
      stiffness: 200,
      damping: 20,
      restThreshold: 1,
    })

    engine.emit(start, undefined)

    let time = 0
    for (let i = 0; i < 200; i++) {
      time += 16
      engine.tick(time)
    }

    // Spring should be chasing the tween value
    expect(sp.value).toBeGreaterThan(0)
  })
})
