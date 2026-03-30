import { createEngine, type EventType, type TweenValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Shape = 'circle' | 'square' | 'diamond' | 'triangle'

export interface CellState {
  shape: Shape
  color: string
  scale: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const GRID_SIZE = 4
export const CELL_COUNT = GRID_SIZE * GRID_SIZE

export const SHAPES: Shape[] = ['circle', 'square', 'diamond', 'triangle']
export const COLORS = ['#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#2a9d8f', '#e76f51', '#f4a261', '#264653']

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const MorphCell = engine.event<{ index: number; shape: Shape }>('MorphCell')
export const MorphAll = engine.event<Shape>('MorphAll')
export const CycleNext = engine.event<void>('CycleNext')
export const ToggleAutoCycle = engine.event<void>('ToggleAutoCycle')
export const RandomizeColors = engine.event<void>('RandomizeColors')

export const CellMorphStart: EventType<number>[] = []
export const CellMorphDone: EventType<number>[] = []

for (let i = 0; i < CELL_COUNT; i++) {
  CellMorphStart.push(engine.event<number>(`CellMorphStart_${i}`))
  CellMorphDone.push(engine.event<number>(`CellMorphDone_${i}`))
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

const initialCells: CellState[] = Array.from({ length: CELL_COUNT }, (_, i) => ({
  shape: SHAPES[i % SHAPES.length],
  color: COLORS[i % COLORS.length],
  scale: 1,
}))

export const cells = engine.signal<CellState[]>(
  MorphCell, initialCells,
  (prev, { index, shape }) => {
    const next = [...prev]
    next[index] = { ...next[index], shape }
    return next
  },
)

engine.signalUpdate(cells, MorphAll, (prev, shape) =>
  prev.map((c) => ({ ...c, shape })),
)

engine.signalUpdate(cells, RandomizeColors, (prev) =>
  prev.map((c) => ({ ...c, color: COLORS[Math.floor(Math.random() * COLORS.length)] })),
)

export const currentShapeIndex = engine.signal<number>(
  CycleNext, 0, (prev) => (prev + 1) % SHAPES.length,
)

export const autoCycle = engine.signal<boolean>(
  ToggleAutoCycle, true, (prev) => !prev,
)

// ---------------------------------------------------------------------------
// Tweens — per-cell morph animation (scale down and back up)
// ---------------------------------------------------------------------------

export const cellScale: TweenValue[] = []

for (let i = 0; i < CELL_COUNT; i++) {
  cellScale.push(engine.tween({
    start: CellMorphStart[i],
    done: CellMorphDone[i],
    from: 0.3,
    to: 1,
    duration: 400,
    easing: (t: number) => {
      // Elastic out
      const c4 = (2 * Math.PI) / 3
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
    },
  }))
}

// ---------------------------------------------------------------------------
// Staggered morph: CycleNext triggers per-cell morphs with stagger
// ---------------------------------------------------------------------------

engine.on(CycleNext, () => {
  const nextShape = SHAPES[currentShapeIndex.value]
  for (let i = 0; i < CELL_COUNT; i++) {
    const row = Math.floor(i / GRID_SIZE)
    const col = i % GRID_SIZE
    const delay = (row + col) * 80 // diagonal stagger
    setTimeout(() => {
      engine.emit(CellMorphStart[i], i)
      engine.emit(MorphCell, { index: i, shape: nextShape })
    }, delay)
  }
})

// ---------------------------------------------------------------------------
// Auto cycle timer
// ---------------------------------------------------------------------------

let cycleTimer: ReturnType<typeof setInterval> | null = null

export function startAutoCycle() {
  if (cycleTimer) return
  cycleTimer = setInterval(() => {
    if (autoCycle.value) {
      engine.emit(CycleNext, undefined)
    }
  }, 2500)
}

export function stopAutoCycle() {
  if (cycleTimer) {
    clearInterval(cycleTimer)
    cycleTimer = null
  }
}

// Start frame loop
engine.startFrameLoop()
