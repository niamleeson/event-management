import { createEngine } from '@pulse/core'
import { createPulseService } from '@pulse/ember'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const IncrementClicked = engine.event<void>('IncrementClicked')
export const DecrementClicked = engine.event<void>('DecrementClicked')
export const ResetClicked = engine.event<void>('ResetClicked')
export const CountChanged = engine.event<number>('CountChanged')
export const TweenStart = engine.event<void>('TweenStart')
export const TweenDone = engine.event<void>('TweenDone')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

// The actual count value (discrete, immediate)
export const count = engine.signal<number>(
  IncrementClicked,
  0,
  (prev) => prev + 1,
)

engine.signalUpdate(count, DecrementClicked, (prev) => Math.max(0, prev - 1))
engine.signalUpdate(count, ResetClicked, () => 0)

// Track the previous count for tween "from" value
let previousCount = 0

// Pipe count changes to trigger the tween
engine.pipe(IncrementClicked, TweenStart, () => undefined)
engine.pipe(DecrementClicked, TweenStart, () => undefined)
engine.pipe(ResetClicked, TweenStart, () => undefined)

// ---------------------------------------------------------------------------
// Tween: smooth animated display value
// ---------------------------------------------------------------------------

// The tween animates from the previous count to the new count.
// We use getter functions for `from` and `to` so the tween reads
// the latest signal values each time it starts.
export const displayTween = engine.tween({
  start: TweenStart,
  done: TweenDone,
  from: () => previousCount,
  to: () => count.value,
  duration: 400,
  easing: 'easeOut',
})

// Update previousCount after tween completes
engine.on(TweenDone, () => {
  previousCount = count.value
})

// Also update on start so rapid clicks use the current animated position
engine.on(TweenStart, () => {
  previousCount = displayTween.value
})

// ---------------------------------------------------------------------------
// Start the frame loop for tween updates
// ---------------------------------------------------------------------------

engine.startFrameLoop()

// ---------------------------------------------------------------------------
// Pulse Service
// ---------------------------------------------------------------------------

export const pulse = createPulseService(engine)
