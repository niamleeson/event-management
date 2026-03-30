import { createEngine, type EventType, type TweenValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const GRID_SIZE = 4
export const CELL_COUNT = GRID_SIZE * GRID_SIZE

export type Shape = 'circle' | 'square' | 'diamond' | 'triangle'
export const SHAPES: Shape[] = ['circle', 'square', 'diamond', 'triangle']

export const COLORS = [
  '#4361ee', '#7209b7', '#f72585', '#4cc9f0',
  '#2a9d8f', '#e76f51', '#06d6a0', '#ffd166',
  '#ef476f', '#118ab2', '#073b4c', '#8338ec',
  '#fb5607', '#ff006e', '#3a86a7', '#ffbe0b',
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const CycleMorph = engine.event<void>('CycleMorph')
export const CellMorph: EventType<void>[] = []
export const CellMorphDone: EventType<void>[] = []

for (let i = 0; i < CELL_COUNT; i++) {
  CellMorph.push(engine.event<void>(`CellMorph_${i}`))
  CellMorphDone.push(engine.event<void>(`CellMorphDone_${i}`))
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

// Current shape index per cell
export const cellShapes = engine.signal<number[]>(
  CycleMorph,
  Array(CELL_COUNT).fill(0),
  (prev) => prev.map((s) => (s + 1) % SHAPES.length),
)

// ---------------------------------------------------------------------------
// Tweens: morph progress per cell (0 to 1)
// ---------------------------------------------------------------------------

export const morphProgress: TweenValue[] = []

for (let i = 0; i < CELL_COUNT; i++) {
  morphProgress.push(engine.tween({
    start: CellMorph[i],
    done: CellMorphDone[i],
    from: 0,
    to: 1,
    duration: 500,
    easing: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  }))
}

// ---------------------------------------------------------------------------
// Staggered morph: CycleMorph triggers each cell with stagger
// ---------------------------------------------------------------------------

engine.on(CycleMorph, () => {
  for (let i = 0; i < CELL_COUNT; i++) {
    const row = Math.floor(i / GRID_SIZE)
    const col = i % GRID_SIZE
    const delay = (row + col) * 80
    setTimeout(() => {
      engine.emit(CellMorph[i], undefined)
    }, delay)
  }
})

// ---------------------------------------------------------------------------
// Auto-cycle every 3 seconds
// ---------------------------------------------------------------------------

let autoCycleTimer: ReturnType<typeof setInterval> | null = null

export function startAutoCycle() {
  if (autoCycleTimer) return
  autoCycleTimer = setInterval(() => {
    engine.emit(CycleMorph, undefined)
  }, 3000)
}

export function stopAutoCycle() {
  if (autoCycleTimer) {
    clearInterval(autoCycleTimer)
    autoCycleTimer = null
  }
}

// Start frame loop
engine.startFrameLoop()
