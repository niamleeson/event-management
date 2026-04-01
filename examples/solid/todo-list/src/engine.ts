import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// TodoTextChanged ──┬──→ CurrentTextChanged
//                   └──→ ValidationResultEvent
//
// TodoAdded ──┬──→ TodosChanged
//             ├──→ FilteredTodosChanged
//             └──→ RemainingCountChanged
//
// TodoRemoved ──┬──→ TodosChanged
//               ├──→ FilteredTodosChanged
//               └──→ RemainingCountChanged
//
// TodoToggled ──┬──→ TodosChanged
//               ├──→ FilteredTodosChanged
//               └──→ RemainingCountChanged
//
// FilterChanged ──┬──→ ActiveFilterChanged
//                 ├──→ FilteredTodosChanged
//                 └──→ RemainingCountChanged

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

function computeFiltered() {
  return activeFilter === 'active' ? todos.filter(t => !t.completed) :
    activeFilter === 'completed' ? todos.filter(t => t.completed) :
    todos
}

// ---------------------------------------------------------------------------
// Validate text input: non-empty and minimum length of 3
// ---------------------------------------------------------------------------

engine.on(TodoTextChanged, [CurrentTextChanged, ValidationResultEvent], (text: string, setCurrentText, setValidation) => {
  currentText = text
  setCurrentText(text)
  if (text.trim().length === 0) {
    setValidation({ valid: false, error: null })
  } else if (text.trim().length < 3) {
    setValidation({ valid: false, error: 'Todo must be at least 3 characters' })
  } else {
    setValidation({ valid: true, error: null })
  }
})

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

engine.on(TodoAdded, [TodosChanged, FilteredTodosChanged, RemainingCountChanged], (todo, setTodos, setFiltered, setRemaining) => {
  todos = [...todos, todo]
  setTodos(todos)
  setFiltered(computeFiltered())
  setRemaining(todos.filter(t => !t.completed).length)
})

engine.on(TodoRemoved, [TodosChanged, FilteredTodosChanged, RemainingCountChanged], (id, setTodos, setFiltered, setRemaining) => {
  todos = todos.filter((t) => t.id !== id)
  setTodos(todos)
  setFiltered(computeFiltered())
  setRemaining(todos.filter(t => !t.completed).length)
})

engine.on(TodoToggled, [TodosChanged, FilteredTodosChanged, RemainingCountChanged], (id, setTodos, setFiltered, setRemaining) => {
  todos = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
  setTodos(todos)
  setFiltered(computeFiltered())
  setRemaining(todos.filter(t => !t.completed).length)
})

engine.on(FilterChanged, [ActiveFilterChanged, FilteredTodosChanged, RemainingCountChanged], (filter, setActive, setFiltered, setRemaining) => {
  activeFilter = filter
  setActive(filter)
  setFiltered(computeFiltered())
  setRemaining(todos.filter(t => !t.completed).length)
})

export function startLoop() {}
export function stopLoop() {}
