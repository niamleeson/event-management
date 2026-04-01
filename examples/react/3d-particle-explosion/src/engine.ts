import { createEngine } from '@pulse/core'
import type { EventType } from '@pulse/core'

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParticleState {
  id: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  maxLife: number
  color: string
  size: number
}

// ---------------------------------------------------------------------------
// Global events
// ---------------------------------------------------------------------------

export const Frame = engine.event<number>('Frame')
export const SpawnExplosion = engine.event<{ x: number; y: number }>('SpawnExplosion')
export const ClearAll = engine.event<void>('ClearAll')
export const ParticleCountChanged = engine.event<number>('ParticleCountChanged')
export const SceneChanged = engine.event<ParticleState[]>('SceneChanged')

// ---------------------------------------------------------------------------
// Per-particle event types (created dynamically per particle)
// ---------------------------------------------------------------------------

export interface ParticleEvents {
  Tick: EventType<number>         // receives dt
  Physics: EventType<number>      // receives dt, applies forces
  Moved: EventType<ParticleState> // emitted after physics update
  Aged: EventType<ParticleState>  // emitted after life drain
  Died: EventType<number>         // emitted when life <= 0, payload = id
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const PALETTE = [
  '#ff6b6b', '#ee5a24', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff',
  '#5f27cd', '#01a3a4', '#f368e0', '#ff9f43', '#00d2d3', '#c44569',
]

// ---------------------------------------------------------------------------
// Particle registry
// ---------------------------------------------------------------------------

let nextId = 0
const liveParticles = new Map<number, { state: ParticleState; events: ParticleEvents; disposers: (() => void)[] }>()

function createParticle(x: number, y: number): void {
  const id = nextId++
  const angle = Math.random() * Math.PI * 2
  const elevation = (Math.random() - 0.5) * Math.PI
  const speed = 1.5 + Math.random() * 5
  const cosElev = Math.cos(elevation)
  const life = 80 + Math.random() * 80

  const state: ParticleState = {
    id,
    x,
    y,
    z: 0,
    vx: Math.cos(angle) * cosElev * speed,
    vy: Math.sin(angle) * cosElev * speed - 2.5,
    vz: Math.sin(elevation) * speed,
    life,
    maxLife: life,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    size: 2 + Math.random() * 4,
  }

  // Create per-particle events
  const events: ParticleEvents = {
    Tick: engine.event<number>(`p${id}.Tick`),
    Physics: engine.event<number>(`p${id}.Physics`),
    Moved: engine.event<ParticleState>(`p${id}.Moved`),
    Aged: engine.event<ParticleState>(`p${id}.Aged`),
    Died: engine.event<number>(`p${id}.Died`),
  }

  const disposers: (() => void)[] = []

  // Tick → Physics (forward dt)
  const d1 = engine.on(events.Tick).emit(events.Physics)
  disposers.push(() => d1.dispose())

  // Physics: apply gravity, velocity, drag → emit Moved
  const d2 = engine.on(events.Physics, [events.Moved], (dt, moved) => {
    const dtSec = dt / 16.67 // normalize to ~60fps
    state.vy += 0.12 * dtSec           // gravity
    state.vx *= 0.995                   // air drag
    state.vy *= 0.995
    state.vz *= 0.99
    state.x += state.vx * dtSec
    state.y += state.vy * dtSec
    state.z += state.vz * dtSec
    state.size *= (1 - 0.003 * dtSec)   // shrink
    moved(state)
  })
  disposers.push(d2)

  // Moved → Aged (drain life)
  const d3 = engine.on(events.Moved, [events.Aged], (_s, aged) => {
    state.life -= 1
    aged(state)
  })
  disposers.push(d3)

  // Aged → maybe Died
  const d4 = engine.on(events.Aged, [events.Died], (s, died) => {
    if (s.life <= 0 || s.size < 0.2) {
      died(s.id)
    }
  })
  disposers.push(d4)

  // Died → remove self
  const d5 = engine.on(events.Died, (deadId) => {
    destroyParticle(deadId)
  })
  disposers.push(d5)

  liveParticles.set(id, { state, events, disposers })
}

function destroyParticle(id: number): void {
  const entry = liveParticles.get(id)
  if (!entry) return
  for (const d of entry.disposers) d()
  liveParticles.delete(id)
}

// ---------------------------------------------------------------------------
// Global handlers
// ---------------------------------------------------------------------------

// SpawnExplosion → create N particles
engine.on(SpawnExplosion, ({ x, y }) => {
  const count = 40 + Math.floor(Math.random() * 40)
  for (let i = 0; i < count; i++) {
    createParticle(x, y)
  }
})

// ClearAll → destroy all particles
engine.on(ClearAll, () => {
  for (const [id] of liveParticles) {
    destroyParticle(id)
  }
})

// Frame → fan out to every particle's Tick, then emit scene snapshot
engine.on(Frame, (dt) => {
  // Fan out Frame to each particle's Tick event
  for (const entry of liveParticles.values()) {
    engine.emit(entry.events.Tick, dt)
  }

  // Collect surviving particle states for rendering
  const states: ParticleState[] = []
  for (const entry of liveParticles.values()) {
    states.push(entry.state)
  }
  engine.emit(SceneChanged, states)
  engine.emit(ParticleCountChanged, liveParticles.size)
})

// ---------------------------------------------------------------------------
// Frame loop
// ---------------------------------------------------------------------------

let _rafId: number | null = null
export function startLoop() {
  if (_rafId !== null) return
  let last = performance.now()
  const loop = () => {
    const now = performance.now()
    engine.emit(Frame, now - last)
    last = now
    _rafId = requestAnimationFrame(loop)
  }
  _rafId = requestAnimationFrame(loop)
}
export function stopLoop() {
  if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null }
}
