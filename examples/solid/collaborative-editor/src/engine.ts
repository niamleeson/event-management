import { createEngine } from '@pulse/core'

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

// State change events
export const ActiveUsersChanged = engine.event<User[]>('ActiveUsersChanged')
export const EditHistoryChanged = engine.event<EditHistoryEntry[]>('EditHistoryChanged')
export const HasConflictChanged = engine.event<boolean>('HasConflictChanged')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

const initialText =
  'Welcome to the Pulse Collaborative Editor!\n\n' +
  'This document is being edited by multiple users simultaneously.\n' +
  'You can see their cursors moving in real-time.\n\n' +
  'Try typing below and watch Alice and Bob make their edits too.\n'


