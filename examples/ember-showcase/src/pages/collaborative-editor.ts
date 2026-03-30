import {
  engine,
  USERS,
  UserEdit,
  CursorMoved,
  lines,
  cursors,
  activeUsers,
  editHistory,
  cursorSprings,
  startSimulation,
  stopSimulation,
} from '../engines/collaborative-editor'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 800px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'Collaborative Editor'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 16px;'
  sub.textContent = 'Multi-user simulation with spring-animated cursors. Remote users edit in real-time.'
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Active users bar
  const usersBar = document.createElement('div')
  usersBar.style.cssText = 'display: flex; gap: 12px; margin-bottom: 12px; padding: 8px 12px; background: #f8f9fa; border-radius: 8px;'
  for (const user of USERS) {
    const u = document.createElement('div')
    u.style.cssText = 'display: flex; align-items: center; gap: 6px;'
    const dot = document.createElement('div')
    dot.style.cssText = `width: 10px; height: 10px; border-radius: 50%; background: ${user.color};`
    const name = document.createElement('span')
    name.style.cssText = 'font-size: 13px; font-weight: 600; color: #344054;'
    name.textContent = user.name
    u.appendChild(dot)
    u.appendChild(name)
    usersBar.appendChild(u)
  }
  wrapper.appendChild(usersBar)

  // Editor container
  const editorContainer = document.createElement('div')
  editorContainer.style.cssText = 'position: relative; border: 1px solid #e4e7ec; border-radius: 10px; overflow: hidden; background: #1e1e2e;'

  // Line number gutter + code area
  const editorInner = document.createElement('div')
  editorInner.style.cssText = 'display: flex; overflow: auto; max-height: 450px;'

  const gutterEl = document.createElement('div')
  gutterEl.style.cssText = 'padding: 12px 0; background: #16162a; min-width: 40px; text-align: right; user-select: none;'

  const codeEl = document.createElement('div')
  codeEl.style.cssText = 'flex: 1; padding: 12px 16px; font-family: "Fira Code", "Consolas", monospace; font-size: 14px; line-height: 22px; color: #e0e0e0; white-space: pre; position: relative; cursor: text; min-height: 350px;'

  // Cursor overlay container
  const cursorOverlay = document.createElement('div')
  cursorOverlay.style.cssText = 'position: absolute; top: 0; left: 0; pointer-events: none; width: 100%; height: 100%;'

  const remoteCursorEls: Record<string, { cursor: HTMLElement; label: HTMLElement }> = {}

  for (const user of USERS) {
    if (user.id === 'user-1') continue
    const cursorEl = document.createElement('div')
    cursorEl.style.cssText = `position: absolute; width: 2px; height: 22px; background: ${user.color}; transition: none;`
    const labelEl = document.createElement('div')
    labelEl.style.cssText = `position: absolute; background: ${user.color}; color: #fff; font-size: 10px; padding: 1px 4px; border-radius: 3px; white-space: nowrap; font-family: sans-serif; transform: translateY(-100%);`
    labelEl.textContent = user.name

    cursorOverlay.appendChild(cursorEl)
    cursorOverlay.appendChild(labelEl)
    remoteCursorEls[user.id] = { cursor: cursorEl, label: labelEl }
  }

  codeEl.appendChild(cursorOverlay)
  editorInner.appendChild(gutterEl)
  editorInner.appendChild(codeEl)
  editorContainer.appendChild(editorInner)
  wrapper.appendChild(editorContainer)

  // Click to edit
  codeEl.addEventListener('click', (e) => {
    const rect = codeEl.getBoundingClientRect()
    const y = e.clientY - rect.top + codeEl.parentElement!.scrollTop
    const x = e.clientX - rect.left
    const line = Math.floor(y / 22)
    const col = Math.floor(x / 8.4)
    const user = USERS[0]
    engine.emit(CursorMoved, {
      userId: user.id, line, col, color: user.color, name: user.name,
    })
  })

  // Keyboard input
  codeEl.tabIndex = 0
  codeEl.addEventListener('keydown', (e) => {
    const cursor = cursors.value['user-1']
    if (!cursor) return

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      engine.emit(UserEdit, {
        userId: 'user-1',
        line: cursor.line,
        col: cursor.col,
        text: e.key,
        type: 'insert',
        timestamp: Date.now(),
      })
      engine.emit(CursorMoved, {
        userId: 'user-1',
        line: cursor.line,
        col: cursor.col + 1,
        color: USERS[0].color,
        name: USERS[0].name,
      })
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      if (cursor.col > 0) {
        engine.emit(UserEdit, {
          userId: 'user-1',
          line: cursor.line,
          col: cursor.col,
          text: '',
          type: 'delete',
          timestamp: Date.now(),
        })
        engine.emit(CursorMoved, {
          userId: 'user-1',
          line: cursor.line,
          col: cursor.col - 1,
          color: USERS[0].color,
          name: USERS[0].name,
        })
      }
    }
  })

  // Edit history panel
  const historyPanel = document.createElement('div')
  historyPanel.style.cssText = 'margin-top: 12px; border: 1px solid #e4e7ec; border-radius: 8px; padding: 12px; max-height: 150px; overflow-y: auto;'
  const historyTitle = document.createElement('div')
  historyTitle.style.cssText = 'font-size: 13px; font-weight: 700; color: #344054; margin-bottom: 8px;'
  historyTitle.textContent = 'Edit History'
  historyPanel.appendChild(historyTitle)
  const historyList = document.createElement('div')
  historyPanel.appendChild(historyList)
  wrapper.appendChild(historyPanel)

  container.appendChild(wrapper)

  startSimulation()

  function renderCode() {
    const currentLines = lines.value

    // Gutter
    gutterEl.innerHTML = ''
    for (let i = 0; i < currentLines.length; i++) {
      const lineNum = document.createElement('div')
      lineNum.style.cssText = 'padding: 0 8px; font-family: monospace; font-size: 13px; line-height: 22px; color: #4a4a6a;'
      lineNum.textContent = String(i + 1)
      gutterEl.appendChild(lineNum)
    }

    // Code — render text nodes only (keep cursor overlay)
    const textNodes = codeEl.querySelectorAll('.code-line')
    textNodes.forEach((n) => n.remove())

    for (let i = 0; i < currentLines.length; i++) {
      const lineEl = document.createElement('div')
      lineEl.className = 'code-line'
      lineEl.style.cssText = 'line-height: 22px; min-height: 22px;'
      lineEl.textContent = currentLines[i] || ' '
      codeEl.insertBefore(lineEl, cursorOverlay)
    }
  }

  // Subscriptions
  unsubs.push(lines.subscribe(() => renderCode()))

  unsubs.push(editHistory.subscribe((history) => {
    historyList.innerHTML = ''
    const recent = history.slice(-10).reverse()
    for (const op of recent) {
      const entry = document.createElement('div')
      const user = USERS.find((u) => u.id === op.userId)
      entry.style.cssText = 'font-size: 12px; color: #667085; padding: 2px 0;'
      entry.textContent = `${user?.name || op.userId} ${op.type}d "${op.text}" at L${op.line + 1}:${op.col}`
      historyList.appendChild(entry)
    }
  }))

  // Frame loop for spring cursors
  unsubs.push(engine.on(engine.frame, () => {
    for (const user of USERS) {
      if (user.id === 'user-1') continue
      const spring = cursorSprings[user.id]
      if (!spring) continue

      const el = remoteCursorEls[user.id]
      if (!el) continue

      const x = spring.x.value
      const y = spring.y.value

      el.cursor.style.left = `${x + 16}px`
      el.cursor.style.top = `${y + 12}px`
      el.label.style.left = `${x + 16}px`
      el.label.style.top = `${y + 12}px`
    }
  }))

  // Initial render
  renderCode()

  return () => {
    ;(window as any).__pulseEngine = null
    stopSimulation()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
