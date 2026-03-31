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
engine.on(TodoTextChanged, (text: string) => {
  currentText = text
  engine.emit(CurrentTextChanged, text)

  let result: ValidationResult
  if (text.trim().length === 0) {
    result = { valid: false, error: null }
  } else if (text.trim().length < 3) {
    result = { valid: false, error: 'Todo must be at least 3 characters' }
  } else {
    result = { valid: true, error: null }
  }
  validation = result
  engine.emit(ValidationResultEvent, result)
  engine.emit(ValidationChanged, result)
})

engine.on(TodoAdded, (todo: Todo) => {
  todos = [...todos, todo]
  engine.emit(TodoListChanged, todos)
})

engine.on(TodoRemoved, (id: string) => {
  todos = todos.filter((t) => t.id !== id)
  engine.emit(TodoListChanged, todos)
})

engine.on(TodoToggled, (id: string) => {
  todos = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
  engine.emit(TodoListChanged, todos)
})

engine.on(FilterChanged, (filter: Filter) => {
  activeFilter = filter
  engine.emit(ActiveFilterChanged, filter)
})

// ---------------------------------------------------------------------------
// Getters for initial values
// ---------------------------------------------------------------------------

export function getTodos() { return todos }
export function getActiveFilter() { return activeFilter }
export function getCurrentText() { return currentText }
export function getValidation() { return validation }
