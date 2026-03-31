import { usePulse, useEmit } from '@pulse/react'
import {
  TodoAdded,
  TodoRemoved,
  TodoToggled,
  TodoTextChanged,
  FilterChanged,
  TodosChanged,
  FilteredTodosChanged,
  RemainingCountChanged,
  CurrentTextChanged,
  ActiveFilterChanged,
  ValidationResultEvent,
  type Todo,
  type Filter,
  type ValidationResult,
} from './engine'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    maxWidth: 560,
    margin: '40px auto',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '0 20px',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    marginBottom: 32,
  } as React.CSSProperties,
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: '#1a1a2e',
    margin: 0,
  } as React.CSSProperties,
  subtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  } as React.CSSProperties,
  inputRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
  } as React.CSSProperties,
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: 16,
    border: '2px solid #e0e0e0',
    borderRadius: 8,
    outline: 'none',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  addBtn: (disabled: boolean) =>
    ({
      padding: '12px 24px',
      fontSize: 16,
      fontWeight: 600,
      border: 'none',
      borderRadius: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: disabled ? '#ccc' : '#4361ee',
      color: '#fff',
      transition: 'background 0.2s',
    }) as React.CSSProperties,
  errorText: {
    color: '#e63946',
    fontSize: 13,
    minHeight: 20,
    marginBottom: 16,
  } as React.CSSProperties,
  filterBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  } as React.CSSProperties,
  filterBtn: (active: boolean) =>
    ({
      padding: '6px 16px',
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      border: active ? '2px solid #4361ee' : '2px solid #e0e0e0',
      borderRadius: 20,
      background: active ? '#eef0ff' : '#fff',
      color: active ? '#4361ee' : '#666',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }) as React.CSSProperties,
  todoItem: (completed: boolean) =>
    ({
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      background: '#fff',
      borderRadius: 8,
      marginBottom: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      transition: 'opacity 0.2s',
      opacity: completed ? 0.5 : 1,
    }) as React.CSSProperties,
  todoText: (completed: boolean) =>
    ({
      flex: 1,
      fontSize: 16,
      textDecoration: completed ? 'line-through' : 'none',
      color: completed ? '#999' : '#1a1a2e',
    }) as React.CSSProperties,
  checkbox: {
    width: 20,
    height: 20,
    cursor: 'pointer',
    accentColor: '#4361ee',
  } as React.CSSProperties,
  removeBtn: {
    padding: '4px 10px',
    fontSize: 18,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#ccc',
    transition: 'color 0.2s',
  } as React.CSSProperties,
  footer: {
    marginTop: 16,
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: 40,
    color: '#bbb',
    fontSize: 16,
  } as React.CSSProperties,
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function TodoInput() {
  const emit = useEmit()
  const text = usePulse(CurrentTextChanged, '')
  const validation = usePulse(ValidationResultEvent, { valid: false, error: null } as ValidationResult)

  const handleAdd = () => {
    if (!validation.valid) return
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
    }
    emit(TodoAdded, todo)
    emit(TodoTextChanged, '')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div>
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={text}
          placeholder="What needs to be done?"
          onChange={(e) => emit(TodoTextChanged, e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          style={styles.addBtn(!validation.valid)}
          disabled={!validation.valid}
          onClick={handleAdd}
        >
          Add
        </button>
      </div>
      <div style={styles.errorText}>{validation.error ?? '\u00A0'}</div>
    </div>
  )
}

function FilterBar() {
  const emit = useEmit()
  const filter = usePulse(ActiveFilterChanged, 'all' as Filter)
  const filters: Filter[] = ['all', 'active', 'completed']

  return (
    <div style={styles.filterBar}>
      {filters.map((f) => (
        <button
          key={f}
          style={styles.filterBtn(filter === f)}
          onClick={() => emit(FilterChanged, f)}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
    </div>
  )
}

function TodoItem({ todo }: { todo: Todo }) {
  const emit = useEmit()

  return (
    <div style={styles.todoItem(todo.completed)}>
      <input
        type="checkbox"
        checked={todo.completed}
        style={styles.checkbox}
        onChange={() => emit(TodoToggled, todo.id)}
      />
      <span style={styles.todoText(todo.completed)}>{todo.text}</span>
      <button
        style={styles.removeBtn}
        onClick={() => emit(TodoRemoved, todo.id)}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#e63946')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#ccc')}
      >
        x
      </button>
    </div>
  )
}

function TodoList() {
  const todos = usePulse(TodosChanged, [] as Todo[])
  const filtered = usePulse(FilteredTodosChanged, [] as Todo[])
  const remaining = usePulse(RemainingCountChanged, 0)

  return (
    <div>
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          {todos.length === 0 ? 'No todos yet. Add one above!' : 'No matching todos.'}
        </div>
      ) : (
        filtered.map((todo) => <TodoItem key={todo.id} todo={todo} />)
      )}
      <div style={styles.footer}>
        {remaining} item{remaining !== 1 ? 's' : ''} remaining
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Pulse Todos</h1>
        <p style={styles.subtitle}>
          All state managed through Pulse events and on/emit
        </p>
      </div>
      <TodoInput />
      <FilterBar />
      <TodoList />
    </div>
  )
}
