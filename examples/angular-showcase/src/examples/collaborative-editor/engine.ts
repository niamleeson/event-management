import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CursorPosition {
  user: string
  line: number
  col: number
  color: string
}

export interface EditAction {
  user: string
  line: number
  col: number
  text: string
  timestamp: number
}

export interface HistoryEntry {
  user: string
  action: string
  timestamp: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const USERS = [
  { name: 'You', color: '#4361ee' },
  { name: 'Alice', color: '#f72585' },
  { name: 'Bob', color: '#2a9d8f' },
]

const INITIAL_TEXT = [
  'import { createEngine } from "@pulse/core"',
  '',
  'const engine = createEngine()',
  '',
  '// Create events',
  'const Click = engine.event("Click")',
  'const Updated = engine.event("Updated")',
  '',
  '// Set up pipes',
  'engine.pipe(Click, Updated, (payload) => {',
  '  return payload.value * 2',
  '})',
  '',
  '// Start the engine',
  'engine.startFrameLoop()',
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const CursorMove = engine.event<CursorPosition>('CursorMove')
export const TextEdit = engine.event<EditAction>('TextEdit')
export const AddHistory = engine.event<HistoryEntry>('AddHistory')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const cursors = engine.signal<Record<string, CursorPosition>>(
  CursorMove,
  {},
  (prev, cursor) => ({ ...prev, [cursor.user]: cursor }),
)

export const docLines = engine.signal<string[]>(
  TextEdit,
  INITIAL_TEXT,
  (prev, edit) => {
    const lines = [...prev]
    if (edit.line >= 0 && edit.line < lines.length) {
      const line = lines[edit.line]
      lines[edit.line] = line.slice(0, edit.col) + edit.text + line.slice(edit.col)
    }
    return lines
  },
)

export const editHistory = engine.signal<HistoryEntry[]>(
  AddHistory,
  [],
  (prev, entry) => [entry, ...prev].slice(0, 50),
)

// Track edit -> add to history
engine.pipe(TextEdit, AddHistory, (edit: EditAction) => ({
  user: edit.user,
  action: `Typed "${edit.text}" at line ${edit.line + 1}`,
  timestamp: edit.timestamp,
}))

// ---------------------------------------------------------------------------
// Springs: cursor positions per user
// ---------------------------------------------------------------------------

const cursorXSignals: Record<string, import('@pulse/core').Signal<number>> = {}
const cursorYSignals: Record<string, import('@pulse/core').Signal<number>> = {}

export const cursorSprings: Record<string, { x: import('@pulse/core').SpringValue; y: import('@pulse/core').SpringValue }> = {}

for (const user of USERS) {
  const xSig = engine.signal<number>(CursorMove, 0, (prev, pos) => pos.user === user.name ? pos.col * 8.4 : prev)
  const ySig = engine.signal<number>(CursorMove, 0, (prev, pos) => pos.user === user.name ? pos.line * 24 : prev)
  cursorXSignals[user.name] = xSig
  cursorYSignals[user.name] = ySig

  cursorSprings[user.name] = {
    x: engine.spring(xSig, { stiffness: 250, damping: 22, restThreshold: 0.1 }),
    y: engine.spring(ySig, { stiffness: 250, damping: 22, restThreshold: 0.1 }),
  }
}

// ---------------------------------------------------------------------------
// Bot simulation
// ---------------------------------------------------------------------------

let botInterval: ReturnType<typeof setInterval> | null = null

const BOT_EDITS = [
  { text: ' ', lineOffset: 0 },
  { text: '//', lineOffset: 1 },
  { text: ' ', lineOffset: -1 },
  { text: 'x', lineOffset: 0 },
  { text: '!', lineOffset: 2 },
]

export function startBots() {
  if (botInterval) return
  botInterval = setInterval(() => {
    for (const user of USERS.slice(1)) {
      // Random cursor move
      const line = Math.floor(Math.random() * INITIAL_TEXT.length)
      const col = Math.floor(Math.random() * 30)
      engine.emit(CursorMove, { user: user.name, line, col, color: user.color })

      // Occasional edit
      if (Math.random() < 0.3) {
        const edit = BOT_EDITS[Math.floor(Math.random() * BOT_EDITS.length)]
        engine.emit(TextEdit, {
          user: user.name,
          line: Math.max(0, Math.min(line + edit.lineOffset, INITIAL_TEXT.length - 1)),
          col,
          text: edit.text,
          timestamp: Date.now(),
        })
      }
    }
  }, 2000)
}

export function stopBots() {
  if (botInterval) {
    clearInterval(botInterval)
    botInterval = null
  }
}

// Start frame loop
engine.startFrameLoop()
