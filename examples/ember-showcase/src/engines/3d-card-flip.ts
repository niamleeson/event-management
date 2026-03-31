import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CardInfo {
  id: number
  front: string
  back: string
  color: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ROWS = 4
export const COLS = 2
export const CARD_COUNT = ROWS * COLS

export const CARDS: CardInfo[] = [
  { id: 0, front: 'Events', back: 'Typed event channels drive all state changes', color: '#4361ee' },
  { id: 1, front: 'Signals', back: 'Reactive values derived from event streams', color: '#7209b7' },
  { id: 2, front: 'Tweens', back: 'Time-based animations with easing functions', color: '#f72585' },
  { id: 3, front: 'Springs', back: 'Physics-based motion with stiffness & damping', color: '#4cc9f0' },
  { id: 4, front: 'Pipes', back: 'Transform events from one type to another', color: '#2a9d8f' },
  { id: 5, front: 'Joins', back: 'Wait for multiple events before firing', color: '#e76f51' },
  { id: 6, front: 'Async', back: 'First-class async with cancellation & retry', color: '#f4a261' },
  { id: 7, front: 'Rules', back: 'DAG-based propagation with cycle detection', color: '#264653' },
]

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const FlipCard = Array.from({ length: CARD_COUNT }, (_, i) => engine.event<number>(`FlipCard_${i}`))
export const HoverCard = Array.from({ length: CARD_COUNT }, (_, i) => engine.event<number>(`HoverCard_${i}`))
export const UnhoverCard = Array.from({ length: CARD_COUNT }, (_, i) => engine.event<number>(`UnhoverCard_${i}`))

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const _flipped = new Uint8Array(CARD_COUNT) // 0 = not flipped, 1 = flipped
const _rotation = new Float64Array(CARD_COUNT) // current rotation degrees
const _rotationStart = new Float64Array(CARD_COUNT)
const _rotationFrom = new Float64Array(CARD_COUNT)
const _rotationTo = new Float64Array(CARD_COUNT)
const _rotationActive = new Uint8Array(CARD_COUNT)

const _hoverScale = new Float64Array(CARD_COUNT).fill(100)
const _hoverScaleTarget = new Float64Array(CARD_COUNT).fill(100)

export function getFlipped(i: number): boolean { return _flipped[i] === 1 }
export function getRotation(i: number): number { return _rotation[i] }
export function getHoverScale(i: number): number { return _hoverScale[i] / 100 }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

for (let i = 0; i < CARD_COUNT; i++) {
  engine.on(FlipCard[i], () => {
    _flipped[i] = _flipped[i] ? 0 : 1
    _rotationFrom[i] = _rotation[i]
    _rotationTo[i] = _flipped[i] ? 180 : 0
    _rotationStart[i] = performance.now()
    _rotationActive[i] = 1
  })

  engine.on(HoverCard[i], () => {
    _hoverScaleTarget[i] = 105
  })

  engine.on(UnhoverCard[i], () => {
    _hoverScaleTarget[i] = 100
  })
}

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// ---------------------------------------------------------------------------
// Frame update (called from page via rAF)
// ---------------------------------------------------------------------------

export function updateFrame(now: number): void {
  for (let i = 0; i < CARD_COUNT; i++) {
    if (_rotationActive[i]) {
      const elapsed = now - _rotationStart[i]
      const t = Math.min(1, elapsed / 600)
      _rotation[i] = _rotationFrom[i] + (_rotationTo[i] - _rotationFrom[i]) * easeInOutQuad(t)
      if (t >= 1) {
        _rotationActive[i] = 0
        _rotation[i] = _rotationTo[i]
      }
    }

    // Spring-like hover scale
    _hoverScale[i] += (_hoverScaleTarget[i] - _hoverScale[i]) * 0.15
  }
}
