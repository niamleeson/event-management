import { useRef, useCallback } from 'react'
import { usePulse, useEmit } from '@pulse/react'
import { engine, Frame } from './engine'

/* ------------------------------------------------------------------ */
/*  Items                                                             */
/* ------------------------------------------------------------------ */

const ITEMS = [
  { icon: '\u2B50', title: 'Stellar', color: '#feca57' },
  { icon: '\u2764', title: 'Heartbeat', color: '#ff6b6b' },
  { icon: '\u26A1', title: 'Thunder', color: '#54a0ff' },
  { icon: '\u2618', title: 'Clover', color: '#00b894' },
  { icon: '\u2744', title: 'Frost', color: '#48dbfb' },
  { icon: '\u2600', title: 'Solar', color: '#ff9f43' },
  { icon: '\u263E', title: 'Lunar', color: '#a29bfe' },
  { icon: '\u2666', title: 'Diamond', color: '#fd79a8' },
]

const ITEM_COUNT = ITEMS.length
const ANGLE_STEP = 360 / ITEM_COUNT

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const DragStart = engine.event('DragStart')
const DragMove = engine.event<number>('DragMove')
const DragEnd = engine.event('DragEnd')
const AutoRotateToggle = engine.event('AutoRotateToggle')
const SelectItem = engine.event<number>('SelectItem')

const CarouselStateChanged = engine.event<{
  totalAngle: number
  isAutoRotating: boolean
  selected: number
  selectedZ: number
}>('CarouselStateChanged')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let baseAngle = 0
let autoAngle = 0
let autoRotating = true
let dragging = false
let selected = -1
let selectedZ = 0
let selectedZTarget = 0
let selectedZVel = 0

engine.on(DragStart, () => {
  if (autoRotating) {
    baseAngle += autoAngle
    autoAngle = 0
  }
  dragging = true
})

engine.on(DragMove, (dx: number) => {
  baseAngle += dx * 0.3
})

engine.on(DragEnd, () => {
  dragging = false
  if (autoRotating) {
    autoAngle = 0
  }
})

engine.on(AutoRotateToggle, () => {
  if (autoRotating) {
    // stopping: absorb autoAngle into base
    baseAngle += autoAngle
    autoAngle = 0
  }
  autoRotating = !autoRotating
})

engine.on(SelectItem, (idx: number) => {
  selected = idx
  selectedZTarget = idx >= 0 ? 80 : 0
})

engine.on(Frame, (dt) => {
  // Auto-rotate
  if (autoRotating && !dragging) {
    autoAngle += dt * 0.018 // ~360deg per 20s
    if (autoAngle >= 360) {
      baseAngle += 360
      autoAngle -= 360
    }
  }

  // Selected Z spring
  const zDiff = selectedZTarget - selectedZ
  selectedZVel += zDiff * 0.1
  selectedZVel *= 0.7
  selectedZ += selectedZVel

  const totalAngle = baseAngle + (autoRotating && !dragging ? autoAngle : 0)
  engine.emit(CarouselStateChanged, { totalAngle, isAutoRotating: autoRotating, selected, selectedZ })
})

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const emit = useEmit()
  const state = usePulse(CarouselStateChanged, { totalAngle: 0, isAutoRotating: true, selected: -1, selectedZ: 0 })
  const dragRef = useRef(false)
  const lastX = useRef(0)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = true
    lastX.current = e.clientX
    emit(DragStart, undefined)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [emit])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - lastX.current
    lastX.current = e.clientX
    emit(DragMove, dx)
  }, [emit])

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = false
    emit(DragEnd, undefined)
  }, [emit])

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, userSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 300, letterSpacing: 2 }}>3D Carousel</h1>

      <div style={{ perspective: 1200, width: 600, height: 300, position: 'relative' }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d',
          transform: `rotateY(${state.totalAngle}deg)`,
        }}>
          {ITEMS.map((item, i) => {
            const angle = i * ANGLE_STEP
            const isSelected = state.selected === i
            const extraZ = isSelected ? state.selectedZ : 0
            const scale = isSelected ? 1.15 : 1
            return (
              <div key={i} onClick={(e) => { e.stopPropagation(); emit(SelectItem, i) }}
                style={{
                  position: 'absolute', width: 140, height: 200, left: '50%', top: '50%', marginLeft: -70, marginTop: -100,
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angle}deg) translateZ(${300 + extraZ}px) scale(${scale})`,
                  background: `linear-gradient(145deg, ${item.color}cc, ${item.color}66)`,
                  borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer',
                  boxShadow: isSelected ? `0 0 40px ${item.color}88, 0 8px 32px rgba(0,0,0,0.5)` : '0 8px 32px rgba(0,0,0,0.4)',
                  border: isSelected ? `2px solid ${item.color}` : '1px solid rgba(255,255,255,0.1)',
                  transition: 'box-shadow 0.3s, border 0.3s',
                }}>
                <span style={{ fontSize: 40 }}>{item.icon}</span>
                <span style={{ color: '#fff', fontSize: 16, fontWeight: 600, letterSpacing: 1 }}>{item.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <button onClick={(e) => { e.stopPropagation(); emit(AutoRotateToggle, undefined) }}
          style={{
            background: state.isAutoRotating ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 24px', borderRadius: 8,
            cursor: 'pointer', fontSize: 13, letterSpacing: 1,
          }}>
          {state.isAutoRotating ? '\u23F8 Pause' : '\u25B6 Resume'}
        </button>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Drag to control {'\u00B7'} Click an item to select</span>
      </div>
    </div>
  )
}
