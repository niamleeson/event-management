import { createEngine, type EventType, type TweenValue, type SpringValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ROWS = 4
export const COLS = 2
export const CARD_COUNT = ROWS * COLS

export interface CardFace {
  front: { title: string; color: string }
  back: { title: string; color: string }
}

export const CARDS: CardFace[] = [
  { front: { title: 'Alpha', color: '#4361ee' }, back: { title: 'Omega', color: '#e63946' } },
  { front: { title: 'Beta', color: '#7209b7' }, back: { title: 'Psi', color: '#f77f00' } },
  { front: { title: 'Gamma', color: '#f72585' }, back: { title: 'Chi', color: '#2a9d8f' } },
  { front: { title: 'Delta', color: '#4cc9f0' }, back: { title: 'Phi', color: '#e76f51' } },
  { front: { title: 'Epsilon', color: '#06d6a0' }, back: { title: 'Upsilon', color: '#9b5de5' } },
  { front: { title: 'Zeta', color: '#ef476f' }, back: { title: 'Tau', color: '#118ab2' } },
  { front: { title: 'Eta', color: '#ffd166' }, back: { title: 'Sigma', color: '#073b4c' } },
  { front: { title: 'Theta', color: '#06d6a0' }, back: { title: 'Rho', color: '#8338ec' } },
]

// ---------------------------------------------------------------------------
// Events
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
// Signals: track flipped state per card
// ---------------------------------------------------------------------------

export const flippedState: import('@pulse/core').Signal<boolean>[] = []

for (let i = 0; i < CARD_COUNT; i++) {
  const sig = engine.signal<boolean>(FlipCard[i], false, (prev) => !prev)
  flippedState.push(sig)
}

// ---------------------------------------------------------------------------
// Tweens: flip rotation per card (0 or 180)
// ---------------------------------------------------------------------------

export const flipRotation: TweenValue[] = []

for (let i = 0; i < CARD_COUNT; i++) {
  const rotation = engine.tween({
    start: FlipCard[i],
    done: FlipDone[i],
    from: () => flippedState[i].value ? 0 : 180,
    to: () => flippedState[i].value ? 180 : 0,
    duration: 600,
    easing: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  })
  flipRotation.push(rotation)
}

// ---------------------------------------------------------------------------
// Springs: hover scale per card
// ---------------------------------------------------------------------------

export const hoverScale: SpringValue[] = []

for (let i = 0; i < CARD_COUNT; i++) {
  const hoverSig = engine.signal<number>(HoverCard[i], 1, () => 1.08)
  engine.signalUpdate(hoverSig, UnhoverCard[i], () => 1)
  const sp = engine.spring(hoverSig, { stiffness: 300, damping: 22, restThreshold: 0.001 })
  hoverScale.push(sp)
}

// Start frame loop
engine.startFrameLoop()
