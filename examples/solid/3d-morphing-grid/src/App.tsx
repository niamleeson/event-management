import { For } from 'solid-js'
import { useEmit, useSignal, useTween } from '@pulse/solid'
import type { Signal, TweenValue, EventType } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Shape definitions                                                 */
/* ------------------------------------------------------------------ */

type ShapeMode = 'flat' | 'sphere' | 'wave' | 'spiral'
const MODES: ShapeMode[] = ['flat', 'sphere', 'wave', 'spiral']
const GRID = 4
const TOTAL = GRID * GRID

function getTargetPosition(mode: ShapeMode, row: number, col: number, time: number): { x: number; y: number; z: number } {
  const cx = (col - (GRID - 1) / 2) * 80
  const cy = (row - (GRID - 1) / 2) * 80

  switch (mode) {
    case 'flat':
      return { x: cx, y: cy, z: 0 }
    case 'sphere': {
      const theta = (col / (GRID - 1)) * Math.PI
      const phi = (row / (GRID - 1)) * Math.PI
      const r = 150
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.cos(phi),
        z: r * Math.sin(phi) * Math.sin(theta) - r / 2,
      }
    }
    case 'wave':
      return { x: cx, y: cy, z: Math.sin((col + row) * 0.8 + time * 0.002) * 80 }
    case 'spiral': {
      const idx = row * GRID + col
      const angle = idx * 0.5
      const r2 = 40 + idx * 12
      return {
        x: Math.cos(angle) * r2,
        y: Math.sin(angle) * r2,
        z: idx * 8 - TOTAL * 4,
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const SetShape = engine.event<ShapeMode>('SetShape')
const ShapeChanged = engine.event<ShapeMode>('ShapeChanged')
const CycleDone = engine.event('CycleDone')
const CycleStart = engine.event('CycleStart')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const currentShape: Signal<ShapeMode> = engine.signal(SetShape, 'flat' as ShapeMode, (_prev, mode) => mode)

// Per-cell morph tweens (staggered)
const cellMorphStarts: EventType[] = []
const cellMorphTweens: TweenValue[] = []

for (let i = 0; i < TOTAL; i++) {
  const start = engine.event(`CellMorph_${i}`)
  cellMorphStarts.push(start)

  const done = i === TOTAL - 1 ? ShapeChanged : cellMorphStarts[i + 1]
  cellMorphTweens.push(engine.tween({
    start,
    done,
    from: 0,
    to: 1,
    duration: 300,
    easing: 'easeOutBack',
  }))
}

// When SetShape fires, kick off the stagger
engine.on(SetShape, () => {
  engine.emit(cellMorphStarts[0], undefined)
})

// Auto-cycle: join ShapeChanged + CycleStart -> next shape
let cycleIndex = 0
const autoCycleTween = engine.tween({
  start: CycleStart,
  done: CycleDone,
  from: 0,
  to: 1,
  duration: 2500,
  easing: 'linear',
})

engine.on(CycleDone, () => {
  cycleIndex = (cycleIndex + 1) % MODES.length
  engine.emit(SetShape, MODES[cycleIndex])
})

engine.on(ShapeChanged, () => {
  engine.emit(CycleStart, undefined)
})

// Start the cycle
setTimeout(() => {
  engine.emit(SetShape, 'sphere')
}, 500)

/* ------------------------------------------------------------------ */
/*  Cell colors                                                       */
/* ------------------------------------------------------------------ */

const CELL_COLORS = [
  '#6c5ce7', '#00b894', '#e17055', '#0984e3',
  '#d63031', '#fdcb6e', '#a29bfe', '#00cec9',
  '#ff6b6b', '#54a0ff', '#5f27cd', '#01a3a4',
  '#f368e0', '#ff9f43', '#00d2d3', '#c44569',
]

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const emit = useEmit()
  const shape = useSignal(currentShape)
  const morphValues = cellMorphTweens.map(tw => useTween(tw))

  // Track positions: we store the "from" and "to" positions per cell
  const prevPositions: { x: number; y: number; z: number }[] = Array.from({ length: TOTAL }, () => ({ x: 0, y: 0, z: 0 }))
  const targetPositions: { x: number; y: number; z: number }[] = Array.from({ length: TOTAL }, () => ({ x: 0, y: 0, z: 0 }))

  // Update targets when shape changes
  let currentTime = 0
  engine.on(engine.frame, ({ time }) => { currentTime = time })

  engine.on(SetShape, (mode) => {
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const idx = r * GRID + c
        prevPositions[idx] = { ...targetPositions[idx] }
        targetPositions[idx] = getTargetPosition(mode, r, c, currentTime)
      }
    }
  })

  // Initialize flat positions
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const idx = r * GRID + c
      const pos = getTargetPosition('flat', r, c, 0)
      prevPositions[idx] = pos
      targetPositions[idx] = pos
    }
  }

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: '32px', 'user-select': 'none' }}>
      <h1 style={{ color: '#fff', 'font-size': '28px', 'font-weight': '300', 'letter-spacing': '2px' }}>
        3D Morphing Grid
      </h1>

      {/* Shape buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <For each={MODES}>
          {(mode) => (
            <button
              onClick={() => { cycleIndex = MODES.indexOf(mode); engine.emit(SetShape, mode) }}
              style={{
                background: shape() === mode ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                border: shape() === mode ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                padding: '8px 20px',
                'border-radius': '20px',
                cursor: 'pointer',
                'font-size': '13px',
                'text-transform': 'capitalize',
                'letter-spacing': '1px',
              }}
            >
              {mode}
            </button>
          )}
        </For>
      </div>

      {/* 3D viewport */}
      <div style={{ perspective: '1000px', width: '500px', height: '500px', position: 'relative' }}>
        <div style={{
          width: '100%', height: '100%',
          'transform-style': 'preserve-3d',
          transform: 'rotateX(-15deg) rotateY(20deg)',
          position: 'relative',
        }}>
          <For each={Array.from({ length: TOTAL }, (_, i) => i)}>
            {(idx) => {
              const t = () => morphValues[idx]()
              const x = () => prevPositions[idx].x + (targetPositions[idx].x - prevPositions[idx].x) * t()
              const y = () => prevPositions[idx].y + (targetPositions[idx].y - prevPositions[idx].y) * t()
              const z = () => prevPositions[idx].z + (targetPositions[idx].z - prevPositions[idx].z) * t()
              const color = CELL_COLORS[idx % CELL_COLORS.length]

              return (
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '60px',
                  height: '60px',
                  'margin-left': '-30px',
                  'margin-top': '-30px',
                  transform: `translate3d(${x()}px, ${y()}px, ${z()}px)`,
                  background: `linear-gradient(145deg, ${color}cc, ${color}66)`,
                  'border-radius': '12px',
                  'box-shadow': `0 4px 16px ${color}44`,
                  border: `1px solid ${color}88`,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: '#fff',
                  'font-size': '14px',
                  'font-weight': '600',
                }}>
                  {idx + 1}
                </div>
              )
            }}
          </For>
        </div>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.4)', 'font-size': '13px' }}>
        Auto-cycling shapes &middot; Click buttons to override &middot; Current: {shape()}
      </p>
    </div>
  )
}
