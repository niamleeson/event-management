import { createEngine, type SpringValue } from '@pulse/core'

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

// Face index -> rotation: 0=front, 1=right, 2=back, 3=left, 4=top, 5=bottom
export const FACE_ROTATIONS: { rotateX: number; rotateY: number }[] = [
  { rotateX: 0, rotateY: 0 },     // front
  { rotateX: 0, rotateY: -90 },   // right
  { rotateX: 0, rotateY: -180 },  // back
  { rotateX: 0, rotateY: 90 },    // left
  { rotateX: -90, rotateY: 0 },   // top
  { rotateX: 90, rotateY: 0 },    // bottom
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const SelectFace = engine.event<number>('SelectFace')
export const DragStart = engine.event<{ x: number; y: number }>('DragStart')
export const DragMove = engine.event<{ x: number; y: number }>('DragMove')
export const DragEnd = engine.event<void>('DragEnd')
export const SnapToFace = engine.event<number>('SnapToFace')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const selectedFace = engine.signal<number>(
  SelectFace, 0, (_prev, face) => face,
)

export const isDragging = engine.signal<boolean>(
  DragStart, false, () => true,
)
engine.signalUpdate(isDragging, DragEnd, () => false)

// Track raw rotation from drag
export const rawRotationX = engine.signal<number>(
  DragMove, 0, (prev, _) => prev,
)
export const rawRotationY = engine.signal<number>(
  DragMove, 0, (prev, _) => prev,
)

// Target rotation for snapping
export const targetRotationX = engine.signal<number>(
  SnapToFace, 0, (_prev, face) => FACE_ROTATIONS[face].rotateX,
)
export const targetRotationY = engine.signal<number>(
  SnapToFace, 0, (_prev, face) => FACE_ROTATIONS[face].rotateY,
)

// Also update when selecting a face directly
engine.signalUpdate(targetRotationX, SelectFace, (_prev, face) => FACE_ROTATIONS[face].rotateX)
engine.signalUpdate(targetRotationY, SelectFace, (_prev, face) => FACE_ROTATIONS[face].rotateY)

// ---------------------------------------------------------------------------
// Springs — smooth rotation
// ---------------------------------------------------------------------------

export const springRotationX: SpringValue = engine.spring(targetRotationX, {
  stiffness: 180,
  damping: 22,
  restThreshold: 0.5,
})

export const springRotationY: SpringValue = engine.spring(targetRotationY, {
  stiffness: 180,
  damping: 22,
  restThreshold: 0.5,
})

// Glow intensity spring for selected face
export const glowIntensity = engine.signal<number>(
  SelectFace, 20, () => 20,
)
export const springGlow: SpringValue = engine.spring(glowIntensity, {
  stiffness: 200,
  damping: 15,
})

// ---------------------------------------------------------------------------
// Snap logic: on DragEnd, snap to nearest 90-degree face
// ---------------------------------------------------------------------------

engine.on(DragEnd, () => {
  // Find nearest face based on current spring rotation
  const curX = springRotationX.value
  const curY = springRotationY.value

  let bestFace = 0
  let bestDist = Infinity
  for (let i = 0; i < FACES.length; i++) {
    const r = FACE_ROTATIONS[i]
    const dx = curX - r.rotateX
    const dy = curY - r.rotateY
    const dist = dx * dx + dy * dy
    if (dist < bestDist) {
      bestDist = dist
      bestFace = i
    }
  }

  engine.emit(SelectFace, bestFace)
})

// Start frame loop
engine.startFrameLoop()
