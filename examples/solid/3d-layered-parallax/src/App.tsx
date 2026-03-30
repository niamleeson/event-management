import { onMount, onCleanup, For, createSignal as solidSignal } from 'solid-js'
import { useEmit, useSpring, useSignal, useTween } from '@pulse/solid'
import type { Signal, SpringValue, TweenValue } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Layer data                                                        */
/* ------------------------------------------------------------------ */

const LAYERS = [
  { z: 0, color: '#0a0a2e', label: 'Background', shapes: [{ x: 10, y: 20, size: 200, type: 'circle' }, { x: 70, y: 60, size: 150, type: 'circle' }] },
  { z: 50, color: '#1a1a4e', label: 'Mountains', shapes: [{ x: 15, y: 55, size: 300, type: 'triangle' }, { x: 55, y: 50, size: 250, type: 'triangle' }, { x: 85, y: 60, size: 200, type: 'triangle' }] },
  { z: 100, color: '#2a2a6e', label: 'Hills', shapes: [{ x: 20, y: 70, size: 180, type: 'circle' }, { x: 60, y: 65, size: 220, type: 'circle' }, { x: 90, y: 75, size: 160, type: 'circle' }] },
  { z: 150, color: '#3a3a8e', label: 'Trees', shapes: [{ x: 10, y: 75, size: 60, type: 'rect' }, { x: 30, y: 70, size: 80, type: 'rect' }, { x: 50, y: 72, size: 70, type: 'rect' }, { x: 75, y: 68, size: 90, type: 'rect' }] },
  { z: 200, color: '#4a4aae', label: 'Foreground', shapes: [{ x: 5, y: 85, size: 40, type: 'rect' }, { x: 25, y: 80, size: 50, type: 'rect' }, { x: 80, y: 82, size: 45, type: 'rect' }] },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const MouseMove = engine.event<{ x: number; y: number }>('MouseMove')
const ToggleTheme = engine.event('ToggleTheme')
const EntranceDone = engine.event('EntranceDone')

/* ------------------------------------------------------------------ */
/*  Camera tilt via springs                                           */
/* ------------------------------------------------------------------ */

const mouseXTarget: Signal<number> = engine.signal(MouseMove, 0, (_prev, { x }) => (x - 0.5) * 20)
const mouseYTarget: Signal<number> = engine.signal(MouseMove, 0, (_prev, { y }) => (y - 0.5) * 10)

const camXSpring: SpringValue = engine.spring(mouseXTarget, { stiffness: 60, damping: 15 })
const camYSpring: SpringValue = engine.spring(mouseYTarget, { stiffness: 60, damping: 15 })

/* ------------------------------------------------------------------ */
/*  Day/night toggle                                                  */
/* ------------------------------------------------------------------ */

const isNight: Signal<boolean> = engine.signal(ToggleTheme, true, (prev) => !prev)

/* ------------------------------------------------------------------ */
/*  Entrance stagger tweens (one per layer)                           */
/* ------------------------------------------------------------------ */

const entranceStarts = LAYERS.map((_, i) => engine.event(`EntranceStart_${i}`))
const entranceTweens: TweenValue[] = LAYERS.map((_, i) => {
  const done = i === LAYERS.length - 1 ? EntranceDone : entranceStarts[i + 1]
  return engine.tween({
    start: entranceStarts[i],
    done,
    from: 100,
    to: 0,
    duration: 400,
    easing: 'easeOutBack',
  })
})

// Kick off first entrance
setTimeout(() => engine.emit(entranceStarts[0], undefined), 200)

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const emit = useEmit()
  const camX = useSpring(camXSpring)
  const camY = useSpring(camYSpring)
  const night = useSignal(isNight)

  const entranceValues = entranceTweens.map(tw => useTween(tw))

  const onMouseMove = (e: MouseEvent) => {
    emit(MouseMove, { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
  }

  const dayBg = 'linear-gradient(180deg, #87CEEB, #98D8C8, #7FCDCD)'
  const nightBg = 'linear-gradient(180deg, #0a0a2e, #1a1a4e, #0d0d3b)'
  const dayColors = ['#87CEEB55', '#7ab648', '#5a9a3a', '#4a8a2a', '#3a7a1a']
  const nightColors = ['#0a0a2e55', '#1a1a4e', '#2a2a6e', '#3a3a8e', '#4a4aae']

  return (
    <div
      onMouseMove={onMouseMove}
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        perspective: '800px',
        background: night() ? nightBg : dayBg,
        transition: 'background 1s',
        position: 'relative',
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        'transform-style': 'preserve-3d',
        transform: `rotateY(${camX()}deg) rotateX(${-camY()}deg)`,
      }}>
        <For each={LAYERS}>
          {(layer, i) => {
            const colors = () => night() ? nightColors : dayColors
            const offset = () => entranceValues[i()]()
            return (
              <div style={{
                position: 'absolute',
                inset: '0',
                transform: `translateZ(${layer.z}px) translateY(${offset()}px)`,
                overflow: 'hidden',
              }}>
                <For each={layer.shapes}>
                  {(shape) => {
                    const c = () => colors()[i()]
                    if (shape.type === 'circle') {
                      return (
                        <div style={{
                          position: 'absolute',
                          left: `${shape.x}%`,
                          top: `${shape.y}%`,
                          width: `${shape.size}px`,
                          height: `${shape.size}px`,
                          'border-radius': '50%',
                          background: `radial-gradient(circle, ${c()}, transparent)`,
                          transform: 'translate(-50%, -50%)',
                        }} />
                      )
                    }
                    if (shape.type === 'triangle') {
                      return (
                        <div style={{
                          position: 'absolute',
                          left: `${shape.x}%`,
                          top: `${shape.y}%`,
                          width: '0',
                          height: '0',
                          'border-left': `${shape.size / 2}px solid transparent`,
                          'border-right': `${shape.size / 2}px solid transparent`,
                          'border-bottom': `${shape.size}px solid ${c()}`,
                          transform: 'translate(-50%, -100%)',
                        }} />
                      )
                    }
                    return (
                      <div style={{
                        position: 'absolute',
                        left: `${shape.x}%`,
                        top: `${shape.y}%`,
                        width: `${shape.size}px`,
                        height: `${shape.size * 1.5}px`,
                        'border-radius': `${shape.size / 4}px ${shape.size / 4}px 0 0`,
                        background: c(),
                        transform: 'translate(-50%, -50%)',
                      }} />
                    )
                  }}
                </For>
              </div>
            )
          }}
        </For>
      </div>

      {/* Stars (night only) */}
      {night() && (
        <div style={{ position: 'absolute', inset: '0', 'pointer-events': 'none' }}>
          <For each={Array.from({ length: 60 }, (_, i) => i)}>
            {(i) => (
              <div style={{
                position: 'absolute',
                left: `${(i * 17 + 3) % 100}%`,
                top: `${(i * 13 + 7) % 50}%`,
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                background: '#fff',
                'border-radius': '50%',
                opacity: `${0.3 + (i % 5) * 0.15}`,
              }} />
            )}
          </For>
        </div>
      )}

      {/* UI overlay */}
      <div style={{
        position: 'absolute', top: '24px', left: '0', right: '0',
        display: 'flex', 'justify-content': 'center', 'align-items': 'center', gap: '24px',
      }}>
        <h1 style={{ color: '#fff', 'font-size': '24px', 'font-weight': '300', 'letter-spacing': '2px', 'text-shadow': '0 2px 8px rgba(0,0,0,0.5)' }}>
          3D Layered Parallax
        </h1>
        <button
          onClick={() => emit(ToggleTheme, undefined)}
          style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', padding: '8px 20px', 'border-radius': '20px',
            cursor: 'pointer', 'font-size': '14px', 'backdrop-filter': 'blur(4px)',
          }}
        >
          {night() ? 'Day Mode' : 'Night Mode'}
        </button>
      </div>

      <div style={{
        position: 'absolute', bottom: '24px', left: '0', right: '0',
        'text-align': 'center', color: 'rgba(255,255,255,0.4)', 'font-size': '13px',
      }}>
        Move mouse to tilt camera &middot; 5 parallax layers
      </div>
    </div>
  )
}
