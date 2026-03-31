import { createEngine } from '@pulse/core'

export const engine = createEngine()

// Events
export const Increment = engine.event<void>('Increment')
export const Decrement = engine.event<void>('Decrement')
export const CountChanged = engine.event<number>('CountChanged')
export const AnimValuesChanged = engine.event<{ animatedCount: number; colorIntensity: number; bounceScale: number }>('AnimValuesChanged')

// State
let count = 0
let animatedCount = 0
let colorIntensity = 0
let bounceScale = 1
let animFrame: number | null = null

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }
function easeOutQuad(t: number) { return t * (2 - t) }
function elasticOut(t: number) {
  const p = 0.4
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
}

// Animation targets & states
let countAnimTarget = 0
let countAnimFrom = 0
let countAnimElapsed = 0
let countAnimActive = false

let colorTarget = 0
let colorFrom = 0
let colorElapsed = 0
let colorActive = false

let bounceElapsed = 0
let bounceActive = false

function startAnimLoop() {
  if (animFrame !== null) return
  let lastTime = performance.now()
  function tick(now: number) {
    const dt = now - lastTime
    lastTime = now

    if (countAnimActive) {
      countAnimElapsed += dt
      const t = Math.min(1, countAnimElapsed / 400)
      animatedCount = countAnimFrom + (countAnimTarget - countAnimFrom) * easeOutCubic(t)
      if (t >= 1) countAnimActive = false
    }

    if (colorActive) {
      colorElapsed += dt
      const t = Math.min(1, colorElapsed / 600)
      colorIntensity = colorFrom + (colorTarget - colorFrom) * easeOutQuad(t)
      if (t >= 1) colorActive = false
    }

    if (bounceActive) {
      bounceElapsed += dt
      const t = Math.min(1, bounceElapsed / 300)
      bounceScale = 1.3 + (1 - 1.3) * elasticOut(t)
      if (t >= 1) { bounceActive = false; bounceScale = 1 }
    }

    engine.emit(AnimValuesChanged, { animatedCount, colorIntensity, bounceScale })

    if (countAnimActive || colorActive || bounceActive) {
      animFrame = requestAnimationFrame(tick)
    } else {
      animFrame = null
    }
  }
  animFrame = requestAnimationFrame(tick)
}

engine.on(Increment, () => {
  count += 1
  engine.emit(CountChanged, count)
  countAnimFrom = animatedCount
  countAnimTarget = count
  countAnimElapsed = 0
  countAnimActive = true
  colorFrom = colorIntensity
  colorTarget = Math.max(-1, Math.min(1, count / 10))
  colorElapsed = 0
  colorActive = true
  bounceElapsed = 0
  bounceActive = true
  startAnimLoop()
})

engine.on(Decrement, () => {
  count -= 1
  engine.emit(CountChanged, count)
  countAnimFrom = animatedCount
  countAnimTarget = count
  countAnimElapsed = 0
  countAnimActive = true
  colorFrom = colorIntensity
  colorTarget = Math.max(-1, Math.min(1, count / 10))
  colorElapsed = 0
  colorActive = true
  bounceElapsed = 0
  bounceActive = true
  startAnimLoop()
})

export function getCount() { return count }
export function getAnimValues() { return { animatedCount, colorIntensity, bounceScale } }


export { count, animatedCount, colorIntensity, bounceScale }
