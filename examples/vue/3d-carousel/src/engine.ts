import { createEngine } from '@pulse/core'
import type { Signal, SpringValue, TweenValue } from '@pulse/core'

export const engine = createEngine()
engine.startFrameLoop()

/* ------------------------------------------------------------------ */
/*  Item data                                                         */
/* ------------------------------------------------------------------ */

export const ITEMS = [
  { title: 'Horizon', color: '#6c5ce7', icon: '\u{1F305}' },
  { title: 'Velocity', color: '#00b894', icon: '\u{1F680}' },
  { title: 'Crystal', color: '#e17055', icon: '\u{1F48E}' },
  { title: 'Thunder', color: '#0984e3', icon: '\u26A1' },
  { title: 'Inferno', color: '#d63031', icon: '\u{1F525}' },
  { title: 'Cascade', color: '#00cec9', icon: '\u{1F30A}' },
  { title: 'Aurora', color: '#a29bfe', icon: '\u2728' },
  { title: 'Zenith', color: '#fdcb6e', icon: '\u2B50' },
]

const ITEM_COUNT = ITEMS.length
const ANGLE_STEP = 360 / ITEM_COUNT

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const DragStart = engine.event('DragStart')
export const DragMove = engine.event<{ dx: number }>('DragMove')
export const DragEnd = engine.event('DragEnd')
export const ItemSelected = engine.event<number>('ItemSelected')
export const AutoRotateStart = engine.event('AutoRotateStart')
export const AutoRotateTick = engine.event('AutoRotateTick')

/* ------------------------------------------------------------------ */
/*  Rotation signal + spring                                          */
/* ------------------------------------------------------------------ */

export const rotationTarget: Signal<number> = engine.signal(DragMove, 0, (prev, { dx }) => prev + dx * 0.3)

// Snap on item select
engine.signalUpdate(rotationTarget, ItemSelected, (_prev, idx) => -idx * ANGLE_STEP)

// Spring-driven smooth rotation
export const rotationSpring: SpringValue = engine.spring(rotationTarget, { stiffness: 80, damping: 18 })

/* ------------------------------------------------------------------ */
/*  Selected item                                                     */
/* ------------------------------------------------------------------ */

export const selectedItem: Signal<number> = engine.signal(ItemSelected, 0, (_prev, idx) => idx)

/* ------------------------------------------------------------------ */
/*  Selected item springs forward (translateZ boost)                  */
/* ------------------------------------------------------------------ */

export const selectedZTargets: Signal<number>[] = []
export const selectedZSprings: SpringValue[] = []

for (let i = 0; i < ITEM_COUNT; i++) {
  const zt = engine.signal(ItemSelected, 0 as number, (_prev, idx) => idx === i ? 60 : 0)
  selectedZTargets.push(zt)
  const zs = engine.spring(zt, { stiffness: 200, damping: 20 })
  selectedZSprings.push(zs)
}

/* ------------------------------------------------------------------ */
/*  Auto-rotate (slow continuous rotation when not dragging)          */
/* ------------------------------------------------------------------ */

let autoRotating = true

engine.on(DragStart, () => { autoRotating = false })
engine.on(DragEnd, () => { autoRotating = true })
engine.on(ItemSelected, () => { autoRotating = false })

engine.on(engine.frame, ({ dt }) => {
  if (!autoRotating) return
  const speed = 0.015
  rotationTarget.set(rotationTarget.value + speed * (dt / 16.667))
})

export { ANGLE_STEP }
