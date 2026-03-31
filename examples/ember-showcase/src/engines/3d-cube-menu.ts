import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CubeFace {
  id: number
  label: string
  icon: string
  color: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FACES: CubeFace[] = [
  { id: 0, label: 'Dashboard', icon: '\u{1F4CA}', color: '#4361ee' },
  { id: 1, label: 'Messages', icon: '\u{1F4E8}', color: '#7209b7' },
  { id: 2, label: 'Settings', icon: '\u{2699}\u{FE0F}', color: '#2a9d8f' },
  { id: 3, label: 'Profile', icon: '\u{1F464}', color: '#e76f51' },
  { id: 4, label: 'Analytics', icon: '\u{1F4C8}', color: '#f72585' },
  { id: 5, label: 'Files', icon: '\u{1F4C1}', color: '#f4a261' },
]

export const FACE_ROTATIONS: { rotateX: number; rotateY: number }[] = [
  { rotateX: 0, rotateY: 0 },
  { rotateX: 0, rotateY: -90 },
  { rotateX: 0, rotateY: -180 },
  { rotateX: 0, rotateY: 90 },
  { rotateX: -90, rotateY: 0 },
  { rotateX: 90, rotateY: 0 },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const SelectFace = engine.event<number>('SelectFace')
export const DragStart = engine.event<{ x: number; y: number }>('DragStart')
export const DragMove = engine.event<{ x: number; y: number }>('DragMove')
export const DragEnd = engine.event<void>('DragEnd')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _selectedFace = 0
let _isDragging = false
let _targetRotationX = 0
let _targetRotationY = 0
let _springRotationX = 0
let _springRotationY = 0
let _springVelocityX = 0
let _springVelocityY = 0
let _glowIntensity = 20

export function getSelectedFace(): number { return _selectedFace }
export function getIsDragging(): boolean { return _isDragging }
export function getSpringRotationX(): number { return _springRotationX }
export function getSpringRotationY(): number { return _springRotationY }
export function getGlowIntensity(): number { return _glowIntensity }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(SelectFace, (face: number) => {
  _selectedFace = face
  _targetRotationX = FACE_ROTATIONS[face].rotateX
  _targetRotationY = FACE_ROTATIONS[face].rotateY
  _glowIntensity = 20
})

engine.on(DragStart, () => {
  _isDragging = true
})

engine.on(DragEnd, () => {
  _isDragging = false
  // Snap to nearest face
  let bestFace = 0
  let bestDist = Infinity
  for (let i = 0; i < FACES.length; i++) {
    const r = FACE_ROTATIONS[i]
    const dx = _springRotationX - r.rotateX
    const dy = _springRotationY - r.rotateY
    const dist = dx * dx + dy * dy
    if (dist < bestDist) {
      bestDist = dist
      bestFace = i
    }
  }
  engine.emit(SelectFace, bestFace)
})

// ---------------------------------------------------------------------------
// Frame update (called from page via rAF)
// ---------------------------------------------------------------------------

export function updateFrame(_dt: number): void {
  // Spring physics for rotation
  const stiffness = 180
  const damping = 22
  const dtSec = Math.min(_dt / 1000, 0.05) // cap at 50ms

  const forceX = ((_targetRotationX - _springRotationX) * stiffness - _springVelocityX * damping) * dtSec
  const forceY = ((_targetRotationY - _springRotationY) * stiffness - _springVelocityY * damping) * dtSec

  _springVelocityX += forceX
  _springVelocityY += forceY
  _springRotationX += _springVelocityX * dtSec
  _springRotationY += _springVelocityY * dtSec
}
