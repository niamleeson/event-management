import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Todo {
  id: string
  text: string
  completed: boolean
}

export type Filter = 'all' | 'active' | 'completed'

export interface ValidationResult {
  valid: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const TodoAdded = engine.event<Todo>('TodoAdded')
export const TodoRemoved = engine.event<string>('TodoRemoved')
export const TodoToggled = engine.event<string>('TodoToggled')
export const TodoTextChanged = engine.event<string>('TodoTextChanged')
export const ValidationResultEvent = engine.event<ValidationResult>('ValidationResult')
export const FilterChanged = engine.event<Filter>('FilterChanged')

// ---------------------------------------------------------------------------
// Pipes
// ---------------------------------------------------------------------------

// Validate text input: non-empty and minimum length of 3
engine.pipe(TodoTextChanged, ValidationResultEvent, (text: string): ValidationResult => {
  if (text.trim().length === 0) {
    return { valid: false, error: null } // empty is not an error, just not valid
  }
  if (text.trim().length < 3) {
    return { valid: false, error: 'Todo must be at least 3 characters' }
  }
  return { valid: true, error: null }
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

// The todo list, reduced from add/remove/toggle events
export const todoList = engine.signal<Todo[]>(TodoAdded, [], (prev, todo) => [
  ...prev,
  todo,
])

// Also update todoList on remove
engine.signalUpdate(todoList, TodoRemoved, (prev, id) =>
  prev.filter((t) => t.id !== id),
)

// Also update todoList on toggle
engine.signalUpdate(todoList, TodoToggled, (prev, id) =>
  prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
)

// Active filter
export const activeFilter = engine.signal<Filter>(
  FilterChanged,
  'all',
  (_prev, filter) => filter,
)

// Current input text
export const currentText = engine.signal<string>(
  TodoTextChanged,
  '',
  (_prev, text) => text,
)

// Validation state
export const validationError = engine.signal<ValidationResult>(
  ValidationResultEvent,
  { valid: false, error: null },
  (_prev, result) => result,
)

// Computed signals: derived from todoList and activeFilter
export const remainingCount = engine.computed([todoList, activeFilter], (todos: Todo[], _filter: Filter) => {
  return todos.filter(t => !t.completed).length
})

export const filteredTodos = engine.computed([todoList, activeFilter], (todos: Todo[], filter: Filter) => {
  if (filter === 'active') return todos.filter(t => !t.completed)
  if (filter === 'completed') return todos.filter(t => t.completed)
  return todos
})
