import { createEngine } from '@pulse/core'
import type { Engine, EventType, Signal } from '@pulse/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Todo {
  id: number
  text: string
  done: boolean
}

export type Filter = 'all' | 'active' | 'completed'

export interface ValidationResult {
  valid: boolean
  message: string
}

// ---------------------------------------------------------------------------
// Engine + Events
// ---------------------------------------------------------------------------

export const engine: Engine = createEngine()

export const TodoTextChanged: EventType<string> = engine.event<string>('TodoTextChanged')
export const ValidationResultEvent: EventType<ValidationResult> = engine.event<ValidationResult>('ValidationResult')
export const TodoAdded: EventType<Todo> = engine.event<Todo>('TodoAdded')
export const TodoRemoved: EventType<number> = engine.event<number>('TodoRemoved')
export const TodoToggled: EventType<number> = engine.event<number>('TodoToggled')
export const FilterChanged: EventType<Filter> = engine.event<Filter>('FilterChanged')

// ---------------------------------------------------------------------------
// Validation pipe: TodoTextChanged -> ValidationResult
// ---------------------------------------------------------------------------

engine.pipe(TodoTextChanged, ValidationResultEvent, (text: string): ValidationResult => {
  if (text.trim().length === 0) {
    return { valid: false, message: 'Todo text cannot be empty' }
  }
  if (text.trim().length < 3) {
    return { valid: false, message: 'Todo text must be at least 3 characters' }
  }
  if (text.trim().length > 100) {
    return { valid: false, message: 'Todo text must be 100 characters or less' }
  }
  return { valid: true, message: '' }
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

let nextId = 1

export const todosSig: Signal<Todo[]> = engine.signal<Todo[]>(TodoAdded, [], (prev, added) => {
  return [...prev, added]
})

// Also update on remove
engine.signalUpdate(todosSig, TodoRemoved, (prev, id) => {
  return prev.filter((t) => t.id !== id)
})

// Also update on toggle
engine.signalUpdate(todosSig, TodoToggled, (prev, id) => {
  return prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
})

export const filterSig: Signal<Filter> = engine.signal<Filter>(FilterChanged, 'all', (_prev, f) => f)

export const validationSig: Signal<ValidationResult> = engine.signal<ValidationResult>(
  ValidationResultEvent,
  { valid: true, message: '' },
  (_prev, v) => v,
)

export const inputTextSig: Signal<string> = engine.signal<string>(
  TodoTextChanged,
  '',
  (_prev, text) => text,
)

/** Helper to generate unique IDs for new todos */
export function getNextId(): number {
  return nextId++
}
