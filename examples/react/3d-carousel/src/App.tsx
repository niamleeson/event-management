import { useRef, useCallback } from 'react'
import { useEmit, useSignal, useSpring, useTween } from '@pulse/react'
import type { Signal, TweenValue, SpringValue } from '@pulse/core'
import { engine } from './engine'

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
const ItemSelected = engine.event<number>('ItemSelected')
const AutoRotateTick = engine.event('AutoRotateTick')
const AutoRotateDone = engine.event('AutoRotateDone')
const PauseAutoRotate = engine.event('PauseAutoRotate')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

// Auto-rotate: tween that advances angle 360deg over 20s, restarts on done
const autoRotateTween: TweenValue = engine.tween({
  start: AutoRotateTick,
  done: AutoRotateDone,
  cancel: [DragStart, PauseAutoRotate],
  from: 0,
  to: 360,
  duration: 20000,
  easing: 'linear',
})

// Base angle signal: accumulates from drag + auto-rotate cycles
const baseAngle: Signal<number> = engine.signal(DragMove, 0, (prev, dx) => prev + dx * 0.3)

// Track auto-rotate state
const autoRotating: Signal<boolean> = engine.signal(AutoRotateToggle, true, (prev) => !prev)

// When auto-rotate completes one cycle, restart
engine.on(AutoRotateDone, () => {
  if (autoRotating.value) {
    // Add 360 to base and restart tween
    baseAngle.set(baseAngle.value + 360)
    engine.emit(AutoRotateTick, undefined)
  }
})

// On drag start, absorb current tween progress into base before tween is canceled
engine.on(DragStart, () => {
  if (autoRotateTween.active) {
    baseAngle.set(baseAngle.value + autoRotateTween.value)
  }
})

// On drag end, resume auto-rotate if enabled
engine.on(DragEnd, () => {
  if (autoRotating.value) {
    engine.emit(AutoRotateTick, undefined)
  }
})

// Toggle auto-rotate
engine.on(AutoRotateToggle, () => {
  if (autoRotating.value) {
    // Will be true after signal updates (resuming handled by setTimeout below)
  } else {
    // Stopping: absorb current tween progress into base angle, then cancel the tween
    baseAngle.set(baseAngle.value + autoRotateTween.value)
    engine.emit(PauseAutoRotate, undefined)
  }
})

// Delayed start of auto-rotate after toggle on
engine.on(AutoRotateToggle, () => {
  // Use a setTimeout to check the new value after signal update
  setTimeout(() => {
    if (autoRotating.value) {
      engine.emit(AutoRotateTick, undefined)
    }
  }, 0)
})

// Selected item
const selectedItem: Signal<number> = engine.signal(SelectItem, -1, (_prev, idx) => idx)
engine.pipe(SelectItem, ItemSelected, (idx) => idx)

// Selected item forward Z spring
const selectedZTarget: Signal<number> = engine.signal(SelectItem, 0, (_prev, idx) => idx >= 0 ? 80 : 0)
const selectedZSpring: SpringValue = engine.spring(selectedZTarget, { stiffness: 170, damping: 20 })

// Start auto-rotate on load
setTimeout(() => engine.emit(AutoRotateTick, undefined), 100)

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const emit = useEmit()
  const base = useSignal(baseAngle)
  const autoTween = useTween(autoRotateTween)
  const isAutoRotating = useSignal(autoRotating)
  const selected = useSignal(selectedItem)
  const selectedZ = useSpring(selectedZSpring)
  const dragging = useRef(false)
  const lastX = useRef(0)

  const totalAngle = base + (isAutoRotating || autoRotateTween.active ? autoTween : 0)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    lastX.current = e.clientX
    emit(DragStart, undefined)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [emit])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - lastX.current
    lastX.current = e.clientX
    emit(DragMove, dx)
  }, [emit])

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    emit(DragEnd, undefined)
  }, [emit])

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, userSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 300, letterSpacing: 2 }}>
        3D Carousel
      </h1>

      <div style={{ perspective: 1200, width: 600, height: 300, position: 'relative' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${totalAngle}deg)`,
          }}
        >
          {ITEMS.map((item, i) => {
            const angle = i * ANGLE_STEP
            const isSelected = selected === i
            const extraZ = isSelected ? selectedZ : 0
            const scale = isSelected ? 1.15 : 1

            return (
              <div
                key={i}
                onClick={(e) => {
                  e.stopPropagation()
                  emit(SelectItem, i)
                }}
                style={{
                  position: 'absolute',
                  width: 140,
                  height: 200,
                  left: '50%',
                  top: '50%',
                  marginLeft: -70,
                  marginTop: -100,
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angle}deg) translateZ(${300 + extraZ}px) scale(${scale})`,
                  background: `linear-gradient(145deg, ${item.color}cc, ${item.color}66)`,
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  boxShadow: isSelected
                    ? `0 0 40px ${item.color}88, 0 8px 32px rgba(0,0,0,0.5)`
                    : '0 8px 32px rgba(0,0,0,0.4)',
                  border: isSelected
                    ? `2px solid ${item.color}`
                    : '1px solid rgba(255,255,255,0.1)',
                  transition: 'box-shadow 0.3s, border 0.3s',
                }}
              >
                <span style={{ fontSize: 40 }}>{item.icon}</span>
                <span style={{ color: '#fff', fontSize: 16, fontWeight: 600, letterSpacing: 1 }}>
                  {item.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            emit(AutoRotateToggle, undefined)
          }}
          style={{
            background: isAutoRotating ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            letterSpacing: 1,
          }}
        >
          {isAutoRotating ? '\u23F8 Pause' : '\u25B6 Resume'}
        </button>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          Drag to control {'\u00B7'} Click an item to select
        </span>
      </div>
    </div>
  )
}
