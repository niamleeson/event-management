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
// State
// ---------------------------------------------------------------------------

let _particles: Particle[] = []
let _gravityEnabled = true
let _explosionCount = 0
let _activeParticleCount = 0

export function getParticles(): Particle[] { return _particles }
export function getGravityEnabled(): boolean { return _gravityEnabled }
export function getExplosionCount(): number { return _explosionCount }
export function getActiveParticleCount(): number { return _activeParticleCount }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(SpawnExplosion, (spawn: SpawnPayload) => {
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
  _particles = [..._particles, ...newParticles]
  _explosionCount++
})

engine.on(ClearParticles, () => {
  _particles = []
  _activeParticleCount = 0
})

engine.on(ToggleGravity, () => {
  _gravityEnabled = !_gravityEnabled
})

// ---------------------------------------------------------------------------
// Frame update (called from page via rAF)
// ---------------------------------------------------------------------------

export function updateFrame(dt: number): void {
  if (_particles.length === 0) return

  const g = _gravityEnabled ? GRAVITY : 0
  const dtScale = Math.min(dt / 16.67, 3)

  const next: Particle[] = []
  let alive = 0
  for (const p of _particles) {
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

  _particles = next
  _activeParticleCount = alive
}
