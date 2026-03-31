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
export const FilterChanged = engine.event<Filter>('FilterChanged')

// Derived state events
export const TodosChanged = engine.event<Todo[]>('TodosChanged')
export const ValidationChanged = engine.event<ValidationResult>('ValidationChanged')
export const InputTextChanged = engine.event<string>('InputTextChanged')
export const ActiveFilterChanged = engine.event<Filter>('ActiveFilterChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let todos: Todo[] = []

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

// Validate text input
engine.on(TodoTextChanged, (text: string) => {
  engine.emit(InputTextChanged, text)
  if (text.trim().length === 0) {
    engine.emit(ValidationChanged, { valid: false, error: null })
  } else if (text.trim().length < 3) {
    engine.emit(ValidationChanged, { valid: false, error: 'Todo must be at least 3 characters' })
  } else {
    engine.emit(ValidationChanged, { valid: true, error: null })
  }
})

engine.on(TodoAdded, (todo: Todo) => {
  todos = [...todos, todo]
  engine.emit(TodosChanged, todos)
})

engine.on(TodoRemoved, (id: string) => {
  todos = todos.filter((t) => t.id !== id)
  engine.emit(TodosChanged, todos)
})

engine.on(TodoToggled, (id: string) => {
  todos = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
  engine.emit(TodosChanged, todos)
})

engine.on(FilterChanged, (filter: Filter) => {
  engine.emit(ActiveFilterChanged, filter)
})
