import { createEngine, type SpringValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CursorPosition {
  userId: string
  line: number
  col: number
  color: string
  name: string
}

export interface EditOp {
  userId: string
  line: number
  col: number
  text: string
  type: 'insert' | 'delete'
  timestamp: number
}

export interface User {
  id: string
  name: string
  color: string
  active: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const USERS: User[] = [
  { id: 'user-1', name: 'You', color: '#4361ee', active: true },
  { id: 'user-2', name: 'Alice', color: '#f72585', active: true },
  { id: 'user-3', name: 'Bob', color: '#2a9d8f', active: true },
]

const INITIAL_LINES = [
  'import { createEngine } from "@pulse/core"',
  '',
  '// Create the engine',
  'const engine = createEngine()',
  '',
  '// Define events',
  'const Click = engine.event("Click")',
  'const Updated = engine.event("Updated")',
  '',
  '// Create a signal',
  'const count = engine.signal(Click, 0, (prev) => prev + 1)',
  '',
  '// Listen for updates',
  'engine.on(Updated, (value) => {',
  '  console.log("Updated:", value)',
  '})',
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const UserEdit = engine.event<EditOp>('UserEdit')
export const CursorMoved = engine.event<CursorPosition>('CursorMoved')
export const UserJoined = engine.event<User>('UserJoined')
export const UserLeft = engine.event<string>('UserLeft')
export const Undo = engine.event<void>('Undo')
export const Redo = engine.event<void>('Redo')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const lines = engine.signal<string[]>(
  UserEdit, [...INITIAL_LINES],
  (prev, op) => {
    const next = [...prev]
    if (op.type === 'insert') {
      if (op.line >= next.length) {
        next.push(op.text)
      } else {
        const line = next[op.line] || ''
        next[op.line] = line.slice(0, op.col) + op.text + line.slice(op.col)
      }
    } else if (op.type === 'delete') {
      if (op.line < next.length) {
        const line = next[op.line] || ''
        next[op.line] = line.slice(0, Math.max(0, op.col - 1)) + line.slice(op.col)
      }
    }
    return next
  },
)

export const cursors = engine.signal<Record<string, CursorPosition>>(
  CursorMoved, {},
  (prev, cursor) => ({ ...prev, [cursor.userId]: cursor }),
)

export const activeUsers = engine.signal<User[]>(
  UserJoined, [...USERS],
  (prev, user) => [...prev, user],
)
engine.signalUpdate(activeUsers, UserLeft, (prev, id) =>
  prev.filter((u) => u.id !== id),
)

export const editHistory = engine.signal<EditOp[]>(
  UserEdit, [], (prev, op) => [...prev, op].slice(-100),
)

export const undoStack = engine.signal<EditOp[]>(
  UserEdit, [], (prev, op) => [...prev, op].slice(-50),
)

// ---------------------------------------------------------------------------
// Springs — smooth cursor movement for remote users
// ---------------------------------------------------------------------------

export const cursorSprings: Record<string, { x: SpringValue; y: SpringValue }> = {}

for (const user of USERS) {
  if (user.id === 'user-1') continue // Local user doesn't need spring

  const targetX = engine.signal<number>(CursorMoved, 0,
    (prev, c) => c.userId === user.id ? c.col * 8.4 : prev,
  )
  const targetY = engine.signal<number>(CursorMoved, 0,
    (prev, c) => c.userId === user.id ? c.line * 22 : prev,
  )

  cursorSprings[user.id] = {
    x: engine.spring(targetX, { stiffness: 200, damping: 22, restThreshold: 0.5 }),
    y: engine.spring(targetY, { stiffness: 200, damping: 22, restThreshold: 0.5 }),
  }
}

// ---------------------------------------------------------------------------
// Simulated remote users
// ---------------------------------------------------------------------------

let simInterval: ReturnType<typeof setInterval> | null = null

const SIM_EDITS: { user: string; line: number; col: number; text: string }[] = [
  { user: 'user-2', line: 3, col: 35, text: ' // Alice was here' },
  { user: 'user-3', line: 7, col: 40, text: ' // Bob says hi' },
  { user: 'user-2', line: 10, col: 0, text: '// Modified by Alice\n' },
  { user: 'user-3', line: 13, col: 2, text: '  // Reviewed by Bob' },
]

let simIndex = 0

export function startSimulation() {
  if (simInterval) return
  // Move cursors periodically
  simInterval = setInterval(() => {
    for (const user of USERS) {
      if (user.id === 'user-1') continue
      const line = Math.floor(Math.random() * Math.min(16, lines.value.length))
      const col = Math.floor(Math.random() * 30)
      engine.emit(CursorMoved, {
        userId: user.id, line, col, color: user.color, name: user.name,
      })
    }

    // Occasionally emit an edit
    if (Math.random() > 0.6 && simIndex < SIM_EDITS.length) {
      const edit = SIM_EDITS[simIndex++]
      const user = USERS.find((u) => u.id === edit.user)!
      engine.emit(UserEdit, {
        userId: edit.user,
        line: edit.line,
        col: edit.col,
        text: edit.text,
        type: 'insert',
        timestamp: Date.now(),
      })
      engine.emit(CursorMoved, {
        userId: edit.user,
        line: edit.line,
        col: edit.col + edit.text.length,
        color: user.color,
        name: user.name,
      })
    }
  }, 2000)
}

export function stopSimulation() {
  if (simInterval) {
    clearInterval(simInterval)
    simInterval = null
  }
}

// Start frame loop for springs
engine.startFrameLoop()
