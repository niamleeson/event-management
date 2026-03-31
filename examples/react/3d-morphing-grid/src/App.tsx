import { useCallback } from 'react'
import { usePulse, useEmit } from '@pulse/react'
import { engine, Frame } from './engine'

const GRID = 4
const CELL_COUNT = GRID * GRID
type Shape = 'flat' | 'sphere' | 'wave' | 'spiral'
const SHAPES: Shape[] = ['flat', 'sphere', 'wave', 'spiral']

function getShapeTargets(shape: Shape, row: number, col: number) {
  const cx = (GRID - 1) / 2, cy = (GRID - 1) / 2
  const dx = col - cx, dy = row - cy
  const dist = Math.sqrt(dx * dx + dy * dy), angle = Math.atan2(dy, dx)
  const maxDist = Math.sqrt(cx * cx + cy * cy), normDist = dist / maxDist
  switch (shape) {
    case 'flat': return { rotX: 0, rotY: 0, tz: 0, scale: 1, radius: 8 }
    case 'sphere': { const c = Math.cos(normDist * Math.PI * 0.5); return { rotX: dy * 15, rotY: -dx * 15, tz: c * 120, scale: 0.9 + c * 0.2, radius: 50 } }
    case 'wave': { const w = Math.sin((col / GRID) * Math.PI * 2 + (row / GRID) * Math.PI); return { rotX: w * 20, rotY: 0, tz: w * 80, scale: 0.85 + Math.abs(w) * 0.3, radius: 8 } }
    case 'spiral': { const sa = angle + normDist * Math.PI * 2; return { rotX: Math.sin(sa) * 30, rotY: Math.cos(sa) * 30, tz: normDist * 100, scale: 1 - normDist * 0.3, radius: 50 * normDist } }
  }
}

/* Events */
const MorphTrigger = engine.event<Shape>('MorphTrigger')
const AutoCycleToggle = engine.event('AutoCycleToggle')
const GridStateChanged = engine.event<{ cells: Array<{ rotX: number; rotY: number; tz: number; scale: number; radius: number }>; shape: Shape; isAuto: boolean }>('GridStateChanged')

/* State */
const cells = Array.from({ length: CELL_COUNT }, () => ({ rotX: 0, rotY: 0, tz: 0, scale: 1, radius: 8 }))
const targets = Array.from({ length: CELL_COUNT }, () => ({ rotX: 0, rotY: 0, tz: 0, scale: 1, radius: 8 }))
const vels = Array.from({ length: CELL_COUNT }, () => ({ rotX: 0, rotY: 0, tz: 0, scale: 0, radius: 0 }))
const morphStarted = Array(CELL_COUNT).fill(false) as boolean[]
let currentShape: Shape = 'flat'
let autoCycling = false
let autoCycleTimer: ReturnType<typeof setTimeout> | null = null
let allSettled = false

function cellDist(i: number) {
  const r = Math.floor(i / GRID), c = i % GRID, cx = (GRID - 1) / 2, cy = (GRID - 1) / 2
  return Math.sqrt((c - cx) ** 2 + (r - cy) ** 2)
}
const maxDist = cellDist(0)

engine.on(MorphTrigger, (shape) => {
  currentShape = shape
  allSettled = false
  for (let i = 0; i < CELL_COUNT; i++) {
    const row = Math.floor(i / GRID), col = i % GRID
    targets[i] = getShapeTargets(shape, row, col)
    morphStarted[i] = false
    const delay = (cellDist(i) / maxDist) * 300
    setTimeout(() => { morphStarted[i] = true }, delay)
  }
})

engine.on(AutoCycleToggle, () => {
  autoCycling = !autoCycling
  if (!autoCycling && autoCycleTimer) { clearTimeout(autoCycleTimer); autoCycleTimer = null }
  if (autoCycling) advanceAutoCycle()
})

function advanceAutoCycle() {
  const idx = SHAPES.indexOf(currentShape)
  engine.emit(MorphTrigger, SHAPES[(idx + 1) % SHAPES.length])
}

engine.on(Frame, () => {
  let anyMoving = false
  for (let i = 0; i < CELL_COUNT; i++) {
    if (!morphStarted[i]) continue
    const stiff = 0.06, damp = 0.72
    for (const k of ['rotX', 'rotY', 'tz', 'scale', 'radius'] as const) {
      const diff = targets[i][k] - cells[i][k]
      vels[i][k] += diff * stiff
      vels[i][k] *= damp
      cells[i][k] += vels[i][k]
      if (Math.abs(diff) > 0.01 || Math.abs(vels[i][k]) > 0.01) anyMoving = true
    }
  }
  if (!anyMoving && !allSettled) {
    allSettled = true
    if (autoCycling) { autoCycleTimer = setTimeout(advanceAutoCycle, 3000) }
  }
  engine.emit(GridStateChanged, { cells: cells.map(c => ({ ...c })), shape: currentShape, isAuto: autoCycling })
})

function Cell({ index, data }: { index: number; data: { rotX: number; rotY: number; tz: number; scale: number; radius: number } }) {
  const row = Math.floor(index / GRID), col = index % GRID
  const hue1 = (row / GRID) * 120 + (col / GRID) * 60 + 200, hue2 = hue1 + 40
  return (
    <div style={{
      width: 80, height: 80,
      transform: `rotateX(${data.rotX}deg) rotateY(${data.rotY}deg) translateZ(${data.tz}px) scale(${data.scale})`,
      borderRadius: `${data.radius}%`,
      background: `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 80%, 40%))`,
      boxShadow: `0 ${4 + data.tz * 0.1}px ${16 + Math.abs(data.tz) * 0.2}px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)`,
      border: '1px solid rgba(255,255,255,0.1)',
    }} />
  )
}

export default function App() {
  const emit = useEmit()
  const state = usePulse(GridStateChanged, {
    cells: Array.from({ length: CELL_COUNT }, () => ({ rotX: 0, rotY: 0, tz: 0, scale: 1, radius: 8 })),
    shape: 'flat' as Shape, isAuto: false,
  })

  const triggerShape = useCallback((s: Shape) => emit(MorphTrigger, s), [emit])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 300, letterSpacing: 2 }}>3D Morphing Grid</h1>
      <div style={{ perspective: 1500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, 80px)`, gap: 16, transformStyle: 'preserve-3d', transform: 'rotateX(15deg) rotateY(-10deg)' }}>
          {state.cells.map((c, i) => <Cell key={i} index={i} data={c} />)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {SHAPES.map((s) => (
          <button key={s} onClick={() => triggerShape(s)} style={{
            background: state.shape === s ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
            border: state.shape === s ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
            color: '#fff', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, letterSpacing: 1, textTransform: 'capitalize', transition: 'all 0.2s',
          }}>{s}</button>
        ))}
        <button onClick={() => emit(AutoCycleToggle, undefined)} style={{
          background: state.isAuto ? 'rgba(100,200,255,0.2)' : 'rgba(255,255,255,0.05)',
          border: state.isAuto ? '1px solid rgba(100,200,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
          color: '#fff', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, letterSpacing: 1,
        }}>{state.isAuto ? '\u23F8 Stop Auto' : '\u25B6 Auto Cycle'}</button>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Current: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{state.shape}</span></p>
    </div>
  )
}
