import { createEngine, type Signal, createSignal } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: string
  name: string
  color: string
  avatar: string
}

export interface EditPayload {
  pos: number
  text: string
  type: 'insert' | 'delete'
}

export interface RemoteEditPayload extends EditPayload {
  user: string
}

export interface CursorPayload {
  user: string
  pos: number
}

export interface EditHistoryEntry {
  id: string
  user: string
  type: 'insert' | 'delete'
  text: string
  pos: number
  timestamp: number
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const localUser: User = {
  id: 'local',
  name: 'You',
  color: '#4361ee',
  avatar: 'Y',
}

export const botUsers: User[] = [
  { id: 'bot-alice', name: 'Alice', color: '#e91e63', avatar: 'A' },
  { id: 'bot-bob', name: 'Bob', color: '#ff9800', avatar: 'B' },
]

export const allUsers = [localUser, ...botUsers]

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const LocalEdit = engine.event<EditPayload>('LocalEdit')
export const RemoteEdit = engine.event<RemoteEditPayload>('RemoteEdit')
export const CursorMoved = engine.event<CursorPayload>('CursorMoved')
export const UserJoined = engine.event<User>('UserJoined')
export const UserLeft = engine.event<string>('UserLeft')
export const ConflictDetected = engine.event<void>('ConflictDetected')
export const ConflictResolved = engine.event<void>('ConflictResolved')
export const DocumentChanged = engine.event<string>('DocumentChanged')
export const HistoryAdded = engine.event<EditHistoryEntry>('HistoryAdded')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

const initialText =
  'Welcome to the Pulse Collaborative Editor!\n\n' +
  'This document is being edited by multiple users simultaneously.\n' +
  'You can see their cursors moving in real-time.\n\n' +
  'Try typing below and watch Alice and Bob make their edits too.\n'

export const document: Signal<string> = engine.signal<string>(
  DocumentChanged,
  initialText,
  (_prev, text) => text,
)

export const cursors: Signal<Map<string, number>> = engine.signal<Map<string, number>>(
  CursorMoved,
  new Map([
    ['local', initialText.length],
    ['bot-alice', 50],
    ['bot-bob', 120],
  ]),
  (prev, payload) => {
    const next = new Map(prev)
    next.set(payload.user, payload.pos)
    return next
  },
)

export const activeUsers: Signal<User[]> = engine.signal<User[]>(
  UserJoined,
  allUsers,
  (prev, user) => prev.find(u => u.id === user.id) ? prev : [...prev, user],
)

engine.signalUpdate(activeUsers, UserLeft, (prev, id) =>
  prev.filter(u => u.id !== id),
)

export const editHistory: Signal<EditHistoryEntry[]> = engine.signal<EditHistoryEntry[]>(
  HistoryAdded,
  [],
  (prev, entry) => [entry, ...prev].slice(0, 50),
)

export const hasConflict: Signal<boolean> = engine.signal<boolean>(
  ConflictDetected,
  false,
  () => true,
)

engine.signalUpdate(hasConflict, ConflictResolved, () => false)

// Signal for spring-driven cursor position (one per user)
export const cursorSpringTargets: Map<string, Signal<number>> = new Map()
for (const user of allUsers) {
  const initial = user.id === 'local' ? initialText.length : user.id === 'bot-alice' ? 50 : 120
  const sig = createSignal<number>(initial)
  cursorSpringTargets.set(user.id, sig)
}

// ---------------------------------------------------------------------------
// Pipes: LocalEdit -> DocumentChanged
// ---------------------------------------------------------------------------

engine.on(LocalEdit, (payload) => {
  const doc = document.value
  let newDoc: string
  if (payload.type === 'insert') {
    newDoc = doc.slice(0, payload.pos) + payload.text + doc.slice(payload.pos)
  } else {
    const deleteLen = payload.text.length
    newDoc = doc.slice(0, Math.max(0, payload.pos - deleteLen)) + doc.slice(payload.pos)
  }
  engine.emit(DocumentChanged, newDoc)

  // Update local cursor
  const newPos = payload.type === 'insert'
    ? payload.pos + payload.text.length
    : Math.max(0, payload.pos - payload.text.length)
  engine.emit(CursorMoved, { user: 'local', pos: newPos })

  // Update spring target
  const target = cursorSpringTargets.get('local')
  if (target) target._set(newPos)

  // Add to history
  engine.emit(HistoryAdded, {
    id: crypto.randomUUID(),
    user: 'You',
    type: payload.type,
    text: payload.text.length > 20 ? payload.text.slice(0, 20) + '...' : payload.text,
    pos: payload.pos,
    timestamp: Date.now(),
  })
})

// Remote edits
engine.on(RemoteEdit, (payload) => {
  const doc = document.value
  let newDoc: string

  // Check for conflict (remote edit near local cursor)
  const localCursorPos = cursors.value.get('local') ?? 0
  if (Math.abs(payload.pos - localCursorPos) < 5) {
    engine.emit(ConflictDetected, undefined)
    setTimeout(() => engine.emit(ConflictResolved, undefined), 1000)
  }

  if (payload.type === 'insert') {
    newDoc = doc.slice(0, payload.pos) + payload.text + doc.slice(payload.pos)
  } else {
    const deleteLen = payload.text.length
    newDoc = doc.slice(0, Math.max(0, payload.pos - deleteLen)) + doc.slice(payload.pos)
  }
  engine.emit(DocumentChanged, newDoc)

  // Update remote cursor
  const newPos = payload.type === 'insert'
    ? payload.pos + payload.text.length
    : Math.max(0, payload.pos - payload.text.length)
  engine.emit(CursorMoved, { user: payload.user, pos: newPos })

  const target = cursorSpringTargets.get(payload.user)
  if (target) target._set(newPos)

  // History
  const userName = allUsers.find(u => u.id === payload.user)?.name ?? payload.user
  engine.emit(HistoryAdded, {
    id: crypto.randomUUID(),
    user: userName,
    type: payload.type,
    text: payload.text.length > 20 ? payload.text.slice(0, 20) + '...' : payload.text,
    pos: payload.pos,
    timestamp: Date.now(),
  })
})

// ---------------------------------------------------------------------------
// Bot simulation: random edits every 2-5 seconds
// ---------------------------------------------------------------------------

const botPhrases = [
  'Hello! ',
  'Nice work. ',
  'I agree. ',
  'TODO: fix this. ',
  'Updated. ',
  'Looks good! ',
  'Reviewing... ',
  'Changed! ',
  'Done. ',
  'See above. ',
]

function simulateBot(botId: string) {
  const interval = 2000 + Math.random() * 3000

  setTimeout(() => {
    const doc = document.value
    if (doc.length === 0) {
      simulateBot(botId)
      return
    }

    const action = Math.random()
    if (action < 0.7) {
      // Insert
      const pos = Math.floor(Math.random() * doc.length)
      const text = botPhrases[Math.floor(Math.random() * botPhrases.length)]
      engine.emit(RemoteEdit, { user: botId, pos, text, type: 'insert' })
    } else {
      // Delete (1-5 chars)
      const pos = Math.min(doc.length, Math.floor(Math.random() * doc.length) + 3)
      const len = Math.min(pos, 1 + Math.floor(Math.random() * 4))
      const text = doc.slice(pos - len, pos)
      engine.emit(RemoteEdit, { user: botId, pos, text, type: 'delete' })
    }

    simulateBot(botId)
  }, interval)
}

// Start bots
simulateBot('bot-alice')
simulateBot('bot-bob')

// Start frame loop for springs
engine.startFrameLoop()
