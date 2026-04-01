// DAG
// PageLoaded ──→ CardOpacityChanged[i] (via stagger)
//            └──→ CardTranslateYChanged[i] (via stagger)
//            └──→ AllEnteredChanged
//            └──→ AllCardsEntered
//            └──→ WelcomeOpacityChanged
//            └──→ WelcomeTranslateYChanged
// HoverCard[i] ──→ CardScaleChanged[i]
//              └──→ CardShadowChanged[i]
// UnhoverCard[i] ──→ CardScaleChanged[i]
//                └──→ CardShadowChanged[i]

import { createEngine, type EventType } from '@pulse/core'

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
  { id: 3, title: 'Animated', description: 'Built-in animation via events and requestAnimationFrame', color: '#4cc9f0', icon: '✨' },
  { id: 4, title: 'Async Ready', description: 'First-class async handling with cancellation and retry', color: '#2a9d8f', icon: '🔄' },
  { id: 5, title: 'Framework Agnostic', description: 'Works with React, Vue, Solid, and more', color: '#e76f51', icon: '🌐' },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const PageLoaded = engine.event<void>('PageLoaded')
export const AllCardsEntered = engine.event<void>('AllCardsEntered')

// Per-card state events
export const CardOpacityChanged: EventType<{ index: number; value: number }>[] = []
export const CardTranslateYChanged: EventType<{ index: number; value: number }>[] = []
export const CardScaleChanged: EventType<{ index: number; value: number }>[] = []
export const CardShadowChanged: EventType<{ index: number; value: number }>[] = []
export const HoverCard: EventType<number>[] = []
export const UnhoverCard: EventType<number>[] = []

// Welcome state
export const AllEnteredChanged = engine.event<boolean>('AllEnteredChanged')
export const WelcomeOpacityChanged = engine.event<number>('WelcomeOpacityChanged')
export const WelcomeTranslateYChanged = engine.event<number>('WelcomeTranslateYChanged')

for (let i = 0; i < CARD_COUNT; i++) {
  CardOpacityChanged.push(engine.event<{ index: number; value: number }>(`CardOpacity_${i}`))
  CardTranslateYChanged.push(engine.event<{ index: number; value: number }>(`CardTranslateY_${i}`))
  CardScaleChanged.push(engine.event<{ index: number; value: number }>(`CardScale_${i}`))
  CardShadowChanged.push(engine.event<{ index: number; value: number }>(`CardShadow_${i}`))
  HoverCard.push(engine.event<number>(`HoverCard_${i}`))
  UnhoverCard.push(engine.event<number>(`UnhoverCard_${i}`))
}

// ---------------------------------------------------------------------------
// Animation helper
// ---------------------------------------------------------------------------

function animateTo(
  from: number, to: number, duration: number,
  easing: (t: number) => number,
  onUpdate: (v: number) => void,
  onDone?: () => void,
) {
  const start = performance.now()
  function tick() {
    const t = Math.min(1, (performance.now() - start) / duration)
    onUpdate(from + (to - from) * easing(t))
    if (t < 1) requestAnimationFrame(tick)
    else onDone?.()
  }
  requestAnimationFrame(tick)
}

function springTo(
  from: number, to: number, stiffness: number, damping: number,
  onUpdate: (v: number) => void,
) {
  let pos = from
  let vel = 0
  function tick() {
    const force = (to - pos) * stiffness / 1000
    vel = (vel + force) * (1 - damping / 1000)
    pos += vel
    onUpdate(pos)
    if (Math.abs(to - pos) > 0.01 || Math.abs(vel) > 0.01) {
      requestAnimationFrame(tick)
    } else {
      onUpdate(to)
    }
  }
  requestAnimationFrame(tick)
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const smoothstep = (t: number) => t * t * (3 - 2 * t)

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

let enteredCount = 0

engine.on(PageLoaded, [AllEnteredChanged, AllCardsEntered, WelcomeOpacityChanged, WelcomeTranslateYChanged], (_payload, setAllEntered, _fireAllEntered, setWelcomeOpacity, setWelcomeTranslateY) => {
  enteredCount = 0
  for (let i = 0; i < CARD_COUNT; i++) {
    setTimeout(() => {
      // Animate card entrance
      animateTo(0, 1, 500, easeOutCubic, (v) => {
        engine.emit(CardOpacityChanged[i], { index: i, value: v })
      }, () => {
        enteredCount++
        if (enteredCount === CARD_COUNT) {
          engine.emit(AllEnteredChanged, true)
          engine.emit(AllCardsEntered, undefined)
          // Animate welcome
          animateTo(0, 1, 800, smoothstep, (v) => {
            engine.emit(WelcomeOpacityChanged, v)
          })
          animateTo(20, 0, 800, easeOutCubic, (v) => {
            engine.emit(WelcomeTranslateYChanged, v)
          })
        }
      })
      animateTo(40, 0, 500, easeOutCubic, (v) => {
        engine.emit(CardTranslateYChanged[i], { index: i, value: v })
      })
    }, i * 150)
  }
})

// Hover handlers
for (let i = 0; i < CARD_COUNT; i++) {
  engine.on(HoverCard[i], () => {
    animateTo(1, 1.05, 200, (t) => t * (2 - t), (v) => {
      engine.emit(CardScaleChanged[i], { index: i, value: v })
    })
    springTo(0, 20, 300, 20, (v) => {
      engine.emit(CardShadowChanged[i], { index: i, value: v })
    })
  })
  engine.on(UnhoverCard[i], () => {
    animateTo(1.05, 1, 200, (t) => t * (2 - t), (v) => {
      engine.emit(CardScaleChanged[i], { index: i, value: v })
    })
    springTo(20, 0, 300, 20, (v) => {
      engine.emit(CardShadowChanged[i], { index: i, value: v })
    })
  })
}

export function startLoop() {}
export function stopLoop() {}
