import { createEngine } from '@pulse/core'
import type { Signal, SpringValue } from '@pulse/core'

export const engine = createEngine()
engine.startFrameLoop()

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
/*  Signals                                                           */
/* ------------------------------------------------------------------ */

let editId = 0

export const document: Signal<string> = engine.signal(UserTyped, '', (prev, { text, position }) => {
  return prev.slice(0, position) + text + prev.slice(position)
})
engine.signalUpdate(document, UserDeleted, (prev, { position, count }) => {
  return prev.slice(0, Math.max(0, position - count)) + prev.slice(position)
})

export const cursors: Signal<Map<string, CursorPos>> = engine.signal(
  CursorMoved,
  new Map<string, CursorPos>(),
  (prev, pos) => {
    const next = new Map(prev)
    next.set(pos.user, pos)
    return next
  },
)

export const editHistory: Signal<Edit[]> = engine.signal(
  EditRecorded,
  [] as Edit[],
  (prev, edit) => [...prev.slice(-49), edit],
)

/* ------------------------------------------------------------------ */
/*  Pipes: record edits                                               */
/* ------------------------------------------------------------------ */

engine.pipe(UserTyped, EditRecorded, ({ user, text, position }) => ({
  id: editId++,
  user,
  position,
  text,
  type: 'insert' as const,
  timestamp: Date.now(),
}))

engine.pipe(UserDeleted, EditRecorded, ({ user, position, count }) => ({
  id: editId++,
  user,
  position,
  text: `[deleted ${count}]`,
  type: 'delete' as const,
  timestamp: Date.now(),
}))

/* ------------------------------------------------------------------ */
/*  Cursor position springs                                           */
/* ------------------------------------------------------------------ */

export const cursorXTargets: Record<string, Signal<number>> = {}
export const cursorXSprings: Record<string, SpringValue> = {}

for (const user of USERS) {
  const target = engine.signal(CursorMoved, 0 as number, (prev, pos) =>
    pos.user === user.name ? pos.position * 8 : prev
  )
  cursorXTargets[user.name] = target
  cursorXSprings[user.name] = engine.spring(target, { stiffness: 200, damping: 22 })
}

/* ------------------------------------------------------------------ */
/*  Bot auto-typing                                                   */
/* ------------------------------------------------------------------ */

const botPositions: Record<string, number> = { Alice: 0, Bob: 0 }

engine.on(BotTick, () => {
  const bots = ['Alice', 'Bob']
  const bot = bots[Math.floor(Math.random() * bots.length)]
  const word = BOT_WORDS[Math.floor(Math.random() * BOT_WORDS.length)]
  const pos = Math.min(botPositions[bot], document.value.length)

  engine.emit(UserTyped, { user: bot, text: word, position: pos })
  botPositions[bot] = pos + word.length

  const userObj = USERS.find(u => u.name === bot)!
  engine.emit(CursorMoved, { user: bot, position: botPositions[bot], color: userObj.color })
})

// Bot types every 2-4 seconds
setInterval(() => {
  engine.emit(BotTick, undefined)
}, 2000 + Math.random() * 2000)
