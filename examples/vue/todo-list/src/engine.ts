// DAG
// TodoTextChanged ──→ CurrentTextChanged
//                 └──→ ValidationResultEvent
//                 └──→ ValidationChanged
// TodoAdded ──→ TodoListChanged
// TodoRemoved ──→ TodoListChanged
// TodoToggled ──→ TodoListChanged
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
export const TodoListChanged = engine.event<Todo[]>('TodoListChanged')
export const ActiveFilterChanged = engine.event<Filter>('ActiveFilterChanged')
export const CurrentTextChanged = engine.event<string>('CurrentTextChanged')
export const ValidationChanged = engine.event<ValidationResult>('ValidationChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let todos: Todo[] = []
let activeFilter: Filter = 'all'
let currentText = ''
let validation: ValidationResult = { valid: false, error: null }

// ---------------------------------------------------------------------------
// Rules: on/emit only
// ---------------------------------------------------------------------------

// Validate text input: non-empty and minimum length of 3
engine.on(TodoTextChanged, [CurrentTextChanged, ValidationResultEvent, ValidationChanged], (text: string, setCurrent, setResult, setValidation) => {
  currentText = text
  setCurrent(text)

  let result: ValidationResult
  if (text.trim().length === 0) {
    result = { valid: false, error: null }
  } else if (text.trim().length < 3) {
    result = { valid: false, error: 'Todo must be at least 3 characters' }
  } else {
    result = { valid: true, error: null }
  }
  validation = result
  setResult(result)
  setValidation(result)
})

engine.on(TodoAdded, [TodoListChanged], (todo: Todo, setList) => {
  todos = [...todos, todo]
  setList(todos)
})

engine.on(TodoRemoved, [TodoListChanged], (id: string, setList) => {
  todos = todos.filter((t) => t.id !== id)
  setList(todos)
})

engine.on(TodoToggled, [TodoListChanged], (id: string, setList) => {
  todos = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
  setList(todos)
})

engine.on(FilterChanged, [ActiveFilterChanged], (filter: Filter, setActive) => {
  activeFilter = filter
  setActive(filter)
})

// ---------------------------------------------------------------------------
// Getters for initial values
// ---------------------------------------------------------------------------

export function getTodos() { return todos }
export function getActiveFilter() { return activeFilter }
export function getCurrentText() { return currentText }
export function getValidation() { return validation }

export function startLoop() {}
export function stopLoop() {}
