import { useEffect, useRef } from 'react'
import { useEmit, useSignal } from '@pulse/react'
import type { Signal } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
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
/*  Particle state (mutable for perf — driven by engine frame)        */
/* ------------------------------------------------------------------ */

const particles: Particle[] = []

const particleCount: Signal<number> = engine.signal(
  ParticlesUpdated,
  0,
  () => particles.length,
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
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // slight upward bias
      life,
      maxLife: life,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      size: 2 + Math.random() * 4,
    })
  }
})

/* ------------------------------------------------------------------ */
/*  Clear logic                                                       */
/* ------------------------------------------------------------------ */

engine.on(ClearAll, () => {
  particles.length = 0
})

/* ------------------------------------------------------------------ */
/*  Frame handler: advance physics                                    */
/* ------------------------------------------------------------------ */

engine.on(engine.frame, ({ dt }) => {
  if (particles.length === 0) return

  const dtSec = Math.min(dt / 16.667, 3) // normalize & cap

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.vy += 0.15 * dtSec // gravity
    p.x += p.vx * dtSec
    p.y += p.vy * dtSec
    p.life -= dtSec
    p.size *= Math.pow(0.997, dtSec)

    if (p.life <= 0 || p.size < 0.2) {
      particles.splice(i, 1)
    }
  }

  engine.emit(ParticlesUpdated, undefined)
})

/* ------------------------------------------------------------------ */
/*  Canvas renderer                                                   */
/* ------------------------------------------------------------------ */

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const emit = useEmit()

  // Draw on every frame via engine.on(engine.frame)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const dispose = engine.on(engine.frame, () => {
      // Trail effect: semi-transparent overlay instead of full clear
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        const alpha = Math.max(0, p.life / p.maxLife)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        // Glow effect
        ctx.globalAlpha = alpha * 0.3
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
    })

    return () => {
      dispose()
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      onClick={(e) => {
        emit(SpawnExplosion, { x: e.clientX, y: e.clientY })
      }}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: 'crosshair',
      }}
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

      {/* UI overlay */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
          pointerEvents: 'none',
        }}
      >
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 300, letterSpacing: 2 }}>
          Particle Explosion
        </h1>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          Particles: {count}
        </span>
        <button
          onClick={() => emit(ClearAll, undefined)}
          style={{
            pointerEvents: 'all',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            letterSpacing: 1,
          }}
        >
          Clear All
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 13,
          pointerEvents: 'none',
        }}
      >
        Click anywhere to spawn explosions
      </div>
    </div>
  )
}
