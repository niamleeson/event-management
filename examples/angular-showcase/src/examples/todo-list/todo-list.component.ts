import { Component, computed, type WritableSignal, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  TodoTextChanged,
  TodoAdded,
  TodoRemoved,
  TodoToggled,
  FilterChanged,
  TodosChanged,
  ActiveFilterChanged,
  ValidationChanged,
  InputTextChanged,
  type Todo,
  type Filter,
  type ValidationResult,
} from './engine'

@Component({
  selector: 'app-todo-list',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="container">
      <div class="header">
        <h1 class="title">Pulse Todos</h1>
        <p class="subtitle">All state managed through Pulse events</p>
      </div>

      <div class="input-row">
        <input
          class="input"
          [value]="inputText()"
          (input)="onTextChange($event)"
          (keydown.enter)="addTodo()"
          placeholder="What needs to be done?"
        />
        <button
          class="add-btn"
          [class.disabled]="!validation().valid"
          [disabled]="!validation().valid"
          (click)="addTodo()"
        >
          Add
        </button>
      </div>

      <div class="error-text">{{ validation().error ?? '\u00A0' }}</div>

      <div class="filter-bar">
        @for (f of filters; track f) {
          <button
            class="filter-btn"
            [class.active]="filter() === f"
            (click)="setFilter(f)"
          >
            {{ capitalize(f) }}
          </button>
        }
      </div>

      @if (filteredTodos().length === 0) {
        <div class="empty">
          {{ todos().length === 0 ? 'No todos yet. Add one above!' : 'No matching todos.' }}
        </div>
      } @else {
        @for (todo of filteredTodos(); track todo.id) {
          <div class="todo-item" [class.completed]="todo.completed">
            <input
              type="checkbox"
              class="checkbox"
              [checked]="todo.completed"
              (change)="toggle(todo.id)"
            />
            <span class="todo-text" [class.completed]="todo.completed">{{ todo.text }}</span>
            <button class="remove-btn" (click)="remove(todo.id)">&#215;</button>
          </div>
        }
      }

      <div class="footer">
        {{ remaining() }} item{{ remaining() !== 1 ? 's' : '' }} remaining
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 560px;
      margin: 40px auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 0 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .title {
      font-size: 36px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
      margin-top: 4px;
    }
    .input-row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .input {
      flex: 1;
      padding: 12px 16px;
      font-size: 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      outline: none;
      transition: border-color 0.2s;
    }
    .input:focus {
      border-color: #4361ee;
    }
    .add-btn {
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      background: #4361ee;
      color: #fff;
      transition: background 0.2s;
    }
    .add-btn.disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .error-text {
      color: #e63946;
      font-size: 13px;
      min-height: 20px;
      margin-bottom: 16px;
    }
    .filter-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }
    .filter-btn {
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 400;
      border: 2px solid #e0e0e0;
      border-radius: 20px;
      background: #fff;
      color: #666;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn.active {
      font-weight: 600;
      border-color: #4361ee;
      background: #eef0ff;
      color: #4361ee;
    }
    .todo-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #fff;
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      transition: opacity 0.2s;
    }
    .todo-item.completed {
      opacity: 0.5;
    }
    .todo-text {
      flex: 1;
      font-size: 16px;
      color: #1a1a2e;
    }
    .todo-text.completed {
      text-decoration: line-through;
      color: #999;
    }
    .checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: #4361ee;
    }
    .remove-btn {
      padding: 4px 10px;
      font-size: 18px;
      border: none;
      background: none;
      cursor: pointer;
      color: #ccc;
      transition: color 0.2s;
    }
    .remove-btn:hover {
      color: #e63946;
    }
    .footer {
      margin-top: 16px;
      font-size: 14px;
      color: #888;
      text-align: center;
    }
    .empty {
      text-align: center;
      padding: 40px;
      color: #bbb;
      font-size: 16px;
    }
  `],
})
export class TodoListComponent implements OnInit, OnDestroy {
  todos = this.pulse.use(TodosChanged, [] as Todo[])
  filter = this.pulse.use(ActiveFilterChanged, 'all' as Filter)
  validation = this.pulse.use(ValidationChanged, { valid: false, error: null } as ValidationResult)
  inputText = this.pulse.use(InputTextChanged, '')

  filters: Filter[] = ['all', 'active', 'completed']

  filteredTodos = computed(() => {
    const f = this.filter()
    const all = this.todos()
    if (f === 'active') return all.filter((t) => !t.completed)
    if (f === 'completed') return all.filter((t) => t.completed)
    return all
  })

  remaining = computed(() => {
    return this.todos().filter((t) => !t.completed).length
  })

  constructor(private pulse: PulseService) {}

  ngOnInit(): void {
    ;(window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    ;(window as any).__pulseEngine = null
    engine.destroy()
  }

  capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  onTextChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.pulse.emit(TodoTextChanged, value)
  }

  addTodo(): void {
    const text = this.inputText().trim()
    if (!this.validation().valid) return
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: text,
      completed: false,
    }
    this.pulse.emit(TodoAdded, todo)
    this.pulse.emit(TodoTextChanged, '')
  }

  toggle(id: string): void {
    this.pulse.emit(TodoToggled, id)
  }

  remove(id: string): void {
    this.pulse.emit(TodoRemoved, id)
  }

  setFilter(f: Filter): void {
    this.pulse.emit(FilterChanged, f)
  }
}
