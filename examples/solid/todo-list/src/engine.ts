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
export const FilteredTodosChanged = engine.event<Todo[]>('FilteredTodosChanged')
export const RemainingCountChanged = engine.event<number>('RemainingCountChanged')
export const CurrentTextChanged = engine.event<string>('CurrentTextChanged')
export const ActiveFilterChanged = engine.event<Filter>('ActiveFilterChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let todos: Todo[] = []
let activeFilter: Filter = 'all'
let currentText = ''

function emitDerived() {
  const filtered =
    activeFilter === 'active' ? todos.filter(t => !t.completed) :
    activeFilter === 'completed' ? todos.filter(t => t.completed) :
    todos
  engine.emit(FilteredTodosChanged, filtered)
  engine.emit(RemainingCountChanged, todos.filter(t => !t.completed).length)
}

// ---------------------------------------------------------------------------
// Validate text input: non-empty and minimum length of 3
// ---------------------------------------------------------------------------

engine.on(TodoTextChanged, (text: string) => {
  currentText = text
  engine.emit(CurrentTextChanged, text)
  if (text.trim().length === 0) {
    engine.emit(ValidationResultEvent, { valid: false, error: null })
  } else if (text.trim().length < 3) {
    engine.emit(ValidationResultEvent, { valid: false, error: 'Todo must be at least 3 characters' })
  } else {
    engine.emit(ValidationResultEvent, { valid: true, error: null })
  }
})

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

engine.on(TodoAdded, (todo) => {
  todos = [...todos, todo]
  engine.emit(TodosChanged, todos)
  emitDerived()
})

engine.on(TodoRemoved, (id) => {
  todos = todos.filter((t) => t.id !== id)
  engine.emit(TodosChanged, todos)
  emitDerived()
})

engine.on(TodoToggled, (id) => {
  todos = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
  engine.emit(TodosChanged, todos)
  emitDerived()
})

engine.on(FilterChanged, (filter) => {
  activeFilter = filter
  engine.emit(ActiveFilterChanged, filter)
  emitDerived()
})
