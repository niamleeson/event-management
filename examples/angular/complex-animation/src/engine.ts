import { createEngine } from '@pulse/core'
import type { Engine, EventType, Signal, TweenValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CardData {
  id: number
  title: string
  description: string
  color: string
}

// ---------------------------------------------------------------------------
// Card data
// ---------------------------------------------------------------------------

export const CARDS: CardData[] = [
  { id: 0, title: 'Design', description: 'Create beautiful interfaces with intuitive UX patterns', color: '#e74c3c' },
  { id: 1, title: 'Develop', description: 'Build robust applications with modern frameworks', color: '#3498db' },
  { id: 2, title: 'Test', description: 'Ensure quality with comprehensive automated tests', color: '#2ecc71' },
  { id: 3, title: 'Deploy', description: 'Ship with confidence using CI/CD pipelines', color: '#f39c12' },
  { id: 4, title: 'Monitor', description: 'Track performance and errors in real time', color: '#9b59b6' },
  { id: 5, title: 'Iterate', description: 'Improve continuously based on user feedback', color: '#1abc9c' },
]

// ---------------------------------------------------------------------------
// Engine + Events
// ---------------------------------------------------------------------------

export const engine: Engine = createEngine()

export const StartEntrance: EventType<void> = engine.event<void>('StartEntrance')
export const ResetCards: EventType<void> = engine.event<void>('ResetCards')
export const AllCardsEntered: EventType<void> = engine.event<void>('AllCardsEntered')

// Per-card stagger events: each card has its own start trigger
const cardStartEvents: EventType<void>[] = CARDS.map((card) =>
  engine.event<void>(`CardStart_${card.id}`),
)
const cardDoneEvents: EventType<void>[] = CARDS.map((card) =>
  engine.event<void>(`CardDone_${card.id}`),
)

export { cardStartEvents, cardDoneEvents }

// ---------------------------------------------------------------------------
// Staggered start: pipe StartEntrance -> individual card starts with delays
// ---------------------------------------------------------------------------

// When StartEntrance fires, we stagger card animations by emitting per-card
// start events with increasing delays
engine.on(StartEntrance, () => {
  CARDS.forEach((card, index) => {
    setTimeout(() => {
      engine.emit(cardStartEvents[index], undefined)
    }, index * 150)
  })
})

// ---------------------------------------------------------------------------
// Per-card tweens: opacity (0 -> 1) and translateY (40 -> 0)
// ---------------------------------------------------------------------------

export const cardOpacityTweens: TweenValue[] = CARDS.map((card, index) =>
  engine.tween({
    start: cardStartEvents[index],
    done: cardDoneEvents[index],
    from: 0,
    to: 1,
    duration: 600,
    easing: 'easeOut',
  }),
)

export const cardTranslateTweens: TweenValue[] = CARDS.map((card, index) =>
  engine.tween({
    start: cardStartEvents[index],
    from: 40,
    to: 0,
    duration: 600,
    easing: 'easeOutBack',
  }),
)

// ---------------------------------------------------------------------------
// Join: when ALL card done events have fired, emit AllCardsEntered
// ---------------------------------------------------------------------------

engine.join(cardDoneEvents, AllCardsEntered, {
  do: () => undefined,
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const allEnteredSig: Signal<boolean> = engine.signal<boolean>(
  AllCardsEntered,
  false,
  () => true,
)
engine.signalUpdate(allEnteredSig, StartEntrance, () => false)

export const entranceCountSig: Signal<number> = engine.signal<number>(
  AllCardsEntered,
  0,
  (prev) => prev + 1,
)

// Start the frame loop
engine.startFrameLoop()
