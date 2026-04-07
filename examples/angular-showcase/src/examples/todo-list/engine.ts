import { createEngine } from '@pulse/core'

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
// DAG (3 levels deep)
// ---------------------------------------------------------------------------
//
//  TodoTextChanged ──→ ValidationResultEvent
//
//  TodoAdded ───→ TodosChanged ──┬──→ FilteredTodosChanged
//  TodoRemoved ─→ TodosChanged   │
//  TodoToggled ─→ TodosChanged   └──→ RemainingCountChanged
//
//  FilterChanged ──→ ActiveFilterChanged ──→ FilteredTodosChanged
//
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

// Layer 0: User input events
export const TodoAdded = engine.event<Todo>('TodoAdded')
export const TodoRemoved = engine.event<string>('TodoRemoved')
export const TodoToggled = engine.event<string>('TodoToggled')
export const TodoTextChanged = engine.event<string>('TodoTextChanged')
export const FilterChanged = engine.event<Filter>('FilterChanged')

// Layer 1: Primary state events
export const TodosChanged = engine.event<Todo[]>('TodosChanged')
export const ActiveFilterChanged = engine.event<Filter>('ActiveFilterChanged')
export const ValidationResultEvent = engine.event<ValidationResult>('ValidationResult')

// Layer 2: Derived state events
export const FilteredTodosChanged = engine.event<Todo[]>('FilteredTodosChanged')
export const RemainingCountChanged = engine.event<number>('RemainingCountChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let todos: Todo[] = []
let activeFilter: Filter = 'all'

function computeFiltered(): Todo[] {
  return activeFilter === 'active' ? todos.filter(t => !t.completed) :
    activeFilter === 'completed' ? todos.filter(t => t.completed) :
    todos
}

// ---------------------------------------------------------------------------
// Layer 0 → Layer 1: Input handlers → primary state
// ---------------------------------------------------------------------------

engine.on(TodoTextChanged, [ValidationResultEvent], (text, setValidation) => {
  if (text.trim().length === 0) {
    setValidation({ valid: false, error: null })
  } else if (text.trim().length < 3) {
    setValidation({ valid: false, error: 'Todo must be at least 3 characters' })
  } else {
    setValidation({ valid: true, error: null })
  }
})

engine.on(TodoAdded, [TodosChanged], (todo, setTodos) => {
  todos = [...todos, todo]
  setTodos(todos)
})

engine.on(TodoRemoved, [TodosChanged], (id, setTodos) => {
  todos = todos.filter(t => t.id !== id)
  setTodos(todos)
})

engine.on(TodoToggled, [TodosChanged], (id, setTodos) => {
  todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
  setTodos(todos)
})

engine.on(FilterChanged, [ActiveFilterChanged], (filter, setActive) => {
  activeFilter = filter
  setActive(filter)
})

// ---------------------------------------------------------------------------
// Layer 1 → Layer 2: Primary state → derived state
// ---------------------------------------------------------------------------

engine.on(TodosChanged, [FilteredTodosChanged, RemainingCountChanged], (allTodos, setFiltered, setRemaining) => {
  setFiltered(computeFiltered())
  setRemaining(allTodos.filter(t => !t.completed).length)
})

engine.on(ActiveFilterChanged, [FilteredTodosChanged], (_filter, setFiltered) => {
  setFiltered(computeFiltered())
})

export function startLoop() {}
export function stopLoop() {}

export function resetState() {
  todos = []
  activeFilter = 'all'
}
