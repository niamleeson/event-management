import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// LocalEdit ──┬──→ DocumentChanged
//             ├──→ CursorsChanged
//             └──→ EditHistoryChanged
// RemoteEdit ─┬──→ HasConflictChanged
//             ├──→ DocumentChanged
//             ├──→ CursorsChanged
//             └──→ EditHistoryChanged
// CursorMoved ──→ CursorsChanged
// ---------------------------------------------------------------------------

export interface User { id: string; name: string; color: string; avatar: string }
export interface EditPayload { pos: number; text: string; type: 'insert' | 'delete' }
export interface RemoteEditPayload extends EditPayload { user: string }
export interface CursorPayload { user: string; pos: number }
export interface EditHistoryEntry { id: string; user: string; type: 'insert' | 'delete'; text: string; pos: number; timestamp: number }

export const localUser: User = { id: 'local', name: 'You', color: '#4361ee', avatar: 'Y' }
export const botUsers: User[] = [{ id: 'bot-alice', name: 'Alice', color: '#e91e63', avatar: 'A' }, { id: 'bot-bob', name: 'Bob', color: '#ff9800', avatar: 'B' }]
export const allUsers = [localUser, ...botUsers]

export const LocalEdit = engine.event<EditPayload>('LocalEdit')
export const RemoteEdit = engine.event<RemoteEditPayload>('RemoteEdit')
export const CursorMoved = engine.event<CursorPayload>('CursorMoved')

export const DocumentChanged = engine.event<string>('DocumentChanged')
export const CursorsChanged = engine.event<Map<string, number>>('CursorsChanged')
export const ActiveUsersChanged = engine.event<User[]>('ActiveUsersChanged')
export const EditHistoryChanged = engine.event<EditHistoryEntry[]>('EditHistoryChanged')
export const HasConflictChanged = engine.event<boolean>('HasConflictChanged')

const initialText = 'Welcome to the Pulse Collaborative Editor!\n\nThis document is being edited by multiple users simultaneously.\nYou can see their cursors moving in real-time.\n\nTry typing below and watch Alice and Bob make their edits too.\n'

let doc = initialText
let cursors = new Map<string, number>([['local', initialText.length], ['bot-alice', 50], ['bot-bob', 120]])
let editHistory: EditHistoryEntry[] = []

function applyEdit(text: string, payload: EditPayload): string {
  if (payload.type === 'insert') return text.slice(0, payload.pos) + payload.text + text.slice(payload.pos)
  const dl = payload.text.length; return text.slice(0, Math.max(0, payload.pos - dl)) + text.slice(payload.pos)
}

function buildHistoryEntry(user: string, type: 'insert' | 'delete', text: string, pos: number) {
  editHistory = [{ id: crypto.randomUUID(), user, type, text: text.length > 20 ? text.slice(0, 20) + '...' : text, pos, timestamp: Date.now() }, ...editHistory].slice(0, 50)
}

engine.on(LocalEdit, [DocumentChanged, CursorsChanged, EditHistoryChanged], (p, setDoc, setCursors, setHistory) => {
  doc = applyEdit(doc, p); setDoc(doc)
  const np = p.type === 'insert' ? p.pos + p.text.length : Math.max(0, p.pos - p.text.length)
  cursors = new Map(cursors); cursors.set('local', np); setCursors(cursors)
  buildHistoryEntry('You', p.type, p.text, p.pos)
  setHistory([...editHistory])
})

engine.on(RemoteEdit, [HasConflictChanged, DocumentChanged, CursorsChanged, EditHistoryChanged], (p, setConflict, setDoc, setCursors, setHistory) => {
  const localPos = cursors.get('local') ?? 0
  if (Math.abs(p.pos - localPos) < 5) { setConflict(true); setTimeout(() => engine.emit(HasConflictChanged, false), 1000) }
  doc = applyEdit(doc, p); setDoc(doc)
  const np = p.type === 'insert' ? p.pos + p.text.length : Math.max(0, p.pos - p.text.length)
  cursors = new Map(cursors); cursors.set(p.user, np); setCursors(cursors)
  const userName = allUsers.find(u => u.id === p.user)?.name ?? p.user
  buildHistoryEntry(userName, p.type, p.text, p.pos)
  setHistory([...editHistory])
})

engine.on(CursorMoved, [CursorsChanged], (p, setCursors) => { cursors = new Map(cursors); cursors.set(p.user, p.pos); setCursors(cursors) })

const botPhrases = ['Hello! ','Nice work. ','I agree. ','TODO: fix this. ','Updated. ','Looks good! ','Reviewing... ','Changed! ','Done. ','See above. ']

function simulateBot(botId: string) {
  setTimeout(() => {
    if (doc.length === 0) { simulateBot(botId); return }
    if (Math.random() < 0.7) {
      const pos = Math.floor(Math.random() * doc.length)
      engine.emit(RemoteEdit, { user: botId, pos, text: botPhrases[Math.floor(Math.random() * botPhrases.length)], type: 'insert' })
    } else {
      const pos = Math.min(doc.length, Math.floor(Math.random() * doc.length) + 3)
      const len = Math.min(pos, 1 + Math.floor(Math.random() * 4))
      engine.emit(RemoteEdit, { user: botId, pos, text: doc.slice(pos - len, pos), type: 'delete' })
    }
    simulateBot(botId)
  }, 2000 + Math.random() * 3000)
}

simulateBot('bot-alice')
simulateBot('bot-bob')

export function startLoop() {}
export function stopLoop() {}
