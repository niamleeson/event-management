import { createEngine, type TweenValue } from '@pulse/core'
import { createPulseService } from '@pulse/ember'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CardData {
  id: number
  title: string
  description: string
  color: string
}

export interface CardTweenSet {
  card: CardData
  opacity: TweenValue
  translateY: TweenValue
  scale: TweenValue
}

// ---------------------------------------------------------------------------
// Card data
// ---------------------------------------------------------------------------

export const CARDS: CardData[] = [
  { id: 1, title: 'Design System', description: 'Component library and tokens', color: '#4361ee' },
  { id: 2, title: 'API Gateway', description: 'Route management and auth', color: '#7209b7' },
  { id: 3, title: 'Data Pipeline', description: 'ETL and stream processing', color: '#f72585' },
  { id: 4, title: 'Monitoring', description: 'Metrics, logs, and alerts', color: '#4cc9f0' },
  { id: 5, title: 'Deployment', description: 'CI/CD and infrastructure', color: '#4895ef' },
  { id: 6, title: 'Security', description: 'Auth, encryption, auditing', color: '#560bad' },
]

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const EntranceTriggered = engine.event<void>('EntranceTriggered')
export const ResetTriggered = engine.event<void>('ResetTriggered')

// Per-card start events (staggered)
export const cardStartEvents = CARDS.map((card) =>
  engine.event<void>(`CardStart_${card.id}`),
)

// Per-card done events
export const cardDoneEvents = CARDS.map((card) =>
  engine.event<void>(`CardDone_${card.id}`),
)

// Fires when ALL cards have finished their entrance
export const AllCardsEntered = engine.event<void>('AllCardsEntered')

// ---------------------------------------------------------------------------
// Join: all cards entered
// ---------------------------------------------------------------------------

engine.join(cardDoneEvents, AllCardsEntered, {
  do: () => undefined,
})

// ---------------------------------------------------------------------------
// Stagger: entrance trigger fans out to per-card starts with delays
// ---------------------------------------------------------------------------

const STAGGER_DELAY = 120 // ms between each card

engine.on(EntranceTriggered, () => {
  CARDS.forEach((_, index) => {
    setTimeout(() => {
      engine.emit(cardStartEvents[index], undefined)
    }, index * STAGGER_DELAY)
  })
})

// ---------------------------------------------------------------------------
// Per-card tweens: opacity, translateY, scale
// ---------------------------------------------------------------------------

export const cardTweens: CardTweenSet[] = CARDS.map((card, index) => {
  const startEvent = cardStartEvents[index]
  const doneEvent = cardDoneEvents[index]

  // Opacity: 0 -> 1
  const opacity = engine.tween({
    start: startEvent,
    from: 0,
    to: 1,
    duration: 500,
    easing: 'easeOut',
  })

  // Translate Y: 40px -> 0px
  const translateY = engine.tween({
    start: startEvent,
    from: 40,
    to: 0,
    duration: 600,
    easing: 'easeOut',
  })

  // Scale: 0.85 -> 1.0 (the "done" event signals this card is fully entered)
  const scale = engine.tween({
    start: startEvent,
    done: doneEvent,
    from: 0.85,
    to: 1.0,
    duration: 500,
    easing: 'easeOutBack',
  })

  return { card, opacity, translateY, scale }
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

// Track whether entrance is complete
export const allEntered = engine.signal<boolean>(
  AllCardsEntered,
  false,
  () => true,
)

engine.signalUpdate(allEntered, ResetTriggered, () => false)

// Track whether animation is in progress
export const isAnimating = engine.signal<boolean>(
  EntranceTriggered,
  false,
  () => true,
)

engine.signalUpdate(isAnimating, AllCardsEntered, () => false)

// ---------------------------------------------------------------------------
// Start the frame loop for tween updates
// ---------------------------------------------------------------------------

engine.startFrameLoop()

// ---------------------------------------------------------------------------
// Pulse Service
// ---------------------------------------------------------------------------

export const pulse = createPulseService(engine)
