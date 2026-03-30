import { For, Show } from 'solid-js'
import { useEmit, useSignal, useTween, useSpring } from '@pulse/solid'
import type { Signal, TweenValue, SpringValue, EventType } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

const ITEMS = [
  { title: 'Cosmic', color: '#6c5ce7', icon: '\u2726' },
  { title: 'Oceanic', color: '#0984e3', icon: '\u2749' },
  { title: 'Forest', color: '#00b894', icon: '\u2618' },
  { title: 'Sunset', color: '#e17055', icon: '\u2600' },
  { title: 'Glacier', color: '#00cec9', icon: '\u2744' },
  { title: 'Ember', color: '#d63031', icon: '\u2668' },
  { title: 'Orchid', color: '#a29bfe', icon: '\u273F' },
  { title: 'Amber', color: '#fdcb6e', icon: '\u2B50' },
]

const COUNT = ITEMS.length
const ANGLE_STEP = (Math.PI * 2) / COUNT
const RADIUS = 350

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const SelectItem = engine.event<number>('SelectItem')
const AutoRotateTick = engine.event('AutoRotateTick')
const DragStart = engine.event('DragStart')
const DragMove = engine.event<number>('DragMove')
const DragEnd = engine.event('DragEnd')
const RotateStart = engine.event('RotateStart')
const RotateDone = engine.event('RotateDone')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const selectedItem: Signal<number> = engine.signal(SelectItem, 0, (_prev, idx) => idx)

// Angle offset (radians) that drives the carousel rotation
const angleTarget: Signal<number> = engine.signal(AutoRotateTick, 0, (prev) => prev + ANGLE_STEP)
engine.signalUpdate(angleTarget, SelectItem, (_prev, idx) => -idx * ANGLE_STEP)
engine.signalUpdate(angleTarget, DragMove, (prev, dx) => prev + dx * 0.005)

const angleSpring: SpringValue = engine.spring(angleTarget, { stiffness: 80, damping: 18 })

// Auto-rotation tween: continuously triggers AutoRotateTick
const autoRotateGo = engine.event('AutoRotateGo')
const autoRotateDone = engine.event('AutoRotateDone')

const autoTween: TweenValue = engine.tween({
  start: autoRotateGo,
  done: autoRotateDone,
  cancel: DragStart,
  from: 0,
  to: 1,
  duration: 3000,
  easing: 'linear',
})

// When auto-rotate completes, emit tick and restart
engine.on(autoRotateDone, () => {
  engine.emit(AutoRotateTick, undefined)
  engine.emit(autoRotateGo, undefined)
})

// When drag ends, snap to nearest item
engine.on(DragEnd, () => {
  const current = angleSpring.value
  const nearest = Math.round(current / ANGLE_STEP)
  const idx = (((-nearest % COUNT) + COUNT) % COUNT)
  engine.emit(SelectItem, idx)
  // Restart auto rotation
  engine.emit(autoRotateGo, undefined)
})

// Selected item springs forward (scale)
const selectedScale: Signal<number> = engine.signal(SelectItem, 1.15, () => 1.15)
const selectedSpring: SpringValue = engine.spring(selectedScale, { stiffness: 200, damping: 22 })

// Start auto rotation
engine.emit(autoRotateGo, undefined)

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const emit = useEmit()
  const angle = useSpring(angleSpring)
  const sel = useSignal(selectedItem)
  const selScale = useSpring(selectedSpring)

  let dragging = false
  let lastX = 0

  const onPointerDown = (e: PointerEvent) => {
    dragging = true
    lastX = e.clientX
    emit(DragStart, undefined)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    lastX = e.clientX
    emit(DragMove, dx)
  }
  const onPointerUp = () => {
    if (!dragging) return
    dragging = false
    emit(DragEnd, undefined)
  }

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: '40px', 'user-select': 'none' }}>
      <h1 style={{ color: '#fff', 'font-size': '28px', 'font-weight': '300', 'letter-spacing': '2px' }}>
        3D Carousel
      </h1>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          perspective: '1200px',
          width: '800px',
          height: '400px',
          position: 'relative',
          cursor: 'grab',
        }}
      >
        <For each={ITEMS}>
          {(item, i) => {
            const itemAngle = () => angle() + i() * ANGLE_STEP
            const x = () => Math.sin(itemAngle()) * RADIUS
            const z = () => Math.cos(itemAngle()) * RADIUS
            const isSel = () => sel() === i()
            const sc = () => isSel() ? selScale() : 1
            const opacity = () => 0.4 + 0.6 * ((z() + RADIUS) / (2 * RADIUS))

            return (
              <div
                onClick={() => emit(SelectItem, i())}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '180px',
                  height: '240px',
                  'margin-left': '-90px',
                  'margin-top': '-120px',
                  transform: `translate3d(${x()}px, 0, ${z()}px) scale(${sc()})`,
                  'z-index': String(Math.round(z() + RADIUS)),
                  opacity: String(opacity()),
                  'border-radius': '16px',
                  background: `linear-gradient(145deg, ${item.color}dd, ${item.color}88)`,
                  display: 'flex',
                  'flex-direction': 'column',
                  'align-items': 'center',
                  'justify-content': 'center',
                  gap: '12px',
                  'box-shadow': isSel()
                    ? `0 0 40px ${item.color}66`
                    : '0 8px 24px rgba(0,0,0,0.3)',
                  border: isSel() ? `2px solid ${item.color}` : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.3s, border 0.3s',
                }}
              >
                <div style={{ 'font-size': '48px' }}>{item.icon}</div>
                <div style={{ color: '#fff', 'font-size': '18px', 'font-weight': '700' }}>{item.title}</div>
              </div>
            )
          }}
        </For>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.5)', 'font-size': '14px' }}>
        Auto-rotates &middot; Drag to spin &middot; Click to select
        <Show when={sel() >= 0}>
          <span style={{ color: ITEMS[sel()]?.color, 'margin-left': '12px' }}>
            {ITEMS[sel()]?.title}
          </span>
        </Show>
      </p>
    </div>
  )
}
