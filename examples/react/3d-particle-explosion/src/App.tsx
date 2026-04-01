import { useEffect, useRef } from 'react'
import { usePulse, useEmit } from '@pulse/react'
import { engine, Frame, SpawnExplosion, ClearAll, ParticleCountChanged, SceneChanged } from './engine'
import type { ParticleState } from './engine'

// ---------------------------------------------------------------------------
// 3D projection helpers
// ---------------------------------------------------------------------------

const CAMERA_Z = 600
const FOV_SCALE = 1.2

function project(x: number, y: number, z: number, cx: number, cy: number) {
  const perspective = CAMERA_Z / (CAMERA_Z + z * FOV_SCALE)
  return {
    sx: cx + (x - cx) * perspective,
    sy: cy + (y - cy) * perspective,
    scale: perspective,
  }
}

// ---------------------------------------------------------------------------
// Canvas renderer — subscribes to SceneChanged
// ---------------------------------------------------------------------------

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const emit = useEmit()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    // Subscribe to scene snapshots for rendering
    const dispose = engine.on(SceneChanged, (particles: ParticleState[]) => {
      const w = canvas.width, h = canvas.height
      const cx = w / 2, cy = h / 2

      // Fade trail
      ctx.fillStyle = 'rgba(8, 8, 18, 0.18)'
      ctx.fillRect(0, 0, w, h)

      // Sort by z for painter's algorithm (far first)
      const sorted = particles.slice().sort((a, b) => b.z - a.z)

      for (const p of sorted) {
        const alpha = Math.max(0, p.life / p.maxLife)
        const { sx, sy, scale } = project(p.x, p.y, p.z, cx, cy)
        const r = Math.max(0.5, p.size * scale)

        // Outer glow
        ctx.globalAlpha = alpha * 0.15 * scale
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(sx, sy, r * 4, 0, Math.PI * 2)
        ctx.fill()

        // Mid glow
        ctx.globalAlpha = alpha * 0.35 * scale
        ctx.beginPath()
        ctx.arc(sx, sy, r * 2, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.globalAlpha = alpha * scale
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fill()

        // Hot center
        ctx.globalAlpha = alpha * 0.7 * scale
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(sx, sy, r * 0.4, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
    })

    return () => { dispose(); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      onClick={(e) => emit(SpawnExplosion, { x: e.clientX, y: e.clientY })}
      style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
    />
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const count = usePulse(ParticleCountChanged, 0)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#080812', overflow: 'hidden' }}>
      <ParticleCanvas />

      {/* HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24,
        padding: '20px 0', pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(8,8,18,0.8) 0%, transparent 100%)',
      }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 300, letterSpacing: 3, textTransform: 'uppercase', margin: 0 }}>
          3D Particle Explosion
        </h1>
        <div style={{
          color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'monospace',
          background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 6,
        }}>
          {count} particles — {count * 5} events/frame
        </div>
        <button
          onClick={() => emit(ClearAll, undefined)}
          style={{
            pointerEvents: 'all', background: 'rgba(255,60,60,0.15)',
            border: '1px solid rgba(255,60,60,0.3)', color: '#ff6b6b',
            padding: '6px 18px', borderRadius: 6, cursor: 'pointer',
            fontSize: 12, letterSpacing: 1, textTransform: 'uppercase',
          }}
        >
          Clear
        </button>
      </div>

      {/* Info */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12,
        pointerEvents: 'none', letterSpacing: 1,
      }}>
        Click anywhere — each particle is its own event chain: Tick → Physics → Moved → Aged → Died
      </div>
    </div>
  )
}
