import { createEngine, type EventType, type TweenValue, type SpringValue } from '@pulse/core'

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

export const FlipCard: EventType<number>[] = []
export const FlipDone: EventType<number>[] = []
export const HoverCard: EventType<number>[] = []
export const UnhoverCard: EventType<number>[] = []

for (let i = 0; i < CARD_COUNT; i++) {
  FlipCard.push(engine.event<number>(`FlipCard_${i}`))
  FlipDone.push(engine.event<number>(`FlipDone_${i}`))
  HoverCard.push(engine.event<number>(`HoverCard_${i}`))
  UnhoverCard.push(engine.event<number>(`UnhoverCard_${i}`))
}

// ---------------------------------------------------------------------------
// Signals — track flip state per card
// ---------------------------------------------------------------------------

export const flippedState = engine.signal<boolean[]>(
  FlipCard[0],
  new Array(CARD_COUNT).fill(false),
  (prev) => prev, // placeholder, updated below
)

for (let i = 0; i < CARD_COUNT; i++) {
  engine.signalUpdate(flippedState, FlipCard[i], (prev, _id) => {
    const next = [...prev]
    next[i] = !next[i]
    return next
  })
}

// ---------------------------------------------------------------------------
// Tweens — rotation per card (0 or 180 degrees)
// We use pairs: flipTo180 and flipTo0, toggled by signal
// ---------------------------------------------------------------------------

export const cardRotation: TweenValue[] = []

for (let i = 0; i < CARD_COUNT; i++) {
  const rotation = engine.tween({
    start: FlipCard[i],
    done: FlipDone[i],
    from: () => flippedState.value[i] ? 0 : 180,
    to: () => flippedState.value[i] ? 180 : 0,
    duration: 600,
    easing: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, // easeInOutQuad
  })
  cardRotation.push(rotation)
}

// ---------------------------------------------------------------------------
// Springs — hover scale per card
// ---------------------------------------------------------------------------

export const cardHoverScale: SpringValue[] = []

for (let i = 0; i < CARD_COUNT; i++) {
  const hoverSignal = engine.signal<number>(HoverCard[i], 100, () => 105)
  engine.signalUpdate(hoverSignal, UnhoverCard[i], () => 100)
  const spring = engine.spring(hoverSignal, {
    stiffness: 300,
    damping: 20,
    restThreshold: 0.1,
  })
  cardHoverScale.push(spring)
}

// Start frame loop
engine.startFrameLoop()
