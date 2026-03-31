import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ── Types ──

export type Zone = 'queue' | 'heaven' | 'hell' | 'falling' | 'dragging' | 'clinging'

export interface NPC {
  id: string
  name: string
  emoji: string
  sin: string
}

export interface NPCState {
  npc: NPC
  zone: Zone
  x: number
  y: number
  targetX: number
  targetY: number
  velX: number
  velY: number
  rotation: number
  targetRotation: number
  scale: number
  targetScale: number
  opacity: number
  targetOpacity: number
  // Behavior
  reachAmount: number       // 0-1, how much they reach toward cursor (hell)
  bowAmount: number         // 0-1, how much they bow (heaven)
  clingStrength: number     // 0-1, how attached to cursor (clinging)
  shakeAccum: number        // accumulated mouse shake energy
  armAngle: number          // arm reaching angle toward cursor
  expression: 'neutral' | 'happy' | 'sad' | 'terrified' | 'pleading' | 'serene' | 'grabbing'
}

export interface Point { x: number; y: number }

// ── Events ──

export const MouseMoved     = engine.event<Point>('mouse:moved')
export const MouseDown      = engine.event<Point>('mouse:down')
export const MouseUp        = engine.event<Point>('mouse:up')
export const Frame          = engine.event<number>('frame')

export const GrabNPC        = engine.event<string>('npc:grab')
export const DropNPC        = engine.event<{ id: string, x: number, y: number }>('npc:drop')
export const NPCLanded      = engine.event<{ id: string, zone: Zone }>('npc:landed')
export const NPCCling       = engine.event<string>('npc:cling')
export const NPCShakenOff   = engine.event<string>('npc:shaken')
export const SpawnNext      = engine.event<void>('spawn:next')

// ── Layout constants ──
export const HELL_X = 0
export const HEAVEN_X_START = 0.5
export const QUEUE_Y = 0
export const QUEUE_HEIGHT = 0.12
export const DIVIDER_X = 0.5
export const GROUND_Y = 0.88
export const NPC_SIZE = 48

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
export let prevMousePos: Point = { x: 0, y: 0 }
export let mouseVel: Point = { x: 0, y: 0 }
export let dragId: string | null = null
export let queueIndex = 0
export let score = { heaven: 0, hell: 0 }
export let screenW = window.innerWidth
export let screenH = window.innerHeight

// ── Helpers ──

function queueSlotX(i: number): number {
  const totalSlots = Math.min(8, NPC_POOL.length - queueIndex)
  const spacing = NPC_SIZE * 1.5
  const totalWidth = totalSlots * spacing
  const startX = (screenW - totalWidth) / 2
  return startX + i * spacing
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

// ── Initialize queue ──

export function initGame() {
  npcs.clear()
  queueIndex = 0
  score = { heaven: 0, hell: 0 }
  for (let i = 0; i < Math.min(8, NPC_POOL.length); i++) {
    const npc = NPC_POOL[i]
    const slotX = queueSlotX(i)
    npcs.set(npc.id, {
      npc,
      zone: 'queue',
      x: slotX, y: screenH * QUEUE_Y + 20,
      targetX: slotX, targetY: screenH * QUEUE_Y + 20,
      velX: 0, velY: 0,
      rotation: 0, targetRotation: 0,
      scale: 1, targetScale: 1,
      opacity: 0, targetOpacity: 1,
      reachAmount: 0, bowAmount: 0,
      clingStrength: 0, shakeAccum: 0,
      armAngle: 0,
      expression: 'neutral',
    })
  }
}

// ── Mouse tracking ──

engine.on(MouseMoved, (pos) => {
  prevMousePos = { ...mousePos }
  mousePos = pos
  mouseVel = { x: pos.x - prevMousePos.x, y: pos.y - prevMousePos.y }
})

// ── Grab NPC ──

engine.on(MouseDown, (pos) => {
  // Find closest NPC to grab
  let closest: string | null = null
  let closestDist = NPC_SIZE * 1.5

  for (const [id, state] of npcs) {
    // Can grab from queue, heaven (NO — can't drag from heaven), hell, falling, clinging
    if (state.zone === 'heaven') continue
    const d = dist(pos, { x: state.x, y: state.y })
    if (d < closestDist) {
      closest = id
      closestDist = d
    }
  }

  if (closest) {
    engine.emit(GrabNPC, closest)
  }
})

engine.on(GrabNPC, (id) => {
  const state = npcs.get(id)
  if (!state) return
  dragId = id
  state.zone = 'dragging'
  state.targetScale = 1.2
  state.clingStrength = 0
  state.shakeAccum = 0
  state.expression = 'terrified'
})

// ── Drop NPC → determine zone ──

engine.on(MouseUp, (pos) => {
  if (!dragId) return
  engine.emit(DropNPC, { id: dragId, x: pos.x, y: pos.y })
  dragId = null
})

engine.on(DropNPC).emit(NPCLanded, ({ id, x, y }) => {
  const state = npcs.get(id)
  if (!state) return Skip

  // Determine which zone
  const normalizedX = x / screenW

  if (y < screenH * QUEUE_HEIGHT + 40) {
    // Dropped back in queue area
    state.zone = 'queue'
    state.targetScale = 1
    state.expression = 'neutral'
    return { id, zone: 'queue' as Zone }
  }

  if (normalizedX < DIVIDER_X) {
    // Hell side
    state.zone = 'falling'
    state.velY = 2
    state.targetScale = 1
    state.expression = 'terrified'
    return { id, zone: 'hell' as Zone }
  } else {
    // Heaven side
    state.zone = 'falling'
    state.velY = -2 // float up slightly first, then settle
    state.targetScale = 1
    state.expression = 'happy'
    return { id, zone: 'heaven' as Zone }
  }
})

engine.on(NPCLanded, ({ id, zone }) => {
  if (zone === 'heaven') score.heaven++
  if (zone === 'hell') score.hell++
  // Spawn next from pool
  engine.emit(SpawnNext, undefined)
})

engine.on(SpawnNext, () => {
  const nextIdx = queueIndex + 8
  if (nextIdx < NPC_POOL.length) {
    const npc = NPC_POOL[nextIdx]
    const slotI = nextIdx % 8
    const slotX = queueSlotX(slotI)
    npcs.set(npc.id, {
      npc,
      zone: 'queue',
      x: slotX, y: -NPC_SIZE,
      targetX: slotX, targetY: screenH * QUEUE_Y + 20,
      velX: 0, velY: 0,
      rotation: 0, targetRotation: 0,
      scale: 0.5, targetScale: 1,
      opacity: 0, targetOpacity: 1,
      reachAmount: 0, bowAmount: 0,
      clingStrength: 0, shakeAccum: 0,
      armAngle: 0,
      expression: 'neutral',
    })
  }
  queueIndex++
})

// ── Clinging logic (hell NPCs grab cursor) ──

engine.on(NPCCling, (id) => {
  const state = npcs.get(id)
  if (!state) return
  state.zone = 'clinging'
  state.clingStrength = 1
  state.expression = 'grabbing'
  state.targetScale = 1.1
})

engine.on(NPCShakenOff, (id) => {
  const state = npcs.get(id)
  if (!state) return
  state.zone = 'falling'
  state.clingStrength = 0
  state.velX = mouseVel.x * 3
  state.velY = mouseVel.y * 3
  state.expression = 'terrified'
  state.targetRotation = (Math.random() - 0.5) * 720
})

// ── Frame loop — ALL physics and behaviors ──

engine.on(Frame, (dt) => {
  const dtSec = Math.min(dt / 1000, 0.05) // cap at 50ms
  const gravity = 800
  const mouseSpeed = Math.sqrt(mouseVel.x ** 2 + mouseVel.y ** 2)

  screenW = window.innerWidth
  screenH = window.innerHeight

  for (const [id, s] of npcs) {

    // ── QUEUE: idle bobbing ──
    if (s.zone === 'queue') {
      s.x += (s.targetX - s.x) * 0.1
      s.y += (s.targetY - s.y) * 0.1
      s.scale += (s.targetScale - s.scale) * 0.15
      s.opacity += (s.targetOpacity - s.opacity) * 0.08
      s.rotation += (0 - s.rotation) * 0.1
      // Gentle bob
      s.targetY = screenH * QUEUE_Y + 20 + Math.sin(Date.now() / 800 + parseInt(id) * 1.3) * 3
      s.expression = 'neutral'
    }

    // ── DRAGGING: follow cursor ──
    else if (s.zone === 'dragging') {
      s.targetX = mousePos.x
      s.targetY = mousePos.y
      s.x += (s.targetX - s.x) * 0.35
      s.y += (s.targetY - s.y) * 0.35
      s.scale += (s.targetScale - s.scale) * 0.15
      // Tilt based on horizontal movement
      s.targetRotation = mouseVel.x * 0.8
      s.rotation += (s.targetRotation - s.rotation) * 0.15

      // Expression based on position
      const nx = mousePos.x / screenW
      if (nx < DIVIDER_X - 0.1) s.expression = 'terrified'
      else if (nx > DIVIDER_X + 0.1) s.expression = 'happy'
      else s.expression = 'neutral'
    }

    // ── FALLING: gravity ──
    else if (s.zone === 'falling') {
      const isHeavenBound = s.x / screenW >= DIVIDER_X
      if (isHeavenBound) {
        // Float up gently then settle
        s.velY += -100 * dtSec // anti-gravity
        s.velY *= 0.96 // air resistance
        s.y += s.velY * dtSec

        // Settle at a heaven position
        const settleY = screenH * 0.3 + Math.random() * screenH * 0.3
        if (s.y < settleY) {
          s.y = settleY
          s.velY = 0
          s.zone = 'heaven'
          s.targetX = screenW * DIVIDER_X + 40 + Math.random() * (screenW * 0.45)
          s.targetY = settleY
          s.expression = 'serene'
          s.targetRotation = 0
        }
      } else {
        // Fall with gravity into hell
        s.velY += gravity * dtSec
        s.velX *= 0.99
        s.y += s.velY * dtSec
        s.x += s.velX * dtSec

        // Bounce off ground
        const ground = screenH * GROUND_Y
        if (s.y > ground) {
          s.y = ground
          s.velY *= -0.4
          if (Math.abs(s.velY) < 30) {
            s.velY = 0
            s.zone = 'hell'
            s.targetY = ground - Math.random() * 20
            s.targetX = 30 + Math.random() * (screenW * DIVIDER_X - 60)
            s.expression = 'sad'
          }
        }
      }
      s.rotation += (s.targetRotation - s.rotation) * 0.05
      s.scale += (s.targetScale - s.scale) * 0.1
    }

    // ── HEAVEN: serene floating ──
    else if (s.zone === 'heaven') {
      s.x += (s.targetX - s.x) * 0.05
      s.y += (s.targetY - s.y) * 0.05
      s.scale += (s.targetScale - s.scale) * 0.1
      s.rotation += (0 - s.rotation) * 0.05

      // Gentle float
      s.targetY += Math.sin(Date.now() / 1200 + parseInt(id) * 0.7) * 0.1

      // React to cursor: bow/kneel when cursor is near
      const d = dist(mousePos, { x: s.x, y: s.y })
      if (d < 150) {
        s.bowAmount += (1 - s.bowAmount) * 0.08
        s.expression = 'serene'
        s.targetScale = 0.9 // slight shrink = kneeling
      } else {
        s.bowAmount += (0 - s.bowAmount) * 0.05
        s.expression = 'happy'
        s.targetScale = 1
      }
    }

    // ── HELL: tormented, reaching for cursor ──
    else if (s.zone === 'hell') {
      s.x += (s.targetX - s.x) * 0.05
      s.y += (s.targetY - s.y) * 0.05
      s.scale += (s.targetScale - s.scale) * 0.1
      s.rotation += (s.targetRotation - s.rotation) * 0.1
      s.targetRotation = 0

      // Subtle suffering sway
      s.targetX += Math.sin(Date.now() / 600 + parseInt(id) * 2.1) * 0.3

      // Reach toward cursor
      const d = dist(mousePos, { x: s.x, y: s.y })
      const reachDist = 200
      if (d < reachDist) {
        s.reachAmount += (1 - s.reachAmount) * 0.12
        s.expression = 'pleading'
        s.armAngle = Math.atan2(mousePos.y - s.y, mousePos.x - s.x)

        // Close enough to cling!
        if (d < NPC_SIZE * 1.2 && s.zone === 'hell' && !dragId) {
          engine.emit(NPCCling, id)
        }
      } else {
        s.reachAmount += (0 - s.reachAmount) * 0.06
        if (s.reachAmount < 0.1) s.expression = 'sad'
      }
    }

    // ── CLINGING: attached to cursor ──
    else if (s.zone === 'clinging') {
      // Follow cursor with offset
      const angle = Math.atan2(s.y - mousePos.y, s.x - mousePos.x)
      const clingDist = NPC_SIZE * 0.8
      s.targetX = mousePos.x + Math.cos(angle) * clingDist
      s.targetY = mousePos.y + Math.sin(angle) * clingDist
      s.x += (s.targetX - s.x) * 0.2
      s.y += (s.targetY - s.y) * 0.2

      // Shake detection — accumulate mouse speed
      s.shakeAccum += mouseSpeed * dtSec * 0.3
      s.shakeAccum *= 0.95 // decay

      // Violent shaking breaks the grip
      if (s.shakeAccum > 15) {
        engine.emit(NPCShakenOff, id)
      }

      s.clingStrength = Math.max(0, s.clingStrength - mouseSpeed * 0.001)
      s.rotation = Math.sin(Date.now() / 100) * 15 * (mouseSpeed / 20) // jitter
      s.scale += (1.1 - s.scale) * 0.1
      s.expression = 'grabbing'
    }

    // ── Common: clamp opacity ──
    s.opacity += (s.targetOpacity - s.opacity) * 0.08
    s.opacity = Math.max(0, Math.min(1, s.opacity))
  }
})

// ── Start frame loop ──
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
