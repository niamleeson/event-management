import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const Increment = engine.event<void>('Increment')
export const Decrement = engine.event<void>('Decrement')
export const CountChanged = engine.event<number>('CountChanged')
export const BounceStart = engine.event<'inc' | 'dec'>('BounceStart')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _count = 0
let _animatedCount = 0
let _colorIntensity = 0
let _bounceScale = 1

// Animation state
let _animCountFrom = 0
let _animCountTo = 0
let _animCountStart = 0
let _animCountDuration = 400
let _animCountActive = false

let _colorFrom = 0
let _colorTo = 0
let _colorStart = 0
let _colorDuration = 600
let _colorActive = false

let _bounceFrom = 1.3
let _bounceTo = 1
let _bounceStartTime = 0
let _bounceDuration = 300
let _bounceActive = false

export function getCount(): number { return _count }
export function getAnimatedCount(): number { return _animatedCount }
export function getColorIntensity(): number { return _colorIntensity }
export function getBounceScale(): number { return _bounceScale }

// ---------------------------------------------------------------------------
// Easing functions
// ---------------------------------------------------------------------------

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutQuad(t: number): number { return t * (2 - t) }
function elasticOut(t: number): number {
  const p = 0.4
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(Increment, () => {
  _count += 1
  engine.emit(CountChanged, _count)
  engine.emit(BounceStart, 'inc')
})

engine.on(Decrement, () => {
  _count -= 1
  engine.emit(CountChanged, _count)
  engine.emit(BounceStart, 'dec')
})

engine.on(CountChanged, (_value: number) => {
  // Start animated count tween
  _animCountFrom = _animatedCount
  _animCountTo = _count
  _animCountStart = performance.now()
  _animCountActive = true

  // Start color intensity tween
  _colorFrom = _colorIntensity
  _colorTo = Math.max(-1, Math.min(1, _count / 10))
  _colorStart = performance.now()
  _colorActive = true
})

engine.on(BounceStart, () => {
  _bounceFrom = 1.3
  _bounceTo = 1
  _bounceStartTime = performance.now()
  _bounceActive = true
})

// ---------------------------------------------------------------------------
// Frame update (called from page via rAF)
// ---------------------------------------------------------------------------

export function updateFrame(now: number): void {
  if (_animCountActive) {
    const elapsed = now - _animCountStart
    const t = Math.min(1, elapsed / _animCountDuration)
    _animatedCount = _animCountFrom + (_animCountTo - _animCountFrom) * easeOutCubic(t)
    if (t >= 1) _animCountActive = false
  }

  if (_colorActive) {
    const elapsed = now - _colorStart
    const t = Math.min(1, elapsed / _colorDuration)
    _colorIntensity = _colorFrom + (_colorTo - _colorFrom) * easeOutQuad(t)
    if (t >= 1) _colorActive = false
  }

  if (_bounceActive) {
    const elapsed = now - _bounceStartTime
    const t = Math.min(1, elapsed / _bounceDuration)
    _bounceScale = _bounceFrom + (_bounceTo - _bounceFrom) * elasticOut(t)
    if (t >= 1) _bounceActive = false
  }
}
