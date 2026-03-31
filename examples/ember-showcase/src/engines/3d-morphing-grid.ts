import { createEngine } from '@pulse/core'

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

export const MorphAll = engine.event<Shape>('MorphAll')
export const CycleNext = engine.event<void>('CycleNext')
export const ToggleAutoCycle = engine.event<void>('ToggleAutoCycle')
export const RandomizeColors = engine.event<void>('RandomizeColors')
export const CellsChanged = engine.event<void>('CellsChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _cells: CellState[] = Array.from({ length: CELL_COUNT }, (_, i) => ({
  shape: SHAPES[i % SHAPES.length],
  color: COLORS[i % COLORS.length],
  scale: 1,
}))
let _currentShapeIndex = 0
let _autoCycle = true

// Per-cell morph animation
const _cellScale = new Float64Array(CELL_COUNT).fill(1)
const _cellScaleStart = new Float64Array(CELL_COUNT)
const _cellScaleActive = new Uint8Array(CELL_COUNT)

export function getCells(): CellState[] { return _cells }
export function getCellScale(i: number): number { return _cellScale[i] }
export function getAutoCycle(): boolean { return _autoCycle }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(MorphAll, (shape: Shape) => {
  _cells = _cells.map((c) => ({ ...c, shape }))
  engine.emit(CellsChanged, undefined)
})

engine.on(CycleNext, () => {
  _currentShapeIndex = (_currentShapeIndex + 1) % SHAPES.length
  const nextShape = SHAPES[_currentShapeIndex]
  for (let i = 0; i < CELL_COUNT; i++) {
    const row = Math.floor(i / GRID_SIZE)
    const col = i % GRID_SIZE
    const delay = (row + col) * 80
    setTimeout(() => {
      _cellScaleStart[i] = performance.now()
      _cellScaleActive[i] = 1
      _cells = _cells.map((c, idx) => idx === i ? { ...c, shape: nextShape } : c)
      engine.emit(CellsChanged, undefined)
    }, delay)
  }
})

engine.on(ToggleAutoCycle, () => {
  _autoCycle = !_autoCycle
})

engine.on(RandomizeColors, () => {
  _cells = _cells.map((c) => ({ ...c, color: COLORS[Math.floor(Math.random() * COLORS.length)] }))
  engine.emit(CellsChanged, undefined)
})

// ---------------------------------------------------------------------------
// Auto cycle timer
// ---------------------------------------------------------------------------

let cycleTimer: ReturnType<typeof setInterval> | null = null

export function startAutoCycle() {
  if (cycleTimer) return
  cycleTimer = setInterval(() => {
    if (_autoCycle) {
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

// ---------------------------------------------------------------------------
// Frame update
// ---------------------------------------------------------------------------

export function updateFrame(now: number): void {
  for (let i = 0; i < CELL_COUNT; i++) {
    if (_cellScaleActive[i]) {
      const elapsed = now - _cellScaleStart[i]
      const t = Math.min(1, elapsed / 400)
      // Elastic out easing
      const c4 = (2 * Math.PI) / 3
      const e = t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
      _cellScale[i] = 0.3 + 0.7 * e
      if (t >= 1) {
        _cellScaleActive[i] = 0
        _cellScale[i] = 1
      }
    }
  }
}
