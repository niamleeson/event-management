import type { TweenValue } from './types.js'

/**
 * Create a TweenValue — an animated numeric value driven by elapsed time + easing.
 */
export function createTween(config: {
  from: number | (() => number)
  to: number | (() => number)
  duration: number
  easing: (t: number) => number
  startEvent: import('./types.js').EventType
  doneEvent?: import('./types.js').EventType
  cancelEvents: import('./types.js').EventType[]
}): TweenValue {
  const subscribers = new Set<(value: number) => void>()

  const tween: TweenValue = {
    value: typeof config.from === 'function' ? 0 : config.from,
    active: false,
    progress: 0,
    _subscribers: subscribers,
    _from: config.from,
    _to: config.to,
    _duration: config.duration,
    _elapsed: 0,
    _easing: config.easing,
    _startEvent: config.startEvent,
    _doneEvent: config.doneEvent,
    _cancelEvents: config.cancelEvents,
    _started: false,

    subscribe(callback: (value: number) => void): () => void {
      subscribers.add(callback)
      return () => {
        subscribers.delete(callback)
      }
    },
  }

  return tween
}

/**
 * Start a tween (resets progress).
 */
export function startTween(tween: TweenValue): void {
  tween.active = true
  tween._elapsed = 0
  tween.progress = 0
  tween._started = true
  const from = typeof tween._from === 'function' ? tween._from() : tween._from
  tween.value = from
}

/**
 * Advance a tween by dt milliseconds.
 * Returns true if the tween just completed this frame.
 */
export function advanceTween(tween: TweenValue, dt: number): boolean {
  if (!tween.active) return false

  tween._elapsed += dt
  const raw = Math.min(1, tween._elapsed / tween._duration)
  tween.progress = raw
  const easedT = tween._easing(raw)

  const from = typeof tween._from === 'function' ? tween._from() : tween._from
  const to = typeof tween._to === 'function' ? tween._to() : tween._to
  tween.value = from + easedT * (to - from)

  // Notify subscribers
  for (const cb of tween._subscribers) {
    cb(tween.value)
  }

  if (raw >= 1) {
    tween.active = false
    return true
  }

  return false
}

/**
 * Cancel a tween.
 */
export function cancelTween(tween: TweenValue): void {
  tween.active = false
}
