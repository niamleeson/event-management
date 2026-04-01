import { createEngine } from '@pulse/core'

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
  { id: 0, title: 'Lightning Fast', description: 'Reactive event-driven architecture for blazing performance', color: '#4361ee', icon: '\u26A1' },
  { id: 1, title: 'Type Safe', description: 'Full TypeScript support with precise type inference', color: '#7209b7', icon: '\uD83D\uDEE1' },
  { id: 2, title: 'Composable', description: 'Build complex flows from simple, reusable primitives', color: '#f72585', icon: '\uD83E\uDDE9' },
  { id: 3, title: 'Animated', description: 'Built-in tweens and springs for fluid animations', color: '#4cc9f0', icon: '\u2728' },
  { id: 4, title: 'Async Ready', description: 'First-class async handling with cancellation and retry', color: '#2a9d8f', icon: '\uD83D\uDD04' },
  { id: 5, title: 'Framework Agnostic', description: 'Works with React, Vue, Solid, and more', color: '#e76f51', icon: '\uD83C\uDF10' },
]

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// PageLoaded (triggers staggered card entrance — terminal)
// HoverCard (sets hover target — terminal)
// UnhoverCard (clears hover target — terminal)
// Frame ──┬──→ AllCardsEnteredEvent
//         ├──→ WelcomeAnimChanged
//         └──→ CardAnimStateChanged
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const PageLoaded = engine.event<void>('PageLoaded')
export const Frame = engine.event<number>('Frame')

// Per-card events
export const HoverCard = engine.event<number>('HoverCard')
export const UnhoverCard = engine.event<number>('UnhoverCard')

// State change events for React
export const CardAnimStateChanged = engine.event<{
  opacities: number[]
  translateYs: number[]
  hoverScales: number[]
  hoverShadows: number[]
}>('CardAnimStateChanged')

export const AllCardsEnteredEvent = engine.event<boolean>('AllCardsEntered')
export const WelcomeAnimChanged = engine.event<{ opacity: number; translateY: number }>('WelcomeAnimChanged')

// ---------------------------------------------------------------------------
// Animation state
// ---------------------------------------------------------------------------

const cardOpacity: number[] = Array(CARD_COUNT).fill(0)
const cardTranslateY: number[] = Array(CARD_COUNT).fill(40)
const cardHoverScale: number[] = Array(CARD_COUNT).fill(1)
const cardHoverShadow: number[] = Array(CARD_COUNT).fill(0)
const cardHoverTarget: number[] = Array(CARD_COUNT).fill(0)
const cardHoverVel: number[] = Array(CARD_COUNT).fill(0)

let cardEnteredCount = 0
let cardEnterTriggered: boolean[] = Array(CARD_COUNT).fill(false)
let allEntered = false

// Welcome message animation
let welcomeOpacity = 0
let welcomeTranslateY = 20
let welcomePhase: 'hidden' | 'fadingIn' | 'slidingUp' | 'done' = 'hidden'

// ---------------------------------------------------------------------------
// Page load -> staggered card entrance
// ---------------------------------------------------------------------------

engine.on(PageLoaded, () => {
  for (let i = 0; i < CARD_COUNT; i++) {
    setTimeout(() => {
      cardEnterTriggered[i] = true
    }, i * 150)
  }
})

// ---------------------------------------------------------------------------
// Hover handlers
// ---------------------------------------------------------------------------

engine.on(HoverCard, (index) => {
  cardHoverTarget[index] = 20
})

engine.on(UnhoverCard, (index) => {
  cardHoverTarget[index] = 0
})

// ---------------------------------------------------------------------------
// Frame loop: animate everything
// ---------------------------------------------------------------------------

engine.on(Frame, [AllCardsEnteredEvent, WelcomeAnimChanged, CardAnimStateChanged], (_dt, setAllEntered, setWelcome, setCardAnim) => {
  let dirty = false

  for (let i = 0; i < CARD_COUNT; i++) {
    // Entrance animation
    if (cardEnterTriggered[i] && cardOpacity[i] < 0.999) {
      cardOpacity[i] += (1 - cardOpacity[i]) * 0.08
      cardTranslateY[i] += (0 - cardTranslateY[i]) * 0.08
      if (cardOpacity[i] > 0.999) {
        cardOpacity[i] = 1
        cardTranslateY[i] = 0
        cardEnteredCount++
        if (cardEnteredCount === CARD_COUNT && !allEntered) {
          allEntered = true
          setAllEntered(true)
          welcomePhase = 'fadingIn'
        }
      }
      dirty = true
    }

    // Hover scale: spring toward target (1 or 1.05)
    const scaleTarget = cardHoverTarget[i] > 0 ? 1.05 : 1
    const scaleDiff = scaleTarget - cardHoverScale[i]
    if (Math.abs(scaleDiff) > 0.001) {
      cardHoverScale[i] += scaleDiff * 0.15
      dirty = true
    }

    // Hover shadow: spring toward target
    const shadowDiff = cardHoverTarget[i] - cardHoverShadow[i]
    cardHoverVel[i] += shadowDiff * 0.05
    cardHoverVel[i] *= 0.8
    if (Math.abs(cardHoverVel[i]) > 0.01 || Math.abs(shadowDiff) > 0.1) {
      cardHoverShadow[i] += cardHoverVel[i]
      dirty = true
    }
  }

  // Welcome animation
  if (welcomePhase === 'fadingIn') {
    welcomeOpacity += (1 - welcomeOpacity) * 0.06
    if (welcomeOpacity > 0.99) {
      welcomeOpacity = 1
      welcomePhase = 'slidingUp'
    }
    setWelcome({ opacity: welcomeOpacity, translateY: welcomeTranslateY })
    dirty = true
  } else if (welcomePhase === 'slidingUp') {
    welcomeTranslateY += (0 - welcomeTranslateY) * 0.08
    if (Math.abs(welcomeTranslateY) < 0.5) {
      welcomeTranslateY = 0
      welcomePhase = 'done'
    }
    setWelcome({ opacity: welcomeOpacity, translateY: welcomeTranslateY })
    dirty = true
  }

  if (dirty) {
    setCardAnim({
      opacities: [...cardOpacity],
      translateYs: [...cardTranslateY],
      hoverScales: [...cardHoverScale],
      hoverShadows: [...cardHoverShadow],
    })
  }
})

// ---------------------------------------------------------------------------
// Start frame loop
// ---------------------------------------------------------------------------

let _rafId: number | null = null
export function startLoop() {
  if (_rafId !== null) return
  let last = performance.now()
  const loop = () => {
    const now = performance.now()
    engine.emit(Frame, now - last)
    last = now
    _rafId = requestAnimationFrame(loop)
  }
  _rafId = requestAnimationFrame(loop)
}
export function stopLoop() {
  if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null }
}
