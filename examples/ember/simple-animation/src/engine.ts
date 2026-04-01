// DAG
// Increment ──→ CountChanged
// Decrement ──→ CountChanged
// Frame ──→ AnimatedCountChanged, ColorIntensityChanged, BounceScaleChanged

import { createEngine } from '@pulse/core'
import { createPulseService } from '@pulse/ember'

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
export const AnimatedCountChanged = engine.event<number>('AnimatedCountChanged')
export const ColorIntensityChanged = engine.event<number>('ColorIntensityChanged')
export const BounceScaleChanged = engine.event<number>('BounceScaleChanged')
export const Frame = engine.event<number>('Frame')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let count = 0
let animatedCount = 0
let targetCount = 0
let colorIntensity = 0
let targetColorIntensity = 0
let bounceScale = 1
let bounceVel = 0

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

engine.on(Increment, [CountChanged], (_, setCount) => {
  count += 1
  targetCount = count
  targetColorIntensity = Math.max(-1, Math.min(1, count / 10))
  bounceScale = 1.3
  bounceVel = 0
  setCount(count)
})

engine.on(Decrement, [CountChanged], (_, setCount) => {
  count -= 1
  targetCount = count
  targetColorIntensity = Math.max(-1, Math.min(1, count / 10))
  bounceScale = 1.3
  bounceVel = 0
  setCount(count)
})

// ---------------------------------------------------------------------------
// Frame loop: animate values
// ---------------------------------------------------------------------------

engine.on(Frame, [AnimatedCountChanged, ColorIntensityChanged, BounceScaleChanged], (_dt, setAnim, setColor, setBounce) => {
  // Animated count: ease toward target (easeOutCubic style)
  const countDiff = targetCount - animatedCount
  if (Math.abs(countDiff) > 0.01) {
    animatedCount += countDiff * 0.08
    setAnim(animatedCount)
  }

  // Color intensity: ease toward target
  const colorDiff = targetColorIntensity - colorIntensity
  if (Math.abs(colorDiff) > 0.001) {
    colorIntensity += colorDiff * 0.05
    setColor(colorIntensity)
  }

  // Bounce: spring toward 1
  if (Math.abs(bounceScale - 1) > 0.001 || Math.abs(bounceVel) > 0.001) {
    const force = (1 - bounceScale) * 0.15
    bounceVel += force
    bounceVel *= 0.75
    bounceScale += bounceVel
    setBounce(bounceScale)
  }
})

// Start/stop the frame loop
let _rafId: number | null = null
export function startLoop() {
  if (_rafId !== null) return
  let last = performance.now()
  const loop = () => {
    const now = performance.now()
    engine.emit(Frame, now - last)
    last = now
    _rafId = requestAnimationFrame(loop)
  }
  _rafId = requestAnimationFrame(loop)
}
export function stopLoop() {
  if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null }
}

// ---------------------------------------------------------------------------
// Pulse Service
// ---------------------------------------------------------------------------

export const pulse = createPulseService(engine)
