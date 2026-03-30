import { describe, it, expect, beforeEach } from 'vitest'
import { Engine } from '../engine.js'
import { linear, easeIn, easeOut, easeInOut, resolveEasing } from '../easing.js'

describe('Tween', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should create a tween that starts inactive', () => {
    const start = engine.event('start')
    const tw = engine.tween({
      start,
      from: 0,
      to: 100,
      duration: 1000,
    })

    expect(tw.active).toBe(false)
    expect(tw.progress).toBe(0)
  })

  it('should activate when start event fires', () => {
    const start = engine.event('start')
    const tw = engine.tween({
      start,
      from: 0,
      to: 100,
      duration: 1000,
    })

    engine.emit(start, undefined)
    expect(tw.active).toBe(true)
    expect(tw.value).toBe(0)
  })

  it('should interpolate value over time', () => {
    const start = engine.event('start')
    const tw = engine.tween({
      start,
      from: 0,
      to: 100,
      duration: 1000,
      easing: 'linear',
    })

    engine.emit(start, undefined)
    engine.tick(0)

    // Advance 500ms (half duration)
    engine.tick(500)
    expect(tw.value).toBeCloseTo(50, 0)
    expect(tw.progress).toBeCloseTo(0.5, 1)
  })

  it('should complete and become inactive', () => {
    const start = engine.event('start')
    const tw = engine.tween({
      start,
      from: 0,
      to: 100,
      duration: 1000,
      easing: 'linear',
    })

    engine.emit(start, undefined)
    engine.tick(0)
    engine.tick(1000)

    expect(tw.active).toBe(false)
    expect(tw.progress).toBe(1)
    expect(tw.value).toBeCloseTo(100, 0)
  })

  it('should emit done event on completion', () => {
    const start = engine.event('start')
    const done = engine.event('done')
    const doneResults: any[] = []

    const tw = engine.tween({
      start,
      done,
      from: 0,
      to: 100,
      duration: 500,
      easing: 'linear',
    })

    engine.on(done, (v) => doneResults.push(v))

    engine.emit(start, undefined)
    engine.tick(0)
    expect(doneResults).toEqual([])

    engine.tick(500)
    expect(doneResults.length).toBe(1)
  })

  it('should cancel when cancel event fires', () => {
    const start = engine.event('start')
    const cancel = engine.event('cancel')

    const tw = engine.tween({
      start,
      cancel,
      from: 0,
      to: 100,
      duration: 1000,
      easing: 'linear',
    })

    engine.emit(start, undefined)
    engine.tick(0)
    engine.tick(300)
    expect(tw.active).toBe(true)

    engine.emit(cancel, undefined)
    expect(tw.active).toBe(false)
  })

  it('should support function-based from/to', () => {
    const start = engine.event('start')
    let fromVal = 10
    let toVal = 50

    const tw = engine.tween({
      start,
      from: () => fromVal,
      to: () => toVal,
      duration: 1000,
      easing: 'linear',
    })

    engine.emit(start, undefined)
    engine.tick(0)
    engine.tick(500)
    expect(tw.value).toBeCloseTo(30, 0) // lerp(10, 50, 0.5) = 30
  })

  it('should notify subscribers', () => {
    const start = engine.event('start')
    const tw = engine.tween({
      start,
      from: 0,
      to: 100,
      duration: 1000,
      easing: 'linear',
    })

    const values: number[] = []
    tw.subscribe((v) => values.push(v))

    engine.emit(start, undefined)
    engine.tick(0)
    engine.tick(250)
    engine.tick(500)

    expect(values.length).toBeGreaterThanOrEqual(2)
  })

  it('should restart when start event fires again', () => {
    const start = engine.event('start')
    const tw = engine.tween({
      start,
      from: 0,
      to: 100,
      duration: 1000,
      easing: 'linear',
    })

    engine.emit(start, undefined)
    engine.tick(0)
    engine.tick(600)
    expect(tw.value).toBeCloseTo(60, 0)

    // Restart
    engine.emit(start, undefined)
    engine.tick(600)
    // Should be back near the start since progress reset
    engine.tick(700)
    expect(tw.progress).toBeCloseTo(0.1, 1)
  })
})

describe('Easing functions', () => {
  it('linear should return identity', () => {
    expect(linear(0)).toBe(0)
    expect(linear(0.5)).toBe(0.5)
    expect(linear(1)).toBe(1)
  })

  it('easeIn should start slow', () => {
    expect(easeIn(0)).toBe(0)
    expect(easeIn(0.5)).toBeLessThan(0.5)
    expect(easeIn(1)).toBe(1)
  })

  it('easeOut should end slow', () => {
    expect(easeOut(0)).toBe(0)
    expect(easeOut(0.5)).toBeGreaterThan(0.5)
    expect(easeOut(1)).toBe(1)
  })

  it('easeInOut should be symmetric', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 1)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.25)).toBeLessThan(0.25)
    expect(easeInOut(0.75)).toBeGreaterThan(0.75)
  })

  it('resolveEasing should return linear by default', () => {
    const fn = resolveEasing()
    expect(fn(0.5)).toBe(0.5)
  })

  it('resolveEasing should accept string names', () => {
    const fn = resolveEasing('easeIn')
    expect(fn(0.5)).toBeLessThan(0.5)
  })

  it('resolveEasing should accept functions', () => {
    const custom = (t: number) => t * t
    const fn = resolveEasing(custom)
    expect(fn(0.5)).toBe(0.25)
  })

  it('resolveEasing should throw on unknown name', () => {
    expect(() => resolveEasing('unknownEasing')).toThrow('Unknown easing function')
  })
})
