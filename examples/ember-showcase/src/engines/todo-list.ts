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
export const CurrentTextChanged = engine.event<string>('CurrentTextChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _todos: Todo[] = []
let _filter: Filter = 'all'
let _currentText = ''
let _validation: ValidationResult = { valid: false, error: null }

export function getTodos(): Todo[] { return _todos }
export function getFilter(): Filter { return _filter }
export function getCurrentText(): string { return _currentText }
export function getValidation(): ValidationResult { return _validation }

// ---------------------------------------------------------------------------
// Validation pipe: TodoTextChanged -> ValidationResultEvent
// ---------------------------------------------------------------------------

engine.on(TodoTextChanged, (text: string) => {
  _currentText = text
  let result: ValidationResult
  if (text.trim().length === 0) {
    result = { valid: false, error: null }
  } else if (text.trim().length < 3) {
    result = { valid: false, error: 'Todo must be at least 3 characters' }
  } else {
    result = { valid: true, error: null }
  }
  engine.emit(ValidationResultEvent, result)
  engine.emit(CurrentTextChanged, text)
})

engine.on(ValidationResultEvent, (result: ValidationResult) => {
  _validation = result
})

// ---------------------------------------------------------------------------
// State reducers
// ---------------------------------------------------------------------------

engine.on(TodoAdded, (todo: Todo) => {
  _todos = [..._todos, todo]
  engine.emit(TodoListChanged, _todos)
})

engine.on(TodoRemoved, (id: string) => {
  _todos = _todos.filter((t) => t.id !== id)
  engine.emit(TodoListChanged, _todos)
})

engine.on(TodoToggled, (id: string) => {
  _todos = _todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
  engine.emit(TodoListChanged, _todos)
})

engine.on(FilterChanged, (filter: Filter) => {
  _filter = filter
})
