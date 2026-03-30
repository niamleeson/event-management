import { onMount, onCleanup } from 'solid-js'
import { useEmit, useSignal } from '@pulse/solid'
import type { Signal } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; color: string; size: number
}

/* ------------------------------------------------------------------ */
/*  Color palette                                                     */
/* ------------------------------------------------------------------ */

const PALETTE = [
  '#ff6b6b', '#ee5a24', '#feca57', '#48dbfb',
  '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4',
  '#f368e0', '#ff9f43', '#00d2d3', '#c44569',
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const SpawnExplosion = engine.event<{ x: number; y: number }>('SpawnExplosion')
const ParticlesUpdated = engine.event('ParticlesUpdated')
const ClearAll = engine.event('ClearAll')

/* ------------------------------------------------------------------ */
/*  Particle state                                                    */
/* ------------------------------------------------------------------ */

const particles: Particle[] = []

const particleCount: Signal<number> = engine.signal(
  ParticlesUpdated, 0, () => particles.length,
)
engine.signalUpdate(particleCount, ClearAll, () => 0)

/* ------------------------------------------------------------------ */
/*  Spawn logic                                                       */
/* ------------------------------------------------------------------ */

engine.on(SpawnExplosion, ({ x, y }) => {
  const count = 50 + Math.floor(Math.random() * 50)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 6
    const life = 60 + Math.random() * 90
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life, maxLife: life,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      size: 2 + Math.random() * 4,
    })
  }
})

engine.on(ClearAll, () => { particles.length = 0 })

/* ------------------------------------------------------------------ */
/*  Frame handler: advance physics                                    */
/* ------------------------------------------------------------------ */

engine.on(engine.frame, ({ dt }) => {
  if (particles.length === 0) return
  const dtSec = Math.min(dt / 16.667, 3)
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.vy += 0.15 * dtSec
    p.x += p.vx * dtSec
    p.y += p.vy * dtSec
    p.life -= dtSec
    p.size *= 0.997
    if (p.life <= 0 || p.size < 0.2) particles.splice(i, 1)
  }
  engine.emit(ParticlesUpdated, undefined)
})

/* ------------------------------------------------------------------ */
/*  Canvas renderer                                                   */
/* ------------------------------------------------------------------ */

function ParticleCanvas() {
  let canvasRef!: HTMLCanvasElement
  const emit = useEmit()

  onMount(() => {
    const ctx = canvasRef.getContext('2d')!
    const resize = () => { canvasRef.width = window.innerWidth; canvasRef.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const dispose = engine.on(engine.frame, () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)'
      ctx.fillRect(0, 0, canvasRef.width, canvasRef.height)
      for (const p of particles) {
        const alpha = Math.max(0, p.life / p.maxLife)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = alpha * 0.3
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    })

    onCleanup(() => { dispose(); window.removeEventListener('resize', resize) })
  })

  return (
    <canvas
      ref={canvasRef}
      onClick={(e) => emit(SpawnExplosion, { x: e.clientX, y: e.clientY })}
      style={{ position: 'absolute', inset: '0', cursor: 'crosshair' }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const emit = useEmit()
  const count = useSignal(particleCount)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ParticleCanvas />
      <div style={{
        position: 'absolute', top: '24px', left: '0', right: '0',
        display: 'flex', 'justify-content': 'center', 'align-items': 'center', gap: '24px',
        'pointer-events': 'none',
      }}>
        <h1 style={{ color: '#fff', 'font-size': '22px', 'font-weight': '300', 'letter-spacing': '2px' }}>
          Particle Explosion
        </h1>
        <span style={{ color: 'rgba(255,255,255,0.5)', 'font-size': '14px' }}>
          Particles: {count()}
        </span>
        <button
          onClick={() => emit(ClearAll, undefined)}
          style={{
            'pointer-events': 'all', background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
            padding: '8px 20px', 'border-radius': '8px', cursor: 'pointer',
            'font-size': '13px', 'letter-spacing': '1px',
          }}
        >Clear All</button>
      </div>
      <div style={{
        position: 'absolute', bottom: '24px', left: '0', right: '0',
        'text-align': 'center', color: 'rgba(255,255,255,0.3)', 'font-size': '13px',
        'pointer-events': 'none',
      }}>
        Click anywhere to spawn explosions
      </div>
    </div>
  )
}
