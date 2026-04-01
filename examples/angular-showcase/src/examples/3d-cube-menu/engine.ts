// DAG
// SnapToFace ──→ RotXChanged
//            └──→ RotYChanged
// SelectFace ──→ SelectedFaceChanged
//            └──→ GlowChanged
// DragEnd ──→ SnapToFace
//         └──→ SelectFace

import { createEngine } from '@pulse/core'

export const engine = createEngine()

export const FACES = [
  { label: 'Home', icon: 'H', color: '#4361ee' },
  { label: 'Profile', icon: 'P', color: '#7209b7' },
  { label: 'Settings', icon: 'S', color: '#f72585' },
  { label: 'Messages', icon: 'M', color: '#4cc9f0' },
  { label: 'Search', icon: 'Q', color: '#2a9d8f' },
  { label: 'About', icon: 'A', color: '#e76f51' },
]

export const FACE_ROTATIONS: [number, number][] = [[0, 0], [0, 90], [0, 180], [0, -90], [-90, 0], [90, 0]]

export const DragStart = engine.event<{ x: number; y: number }>('DragStart')
export const DragMove = engine.event<{ x: number; y: number }>('DragMove')
export const DragEnd = engine.event<void>('DragEnd')
export const SnapToFace = engine.event<number>('SnapToFace')
export const SelectFace = engine.event<number>('SelectFace')

export const RotXChanged = engine.event<number>('RotXChanged')
export const RotYChanged = engine.event<number>('RotYChanged')
export const SelectedFaceChanged = engine.event<number>('SelectedFaceChanged')
export const GlowChanged = engine.event<number>('GlowChanged')

let targetRotX = 0, targetRotY = 0

function springTo(from: number, to: number, cb: (v: number) => void) {
  let pos = from, vel = 0
  function tick() {
    vel = (vel + (to - pos) * 200 / 1000) * (1 - 20 / 1000); pos += vel; cb(pos)
    if (Math.abs(to - pos) > 0.5 || Math.abs(vel) > 0.5) requestAnimationFrame(tick); else cb(to)
  }
  requestAnimationFrame(tick)
}

engine.on(SnapToFace, (idx) => {
  const [fx, fy] = FACE_ROTATIONS[idx]
  springTo(targetRotX, fx, (v) => { targetRotX = v; engine.emit(RotXChanged, v) })
  springTo(targetRotY, fy, (v) => { targetRotY = v; engine.emit(RotYChanged, v) })
})

engine.on(SelectFace, [SelectedFaceChanged, GlowChanged], (idx, setSelected, setGlow) => { setSelected(idx); setGlow(1) })

engine.on(DragEnd, () => {
  let bestFace = 0, bestDist = Infinity
  for (let i = 0; i < FACE_ROTATIONS.length; i++) {
    const [fx, fy] = FACE_ROTATIONS[i]
    const dx = ((targetRotX - fx + 180) % 360) - 180
    const dy = ((targetRotY - fy + 180) % 360) - 180
    const dist = dx * dx + dy * dy
    if (dist < bestDist) { bestDist = dist; bestFace = i }
  }
  engine.emit(SnapToFace, bestFace)
  engine.emit(SelectFace, bestFace)
})

export function updateTargetRot(x: number, y: number) { targetRotX = x; targetRotY = y; engine.emit(RotXChanged, x); engine.emit(RotYChanged, y) }
export function getTargetRotX() { return targetRotX }
export function getTargetRotY() { return targetRotY }

export function startLoop() {}
export function stopLoop() {}
