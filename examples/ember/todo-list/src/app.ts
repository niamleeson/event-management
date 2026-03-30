import Component from '@glimmer/component'
import { action } from '@ember/object'
import { TrackedSignal } from '@pulse/ember'
import {
  pulse,
  todoList,
  activeFilter,
  currentText,
  validationState,
  TodoAdded,
  TodoRemoved,
  TodoToggled,
  TodoTextChanged,
  FilterChanged,
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
//   <p class="subtitle">All state managed through Pulse events and signals</p>
//   <TodoInput />
//   <FilterBar />
//   <TodoList />
// </div>

export default class TodoApp extends Component {
  // -- Tracked signals bound to Pulse state --
  todos: TrackedSignal<Todo[]>
  filter: TrackedSignal<Filter>
  text: TrackedSignal<string>
  validation: TrackedSignal<ValidationResult>

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args)
    this.todos = pulse.createSignal(todoList)
    this.filter = pulse.createSignal(activeFilter)
    this.text = pulse.createSignal(currentText)
    this.validation = pulse.createSignal(validationState)
  }

  // -- Computed: filtered todo list --
  get filteredTodos(): Todo[] {
    const f = this.filter.value
    return this.todos.value.filter((t) => {
      if (f === 'active') return !t.completed
      if (f === 'completed') return t.completed
      return true
    })
  }

  get remainingCount(): number {
    return this.todos.value.filter((t) => !t.completed).length
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
    this.filter.destroy()
    this.text.destroy()
    this.validation.destroy()
  }
}
