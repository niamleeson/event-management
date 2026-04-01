// DAG
// DragStart ──→ (sets drag state)
// DragMove ──→ RotationChanged
// DragEnd ──→ (re-enables auto-rotate)
// SelectItem ──→ SelectedChanged
// RotateTo ──→ RotationChanged

import { createEngine } from '@pulse/core'

export const engine = createEngine()

export const ITEM_COUNT = 8

export interface CarouselItem { id: number; title: string; color: string; description: string }

export const ITEMS: CarouselItem[] = [
  { id: 0, title: 'Reactive', color: '#4361ee', description: 'Event-driven architecture' },
  { id: 1, title: 'Typed', color: '#7209b7', description: 'Full TypeScript support' },
  { id: 2, title: 'Fast', color: '#f72585', description: 'Zero-copy propagation' },
  { id: 3, title: 'Animated', color: '#4cc9f0', description: 'Built-in animation support' },
  { id: 4, title: 'Async', color: '#2a9d8f', description: 'First-class async handling' },
  { id: 5, title: 'Composable', color: '#e76f51', description: 'Reusable primitives' },
  { id: 6, title: 'Testable', color: '#06d6a0', description: 'Deterministic tick API' },
  { id: 7, title: 'Universal', color: '#ffd166', description: 'Framework agnostic' },
]

export const RotateTo = engine.event<number>('RotateTo')
export const DragStart = engine.event<number>('DragStart')
export const DragMove = engine.event<number>('DragMove')
export const DragEnd = engine.event<void>('DragEnd')
export const SelectItem = engine.event<number>('SelectItem')

export const RotationChanged = engine.event<number>('RotationChanged')
export const SelectedChanged = engine.event<number>('SelectedChanged')

let rotation = 0
let autoRotateEnabled = true
let autoRotateAngle = 0
let dragStartAngle = 0
let isDragging = false
let animFrame: number | null = null

engine.on(DragStart, (startX) => { isDragging = true; autoRotateEnabled = false; dragStartAngle = rotation })
engine.on(DragMove, [RotationChanged], (deltaX, setRotation) => { rotation = dragStartAngle + deltaX * 0.3; setRotation(rotation) })
engine.on(DragEnd, () => { isDragging = false; autoRotateEnabled = true; autoRotateAngle = rotation })
engine.on(SelectItem, [SelectedChanged], (idx, setSelected) => { autoRotateEnabled = false; setSelected(idx) })
engine.on(RotateTo, [RotationChanged], (deg, setRotation) => { rotation = deg; autoRotateAngle = deg; setRotation(deg) })

// Auto-rotate
function autoRotateLoop() {
  if (autoRotateEnabled && !isDragging) {
    autoRotateAngle += 16 * 0.02
    rotation = autoRotateAngle
    engine.emit(RotationChanged, rotation)
  }
  animFrame = requestAnimationFrame(autoRotateLoop)
}

export function startLoop() {
  if (animFrame !== null) return
  animFrame = requestAnimationFrame(autoRotateLoop)
}
export function stopLoop() {
  if (animFrame !== null) { cancelAnimationFrame(animFrame); animFrame = null }
}
