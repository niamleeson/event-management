import { createEngine } from '@pulse/core'

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
export const EditorChanged = engine.event<void>('EditorChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _lines: string[] = [...INITIAL_LINES]
let _cursors: Record<string, CursorPosition> = {}
let _activeUsers: User[] = [...USERS]
let _editHistory: EditOp[] = []

// Spring-like cursor positions for remote users
const _cursorSpringX: Record<string, number> = {}
const _cursorSpringY: Record<string, number> = {}
const _cursorTargetX: Record<string, number> = {}
const _cursorTargetY: Record<string, number> = {}

export function getLines(): string[] { return _lines }
export function getCursors(): Record<string, CursorPosition> { return _cursors }
export function getActiveUsers(): User[] { return _activeUsers }
export function getEditHistory(): EditOp[] { return _editHistory }
export function getCursorSpringX(userId: string): number { return _cursorSpringX[userId] ?? 0 }
export function getCursorSpringY(userId: string): number { return _cursorSpringY[userId] ?? 0 }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(UserEdit, (op: EditOp) => {
  const next = [..._lines]
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
  _lines = next
  _editHistory = [..._editHistory, op].slice(-100)
  engine.emit(EditorChanged, undefined)
})

engine.on(CursorMoved, (cursor: CursorPosition) => {
  _cursors = { ..._cursors, [cursor.userId]: cursor }
  if (cursor.userId !== 'user-1') {
    _cursorTargetX[cursor.userId] = cursor.col * 8.4
    _cursorTargetY[cursor.userId] = cursor.line * 22
  }
  engine.emit(EditorChanged, undefined)
})

engine.on(UserJoined, (user: User) => {
  _activeUsers = [..._activeUsers, user]
  engine.emit(EditorChanged, undefined)
})

engine.on(UserLeft, (id: string) => {
  _activeUsers = _activeUsers.filter((u) => u.id !== id)
  engine.emit(EditorChanged, undefined)
})

// ---------------------------------------------------------------------------
// Frame update (spring cursor animation)
// ---------------------------------------------------------------------------

export function updateFrame(): void {
  for (const user of USERS) {
    if (user.id === 'user-1') continue
    const tx = _cursorTargetX[user.id] ?? 0
    const ty = _cursorTargetY[user.id] ?? 0
    const cx = _cursorSpringX[user.id] ?? 0
    const cy = _cursorSpringY[user.id] ?? 0

    _cursorSpringX[user.id] = cx + (tx - cx) * 0.15
    _cursorSpringY[user.id] = cy + (ty - cy) * 0.15
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
  simInterval = setInterval(() => {
    for (const user of USERS) {
      if (user.id === 'user-1') continue
      const line = Math.floor(Math.random() * Math.min(16, _lines.length))
      const col = Math.floor(Math.random() * 30)
      engine.emit(CursorMoved, {
        userId: user.id, line, col, color: user.color, name: user.name,
      })
    }

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
