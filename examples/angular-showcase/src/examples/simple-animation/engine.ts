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

// State change events
export const CountChanged = engine.event<number>('CountChanged')
export const AnimatedCountChanged = engine.event<number>('AnimatedCountChanged')
export const ColorIntensityChanged = engine.event<number>('ColorIntensityChanged')
export const BounceScaleChanged = engine.event<number>('BounceScaleChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let count = 0
let animatedCount = 0
let colorIntensity = 0
let bounceScale = 1

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutQuad(t: number): number {
  return t * (2 - t)
}

function elasticOut(t: number): number {
  const p = 0.4
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
}

// Simple tween helper
function animateTo(
  from: number,
  to: number,
  duration: number,
  easing: (t: number) => number,
  onUpdate: (v: number) => void,
  onDone?: () => void,
) {
  const start = performance.now()
  function tick() {
    const elapsed = performance.now() - start
    const t = Math.min(1, elapsed / duration)
    const v = from + (to - from) * easing(t)
    onUpdate(v)
    if (t < 1) {
      requestAnimationFrame(tick)
    } else {
      onDone?.()
    }
  }
  requestAnimationFrame(tick)
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

engine.on(Increment, () => {
  count++
  engine.emit(CountChanged, count)

  // Animate count display
  animateTo(animatedCount, count, 400, easeOutCubic, (v) => {
    animatedCount = v
    engine.emit(AnimatedCountChanged, v)
  })

  // Animate color intensity
  const targetIntensity = Math.max(-1, Math.min(1, count / 10))
  animateTo(colorIntensity, targetIntensity, 600, easeOutQuad, (v) => {
    colorIntensity = v
    engine.emit(ColorIntensityChanged, v)
  })

  // Bounce animation
  bounceScale = 1.3
  animateTo(1.3, 1, 300, elasticOut, (v) => {
    bounceScale = v
    engine.emit(BounceScaleChanged, v)
  })
})

engine.on(Decrement, () => {
  count--
  engine.emit(CountChanged, count)

  animateTo(animatedCount, count, 400, easeOutCubic, (v) => {
    animatedCount = v
    engine.emit(AnimatedCountChanged, v)
  })

  const targetIntensity = Math.max(-1, Math.min(1, count / 10))
  animateTo(colorIntensity, targetIntensity, 600, easeOutQuad, (v) => {
    colorIntensity = v
    engine.emit(ColorIntensityChanged, v)
  })

  bounceScale = 1.3
  animateTo(1.3, 1, 300, elasticOut, (v) => {
    bounceScale = v
    engine.emit(BounceScaleChanged, v)
  })
})
