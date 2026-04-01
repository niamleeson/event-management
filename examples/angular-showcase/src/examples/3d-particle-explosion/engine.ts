// DAG
// ClickSpawn ──→ (adds particles, updated via physics loop)
// ClearParticles ──→ ParticlesChanged
//                └──→ ParticleCountChanged
// FrameTick ──→ ParticlesChanged (via physics loop)
//           └──→ ParticleCountChanged (via physics loop)

import { createEngine } from '@pulse/core'

export const engine = createEngine()
export interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string; trail: { x: number; y: number }[] }
export interface SpawnInfo { x: number; y: number }
const GRAVITY = 0.15, FRICTION = 0.99, TRAIL_LENGTH = 8
const COLORS = ['#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#06d6a0', '#ffd166', '#ef476f', '#e76f51']
let nextId = 0

export const ClickSpawn = engine.event<SpawnInfo>('ClickSpawn')
export const ClearParticles = engine.event<void>('ClearParticles')
export const ParticlesChanged = engine.event<Particle[]>('ParticlesChanged')
export const ParticleCountChanged = engine.event<number>('ParticleCountChanged')
export const FrameTick = engine.event<void>('FrameTick')

let particles: Particle[] = []

engine.on(ClickSpawn, (spawn) => {
  const count = 30 + Math.floor(Math.random() * 20)
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5, speed = 2 + Math.random() * 6
    particles.push({ id: nextId++, x: spawn.x, y: spawn.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2, life: 1, maxLife: 60 + Math.random() * 60, size: 2 + Math.random() * 4, color: COLORS[Math.floor(Math.random() * COLORS.length)], trail: [] })
  }
})

engine.on(ClearParticles, [ParticlesChanged, ParticleCountChanged], (_payload, setParticles, setCount) => { particles = []; setParticles(particles); setCount(0) })

let _rafId: number | null = null
function physicsLoop() {
  if (particles.length > 0) {
    particles = particles.map((p) => ({
      ...p, x: p.x + p.vx, y: p.y + p.vy, vx: p.vx * FRICTION, vy: p.vy * FRICTION + GRAVITY,
      life: p.life - 1 / p.maxLife, trail: [...p.trail, { x: p.x, y: p.y }].slice(-TRAIL_LENGTH),
    })).filter((p) => p.life > 0)
    engine.emit(ParticlesChanged, particles); engine.emit(ParticleCountChanged, particles.length)
  }
  engine.emit(FrameTick, undefined)
  _rafId = requestAnimationFrame(physicsLoop)
}

export function startLoop() {
  if (_rafId !== null) return
  _rafId = requestAnimationFrame(physicsLoop)
}
export function stopLoop() {
  if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null }
}
