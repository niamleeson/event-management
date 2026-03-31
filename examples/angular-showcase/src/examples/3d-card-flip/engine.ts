import { createEngine, type EventType } from '@pulse/core'

export const engine = createEngine()

export const ROWS = 4
export const COLS = 2
export const CARD_COUNT = ROWS * COLS

export interface CardFace { front: { title: string; color: string }; back: { title: string; color: string } }

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

export const FlipCard: EventType<number>[] = []
export const HoverCard: EventType<number>[] = []
export const UnhoverCard: EventType<number>[] = []
export const FlipRotationChanged: EventType<{ index: number; value: number }>[] = []
export const HoverScaleChanged: EventType<{ index: number; value: number }>[] = []

for (let i = 0; i < CARD_COUNT; i++) {
  FlipCard.push(engine.event<number>(`FlipCard_${i}`))
  HoverCard.push(engine.event<number>(`HoverCard_${i}`))
  UnhoverCard.push(engine.event<number>(`UnhoverCard_${i}`))
  FlipRotationChanged.push(engine.event<{ index: number; value: number }>(`FlipRotation_${i}`))
  HoverScaleChanged.push(engine.event<{ index: number; value: number }>(`HoverScale_${i}`))
}

const flipped: boolean[] = Array(CARD_COUNT).fill(false)

function animateTo(from: number, to: number, dur: number, ease: (t: number) => number, cb: (v: number) => void, done?: () => void) {
  const s = performance.now()
  function tick() { const t = Math.min(1, (performance.now() - s) / dur); cb(from + (to - from) * ease(t)); if (t < 1) requestAnimationFrame(tick); else done?.() }
  requestAnimationFrame(tick)
}

function springTo(from: number, to: number, stiff: number, damp: number, cb: (v: number) => void) {
  let pos = from, vel = 0
  function tick() { vel = (vel + (to - pos) * stiff / 1000) * (1 - damp / 1000); pos += vel; cb(pos); if (Math.abs(to - pos) > 0.001 || Math.abs(vel) > 0.001) requestAnimationFrame(tick); else cb(to) }
  requestAnimationFrame(tick)
}

const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

for (let i = 0; i < CARD_COUNT; i++) {
  engine.on(FlipCard[i], () => {
    flipped[i] = !flipped[i]
    const from = flipped[i] ? 0 : 180
    const to = flipped[i] ? 180 : 0
    animateTo(from, to, 600, easeInOutQuad, (v) => engine.emit(FlipRotationChanged[i], { index: i, value: v }))
  })
  engine.on(HoverCard[i], () => {
    springTo(1, 1.08, 300, 22, (v) => engine.emit(HoverScaleChanged[i], { index: i, value: v }))
  })
  engine.on(UnhoverCard[i], () => {
    springTo(1.08, 1, 300, 22, (v) => engine.emit(HoverScaleChanged[i], { index: i, value: v }))
  })
}
