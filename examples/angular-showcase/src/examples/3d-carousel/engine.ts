import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ITEM_COUNT = 8

export interface CarouselItem {
  id: number
  title: string
  color: string
  description: string
}

export const ITEMS: CarouselItem[] = [
  { id: 0, title: 'Reactive', color: '#4361ee', description: 'Event-driven architecture' },
  { id: 1, title: 'Typed', color: '#7209b7', description: 'Full TypeScript support' },
  { id: 2, title: 'Fast', color: '#f72585', description: 'Zero-copy propagation' },
  { id: 3, title: 'Animated', color: '#4cc9f0', description: 'Built-in tweens & springs' },
  { id: 4, title: 'Async', color: '#2a9d8f', description: 'First-class async handling' },
  { id: 5, title: 'Composable', color: '#e76f51', description: 'Reusable primitives' },
  { id: 6, title: 'Testable', color: '#06d6a0', description: 'Deterministic tick API' },
  { id: 7, title: 'Universal', color: '#ffd166', description: 'Framework agnostic' },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const RotateTo = engine.event<number>('RotateTo')
export const DragStart = engine.event<number>('DragStart')
export const DragMove = engine.event<number>('DragMove')
export const DragEnd = engine.event<void>('DragEnd')
export const SelectItem = engine.event<number>('SelectItem')
export const AutoRotateTick = engine.event<void>('AutoRotateTick')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const rotation = engine.signal<number>(RotateTo, 0, (_prev, deg) => deg)
export const selectedItem = engine.signal<number>(SelectItem, -1, (_prev, idx) => idx)
export const isDragging = engine.signal<boolean>(DragStart, false, () => true)
engine.signalUpdate(isDragging, DragEnd, () => false)

// ---------------------------------------------------------------------------
// Spring for smooth rotation
// ---------------------------------------------------------------------------

export const springRotation = engine.spring(rotation, {
  stiffness: 120,
  damping: 18,
  restThreshold: 0.1,
})

// ---------------------------------------------------------------------------
// Spring for selected item popping forward
// ---------------------------------------------------------------------------

export const selectedDepth = engine.signal<number>(SelectItem, 0, () => 80)
// Reset on deselect or new rotation
engine.signalUpdate(selectedDepth, RotateTo, () => 0)

export const springDepth = engine.spring(selectedDepth, {
  stiffness: 200,
  damping: 22,
})

// ---------------------------------------------------------------------------
// Auto-rotate via frame
// ---------------------------------------------------------------------------

let autoRotateEnabled = true
let autoRotateAngle = 0

engine.on(DragStart, () => { autoRotateEnabled = false })
engine.on(DragEnd, () => { autoRotateEnabled = true })
engine.on(SelectItem, () => { autoRotateEnabled = false })

engine.on(engine.frame, ({ dt }) => {
  if (!autoRotateEnabled || isDragging.value) return
  autoRotateAngle += dt * 0.02
  rotation.set(autoRotateAngle)
})

// Drag handling: accumulate rotation from mouse delta
let dragStartAngle = 0

engine.on(DragStart, (startX) => {
  dragStartAngle = rotation.value
})

engine.on(DragMove, (deltaX) => {
  rotation.set(dragStartAngle + deltaX * 0.3)
})

engine.on(DragEnd, () => {
  autoRotateAngle = rotation.value
})

// Start frame loop
engine.startFrameLoop()
