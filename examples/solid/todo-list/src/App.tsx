import { For, Show } from 'solid-js'
import { usePulse, useEmit } from '@pulse/solid'
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
    'max-width': '560px',
    margin: '40px auto',
    'font-family':
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '0 20px',
  },
  header: {
    'text-align': 'center',
    'margin-bottom': '32px',
  },
  title: {
    'font-size': '36px',
    'font-weight': '700',
    color: '#1a1a2e',
    margin: '0',
  },
  subtitle: {
    color: '#666',
    'font-size': '14px',
    'margin-top': '4px',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    'margin-bottom': '8px',
  },
  input: {
    flex: '1',
    padding: '12px 16px',
    'font-size': '16px',
    border: '2px solid #e0e0e0',
    'border-radius': '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  errorText: {
    color: '#e63946',
    'font-size': '13px',
    'min-height': '20px',
    'margin-bottom': '16px',
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    'margin-bottom': '20px',
  },
  footer: {
    'margin-top': '16px',
    'font-size': '14px',
    color: '#888',
    'text-align': 'center',
  },
  empty: {
    'text-align': 'center',
    padding: '40px',
    color: '#bbb',
    'font-size': '16px',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    'accent-color': '#4361ee',
  },
  removeBtn: {
    padding: '4px 10px',
    'font-size': '18px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#ccc',
    transition: 'color 0.2s',
  },
}

function addBtnStyle(disabled: boolean) {
  return {
    padding: '12px 24px',
    'font-size': '16px',
    'font-weight': '600',
    border: 'none',
    'border-radius': '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#ccc' : '#4361ee',
    color: '#fff',
    transition: 'background 0.2s',
  }
}

function filterBtnStyle(active: boolean) {
  return {
    padding: '6px 16px',
    'font-size': '13px',
    'font-weight': active ? '600' : '400',
    border: active ? '2px solid #4361ee' : '2px solid #e0e0e0',
    'border-radius': '20px',
    background: active ? '#eef0ff' : '#fff',
    color: active ? '#4361ee' : '#666',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
}

function todoItemStyle(completed: boolean) {
  return {
    display: 'flex',
    'align-items': 'center',
    gap: '12px',
    padding: '14px 16px',
    background: '#fff',
    'border-radius': '8px',
    'margin-bottom': '8px',
    'box-shadow': '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'opacity 0.2s',
    opacity: completed ? '0.5' : '1',
  }
}

function todoTextStyle(completed: boolean) {
  return {
    flex: '1',
    'font-size': '16px',
    'text-decoration': completed ? 'line-through' : 'none',
    color: completed ? '#999' : '#1a1a2e',
  }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function TodoInput() {
  const emit = useEmit()
  const text = usePulse(CurrentTextChanged, '')
  const validation = usePulse(ValidationResultEvent, { valid: false, error: null } as ValidationResult)

  const handleAdd = () => {
    if (!validation().valid) return
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: text().trim(),
      completed: false,
    }
    emit(TodoAdded, todo)
    emit(TodoTextChanged, '')
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div>
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={text()}
          placeholder="What needs to be done?"
          onInput={(e) => emit(TodoTextChanged, e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          style={addBtnStyle(!validation().valid)}
          disabled={!validation().valid}
          onClick={handleAdd}
        >
          Add
        </button>
      </div>
      <div style={styles.errorText}>{validation().error ?? '\u00A0'}</div>
    </div>
  )
}

function FilterBar() {
  const emit = useEmit()
  const filter = usePulse(ActiveFilterChanged, 'all' as Filter)
  const filters: Filter[] = ['all', 'active', 'completed']

  return (
    <div style={styles.filterBar}>
      <For each={filters}>
        {(f) => (
          <button
            style={filterBtnStyle(filter() === f)}
            onClick={() => emit(FilterChanged, f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        )}
      </For>
    </div>
  )
}

function TodoItem(props: { todo: Todo }) {
  const emit = useEmit()

  return (
    <div style={todoItemStyle(props.todo.completed)}>
      <input
        type="checkbox"
        checked={props.todo.completed}
        style={styles.checkbox}
        onChange={() => emit(TodoToggled, props.todo.id)}
      />
      <span style={todoTextStyle(props.todo.completed)}>{props.todo.text}</span>
      <button
        style={styles.removeBtn}
        onClick={() => emit(TodoRemoved, props.todo.id)}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#e63946')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#ccc')}
      >
        x
      </button>
    </div>
  )
}

function TodoListView() {
  const todos = usePulse(TodosChanged, [] as Todo[])
  const filtered = usePulse(FilteredTodosChanged, [] as Todo[])
  const remaining = usePulse(RemainingCountChanged, 0)

  return (
    <div>
      <Show
        when={filtered().length > 0}
        fallback={
          <div style={styles.empty}>
            {todos().length === 0
              ? 'No todos yet. Add one above!'
              : 'No matching todos.'}
          </div>
        }
      >
        <For each={filtered()}>
          {(todo) => <TodoItem todo={todo} />}
        </For>
      </Show>
      <div style={styles.footer}>
        {remaining()} item{remaining() !== 1 ? 's' : ''} remaining
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
      <TodoListView />
    </div>
  )
}
