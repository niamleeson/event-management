import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface Particle {
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

export const SpawnExplosion = engine.event<{ x: number; y: number }>('SpawnExplosion')
export const ParticlesUpdated = engine.event('ParticlesUpdated')
export const ClearAll = engine.event('ClearAll')

/* ------------------------------------------------------------------ */
/*  Particle state (mutable for perf — driven by engine frame)        */
/* ------------------------------------------------------------------ */

export const particles: Particle[] = []

export let particleCount = 0
export const ParticleCountChanged = engine.event('ParticleCountChanged')
engine.on(ParticlesUpdated, (v: any) => { particleCount = (() => particles.length)(particleCount, v); engine.emit(ParticleCountChanged, particleCount) })
engine.on(ClearAll, (v: any) => { particleCount = (() => 0)(particleCount, v); engine.emit(ParticleCountChanged, particleCount) })

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
      vy: Math.sin(angle) * speed - 2,
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

  const dtSec = Math.min(dt / 16.667, 3)

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.vy += 0.15 * dtSec
    p.x += p.vx * dtSec
    p.y += p.vy * dtSec
    p.life -= dtSec
    p.size *= 0.997

    if (p.life <= 0 || p.size < 0.2) {
      particles.splice(i, 1)
    }
  }

  engine.emit(ParticlesUpdated, undefined)
})
