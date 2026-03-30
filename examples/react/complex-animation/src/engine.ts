import { createEngine, type EventType, type TweenValue, type SpringValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CARD_COUNT = 6

export interface CardData {
  id: number
  title: string
  description: string
  color: string
  icon: string
}

export const CARDS: CardData[] = [
  { id: 0, title: 'Lightning Fast', description: 'Reactive event-driven architecture for blazing performance', color: '#4361ee', icon: '⚡' },
  { id: 1, title: 'Type Safe', description: 'Full TypeScript support with precise type inference', color: '#7209b7', icon: '🛡' },
  { id: 2, title: 'Composable', description: 'Build complex flows from simple, reusable primitives', color: '#f72585', icon: '🧩' },
  { id: 3, title: 'Animated', description: 'Built-in tweens and springs for fluid animations', color: '#4cc9f0', icon: '✨' },
  { id: 4, title: 'Async Ready', description: 'First-class async handling with cancellation and retry', color: '#2a9d8f', icon: '🔄' },
  { id: 5, title: 'Framework Agnostic', description: 'Works with React, Vue, Solid, and more', color: '#e76f51', icon: '🌐' },
]

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const PageLoaded = engine.event<void>('PageLoaded')
export const AllCardsEntered = engine.event<void>('AllCardsEntered')
export const WelcomeFadeDone = engine.event<void>('WelcomeFadeDone')

// Per-card events
export const CardEnter: EventType<number>[] = []
export const CardEntered: EventType<number>[] = []
export const HoverCard: EventType<number>[] = []
export const UnhoverCard: EventType<number>[] = []

for (let i = 0; i < CARD_COUNT; i++) {
  CardEnter.push(engine.event<number>(`CardEnter_${i}`))
  CardEntered.push(engine.event<number>(`CardEntered_${i}`))
  HoverCard.push(engine.event<number>(`HoverCard_${i}`))
  UnhoverCard.push(engine.event<number>(`UnhoverCard_${i}`))
}

// ---------------------------------------------------------------------------
// Pipe: PageLoaded -> staggered CardEnter events
// Each card fires after a delay, creating a cascade effect
// ---------------------------------------------------------------------------

engine.on(PageLoaded, () => {
  for (let i = 0; i < CARD_COUNT; i++) {
    setTimeout(() => {
      engine.emit(CardEnter[i], i)
    }, i * 150) // 150ms stagger between each card
  }
})

// ---------------------------------------------------------------------------
// Per-card tweens: opacity and translateY for entrance
// ---------------------------------------------------------------------------

export const cardOpacity: TweenValue[] = []
export const cardTranslateY: TweenValue[] = []
export const cardHoverScale: TweenValue[] = []
export const cardHoverShadow: SpringValue[] = []

for (let i = 0; i < CARD_COUNT; i++) {
  // Entrance opacity: 0 -> 1
  const opacity = engine.tween({
    start: CardEnter[i],
    done: CardEntered[i],
    from: 0,
    to: 1,
    duration: 500,
    easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
  })
  cardOpacity.push(opacity)

  // Entrance translateY: 40px -> 0px
  const translateY = engine.tween({
    start: CardEnter[i],
    from: 40,
    to: 0,
    duration: 500,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  })
  cardTranslateY.push(translateY)

  // Hover scale: driven by hover/unhover events
  const scale = engine.tween({
    start: HoverCard[i],
    cancel: UnhoverCard[i],
    from: 1,
    to: 1.05,
    duration: 200,
    easing: (t: number) => t * (2 - t), // easeOutQuad
  })
  cardHoverScale.push(scale)

  // Hover shadow: spring-driven for smooth tracking
  // Use a signal that tracks the hover state
  const hoverSignal = engine.signal<number>(HoverCard[i], 0, () => 20)
  engine.signalUpdate(hoverSignal, UnhoverCard[i], () => 0)
  const shadow = engine.spring(hoverSignal, {
    stiffness: 300,
    damping: 20,
    restThreshold: 0.1,
  })
  cardHoverShadow.push(shadow)
}

// ---------------------------------------------------------------------------
// Join: all CardEntered -> AllCardsEntered
// Fires when every card has completed its entrance animation
// ---------------------------------------------------------------------------

engine.join(
  CardEntered,
  AllCardsEntered,
  {
    do: () => undefined,
  },
)

// ---------------------------------------------------------------------------
// Welcome message tweens (sequenced: opacity then translateY)
// After AllCardsEntered, sequence two tweens: fade in then slide up
// ---------------------------------------------------------------------------

const welcomeTweens = engine.sequence(AllCardsEntered, [
  { from: 0, to: 1, duration: 500, easing: 'easeOut' },
  { from: 20, to: 0, duration: 400, easing: 'easeOut' },
], WelcomeFadeDone)
export const welcomeOpacity = welcomeTweens[0]
export const welcomeTranslateY = welcomeTweens[1]

// ---------------------------------------------------------------------------
// Signals to track state
// ---------------------------------------------------------------------------

export const allEntered = engine.signal<boolean>(
  AllCardsEntered,
  false,
  () => true,
)

// Start the frame loop for animations
engine.startFrameLoop()
