import { useState, useCallback } from 'react'
import { usePulse, useEmit, useSync } from '@pulse/react'
import {
  ctx,
  TextInput, AddTodo, RemoveTodo, ToggleTodo, SetFilter,
  Todos, ActiveFilter, Filtered, Remaining, Validated, CanSubmit,
  type Todo, type Filter, type Validation,
} from './engine'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const colors = {
  bg: '#f8f9fa', primary: '#4361ee', primaryLight: '#eef0ff',
  text: '#1a1a2e', muted: '#6c757d', border: '#e9ecef', danger: '#e63946',
}

const s = {
  container: { maxWidth: 560, margin: '40px auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '0 20px' } as React.CSSProperties,
  title: { fontSize: 42, fontWeight: 800, color: colors.text, margin: 0, textAlign: 'center' as const } as React.CSSProperties,
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4, textAlign: 'center' as const, marginBottom: 24 } as React.CSSProperties,
  row: { display: 'flex', gap: 8, marginBottom: 4 } as React.CSSProperties,
  input: { flex: 1, padding: '12px 14px', fontSize: 16, border: `2px solid ${colors.border}`, borderRadius: 10, outline: 'none', boxSizing: 'border-box' as const } as React.CSSProperties,
  btn: (disabled: boolean) => ({ padding: '12px 20px', fontSize: 14, fontWeight: 600, border: 'none', borderRadius: 10, background: disabled ? colors.border : colors.primary, color: disabled ? colors.muted : '#fff', cursor: disabled ? 'not-allowed' : 'pointer' }) as React.CSSProperties,
  error: { fontSize: 12, color: colors.danger, minHeight: 18, marginBottom: 8 } as React.CSSProperties,
  filters: { display: 'flex', gap: 6, marginBottom: 16 } as React.CSSProperties,
  filterBtn: (on: boolean) => ({ padding: '6px 16px', fontSize: 13, fontWeight: 600, border: `2px solid ${on ? colors.primary : colors.border}`, borderRadius: 20, background: on ? colors.primaryLight : '#fff', color: on ? colors.primary : colors.muted, cursor: 'pointer' }) as React.CSSProperties,
  item: (done: boolean) => ({ display: 'flex', alignItems: 'center', padding: '12px 14px', background: '#fff', borderRadius: 10, border: `1px solid ${colors.border}`, marginBottom: 6, opacity: done ? 0.6 : 1 }) as React.CSSProperties,
  check: { marginRight: 12, width: 18, height: 18, cursor: 'pointer' } as React.CSSProperties,
  text: (done: boolean) => ({ flex: 1, fontSize: 16, color: colors.text, textDecoration: done ? 'line-through' : 'none' }) as React.CSSProperties,
  remove: { background: 'none', border: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer', padding: '4px 8px' } as React.CSSProperties,
  empty: { padding: 32, textAlign: 'center' as const, color: colors.muted, fontSize: 14 } as React.CSSProperties,
  footer: { padding: '12px 0', fontSize: 13, color: colors.muted, textAlign: 'center' as const } as React.CSSProperties,
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()

  // --- State: component owns, engine reads + updates ---
  const [text, setText] = useState('')
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  useSync(ctx, {
    todos: [todos, setTodos, Todos],
    filter: [filter, setFilter, ActiveFilter],
  })

  // --- Derived state: engine computes, component reads ---
  const filtered = usePulse(Filtered, [] as Todo[])
  const remaining = usePulse(Remaining, 0)
  const validation = usePulse(Validated, { valid: false, error: null } as Validation)
  const canSubmit = usePulse(CanSubmit, false)

  // --- Actions ---
  const type = useCallback((v: string) => { setText(v); emit(TextInput, v) }, [emit])
  const add = useCallback(() => {
    if (!canSubmit) return
    emit(AddTodo, { id: crypto.randomUUID(), text: text.trim(), completed: false })
    type('')
  }, [canSubmit, text, type, emit])

  return (
    <div style={s.container}>
      <h1 style={s.title}>Pulse Todos</h1>

      <div style={s.row}>
        <input style={s.input} value={text} placeholder="What needs to be done?"
          onChange={e => type(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
        />
        <button style={s.btn(!canSubmit)} disabled={!canSubmit} onClick={add}>Add</button>
      </div>
      <div style={s.error}>{validation.error ?? '\u00A0'}</div>

      <div style={s.filters}>
        {(['all', 'active', 'completed'] as Filter[]).map(f => (
          <button key={f} style={s.filterBtn(filter === f)} onClick={() => emit(SetFilter, f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>{todos.length === 0 ? 'No todos yet.' : 'No matching todos.'}</div>
      ) : (
        filtered.map(todo => (
          <div key={todo.id} style={s.item(todo.completed)}>
            <input type="checkbox" checked={todo.completed} style={s.check}
              onChange={() => emit(ToggleTodo, todo.id)} />
            <span style={s.text(todo.completed)}>{todo.text}</span>
            <button style={s.remove} onClick={() => emit(RemoveTodo, todo.id)}>x</button>
          </div>
        ))
      )}

      <div style={s.footer}>{remaining} item{remaining !== 1 ? 's' : ''} remaining</div>
    </div>
  )
}
