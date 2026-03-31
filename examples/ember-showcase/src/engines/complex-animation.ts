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
// Event declarations
// ---------------------------------------------------------------------------

export const PageLoaded = engine.event<void>('PageLoaded')
export const AllCardsEntered = engine.event<void>('AllCardsEntered')

// Per-card events
export const CardEnter = Array.from({ length: CARD_COUNT }, (_, i) => engine.event<number>(`CardEnter_${i}`))
export const HoverCard = Array.from({ length: CARD_COUNT }, (_, i) => engine.event<number>(`HoverCard_${i}`))
export const UnhoverCard = Array.from({ length: CARD_COUNT }, (_, i) => engine.event<number>(`UnhoverCard_${i}`))

// ---------------------------------------------------------------------------
// Animation state — per card
// ---------------------------------------------------------------------------

// Entrance opacity: 0 -> 1
const _cardOpacity = new Float64Array(CARD_COUNT) // starts at 0
const _cardTranslateY = new Float64Array(CARD_COUNT).fill(40)
const _cardEntranceStart = new Float64Array(CARD_COUNT)
const _cardEntranceActive = new Uint8Array(CARD_COUNT)

// Hover scale: 1 -> 1.05
const _cardHoverScale = new Float64Array(CARD_COUNT).fill(1)
const _cardHoverTarget = new Float64Array(CARD_COUNT).fill(1)

// Hover shadow (spring-like lerp)
const _cardShadow = new Float64Array(CARD_COUNT)
const _cardShadowTarget = new Float64Array(CARD_COUNT)

// Welcome tween
let _welcomeOpacity = 0
let _welcomeTranslateY = 20
let _welcomeActive = false
let _welcomeStart = 0

let _allEntered = false
let _enteredCount = 0

export function getCardOpacity(i: number): number { return _cardOpacity[i] }
export function getCardTranslateY(i: number): number { return _cardTranslateY[i] }
export function getCardHoverScale(i: number): number { return _cardHoverScale[i] }
export function getCardShadow(i: number): number { return _cardShadow[i] }
export function getWelcomeOpacity(): number { return _welcomeOpacity }
export function getWelcomeTranslateY(): number { return _welcomeTranslateY }

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function smoothstep(t: number): number { return t * t * (3 - 2 * t) }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(PageLoaded, () => {
  for (let i = 0; i < CARD_COUNT; i++) {
    setTimeout(() => {
      engine.emit(CardEnter[i], i)
    }, i * 150)
  }
})

for (let i = 0; i < CARD_COUNT; i++) {
  engine.on(CardEnter[i], () => {
    _cardEntranceStart[i] = performance.now()
    _cardEntranceActive[i] = 1
  })

  engine.on(HoverCard[i], () => {
    _cardHoverTarget[i] = 1.05
    _cardShadowTarget[i] = 20
  })

  engine.on(UnhoverCard[i], () => {
    _cardHoverTarget[i] = 1
    _cardShadowTarget[i] = 0
  })
}

// ---------------------------------------------------------------------------
// Frame update (called from page via rAF)
// ---------------------------------------------------------------------------

export function updateFrame(now: number): void {
  for (let i = 0; i < CARD_COUNT; i++) {
    // Entrance animation
    if (_cardEntranceActive[i]) {
      const elapsed = now - _cardEntranceStart[i]
      const t = Math.min(1, elapsed / 500)
      const e = easeOutCubic(t)
      _cardOpacity[i] = e
      _cardTranslateY[i] = 40 * (1 - e)
      if (t >= 1) {
        _cardEntranceActive[i] = 0
        _cardOpacity[i] = 1
        _cardTranslateY[i] = 0
        _enteredCount++
        if (_enteredCount >= CARD_COUNT && !_allEntered) {
          _allEntered = true
          engine.emit(AllCardsEntered, undefined)
          // Start welcome tween
          _welcomeActive = true
          _welcomeStart = performance.now()
        }
      }
    }

    // Hover scale (lerp toward target)
    _cardHoverScale[i] += (_cardHoverTarget[i] - _cardHoverScale[i]) * 0.15

    // Shadow (lerp toward target)
    _cardShadow[i] += (_cardShadowTarget[i] - _cardShadow[i]) * 0.12
  }

  // Welcome tween
  if (_welcomeActive) {
    const elapsed = now - _welcomeStart
    const t = Math.min(1, elapsed / 800)
    _welcomeOpacity = smoothstep(t)
    _welcomeTranslateY = 20 * (1 - easeOutCubic(t))
    if (t >= 1) _welcomeActive = false
  }
}
