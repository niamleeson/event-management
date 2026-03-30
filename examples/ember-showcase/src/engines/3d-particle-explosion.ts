import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  trail: { x: number; y: number }[]
}

export interface SpawnPayload {
  x: number
  y: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const GRAVITY = 0.15
export const PARTICLE_COUNT = 40
export const TRAIL_LENGTH = 8
export const COLORS = ['#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#2a9d8f', '#e76f51', '#f4a261', '#ff6b6b']

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const SpawnExplosion = engine.event<SpawnPayload>('SpawnExplosion')
export const ClearParticles = engine.event<void>('ClearParticles')
export const ToggleGravity = engine.event<void>('ToggleGravity')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const particles = engine.signal<Particle[]>(
  SpawnExplosion,
  [],
  (prev, spawn) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5
      const speed = 2 + Math.random() * 6
      newParticles.push({
        x: spawn.x,
        y: spawn.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 60 + Math.random() * 60,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 2 + Math.random() * 4,
        trail: [],
      })
    }
    return [...prev, ...newParticles]
  },
)

engine.signalUpdate(particles, ClearParticles, () => [])

export const gravityEnabled = engine.signal<boolean>(
  ToggleGravity, true, (prev) => !prev,
)

export const explosionCount = engine.signal<number>(
  SpawnExplosion, 0, (prev) => prev + 1,
)

export const activeParticleCount = engine.signal<number>(
  SpawnExplosion, 0, (prev) => prev, // updated in frame loop
)

// ---------------------------------------------------------------------------
// Frame loop updates particles via direct mutation for performance
// The page will read particles.value each frame
// ---------------------------------------------------------------------------

engine.on(engine.frame, ({ dt }) => {
  const ps = particles.value
  if (ps.length === 0) return

  const g = gravityEnabled.value ? GRAVITY : 0
  const dtScale = Math.min(dt / 16.67, 3) // normalize to 60fps

  let alive = 0
  const next: Particle[] = []
  for (const p of ps) {
    p.trail.push({ x: p.x, y: p.y })
    if (p.trail.length > TRAIL_LENGTH) p.trail.shift()

    p.vy += g * dtScale
    p.x += p.vx * dtScale
    p.y += p.vy * dtScale
    p.life -= (1 / p.maxLife) * dtScale

    if (p.life > 0) {
      next.push(p)
      alive++
    }
  }

  // Force signal update by setting new array reference
  particles.set(next)
  activeParticleCount.set(alive)
})

// Start frame loop
engine.startFrameLoop()
