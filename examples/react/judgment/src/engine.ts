import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ── Types ──

export type Zone = 'queue' | 'heaven' | 'hell' | 'falling' | 'dragging' | 'clinging'
export type Expression = 'neutral' | 'happy' | 'sad' | 'terrified' | 'pleading' | 'serene' | 'grabbing'

export interface NPC {
  id: string
  name: string
  emoji: string
  sin: string
}

export interface NPCState {
  npc: NPC
  zone: Zone
  x: number; y: number
  targetX: number; targetY: number
  velX: number; velY: number
  rotation: number; targetRotation: number
  scale: number; targetScale: number
  opacity: number; targetOpacity: number
  reachAmount: number
  bowAmount: number
  clingStrength: number
  shakeAccum: number
  armAngle: number
  _lastVelX: number
  _wasNear: boolean
  _wasVeryClose: boolean
  expression: Expression
}

export interface Point { x: number; y: number }

// ── Events ──

// Input
export const MouseMoved = engine.event<Point>('mouse:moved')
export const MouseDown  = engine.event<Point>('mouse:down')
export const MouseUp    = engine.event<Point>('mouse:up')
export const Frame      = engine.event<number>('frame')

// NPC lifecycle
export const GrabNPC      = engine.event<string>('npc:grab')
export const DropNPC      = engine.event<{ id: string, x: number, y: number }>('npc:drop')
export const NPCLanded    = engine.event<{ id: string, zone: Zone }>('npc:landed')
export const SpawnNext    = engine.event<void>('spawn:next')

// Proximity (only for heaven/hell NPCs within range)
export const CursorNearHeaven    = engine.event<{ id: string, dist: number }>('cursor:near:heaven')
export const CursorLeftHeaven    = engine.event<string>('cursor:left:heaven')
export const CursorNearHell      = engine.event<{ id: string, dist: number, angle: number }>('cursor:near:hell')
export const CursorVeryCloseHell = engine.event<string>('cursor:veryclose:hell')
export const CursorLeftHell      = engine.event<string>('cursor:left:hell')

// Reactions
export const NPCBow     = engine.event<string>('npc:bow')
export const NPCStopBow = engine.event<string>('npc:stopbow')
export const NPCReach   = engine.event<{ id: string, angle: number }>('npc:reach')
export const NPCStopReach = engine.event<string>('npc:stopreach')
export const NPCCling     = engine.event<string>('npc:cling')
export const NPCShakenOff = engine.event<string>('npc:shaken')
export const ShakeDetected = engine.event<{ id: string, amount: number }>('shake:detected')

// Zone transitions (emitted by Frame when physics settles)
export const NPCSettledHeaven = engine.event<string>('npc:settled:heaven')
export const NPCSettledHell   = engine.event<string>('npc:settled:hell')

// ── Constants ──
export const QUEUE_Y = 0
export const QUEUE_HEIGHT = 0.12
export const DIVIDER_X = 0.5
export const GROUND_Y = 0.88
export const NPC_SIZE = 48
const NEAR_RADIUS = 150
const VERY_CLOSE_RADIUS = NPC_SIZE * 1.2

// ── NPC pool ──
const NPC_POOL: NPC[] = [
  { id: '1',  name: 'Gerald', emoji: '👴', sin: 'Stole candy from a baby' },
  { id: '2',  name: 'Mildred', emoji: '👵', sin: 'Gossiped about everyone' },
  { id: '3',  name: 'Chad', emoji: '🧔', sin: 'Double-dipped chips' },
  { id: '4',  name: 'Karen', emoji: '👩', sin: 'Asked for the manager' },
  { id: '5',  name: 'Timmy', emoji: '👦', sin: 'Put milk before cereal' },
  { id: '6',  name: 'Brenda', emoji: '👩‍🦰', sin: 'Replied-all to company email' },
  { id: '7',  name: 'Steve', emoji: '🧑‍💼', sin: 'Microwaved fish at work' },
  { id: '8',  name: 'Linda', emoji: '👩‍🦳', sin: 'Spoiled movie endings' },
  { id: '9',  name: 'Derek', emoji: '🧑‍🎤', sin: 'Played guitar at parties' },
  { id: '10', name: 'Susan', emoji: '👩‍🏫', sin: 'Gave homework on Friday' },
  { id: '11', name: 'Frank', emoji: '👨‍🔧', sin: 'Left the toilet seat up' },
  { id: '12', name: 'Doris', emoji: '🧓', sin: 'Drove 40 in the fast lane' },
  { id: '13', name: 'Kevin', emoji: '🧑‍💻', sin: 'Used tabs instead of spaces' },
  { id: '14', name: 'Pam', emoji: '👩‍🍳', sin: 'Put pineapple on pizza' },
  { id: '15', name: 'Greg', emoji: '🕺', sin: 'Clapped when the plane landed' },
  { id: '16', name: 'Wendy', emoji: '💃', sin: 'Talked during movies' },
  { id: '17', name: 'Bob', emoji: '👨‍🌾', sin: 'Mowed the lawn at 7am Sunday' },
  { id: '18', name: 'Diane', emoji: '👸', sin: 'Took 20 items to express lane' },
  { id: '19', name: 'Earl', emoji: '🤠', sin: 'Said "working hard or hardly working"' },
  { id: '20', name: 'Nancy', emoji: '🧙‍♀️', sin: 'Used Comic Sans professionally' },
]

// ── State ──

export let npcs: Map<string, NPCState> = new Map()
export let mousePos: Point = { x: 0, y: 0 }
export let mouseVel: Point = { x: 0, y: 0 }
export let dragId: string | null = null
export let queueIndex = 0
export let score = { heaven: 0, hell: 0 }
export let screenW = window.innerWidth
export let screenH = window.innerHeight

function distPt(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function makeNPCState(npc: NPC, x: number, y: number): NPCState {
  return {
    npc, zone: 'queue', x, y, targetX: x, targetY: y,
    velX: 0, velY: 0, rotation: 0, targetRotation: 0,
    scale: 1, targetScale: 1, opacity: 0, targetOpacity: 1,
    reachAmount: 0, bowAmount: 0, clingStrength: 0, shakeAccum: 0,
    armAngle: 0, _lastVelX: 0, _wasNear: false, _wasVeryClose: false,
    expression: 'neutral',
  }
}

function queueSlotX(i: number): number {
  const spacing = NPC_SIZE * 1.5
  const total = Math.min(8, NPC_POOL.length - queueIndex) * spacing
  return (screenW - total) / 2 + i * spacing
}

export function initGame() {
  npcs.clear()
  queueIndex = 0
  score = { heaven: 0, hell: 0 }
  for (let i = 0; i < Math.min(8, NPC_POOL.length); i++) {
    const slotX = queueSlotX(i)
    npcs.set(NPC_POOL[i].id, makeNPCState(NPC_POOL[i], slotX, screenH * QUEUE_Y + 20))
  }
}

// ════════════════════════════════
// MOUSE → PROXIMITY EVENTS
// ════════════════════════════════

engine.on(MouseMoved, (pos) => {
  const prev = mousePos
  mouseVel = { x: pos.x - prev.x, y: pos.y - prev.y }
  mousePos = pos

  // Check proximity for settled heaven/hell NPCs only
  for (const [id, s] of npcs) {
    if (s.zone === 'heaven') {
      const d = distPt(pos, { x: s.x, y: s.y })
      const isNear = d < NEAR_RADIUS
      if (isNear && !s._wasNear) {
        engine.emit(CursorNearHeaven, { id, dist: d })
      } else if (!isNear && s._wasNear) {
        engine.emit(CursorLeftHeaven, id)
      }
      s._wasNear = isNear
    } else if (s.zone === 'hell') {
      const d = distPt(pos, { x: s.x, y: s.y })
      const isNear = d < NEAR_RADIUS
      const isVeryClose = d < VERY_CLOSE_RADIUS
      const angle = Math.atan2(pos.y - s.y, pos.x - s.x)
      if (isNear && !s._wasNear) {
        engine.emit(CursorNearHell, { id, dist: d, angle })
      } else if (isNear && s._wasNear) {
        // Update angle while still near
        engine.emit(CursorNearHell, { id, dist: d, angle })
      }
      if (isVeryClose && !s._wasVeryClose && !dragId) {
        engine.emit(CursorVeryCloseHell, id)
      }
      if (!isNear && s._wasNear) {
        engine.emit(CursorLeftHell, id)
      }
      s._wasNear = isNear
      s._wasVeryClose = isVeryClose
    }
  }

  // Shake detection for clinging NPCs
  for (const [id, s] of npcs) {
    if (s.zone !== 'clinging') continue
    const dirChange = mouseVel.x * s._lastVelX < 0 ? Math.abs(mouseVel.x) : 0
    s._lastVelX = mouseVel.x || s._lastVelX
    s.shakeAccum += dirChange * 0.15 + Math.sqrt(mouseVel.x ** 2 + mouseVel.y ** 2) * 0.02
    s.shakeAccum *= 0.92
    if (s.shakeAccum > 5) {
      engine.emit(ShakeDetected, { id, amount: s.shakeAccum })
    }
  }
})

// ════════════════════════════════
// PROXIMITY → REACTIONS
// ════════════════════════════════

engine.on(CursorNearHeaven, ({ id }) => {
  engine.emit(NPCBow, id)
})

engine.on(CursorLeftHeaven, (id) => {
  engine.emit(NPCStopBow, id)
})

engine.on(CursorNearHell, ({ id, angle }) => {
  engine.emit(NPCReach, { id, angle })
})

engine.on(CursorLeftHell, (id) => {
  engine.emit(NPCStopReach, id)
})

engine.on(CursorVeryCloseHell, (id) => {
  engine.emit(NPCCling, id)
})

engine.on(ShakeDetected, ({ id }) => {
  engine.emit(NPCShakenOff, id)
})

// ════════════════════════════════
// REACTIONS → STATE CHANGES
// ════════════════════════════════

engine.on(NPCBow, (id) => {
  const s = npcs.get(id)
  if (!s || s.zone !== 'heaven') return
  s.expression = 'serene'
  s.targetScale = 0.9
})

engine.on(NPCStopBow, (id) => {
  const s = npcs.get(id)
  if (!s || s.zone !== 'heaven') return
  s.expression = 'happy'
  s.targetScale = 1
})

engine.on(NPCReach, ({ id, angle }) => {
  const s = npcs.get(id)
  if (!s || s.zone !== 'hell') return
  s.expression = 'pleading'
  s.armAngle = angle
})

engine.on(NPCStopReach, (id) => {
  const s = npcs.get(id)
  if (!s || s.zone !== 'hell') return
  s.expression = 'sad'
})

engine.on(NPCCling, (id) => {
  const s = npcs.get(id)
  if (!s || s.zone !== 'hell') return
  s.zone = 'clinging'
  s.clingStrength = 1
  s.shakeAccum = 0
  s._lastVelX = 0
  s.expression = 'grabbing'
  s.targetScale = 1.1
})

engine.on(NPCShakenOff, (id) => {
  const s = npcs.get(id)
  if (!s || s.zone !== 'clinging') return
  s.zone = 'falling'
  s.clingStrength = 0
  s.shakeAccum = 0
  s.velX = mouseVel.x * 3
  s.velY = mouseVel.y * 3
  s.expression = 'terrified'
  s.targetRotation = (Math.random() - 0.5) * 720
})

// ════════════════════════════════
// GRAB / DROP
// ════════════════════════════════

engine.on(MouseDown, (pos) => {
  let closest: string | null = null
  let closestDist = NPC_SIZE * 1.5
  for (const [id, s] of npcs) {
    if (s.zone === 'heaven') continue // can't grab from heaven
    const d = distPt(pos, { x: s.x, y: s.y })
    if (d < closestDist) { closest = id; closestDist = d }
  }
  if (closest) engine.emit(GrabNPC, closest)
})

engine.on(GrabNPC, (id) => {
  const s = npcs.get(id)
  if (!s) return
  dragId = id
  s.zone = 'dragging'
  s.targetScale = 1.2
  s.clingStrength = 0
  s.shakeAccum = 0
  s.expression = 'terrified'
})

engine.on(MouseUp, (pos) => {
  if (!dragId) return
  engine.emit(DropNPC, { id: dragId, x: pos.x, y: pos.y })
  dragId = null
})

engine.on(DropNPC, ({ id, x, y }) => {
  const s = npcs.get(id)
  if (!s) return
  if (y < screenH * QUEUE_HEIGHT + 40) {
    s.zone = 'queue'
    s.targetScale = 1
    s.expression = 'neutral'
    return
  }
  s.zone = 'falling'
  s.targetScale = 1
  if (x / screenW < DIVIDER_X) {
    s.velY = 2
    s.expression = 'terrified'
    engine.emit(NPCLanded, { id, zone: 'hell' })
  } else {
    s.velY = -2
    s.expression = 'happy'
    engine.emit(NPCLanded, { id, zone: 'heaven' })
  }
})

// ════════════════════════════════
// LANDING / SETTLING → SCORE
// ════════════════════════════════

engine.on(NPCLanded, ({ zone }) => {
  if (zone === 'heaven') score.heaven++
  if (zone === 'hell') score.hell++
  engine.emit(SpawnNext, undefined)
})

engine.on(SpawnNext, () => {
  const idx = queueIndex + 8
  if (idx < NPC_POOL.length) {
    const npc = NPC_POOL[idx]
    const slotX = queueSlotX(idx % 8)
    npcs.set(npc.id, makeNPCState(npc, slotX, -NPC_SIZE))
    const s = npcs.get(npc.id)!
    s.targetY = screenH * QUEUE_Y + 20
    s.scale = 0.5
  }
  queueIndex++
})

engine.on(NPCSettledHeaven, (id) => {
  const s = npcs.get(id)
  if (!s) return
  s.zone = 'heaven'
  s.expression = 'serene'
  s.targetRotation = 0
})

engine.on(NPCSettledHell, (id) => {
  const s = npcs.get(id)
  if (!s) return
  s.zone = 'hell'
  s.expression = 'sad'
  s.targetY = screenH * GROUND_Y - Math.random() * 20
  s.targetX = 30 + Math.random() * (screenW * DIVIDER_X - 60)
})

// ════════════════════════════════
// FRAME — PHYSICS ONLY
// ════════════════════════════════

engine.on(Frame, (dt) => {
  const dtSec = Math.min(dt / 1000, 0.05)
  const gravity = 800
  screenW = window.innerWidth
  screenH = window.innerHeight

  for (const [id, s] of npcs) {
    // ── Spring interpolation (all zones) ──
    s.scale += (s.targetScale - s.scale) * 0.15
    s.opacity += (s.targetOpacity - s.opacity) * 0.08
    s.opacity = Math.max(0, Math.min(1, s.opacity))

    if (s.zone === 'queue') {
      s.x += (s.targetX - s.x) * 0.1
      s.y += (s.targetY - s.y) * 0.1
      s.rotation += (0 - s.rotation) * 0.1
      s.targetY = screenH * QUEUE_Y + 20 + Math.sin(Date.now() / 800 + parseInt(id) * 1.3) * 3
    }

    else if (s.zone === 'dragging') {
      s.targetX = mousePos.x
      s.targetY = mousePos.y
      s.x += (s.targetX - s.x) * 0.35
      s.y += (s.targetY - s.y) * 0.35
      s.targetRotation = mouseVel.x * 0.8
      s.rotation += (s.targetRotation - s.rotation) * 0.15
      // Expression based on side
      const nx = mousePos.x / screenW
      if (nx < DIVIDER_X - 0.1) s.expression = 'terrified'
      else if (nx > DIVIDER_X + 0.1) s.expression = 'happy'
      else s.expression = 'neutral'
    }

    else if (s.zone === 'falling') {
      const heavenBound = s.x / screenW >= DIVIDER_X
      if (heavenBound) {
        s.velY += -100 * dtSec
        s.velY *= 0.96
        s.y += s.velY * dtSec
        const settleY = screenH * 0.3 + (parseInt(id) % 5) * screenH * 0.08
        if (s.y < settleY) {
          s.y = settleY
          s.velY = 0
          s.targetX = screenW * DIVIDER_X + 40 + Math.random() * (screenW * 0.45)
          s.targetY = settleY
          engine.emit(NPCSettledHeaven, id)
        }
      } else {
        s.velY += gravity * dtSec
        s.velX *= 0.99
        s.y += s.velY * dtSec
        s.x += s.velX * dtSec
        const ground = screenH * GROUND_Y
        if (s.y > ground) {
          s.y = ground
          s.velY *= -0.4
          if (Math.abs(s.velY) < 30) {
            s.velY = 0
            engine.emit(NPCSettledHell, id)
          }
        }
      }
      s.rotation += (s.targetRotation - s.rotation) * 0.05
    }

    else if (s.zone === 'heaven') {
      s.x += (s.targetX - s.x) * 0.05
      s.y += (s.targetY - s.y) * 0.05
      s.rotation += (0 - s.rotation) * 0.05
      s.targetY += Math.sin(Date.now() / 1200 + parseInt(id) * 0.7) * 0.1
      // Bow spring
      const d = distPt(mousePos, { x: s.x, y: s.y })
      s.bowAmount += ((d < NEAR_RADIUS ? 1 : 0) - s.bowAmount) * 0.08
    }

    else if (s.zone === 'hell') {
      s.x += (s.targetX - s.x) * 0.05
      s.y += (s.targetY - s.y) * 0.05
      s.rotation += (0 - s.rotation) * 0.1
      s.targetX += Math.sin(Date.now() / 600 + parseInt(id) * 2.1) * 0.3
      // Reach spring
      const d = distPt(mousePos, { x: s.x, y: s.y })
      s.reachAmount += ((d < NEAR_RADIUS ? 1 : 0) - s.reachAmount) * 0.1
      if (d >= NEAR_RADIUS) s.reachAmount *= 0.94
    }

    else if (s.zone === 'clinging') {
      const angle = Math.atan2(s.y - mousePos.y, s.x - mousePos.x)
      s.targetX = mousePos.x + Math.cos(angle) * NPC_SIZE * 0.8
      s.targetY = mousePos.y + Math.sin(angle) * NPC_SIZE * 0.8
      s.x += (s.targetX - s.x) * 0.2
      s.y += (s.targetY - s.y) * 0.2
      const speed = Math.sqrt(mouseVel.x ** 2 + mouseVel.y ** 2)
      s.rotation = Math.sin(Date.now() / 100) * 15 * (speed / 20)
    }
  }
})

// ── Frame loop ──
let lastTime = performance.now()
let rafId: number

export function startLoop() {
  function loop() {
    const now = performance.now()
    engine.emit(Frame, now - lastTime)
    lastTime = now
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}

export function stopLoop() {
  cancelAnimationFrame(rafId)
}
