// DAG
// TodoTextChanged ──→ InputTextChanged
//                 └──→ ValidationChanged
// TodoAdded ──→ TodosChanged
// TodoRemoved ──→ TodosChanged
// TodoToggled ──→ TodosChanged
// FilterChanged ──→ ActiveFilterChanged

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
engine.on(TodoTextChanged, [InputTextChanged, ValidationChanged], (text: string, setInput, setValidation) => {
  setInput(text)
  if (text.trim().length === 0) {
    setValidation({ valid: false, error: null })
  } else if (text.trim().length < 3) {
    setValidation({ valid: false, error: 'Todo must be at least 3 characters' })
  } else {
    setValidation({ valid: true, error: null })
  }
})

engine.on(TodoAdded, [TodosChanged], (todo: Todo, setTodos) => {
  todos = [...todos, todo]
  setTodos(todos)
})

engine.on(TodoRemoved, [TodosChanged], (id: string, setTodos) => {
  todos = todos.filter((t) => t.id !== id)
  setTodos(todos)
})

engine.on(TodoToggled, [TodosChanged], (id: string, setTodos) => {
  todos = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
  setTodos(todos)
})

engine.on(FilterChanged, [ActiveFilterChanged], (filter: Filter, setActive) => {
  setActive(filter)
})

export function startLoop() {}
export function stopLoop() {}
