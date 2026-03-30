import { createEngine } from '@pulse/core'
import type { Signal, SpringValue } from '@pulse/core'

export const engine = createEngine()
engine.startFrameLoop()

/* ------------------------------------------------------------------ */
/*  Face data                                                         */
/* ------------------------------------------------------------------ */

export const FACES = [
  { icon: '\u2302', label: 'Home', desc: 'Return to dashboard', color: '#6c5ce7' },
  { icon: '\u2699', label: 'Settings', desc: 'Configure preferences', color: '#00b894' },
  { icon: '\u2709', label: 'Messages', desc: 'View your inbox', color: '#e17055' },
  { icon: '\u2605', label: 'Favorites', desc: 'Bookmarked items', color: '#0984e3' },
  { icon: '\u263A', label: 'Profile', desc: 'Your account details', color: '#d63031' },
  { icon: '\u2139', label: 'About', desc: 'App information', color: '#fdcb6e' },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const DragStart = engine.event('DragStart')
export const DragMove = engine.event<{ dx: number; dy: number }>('DragMove')
export const DragEnd = engine.event('DragEnd')
export const FaceSelected = engine.event<number>('FaceSelected')
export const SnapToFace = engine.event<number>('SnapToFace')
export const SnapDone = engine.event('SnapDone')

/* ------------------------------------------------------------------ */
/*  Rotation signals + springs                                        */
/* ------------------------------------------------------------------ */

export const rotationXTarget: Signal<number> = engine.signal(DragMove, 0, (prev, { dy }) => prev + dy * 0.4)
export const rotationYTarget: Signal<number> = engine.signal(DragMove, 0, (prev, { dx }) => prev + dx * 0.4)

engine.signalUpdate(rotationXTarget, SnapToFace, (_prev, face) => {
  const snaps: Record<number, number> = { 4: -90, 5: 90 }
  return snaps[face] ?? 0
})
engine.signalUpdate(rotationYTarget, SnapToFace, (_prev, face) => {
  const snaps: Record<number, number> = { 0: 0, 1: -90, 2: -180, 3: -270 }
  return snaps[face] ?? 0
})

export const rotXSpring: SpringValue = engine.spring(rotationXTarget, { stiffness: 120, damping: 20 })
export const rotYSpring: SpringValue = engine.spring(rotationYTarget, { stiffness: 120, damping: 20 })

export const selectedFace: Signal<number> = engine.signal(FaceSelected, -1, (_prev, idx) => idx)

/* ------------------------------------------------------------------ */
/*  Snap logic                                                        */
/* ------------------------------------------------------------------ */

engine.on(DragEnd, () => {
  const ry = rotYSpring.value
  const rx = rotXSpring.value

  if (rx < -45) {
    engine.emit(SnapToFace, 4)
    return
  }
  if (rx > 45) {
    engine.emit(SnapToFace, 5)
    return
  }

  const normalized = ((ry % 360) + 360) % 360
  const faceIndex = Math.round(normalized / 90) % 4
  engine.emit(SnapToFace, faceIndex)
})
