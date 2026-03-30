import { createEngine } from '@pulse/core'
import type { Engine, EventType, Signal, TweenValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine + Events
// ---------------------------------------------------------------------------

export const engine: Engine = createEngine()

export const Increment: EventType<void> = engine.event<void>('Increment')
export const Decrement: EventType<void> = engine.event<void>('Decrement')
export const Reset: EventType<void> = engine.event<void>('Reset')
export const AnimateCounter: EventType<void> = engine.event<void>('AnimateCounter')
export const AnimationDone: EventType<void> = engine.event<void>('AnimationDone')

// ---------------------------------------------------------------------------
// Counter signal
// ---------------------------------------------------------------------------

export const counterSig: Signal<number> = engine.signal<number>(
  Increment,
  0,
  (prev) => prev + 1,
)
engine.signalUpdate(counterSig, Decrement, (prev) => Math.max(0, prev - 1))
engine.signalUpdate(counterSig, Reset, () => 0)

// ---------------------------------------------------------------------------
// Pipe: counter changes trigger animation
// ---------------------------------------------------------------------------

engine.pipe(Increment, AnimateCounter, () => undefined)
engine.pipe(Decrement, AnimateCounter, () => undefined)
engine.pipe(Reset, AnimateCounter, () => undefined)

// ---------------------------------------------------------------------------
// Tween: animated display value (0 -> target over 800ms with easeOut)
// ---------------------------------------------------------------------------

export const counterTween: TweenValue = engine.tween({
  start: AnimateCounter,
  done: AnimationDone,
  from: () => counterTween.value,
  to: () => counterSig.value,
  duration: 800,
  easing: 'easeOut',
})

// ---------------------------------------------------------------------------
// Animation state signal
// ---------------------------------------------------------------------------

export const isAnimatingSig: Signal<boolean> = engine.signal<boolean>(
  AnimateCounter,
  false,
  () => true,
)
engine.signalUpdate(isAnimatingSig, AnimationDone, () => false)

// Start the frame loop so tweens animate
engine.startFrameLoop()
