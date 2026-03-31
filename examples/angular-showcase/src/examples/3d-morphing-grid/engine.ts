import { createEngine, type EventType } from '@pulse/core'

export const engine = createEngine()
export const GRID_SIZE = 4
export const CELL_COUNT = GRID_SIZE * GRID_SIZE
export type Shape = 'circle' | 'square' | 'diamond' | 'triangle'
export const SHAPES: Shape[] = ['circle', 'square', 'diamond', 'triangle']
export const COLORS = ['#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#2a9d8f', '#e76f51', '#06d6a0', '#ffd166', '#ef476f', '#118ab2', '#073b4c', '#8338ec', '#fb5607', '#ff006e', '#3a86a7', '#ffbe0b']

export const CycleMorph = engine.event<void>('CycleMorph')
export const CellShapesChanged = engine.event<number[]>('CellShapesChanged')
export const MorphProgressChanged: EventType<{ index: number; value: number }>[] = []
for (let i = 0; i < CELL_COUNT; i++) MorphProgressChanged.push(engine.event<{ index: number; value: number }>('MorphProgress_' + i))

let cellShapes = Array(CELL_COUNT).fill(0)

function animateTo(from: number, to: number, dur: number, ease: (t: number) => number, cb: (v: number) => void) {
  const s = performance.now()
  function tick() { const t = Math.min(1, (performance.now() - s) / dur); cb(from + (to - from) * ease(t)); if (t < 1) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
}

engine.on(CycleMorph, () => {
  cellShapes = cellShapes.map((s) => (s + 1) % SHAPES.length)
  engine.emit(CellShapesChanged, cellShapes)
  for (let i = 0; i < CELL_COUNT; i++) {
    const row = Math.floor(i / GRID_SIZE), col = i % GRID_SIZE, delay = (row + col) * 80, idx = i
    setTimeout(() => animateTo(0, 1, 500, (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, (v) => engine.emit(MorphProgressChanged[idx], { index: idx, value: v })), delay)
  }
})

let autoCycleTimer: ReturnType<typeof setInterval> | null = null
export function startAutoCycle() { if (autoCycleTimer) return; autoCycleTimer = setInterval(() => engine.emit(CycleMorph, undefined), 3000) }
export function stopAutoCycle() { if (autoCycleTimer) { clearInterval(autoCycleTimer); autoCycleTimer = null } }
