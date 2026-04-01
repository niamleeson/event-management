// DAG
// TodoTextChanged ──→ CurrentTextChanged
//                 └──→ ValidationResultEvent
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
export const ValidationResultEvent = engine.event<ValidationResult>('ValidationResult')
export const FilterChanged = engine.event<Filter>('FilterChanged')
export const TodosChanged = engine.event<Todo[]>('TodosChanged')
export const CurrentTextChanged = engine.event<string>('CurrentTextChanged')
export const ActiveFilterChanged = engine.event<Filter>('ActiveFilterChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let todos: Todo[] = []
let activeFilter: Filter = 'all'
let currentText = ''

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

engine.on(TodoTextChanged, [CurrentTextChanged, ValidationResultEvent], (text: string, setCurrent, setValidation) => {
  currentText = text
  setCurrent(text)
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
  activeFilter = filter
  setActive(filter)
})

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getTodos() { return todos }
export function getActiveFilter() { return activeFilter }
export function getCurrentText() { return currentText }

export function startLoop() {}
export function stopLoop() {}
