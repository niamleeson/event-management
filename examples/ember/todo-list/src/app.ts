import Component from '@glimmer/component'
import { action } from '@ember/object'
import { type PulseBinding } from '@pulse/ember'
import {
  pulse,
  startLoop,
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
// TodoApp — root component
// ---------------------------------------------------------------------------

// Template: app.hbs (see components/app.hbs below)
//
// <div class="todo-app">
//   <h1>Pulse Todos</h1>
//   <p class="subtitle">All state managed through Pulse events and on/emit</p>
//   <TodoInput />
//   <FilterBar />
//   <TodoList />
// </div>

export default class TodoApp extends Component {
  // -- PulseBindings bound to Pulse events --
  todos: PulseBinding<Todo[]>
  filtered: PulseBinding<Todo[]>
  remaining: PulseBinding<number>
  filter: PulseBinding<Filter>
  text: PulseBinding<string>
  validation: PulseBinding<ValidationResult>

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args)
    startLoop()
    this.todos = pulse.bind(TodosChanged, [])
    this.filtered = pulse.bind(FilteredTodosChanged, [])
    this.remaining = pulse.bind(RemainingCountChanged, 0)
    this.filter = pulse.bind(ActiveFilterChanged, 'all')
    this.text = pulse.bind(CurrentTextChanged, '')
    this.validation = pulse.bind(ValidationResultEvent, { valid: false, error: null })
  }

  // -- Computed --
  get filteredTodos(): Todo[] {
    return this.filtered.value
  }

  get remainingCount(): number {
    return this.remaining.value
  }

  get isAddDisabled(): boolean {
    return !this.validation.value.valid
  }

  get errorMessage(): string | null {
    return this.validation.value.error
  }

  // -- Actions --

  @action
  updateText(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    pulse.emit(TodoTextChanged, value)
  }

  @action
  addTodo(): void {
    if (!this.validation.value.valid) return
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: this.text.value.trim(),
      completed: false,
    }
    pulse.emit(TodoAdded, todo)
    pulse.emit(TodoTextChanged, '')
  }

  @action
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.addTodo()
  }

  @action
  toggleTodo(id: string): void {
    pulse.emit(TodoToggled, id)
  }

  @action
  removeTodo(id: string): void {
    pulse.emit(TodoRemoved, id)
  }

  @action
  setFilter(filter: Filter): void {
    pulse.emit(FilterChanged, filter)
  }

  willDestroy(): void {
    super.willDestroy()
    this.todos.destroy()
    this.filtered.destroy()
    this.remaining.destroy()
    this.filter.destroy()
    this.text.destroy()
    this.validation.destroy()
  }
}
