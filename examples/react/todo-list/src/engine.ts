import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Todo { id: string; text: string; completed: boolean }
export type Filter = 'all' | 'active' | 'completed'
export interface Validation { valid: boolean; error: string | null }

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
//
//  TextInput ──→ Validated ──→ CanSubmit
//
//  AddTodo ───→ Todos ──┬──→ Filtered
//  RemoveTodo → Todos   └──→ Remaining
//  ToggleTodo → Todos
//
//  SetFilter ──→ ActiveFilter
//             └──→ Filtered
//
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Context — component syncs its state here, handlers read it
// ---------------------------------------------------------------------------

export const ctx = engine.context({
  todos: [] as Todo[],
  filter: 'all' as Filter,
})

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const TextInput = engine.event<string>('TextInput')
export const Validated = engine.event<Validation>('Validated')
export const CanSubmit = engine.event<boolean>('CanSubmit')

export const AddTodo = engine.event<Todo>('AddTodo')
export const RemoveTodo = engine.event<string>('RemoveTodo')
export const ToggleTodo = engine.event<string>('ToggleTodo')
export const Todos = engine.event<Todo[]>('Todos')

export const SetFilter = engine.event<Filter>('SetFilter')
export const ActiveFilter = engine.event<Filter>('ActiveFilter')
export const Filtered = engine.event<Todo[]>('Filtered')
export const Remaining = engine.event<number>('Remaining')

// ---------------------------------------------------------------------------
// TextInput → Validated → CanSubmit (pure, no ctx needed)
// ---------------------------------------------------------------------------

engine.on(TextInput, [Validated], (text, validated) => {
  if (!text.trim()) validated({ valid: false, error: null })
  else if (text.trim().length < 3) validated({ valid: false, error: 'At least 3 characters' })
  else validated({ valid: true, error: null })
})

engine.on(Validated).emit(CanSubmit, v => v.valid)

// ---------------------------------------------------------------------------
// Mutations → Todos (read ctx, compute new state, emit it)
// Handler reads ctx.todos, computes new list, emits Todos.
// Also writes ctx.todos so downstream handlers in same cycle see it.
// ---------------------------------------------------------------------------

engine.on(AddTodo, [Todos], (todo, setTodos) => {
  const next = [...ctx.todos, todo]
  ctx.todos = next
  setTodos(next)
})

engine.on(RemoveTodo, [Todos], (id, setTodos) => {
  const next = ctx.todos.filter(t => t.id !== id)
  ctx.todos = next
  setTodos(next)
})

engine.on(ToggleTodo, [Todos], (id, setTodos) => {
  const next = ctx.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
  ctx.todos = next
  setTodos(next)
})

// ---------------------------------------------------------------------------
// Todos → Filtered + Remaining (reads ctx.filter for computation)
// ---------------------------------------------------------------------------

engine.on(Todos, [Filtered, Remaining], (allTodos, setFiltered, setRemaining) => {
  const f = ctx.filter
  const filtered = f === 'active' ? allTodos.filter(t => !t.completed)
    : f === 'completed' ? allTodos.filter(t => t.completed)
    : allTodos
  setFiltered(filtered)
  setRemaining(allTodos.filter(t => !t.completed).length)
})

// ---------------------------------------------------------------------------
// SetFilter → ActiveFilter + Filtered (reads ctx.todos for computation)
// ---------------------------------------------------------------------------

engine.on(SetFilter, [ActiveFilter, Filtered], (f, setActive, setFiltered) => {
  ctx.filter = f
  setActive(f)
  const filtered = f === 'active' ? ctx.todos.filter(t => !t.completed)
    : f === 'completed' ? ctx.todos.filter(t => t.completed)
    : ctx.todos
  setFiltered(filtered)
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export function startLoop() {}
export function stopLoop() {}
export function resetState() { engine.reset() }
