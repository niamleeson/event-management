import { Component, computed, type WritableSignal } from '@angular/core'
import { PulseService } from '@pulse/angular'
import {
  TodoTextChanged,
  TodoAdded,
  TodoRemoved,
  TodoToggled,
  FilterChanged,
  todosSig,
  filterSig,
  validationSig,
  inputTextSig,
  getNextId,
  type Todo,
  type Filter,
  type ValidationResult,
} from './engine'

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [PulseService],
  template: `
    <div class="container">
      <h1>Pulse Todo List</h1>

      <div class="input-row">
        <input
          type="text"
          [value]="inputText()"
          (input)="onTextChange($event)"
          (keydown.enter)="addTodo()"
          placeholder="What needs to be done?"
          [class.invalid]="!validation().valid && inputText().length > 0"
        />
        <button (click)="addTodo()" [disabled]="!validation().valid || inputText().length === 0">
          Add
        </button>
      </div>

      @if (!validation().valid && inputText().length > 0) {
        <p class="error">{{ validation().message }}</p>
      }

      <div class="filters">
        <button
          (click)="setFilter('all')"
          [class.active]="filter() === 'all'"
        >All</button>
        <button
          (click)="setFilter('active')"
          [class.active]="filter() === 'active'"
        >Active</button>
        <button
          (click)="setFilter('completed')"
          [class.active]="filter() === 'completed'"
        >Completed</button>
      </div>

      <ul class="todo-list">
        @for (todo of filteredTodos(); track todo.id) {
          <li [class.done]="todo.done">
            <label>
              <input
                type="checkbox"
                [checked]="todo.done"
                (change)="toggle(todo.id)"
              />
              <span>{{ todo.text }}</span>
            </label>
            <button class="remove" (click)="remove(todo.id)">x</button>
          </li>
        } @empty {
          <li class="empty">No todos to show</li>
        }
      </ul>

      <p class="count">{{ activeCount() }} item(s) remaining</p>
    </div>
  `,
  styles: [`
    .container {
      max-width: 500px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      text-align: center;
      margin-bottom: 1rem;
      color: #e74c3c;
    }
    .input-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    input[type="text"] {
      flex: 1;
      padding: 0.5rem;
      border: 2px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    input[type="text"].invalid {
      border-color: #e74c3c;
    }
    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      background: #3498db;
      color: white;
      cursor: pointer;
      font-size: 0.9rem;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .error {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }
    .filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .filters button {
      background: #ecf0f1;
      color: #333;
    }
    .filters button.active {
      background: #3498db;
      color: white;
    }
    .todo-list {
      list-style: none;
      padding: 0;
    }
    .todo-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0;
      border-bottom: 1px solid #eee;
    }
    .todo-list li.done span {
      text-decoration: line-through;
      color: #aaa;
    }
    .todo-list li.empty {
      color: #aaa;
      text-align: center;
      display: block;
    }
    label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
    .remove {
      background: #e74c3c;
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }
    .count {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: #888;
      text-align: center;
    }
  `],
})
export class AppComponent {
  todos: WritableSignal<Todo[]>
  filter: WritableSignal<Filter>
  validation: WritableSignal<ValidationResult>
  inputText: WritableSignal<string>

  filteredTodos = computed(() => {
    const f = this.filter()
    const all = this.todos()
    if (f === 'active') return all.filter((t) => !t.done)
    if (f === 'completed') return all.filter((t) => t.done)
    return all
  })

  activeCount = computed(() => {
    return this.todos().filter((t) => !t.done).length
  })

  constructor(private pulse: PulseService) {
    this.todos = pulse.signal(todosSig)
    this.filter = pulse.signal(filterSig)
    this.validation = pulse.signal(validationSig)
    this.inputText = pulse.signal(inputTextSig)
  }

  onTextChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.pulse.emit(TodoTextChanged, value)
  }

  addTodo(): void {
    const text = this.inputText().trim()
    if (!this.validation().valid || text.length === 0) return

    this.pulse.emit(TodoAdded, { id: getNextId(), text, done: false })
    this.pulse.emit(TodoTextChanged, '')
  }

  toggle(id: number): void {
    this.pulse.emit(TodoToggled, id)
  }

  remove(id: number): void {
    this.pulse.emit(TodoRemoved, id)
  }

  setFilter(f: Filter): void {
    this.pulse.emit(FilterChanged, f)
  }
}
