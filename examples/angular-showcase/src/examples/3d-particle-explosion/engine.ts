import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  trail: { x: number; y: number }[]
}

export interface SpawnInfo {
  x: number
  y: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRAVITY = 0.15
const FRICTION = 0.99
const TRAIL_LENGTH = 8

const COLORS = ['#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#06d6a0', '#ffd166', '#ef476f', '#e76f51']

let nextId = 0

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const ClickSpawn = engine.event<SpawnInfo>('ClickSpawn')
export const ClearParticles = engine.event<void>('ClearParticles')
export const FrameTick = engine.frame

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const particles = engine.signal<Particle[]>(
  ClickSpawn,
  [],
  (prev, spawn) => {
    const newParticles: Particle[] = []
    const count = 30 + Math.floor(Math.random() * 20)
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const speed = 2 + Math.random() * 6
      newParticles.push({
        id: nextId++,
        x: spawn.x,
        y: spawn.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 60 + Math.random() * 60,
        size: 2 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        trail: [],
      })
    }
    return [...prev, ...newParticles]
  },
)

engine.signalUpdate(particles, ClearParticles, () => [])

// ---------------------------------------------------------------------------
// Physics: advance particles each frame
// ---------------------------------------------------------------------------

export const particleCount = engine.signal<number>(ClickSpawn, 0, () => 0)

engine.on(FrameTick, () => {
  const current = particles.value
  if (current.length === 0) return

  const updated = current
    .map((p) => {
      const trail = [...p.trail, { x: p.x, y: p.y }].slice(-TRAIL_LENGTH)
      return {
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vx: p.vx * FRICTION,
        vy: p.vy * FRICTION + GRAVITY,
        life: p.life - 1 / p.maxLife,
        trail,
      }
    })
    .filter((p) => p.life > 0)

  particles.set(updated)
  particleCount.set(updated.length)
})

// Start frame loop
engine.startFrameLoop()
