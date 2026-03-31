import { usePulse, useEmit } from '@pulse/solid'
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
  let dragRef = false
  let lastX = 0

  const onPointerDown = (e: PointerEvent) => {
    dragRef = true
    lastX = e.clientX
    emit(DragStart, undefined)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragRef) return
    const dx = e.clientX - lastX
    lastX = e.clientX
    emit(DragMove, dx)
  }

  const onPointerUp = () => {
    if (!dragRef) return
    dragRef = false
    emit(DragEnd, undefined)
  }

  return (
    <div
      style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: 40, 'user-select': 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <h1 style={{ color: '#fff', 'font-size': 28, 'font-weight': 300, 'letter-spacing': 2 }}>3D Carousel</h1>

      <div style={{ perspective: 1200, width: 600, height: 300, position: 'relative' }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative', 'transform-style': 'preserve-3d',
          transform: `rotateY(${state.totalAngle}deg)`,
        }}>
          {ITEMS.map((item, i) => {
            const angle = i * ANGLE_STEP
            const isSelected = state().selected === i
            const extraZ = isSelected ? state().selectedZ : 0
            const scale = isSelected ? 1.15 : 1
            return (
              <div onClick={(e) => { e.stopPropagation(); emit(SelectItem, i) }}
                style={{
                  position: 'absolute', width: 140, height: 200, left: '50%', top: '50%', 'margin-left': -70, 'margin-top': -100,
                  'transform-style': 'preserve-3d',
                  transform: `rotateY(${angle}deg) translateZ(${300 + extraZ}px) scale(${scale})`,
                  background: `linear-gradient(145deg, ${item.color}cc, ${item.color}66)`,
                  'border-radius': 16, display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center', gap: 12, cursor: 'pointer',
                  'box-shadow': isSelected ? `0 0 40px ${item.color}88, 0 8px 32px rgba(0,0,0,0.5)` : '0 8px 32px rgba(0,0,0,0.4)',
                  border: isSelected ? `2px solid ${item.color}` : '1px solid rgba(255,255,255,0.1)',
                  transition: 'box-shadow 0.3s, border 0.3s',
                }}>
                <span style={{ 'font-size': 40 }}>{item.icon}</span>
                <span style={{ color: '#fff', 'font-size': 16, 'font-weight': 600, 'letter-spacing': 1 }}>{item.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, 'align-items': 'center' }}>
        <button onClick={(e) => { e.stopPropagation(); emit(AutoRotateToggle, undefined) }}
          style={{
            background: state.isAutoRotating ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 24px', 'border-radius': 8,
            cursor: 'pointer', 'font-size': 13, 'letter-spacing': 1,
          }}>
          {state().isAutoRotating ? '\u23F8 Pause' : '\u25B6 Resume'}
        </button>
        <span style={{ color: 'rgba(255,255,255,0.4)', 'font-size': 13 }}>Drag to control {'\u00B7'} Click an item to select</span>
      </div>
    </div>
  )
}
