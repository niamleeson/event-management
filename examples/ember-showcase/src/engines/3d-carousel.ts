import { createEngine } from '@pulse/core'

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

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _selectedIndex = 0
let _autoRotate = true
let _targetAngle = 0

// Spring physics for angle
let _springAngle = 0
let _springVelocity = 0

export function getSelectedIndex(): number { return _selectedIndex }
export function getAutoRotate(): boolean { return _autoRotate }
export function getSpringAngle(): number { return _springAngle }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(SelectItem, (idx: number) => {
  _selectedIndex = idx % ITEM_COUNT
  _targetAngle = _selectedIndex * (360 / ITEM_COUNT)
})

engine.on(RotateLeft, () => {
  _selectedIndex = (_selectedIndex - 1 + ITEM_COUNT) % ITEM_COUNT
  _targetAngle -= (360 / ITEM_COUNT)
})

engine.on(RotateRight, () => {
  _selectedIndex = (_selectedIndex + 1) % ITEM_COUNT
  _targetAngle += (360 / ITEM_COUNT)
})

engine.on(ToggleAutoRotate, () => {
  _autoRotate = !_autoRotate
})

// ---------------------------------------------------------------------------
// Auto-rotate timer
// ---------------------------------------------------------------------------

let autoTimer: ReturnType<typeof setInterval> | null = null

export function startAutoRotate() {
  if (autoTimer) return
  autoTimer = setInterval(() => {
    if (_autoRotate) {
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

// ---------------------------------------------------------------------------
// Frame update
// ---------------------------------------------------------------------------

export function updateFrame(dt: number): void {
  const stiffness = 120
  const damping = 20
  const dtSec = Math.min(dt / 1000, 0.05)

  const force = ((_targetAngle - _springAngle) * stiffness - _springVelocity * damping) * dtSec
  _springVelocity += force
  _springAngle += _springVelocity * dtSec
}
