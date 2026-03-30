import {
  engine,
  todoList,
  activeFilter,
  currentText,
  validationError,
  TodoAdded,
  TodoRemoved,
  TodoToggled,
  TodoTextChanged,
  FilterChanged,
  type Todo,
  type Filter,
} from '../engines/todo-list'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  // Build DOM once
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 560px; margin: 40px auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 0 20px;'
  container.appendChild(wrapper)

  // Header
  const header = document.createElement('div')
  header.style.cssText = 'text-align: center; margin-bottom: 32px;'
  const h1 = document.createElement('h1')
  h1.style.cssText = 'font-size: 36px; font-weight: 700; color: #1a1a2e; margin: 0;'
  h1.textContent = 'Pulse Todos'
  const subtitle = document.createElement('p')
  subtitle.style.cssText = 'color: #666; font-size: 14px; margin-top: 4px;'
  subtitle.textContent = 'All state managed through Pulse events and signals'
  header.appendChild(h1)
  header.appendChild(subtitle)
  wrapper.appendChild(header)

  // Input row
  const inputRow = document.createElement('div')
  inputRow.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px;'

  const input = document.createElement('input')
  input.style.cssText = 'flex: 1; padding: 12px 16px; font-size: 16px; border: 2px solid #e0e0e0; border-radius: 8px; outline: none; transition: border-color 0.2s;'
  input.placeholder = 'What needs to be done?'
  input.value = currentText.value
  input.addEventListener('input', (e) => {
    engine.emit(TodoTextChanged, (e.target as HTMLInputElement).value)
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodo()
  })

  const addBtn = document.createElement('button')
  addBtn.textContent = 'Add'
  updateAddBtn()
  addBtn.addEventListener('click', addTodo)

  inputRow.appendChild(input)
  inputRow.appendChild(addBtn)
  wrapper.appendChild(inputRow)

  // Error text
  const errorText = document.createElement('div')
  errorText.style.cssText = 'color: #e63946; font-size: 13px; min-height: 20px; margin-bottom: 16px;'
  errorText.textContent = validationError.value.error ?? '\u00A0'
  wrapper.appendChild(errorText)

  // Filter bar
  const filterBar = document.createElement('div')
  filterBar.style.cssText = 'display: flex; gap: 8px; margin-bottom: 20px;'
  const filterButtons: HTMLButtonElement[] = []
  for (const f of ['all', 'active', 'completed'] as Filter[]) {
    const btn = document.createElement('button')
    btn.textContent = f.charAt(0).toUpperCase() + f.slice(1)
    btn.addEventListener('click', () => engine.emit(FilterChanged, f))
    filterBar.appendChild(btn)
    filterButtons.push(btn)
  }
  updateFilterButtons()
  wrapper.appendChild(filterBar)

  // Todo list container
  const listContainer = document.createElement('div')
  wrapper.appendChild(listContainer)

  // Footer
  const footer = document.createElement('div')
  footer.style.cssText = 'margin-top: 16px; font-size: 14px; color: #888; text-align: center;'
  wrapper.appendChild(footer)

  // --- Helper functions ---

  function updateAddBtn() {
    const disabled = !validationError.value.valid
    addBtn.disabled = disabled
    addBtn.style.cssText = `padding: 12px 24px; font-size: 16px; font-weight: 600; border: none; border-radius: 8px; cursor: ${disabled ? 'not-allowed' : 'pointer'}; background: ${disabled ? '#ccc' : '#4361ee'}; color: #fff; transition: background 0.2s;`
  }

  function updateFilterButtons() {
    const current = activeFilter.value
    const filters: Filter[] = ['all', 'active', 'completed']
    filterButtons.forEach((btn, i) => {
      const active = current === filters[i]
      btn.style.cssText = `padding: 6px 16px; font-size: 13px; font-weight: ${active ? 600 : 400}; border: 2px solid ${active ? '#4361ee' : '#e0e0e0'}; border-radius: 20px; background: ${active ? '#eef0ff' : '#fff'}; color: ${active ? '#4361ee' : '#666'}; cursor: pointer; transition: all 0.2s;`
    })
  }

  function renderTodoList() {
    listContainer.innerHTML = ''
    const todos = todoList.value
    const filter = activeFilter.value

    const filtered = todos.filter((t: Todo) => {
      if (filter === 'active') return !t.completed
      if (filter === 'completed') return t.completed
      return true
    })

    if (filtered.length === 0) {
      const empty = document.createElement('div')
      empty.style.cssText = 'text-align: center; padding: 40px; color: #bbb; font-size: 16px;'
      empty.textContent = todos.length === 0 ? 'No todos yet. Add one above!' : 'No matching todos.'
      listContainer.appendChild(empty)
    } else {
      for (const todo of filtered) {
        const item = document.createElement('div')
        item.style.cssText = `display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #fff; border-radius: 8px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: opacity 0.2s; opacity: ${todo.completed ? 0.5 : 1};`

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.checked = todo.completed
        checkbox.style.cssText = 'width: 20px; height: 20px; cursor: pointer; accent-color: #4361ee;'
        checkbox.addEventListener('change', () => engine.emit(TodoToggled, todo.id))

        const span = document.createElement('span')
        span.style.cssText = `flex: 1; font-size: 16px; text-decoration: ${todo.completed ? 'line-through' : 'none'}; color: ${todo.completed ? '#999' : '#1a1a2e'};`
        span.textContent = todo.text

        const removeBtn = document.createElement('button')
        removeBtn.style.cssText = 'padding: 4px 10px; font-size: 18px; border: none; background: none; cursor: pointer; color: #ccc; transition: color 0.2s;'
        removeBtn.innerHTML = '&times;'
        removeBtn.addEventListener('click', () => engine.emit(TodoRemoved, todo.id))
        removeBtn.addEventListener('mouseenter', () => { removeBtn.style.color = '#e63946' })
        removeBtn.addEventListener('mouseleave', () => { removeBtn.style.color = '#ccc' })

        item.appendChild(checkbox)
        item.appendChild(span)
        item.appendChild(removeBtn)
        listContainer.appendChild(item)
      }
    }

    const remaining = todos.filter((t: Todo) => !t.completed).length
    footer.textContent = `${remaining} item${remaining !== 1 ? 's' : ''} remaining`
  }

  function addTodo(): void {
    if (!validationError.value.valid) return
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: currentText.value.trim(),
      completed: false,
    }
    engine.emit(TodoAdded, todo)
    engine.emit(TodoTextChanged, '')
  }

  // Subscribe for updates
  unsubs.push(currentText.subscribe((text) => {
    input.value = text
  }))

  unsubs.push(validationError.subscribe(() => {
    updateAddBtn()
    errorText.textContent = validationError.value.error ?? '\u00A0'
  }))

  unsubs.push(activeFilter.subscribe(() => {
    updateFilterButtons()
    renderTodoList()
  }))

  unsubs.push(todoList.subscribe(() => {
    renderTodoList()
  }))

  // Initial render
  renderTodoList()

  return () => {
    ;(window as any).__pulseEngine = null
    unsubs.forEach((u) => u())
  }
}
