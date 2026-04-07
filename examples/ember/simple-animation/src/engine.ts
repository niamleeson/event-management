import { createEngine } from '@pulse/core'
import { createPulseService } from '@pulse/ember'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// DAG (3 levels deep)
// ---------------------------------------------------------------------------
// Increment ──→ CountChanged ──→ AnimationTargetsChanged
// Decrement ──→ CountChanged ──→ AnimationTargetsChanged
//
// Frame ──→ AnimatedCountChanged
//        ├──→ ColorIntensityChanged
//        └──→ BounceScaleChanged
//
// AnimationTargetsChanged feeds target values consumed by Frame handlers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

// Layer 0: User input events
export const Increment = engine.event<void>('Increment')
export const Decrement = engine.event<void>('Decrement')
export const Frame = engine.event<number>('Frame')

// Layer 1: Primary state events
export const CountChanged = engine.event<number>('CountChanged')

// Layer 2: Derived animation targets (from count changes)
export const AnimationTargetsChanged = engine.event<{ targetCount: number; targetColorIntensity: number; bounceScale: number }>('AnimationTargetsChanged')

// Layer 2 (Frame-driven): Animated output values
export const AnimatedCountChanged = engine.event<number>('AnimatedCountChanged')
export const ColorIntensityChanged = engine.event<number>('ColorIntensityChanged')
export const BounceScaleChanged = engine.event<number>('BounceScaleChanged')

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
// Layer 0 → Layer 1: Input handlers → primary state
// ---------------------------------------------------------------------------

engine.on(Increment, [CountChanged], (_, setCount) => {
  count += 1
  setCount(count)
})

engine.on(Decrement, [CountChanged], (_, setCount) => {
  count -= 1
  setCount(count)
})

// ---------------------------------------------------------------------------
// Layer 1 → Layer 2: Primary state → derived animation targets
// ---------------------------------------------------------------------------

engine.on(CountChanged, [AnimationTargetsChanged], (newCount, setTargets) => {
  targetCount = newCount
  targetColorIntensity = Math.max(-1, Math.min(1, newCount / 10))
  bounceScale = 1.3
  bounceVel = 0
  setTargets({ targetCount, targetColorIntensity, bounceScale })
})

// ---------------------------------------------------------------------------
// Frame loop: animate values toward targets (Layer 0 → Layer 2)
// Frame reads targets set by AnimationTargetsChanged and produces animated outputs
// ---------------------------------------------------------------------------

engine.on(Frame, [AnimatedCountChanged, ColorIntensityChanged, BounceScaleChanged], (_, setAnimated, setColor, setBounce) => {
  // Animated count: ease toward target (easeOutCubic style)
  const countDiff = targetCount - animatedCount
  if (Math.abs(countDiff) > 0.01) {
    animatedCount += countDiff * 0.08
    setAnimated(animatedCount)
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

// Start the frame loop
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

export function resetState() {
  count = 0
  animatedCount = 0
  targetCount = 0
  colorIntensity = 0
  targetColorIntensity = 0
  bounceScale = 1
  bounceVel = 0
  _rafId = null
}

// ---------------------------------------------------------------------------
// Pulse Service
// ---------------------------------------------------------------------------

export const pulse = createPulseService(engine)
