import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FACES = [
  { label: 'Home', icon: 'H', color: '#4361ee' },
  { label: 'Profile', icon: 'P', color: '#7209b7' },
  { label: 'Settings', icon: 'S', color: '#f72585' },
  { label: 'Messages', icon: 'M', color: '#4cc9f0' },
  { label: 'Search', icon: 'Q', color: '#2a9d8f' },
  { label: 'About', icon: 'A', color: '#e76f51' },
]

// Face index to rotation mapping: [rotateX, rotateY]
export const FACE_ROTATIONS: [number, number][] = [
  [0, 0],       // front
  [0, 90],      // right
  [0, 180],     // back
  [0, -90],     // left
  [-90, 0],     // top
  [90, 0],      // bottom
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const DragStart = engine.event<{ x: number; y: number }>('DragStart')
export const DragMove = engine.event<{ x: number; y: number }>('DragMove')
export const DragEnd = engine.event<void>('DragEnd')
export const SnapToFace = engine.event<number>('SnapToFace')
export const SelectFace = engine.event<number>('SelectFace')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

// Track rotation offsets from drag
export const rotX = engine.signal<number>(DragMove, 0, (prev, pos) => pos.x)
export const rotY = engine.signal<number>(DragMove, 0, (prev, pos) => pos.y)

// Selected face
export const selectedFace = engine.signal<number>(SelectFace, 0, (_prev, idx) => idx)

// Is dragging
export const isDragging = engine.signal<boolean>(DragStart, false, () => true)
engine.signalUpdate(isDragging, DragEnd, () => false)

// Target rotations for snapping
export const targetRotX = engine.signal<number>(SnapToFace, 0, (_prev, idx) => FACE_ROTATIONS[idx][0])
export const targetRotY = engine.signal<number>(SnapToFace, 0, (_prev, idx) => FACE_ROTATIONS[idx][1])

// ---------------------------------------------------------------------------
// Springs for smooth rotation
// ---------------------------------------------------------------------------

export const springRotX = engine.spring(targetRotX, {
  stiffness: 200,
  damping: 20,
  restThreshold: 0.5,
})

export const springRotY = engine.spring(targetRotY, {
  stiffness: 200,
  damping: 20,
  restThreshold: 0.5,
})

// ---------------------------------------------------------------------------
// Glow signal for selected face
// ---------------------------------------------------------------------------

export const glowIntensity = engine.signal<number>(SelectFace, 0, () => 1)

export const glowSpring = engine.spring(glowIntensity, {
  stiffness: 150,
  damping: 18,
})

// Snap on drag end: find nearest face
engine.on(DragEnd, () => {
  // Determine which face is closest based on current spring rotation
  const curX = springRotX.value
  const curY = springRotY.value
  let bestFace = 0
  let bestDist = Infinity
  for (let i = 0; i < FACE_ROTATIONS.length; i++) {
    const [fx, fy] = FACE_ROTATIONS[i]
    // Normalize angles
    const dx = ((curX - fx + 180) % 360) - 180
    const dy = ((curY - fy + 180) % 360) - 180
    const dist = dx * dx + dy * dy
    if (dist < bestDist) {
      bestDist = dist
      bestFace = i
    }
  }
  engine.emit(SnapToFace, bestFace)
  engine.emit(SelectFace, bestFace)
})

// Start frame loop
engine.startFrameLoop()
