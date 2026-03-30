import { createEngine, type SpringValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CarouselItem {
  id: number
  title: string
  description: string
  color: string
  icon: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ITEM_COUNT = 8
export const ITEMS: CarouselItem[] = [
  { id: 0, title: 'Events', description: 'Typed event channels', color: '#4361ee', icon: '\u{26A1}' },
  { id: 1, title: 'Signals', description: 'Reactive state', color: '#7209b7', icon: '\u{1F4E1}' },
  { id: 2, title: 'Tweens', description: 'Smooth animations', color: '#f72585', icon: '\u{1F3AC}' },
  { id: 3, title: 'Springs', description: 'Physics motion', color: '#4cc9f0', icon: '\u{1F30A}' },
  { id: 4, title: 'Pipes', description: 'Event transforms', color: '#2a9d8f', icon: '\u{1F527}' },
  { id: 5, title: 'Joins', description: 'Multi-event sync', color: '#e76f51', icon: '\u{1F517}' },
  { id: 6, title: 'Async', description: 'Async operations', color: '#f4a261', icon: '\u{23F3}' },
  { id: 7, title: 'DAG', description: 'Rule ordering', color: '#264653', icon: '\u{1F310}' },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const SelectItem = engine.event<number>('SelectItem')
export const RotateLeft = engine.event<void>('RotateLeft')
export const RotateRight = engine.event<void>('RotateRight')
export const ToggleAutoRotate = engine.event<void>('ToggleAutoRotate')
export const DragRotate = engine.event<number>('DragRotate')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const selectedIndex = engine.signal<number>(
  SelectItem, 0, (_prev, idx) => idx % ITEM_COUNT,
)

engine.signalUpdate(selectedIndex, RotateLeft, (prev) => (prev - 1 + ITEM_COUNT) % ITEM_COUNT)
engine.signalUpdate(selectedIndex, RotateRight, (prev) => (prev + 1) % ITEM_COUNT)

export const autoRotate = engine.signal<boolean>(
  ToggleAutoRotate, true, (prev) => !prev,
)

// Angle signal: each item is 360/ITEM_COUNT degrees apart
// Target angle = selectedIndex * (360 / ITEM_COUNT)
export const targetAngle = engine.signal<number>(
  SelectItem, 0, (_prev, idx) => idx * (360 / ITEM_COUNT),
)
engine.signalUpdate(targetAngle, RotateLeft, (prev) => prev - (360 / ITEM_COUNT))
engine.signalUpdate(targetAngle, RotateRight, (prev) => prev + (360 / ITEM_COUNT))

// ---------------------------------------------------------------------------
// Springs
// ---------------------------------------------------------------------------

export const springAngle: SpringValue = engine.spring(targetAngle, {
  stiffness: 120,
  damping: 20,
  restThreshold: 0.5,
})

// Scale spring for selected item
export const selectedScale = engine.signal<number>(
  SelectItem, 120, () => 120,
)
export const springScale: SpringValue = engine.spring(selectedScale, {
  stiffness: 200,
  damping: 18,
})

// ---------------------------------------------------------------------------
// Auto-rotate timer
// ---------------------------------------------------------------------------

let autoTimer: ReturnType<typeof setInterval> | null = null

export function startAutoRotate() {
  if (autoTimer) return
  autoTimer = setInterval(() => {
    if (autoRotate.value) {
      engine.emit(RotateRight, undefined)
    }
  }, 3000)
}

export function stopAutoRotate() {
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}

// Start frame loop
engine.startFrameLoop()
