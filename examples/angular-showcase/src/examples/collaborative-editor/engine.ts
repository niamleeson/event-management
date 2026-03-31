import { createEngine } from '@pulse/core'

export const engine = createEngine()

export interface CursorPosition { user: string; line: number; col: number; color: string }
export interface EditAction { user: string; line: number; col: number; text: string; timestamp: number }
export interface HistoryEntry { user: string; action: string; timestamp: number }

export const USERS = [
  { name: 'You', color: '#4361ee' },
  { name: 'Alice', color: '#f72585' },
  { name: 'Bob', color: '#2a9d8f' },
]

const INITIAL_TEXT = [
  'import { createEngine } from "@pulse/core"', '', 'const engine = createEngine()', '',
  '// Create events', 'const Click = engine.event("Click")', 'const Updated = engine.event("Updated")', '',
  '// Set up handlers', 'engine.on(Click, (payload) => {', '  engine.emit(Updated, payload.value * 2)', '})', '',
  '// Start', 'engine.emit(Click, { value: 21 })',
]

export const CursorMove = engine.event<CursorPosition>('CursorMove')
export const TextEdit = engine.event<EditAction>('TextEdit')
export const CursorsChanged = engine.event<Record<string, CursorPosition>>('CursorsChanged')
export const DocLinesChanged = engine.event<string[]>('DocLinesChanged')
export const EditHistoryChanged = engine.event<HistoryEntry[]>('EditHistoryChanged')
export const CursorXChanged = engine.event<{ user: string; value: number }>('CursorXChanged')
export const CursorYChanged = engine.event<{ user: string; value: number }>('CursorYChanged')

let cursors: Record<string, CursorPosition> = {}
let docLines = [...INITIAL_TEXT]
let editHistory: HistoryEntry[] = []

engine.on(CursorMove, (cursor) => {
  cursors = { ...cursors, [cursor.user]: cursor }
  engine.emit(CursorsChanged, cursors)
  // Spring-like smooth cursor (simplified: just emit target position)
  engine.emit(CursorXChanged, { user: cursor.user, value: cursor.col * 8.4 })
  engine.emit(CursorYChanged, { user: cursor.user, value: cursor.line * 24 })
})

engine.on(TextEdit, (edit) => {
  const lines = [...docLines]
  if (edit.line >= 0 && edit.line < lines.length) {
    const line = lines[edit.line]
    lines[edit.line] = line.slice(0, edit.col) + edit.text + line.slice(edit.col)
  }
  docLines = lines
  engine.emit(DocLinesChanged, docLines)
  const entry: HistoryEntry = { user: edit.user, action: `Typed "${edit.text}" at line ${edit.line + 1}`, timestamp: edit.timestamp }
  editHistory = [entry, ...editHistory].slice(0, 50)
  engine.emit(EditHistoryChanged, editHistory)
})

const BOT_EDITS = [{ text: ' ', lineOffset: 0 }, { text: '//', lineOffset: 1 }, { text: ' ', lineOffset: -1 }, { text: 'x', lineOffset: 0 }, { text: '!', lineOffset: 2 }]
let botInterval: ReturnType<typeof setInterval> | null = null

export function startBots() {
  if (botInterval) return
  botInterval = setInterval(() => {
    for (const user of USERS.slice(1)) {
      const line = Math.floor(Math.random() * INITIAL_TEXT.length), col = Math.floor(Math.random() * 30)
      engine.emit(CursorMove, { user: user.name, line, col, color: user.color })
      if (Math.random() < 0.3) {
        const edit = BOT_EDITS[Math.floor(Math.random() * BOT_EDITS.length)]
        engine.emit(TextEdit, { user: user.name, line: Math.max(0, Math.min(line + edit.lineOffset, INITIAL_TEXT.length - 1)), col, text: edit.text, timestamp: Date.now() })
      }
    }
  }, 2000)
}
export function stopBots() { if (botInterval) { clearInterval(botInterval); botInterval = null } }
