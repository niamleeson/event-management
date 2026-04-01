// DAG
// UserTyped ──→ DocumentChanged
//           └──→ EditRecorded
// UserDeleted ──→ DocumentChanged
//             └──→ EditRecorded
// CursorMoved ──→ CursorsChanged
//             └──→ CursorXChanged
// EditRecorded ──→ EditHistoryChanged
// BotTick ──→ UserTyped
//         └──→ CursorMoved

import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface Edit {
  id: number
  user: string
  position: number
  text: string
  type: 'insert' | 'delete'
  timestamp: number
}

export interface CursorPos {
  user: string
  position: number
  color: string
}

/* ------------------------------------------------------------------ */
/*  Users                                                             */
/* ------------------------------------------------------------------ */

export const USERS = [
  { name: 'You', color: '#4361ee' },
  { name: 'Alice', color: '#00b894' },
  { name: 'Bob', color: '#e17055' },
]

const BOT_WORDS = [
  'Hello ', 'world ', 'this ', 'is ', 'a ', 'collaborative ', 'editor ',
  'demo ', 'with ', 'real-time ', 'cursors ', 'and ', 'text ',
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const UserTyped = engine.event<{ user: string; text: string; position: number }>('UserTyped')
export const UserDeleted = engine.event<{ user: string; position: number; count: number }>('UserDeleted')
export const CursorMoved = engine.event<CursorPos>('CursorMoved')
export const EditRecorded = engine.event<Edit>('EditRecorded')
export const BotTick = engine.event('BotTick')

/* ------------------------------------------------------------------ */
/*  State-changed events                                              */
/* ------------------------------------------------------------------ */

export const DocumentChanged = engine.event<string>('DocumentChanged')
export const CursorsChanged = engine.event<Map<string, CursorPos>>('CursorsChanged')
export const EditHistoryChanged = engine.event<Edit[]>('EditHistoryChanged')
export const CursorXChanged = engine.event<Record<string, number>>('CursorXChanged')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let editId = 0
let document = ''
let cursors = new Map<string, CursorPos>()
let editHistory: Edit[] = []
let cursorXPositions: Record<string, number> = {}

// Document state
engine.on(UserTyped, [DocumentChanged], ({ text, position }, setDoc) => {
  document = document.slice(0, position) + text + document.slice(position)
  setDoc(document)
})
engine.on(UserDeleted, [DocumentChanged], ({ position, count }, setDoc) => {
  document = document.slice(0, Math.max(0, position - count)) + document.slice(position)
  setDoc(document)
})

// Cursors state
engine.on(CursorMoved, [CursorsChanged, CursorXChanged], (pos, setCursors, setCursorX) => {
  const next = new Map(cursors)
  next.set(pos.user, pos)
  cursors = next
  setCursors(cursors)

  // Update cursor X positions (used for visual indicators)
  cursorXPositions = { ...cursorXPositions, [pos.user]: pos.position * 8 }
  setCursorX(cursorXPositions)
})

// Edit history state
engine.on(EditRecorded, [EditHistoryChanged], (edit, setHistory) => {
  editHistory = [...editHistory.slice(-49), edit]
  setHistory(editHistory)
})

/* ------------------------------------------------------------------ */
/*  Record edits                                                      */
/* ------------------------------------------------------------------ */

engine.on(UserTyped, [EditRecorded], ({ user, text, position }, setEdit) => {
  setEdit({
    id: editId++,
    user,
    position,
    text,
    type: 'insert' as const,
    timestamp: Date.now(),
  })
})

engine.on(UserDeleted, [EditRecorded], ({ user, position, count }, setEdit) => {
  setEdit({
    id: editId++,
    user,
    position,
    text: `[deleted ${count}]`,
    type: 'delete' as const,
    timestamp: Date.now(),
  })
})

/* ------------------------------------------------------------------ */
/*  Bot auto-typing                                                   */
/* ------------------------------------------------------------------ */

const botPositions: Record<string, number> = { Alice: 0, Bob: 0 }

engine.on(BotTick, [UserTyped, CursorMoved], (_payload, setTyped, setCursor) => {
  const bots = ['Alice', 'Bob']
  const bot = bots[Math.floor(Math.random() * bots.length)]
  const word = BOT_WORDS[Math.floor(Math.random() * BOT_WORDS.length)]
  const pos = Math.min(botPositions[bot], document.length)

  setTyped({ user: bot, text: word, position: pos })
  botPositions[bot] = pos + word.length

  const userObj = USERS.find(u => u.name === bot)!
  setCursor({ user: bot, position: botPositions[bot], color: userObj.color })
})

// Bot types every 2-4 seconds
setInterval(() => {
  engine.emit(BotTick, undefined)
}, 2000 + Math.random() * 2000)

/* ------------------------------------------------------------------ */
/*  Initial values                                                    */
/* ------------------------------------------------------------------ */

export function getDocument() { return document }
export function getCursors() { return cursors }
export function getEditHistory() { return editHistory }
export function getCursorXPositions() { return cursorXPositions }

export function startLoop() {}
export function stopLoop() {}
