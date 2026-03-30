import {
  engine,
  cards,
  dragState,
  cardStatuses,
  dragSpringX,
  dragSpringY,
  DragStart,
  DragMove,
  DragEnd,
  CardMoved,
  UndoRequested,
  type KanbanCard,
  type ColumnId,
  type CardStatus,
} from '../engines/drag-api-animation'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMNS: { id: ColumnId; title: string; color: string }[] = [
  { id: 'todo', title: 'Todo', color: '#4361ee' },
  { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' },
]

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  // Inject keyframes
  const styleTag = document.createElement('style')
  styleTag.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
    @keyframes flashGreen {
      0% { background: #10b98122; }
      100% { background: #0f172a; }
    }
  `
  document.head.appendChild(styleTag)

  // Build static DOM
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #0f172a; padding: 32px 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  container.appendChild(wrapper)

  // Header
  const headerDiv = document.createElement('div')
  headerDiv.style.cssText = 'text-align: center; margin-bottom: 32px;'
  const h1 = document.createElement('h1')
  h1.style.cssText = 'font-size: 36px; font-weight: 800; color: #f1f5f9; margin: 0;'
  h1.textContent = 'Pulse Kanban'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #94a3b8; font-size: 14px; margin-top: 6px;'
  sub.textContent = 'Drag cards between columns. Spring physics follow your mouse. Saves auto-retry on failure.'
  headerDiv.appendChild(h1)
  headerDiv.appendChild(sub)
  wrapper.appendChild(headerDiv)

  // Board
  const board = document.createElement('div')
  board.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1100px; margin: 0 auto;'

  // Column elements storage for drop detection
  const columnElements: Record<string, HTMLElement> = {}

  // Card elements for targeted updates
  const cardElementMap = new Map<string, HTMLElement>()

  // Build columns
  for (const col of COLUMNS) {
    const column = document.createElement('div')
    column.style.cssText = `background: #1e293b; border-radius: 16px; padding: 16px; min-height: 400px; border-top: 3px solid ${col.color};`
    column.dataset.columnId = col.id
    columnElements[col.id] = column

    // Column header
    const colHeader = document.createElement('div')
    colHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 0 4px;'
    const colTitle = document.createElement('span')
    colTitle.style.cssText = 'font-size: 16px; font-weight: 700; color: #e2e8f0;'
    colTitle.textContent = col.title
    const colCount = document.createElement('span')
    colCount.style.cssText = `font-size: 13px; font-weight: 600; color: ${col.color}; background: ${col.color}22; padding: 2px 10px; border-radius: 12px;`
    colCount.className = 'col-count'
    colHeader.appendChild(colTitle)
    colHeader.appendChild(colCount)
    column.appendChild(colHeader)

    // Cards container
    const cardsContainer = document.createElement('div')
    cardsContainer.className = 'cards-container'
    column.appendChild(cardsContainer)

    // Drop zone (hidden by default)
    const dropZone = document.createElement('div')
    dropZone.className = 'drop-zone'
    dropZone.style.cssText = 'min-height: 60px; border: 2px dashed transparent; border-radius: 8px; transition: border-color 0.2s, background 0.2s; display: none;'
    const dropText = document.createElement('div')
    dropText.style.cssText = 'padding: 20px; text-align: center; color: #475569; font-size: 13px;'
    dropText.textContent = 'Drop here'
    dropZone.appendChild(dropText)
    dropZone.addEventListener('mouseenter', () => {
      dropZone.style.borderColor = '#4361ee'
      dropZone.style.background = '#4361ee11'
    })
    dropZone.addEventListener('mouseleave', () => {
      dropZone.style.borderColor = 'transparent'
      dropZone.style.background = 'transparent'
    })
    dropZone.addEventListener('mouseup', () => {
      const drag = dragState.value
      if (drag) {
        const card = cards.value.find((c) => c.id === drag.cardId)
        if (card && card.column !== col.id) {
          engine.emit(CardMoved, {
            cardId: drag.cardId,
            fromColumn: card.column,
            toColumn: col.id,
          })
        }
        engine.emit(DragEnd, undefined)
      }
    })
    column.appendChild(dropZone)

    board.appendChild(column)
  }

  wrapper.appendChild(board)

  // Ghost card (follows spring position)
  const ghostCard = document.createElement('div')
  ghostCard.style.cssText = 'position: fixed; pointer-events: none; z-index: 1000; width: 300px; background: #1e293b; border: 2px solid #4361ee; border-radius: 12px; padding: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); display: none;'
  const ghostTitle = document.createElement('p')
  ghostTitle.style.cssText = 'font-size: 15px; font-weight: 600; color: #e2e8f0; margin: 0; margin-bottom: 4px;'
  const ghostDesc = document.createElement('p')
  ghostDesc.style.cssText = 'font-size: 13px; color: #94a3b8; margin: 0;'
  ghostCard.appendChild(ghostTitle)
  ghostCard.appendChild(ghostDesc)
  document.body.appendChild(ghostCard)

  // Devtools hint
  const devHint = document.createElement('div')
  devHint.style.cssText = 'text-align: center; margin-top: 32px; padding: 16px; background: #1e293b; border-radius: 12px; max-width: 500px; margin-left: auto; margin-right: auto;'
  devHint.innerHTML = `
    <p style="color: #94a3b8; font-size: 13px;">This example integrates with <code style="color: #4361ee; font-family: monospace; font-size: 12px;">@pulse/devtools</code>. Import and connect to visualize event flow, signals, and the DAG in real-time.</p>
    <p style="color: #94a3b8; font-size: 13px; margin-top: 8px;"><code style="color: #4361ee; font-family: monospace; font-size: 12px;">import { connectDevtools } from '@pulse/devtools'</code></p>
  `
  wrapper.appendChild(devHint)

  // --- Render cards into columns ---

  function getCardBorderColor(status: CardStatus): string {
    if (status === 'saving') return '#f59e0b'
    if (status === 'saved') return '#10b981'
    if (status === 'error') return '#ef4444'
    return '#334155'
  }

  function getCardBg(status: CardStatus): string {
    if (status === 'saved') return '#10b98108'
    if (status === 'error') return '#ef444408'
    return '#0f172a'
  }

  function getStatusLabel(status: CardStatus): string {
    const map: Record<CardStatus, string> = {
      idle: '',
      saving: 'Saving...',
      saved: 'Saved',
      error: 'Error - retrying',
      settled: '',
    }
    return map[status]
  }

  function getStatusColor(status: CardStatus): string {
    const map: Record<CardStatus, string> = {
      idle: '#64748b',
      saving: '#f59e0b',
      saved: '#10b981',
      error: '#ef4444',
      settled: '#64748b',
    }
    return map[status]
  }

  function renderCards() {
    const allCards = cards.value
    const statuses = cardStatuses.value
    const drag = dragState.value
    const isDragging = drag !== null

    cardElementMap.clear()

    for (const col of COLUMNS) {
      const column = columnElements[col.id]
      const cardsContainer = column.querySelector('.cards-container')!
      cardsContainer.innerHTML = ''

      const colCards = allCards.filter((c) => c.column === col.id)

      // Update count
      const countEl = column.querySelector('.col-count')!
      countEl.textContent = String(colCards.length)

      for (const card of colCards) {
        const status: CardStatus = statuses[card.id] ?? 'idle'
        const isCardDragging = drag?.cardId === card.id
        const borderColor = getCardBorderColor(status)
        const bg = getCardBg(status)

        const cardEl = document.createElement('div')
        cardEl.style.cssText = `background: ${bg}; border: 2px solid ${borderColor}; border-radius: 12px; padding: 16px; margin-bottom: 10px; cursor: ${isCardDragging ? 'grabbing' : 'grab'}; opacity: ${isCardDragging ? 0.4 : 1}; transition: border-color 0.3s, background 0.3s, opacity 0.15s; user-select: none;`

        if (status === 'error') {
          cardEl.style.animation = 'shake 0.5s ease-in-out'
        } else if (status === 'saved') {
          cardEl.style.animation = 'flashGreen 0.6s ease-out'
        }

        const titleEl = document.createElement('p')
        titleEl.style.cssText = 'font-size: 15px; font-weight: 600; color: #e2e8f0; margin: 0; margin-bottom: 4px;'
        titleEl.textContent = card.title

        const descEl = document.createElement('p')
        descEl.style.cssText = 'font-size: 13px; color: #94a3b8; margin: 0; margin-bottom: 10px;'
        descEl.textContent = card.description

        const footerEl = document.createElement('div')
        footerEl.style.cssText = 'display: flex; align-items: center; justify-content: space-between;'

        const priorityBadge = document.createElement('span')
        const pColor = PRIORITY_COLORS[card.priority] ?? '#94a3b8'
        priorityBadge.style.cssText = `font-size: 11px; font-weight: 600; text-transform: uppercase; color: ${pColor}; background: ${pColor}22; padding: 2px 8px; border-radius: 8px;`
        priorityBadge.textContent = card.priority

        const rightSpan = document.createElement('span')
        const statusLabel = getStatusLabel(status)
        if (statusLabel) {
          const statusSpan = document.createElement('span')
          statusSpan.style.cssText = `font-size: 11px; font-weight: 600; color: ${getStatusColor(status)};`
          statusSpan.textContent = statusLabel
          rightSpan.appendChild(statusSpan)
        }

        if (status === 'saved' || status === 'error') {
          const undoBtn = document.createElement('button')
          undoBtn.style.cssText = 'font-size: 12px; color: #94a3b8; background: none; border: 1px solid #334155; border-radius: 6px; padding: 2px 8px; cursor: pointer; margin-left: 8px;'
          undoBtn.textContent = 'Undo'
          undoBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            engine.emit(UndoRequested, card.id)
          })
          rightSpan.appendChild(undoBtn)
        }

        footerEl.appendChild(priorityBadge)
        footerEl.appendChild(rightSpan)

        cardEl.appendChild(titleEl)
        cardEl.appendChild(descEl)
        cardEl.appendChild(footerEl)

        // Mouse down for drag
        cardEl.addEventListener('mousedown', (e) => {
          e.preventDefault()
          const rect = cardEl.getBoundingClientRect()
          engine.emit(DragStart, {
            cardId: card.id,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
          })
        })

        cardsContainer.appendChild(cardEl)
        cardElementMap.set(card.id, cardEl)
      }

      // Show/hide drop zone
      const dropZone = column.querySelector('.drop-zone') as HTMLElement
      dropZone.style.display = isDragging ? 'block' : 'none'
    }
  }

  // --- Global mouse handlers for drag ---

  function handleMouseMove(e: MouseEvent) {
    if (dragState.value) {
      engine.emit(DragMove, { x: e.clientX, y: e.clientY })
    }
  }

  function handleMouseUp() {
    if (dragState.value) {
      engine.emit(DragEnd, undefined)
    }
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)

  // Subscribe to state changes
  unsubs.push(cards.subscribe(() => renderCards()))
  unsubs.push(cardStatuses.subscribe(() => renderCards()))
  unsubs.push(dragState.subscribe(() => {
    renderCards()
    // Update ghost card visibility
    const drag = dragState.value
    if (!drag) {
      ghostCard.style.display = 'none'
    } else {
      const card = cards.value.find((c) => c.id === drag.cardId)
      if (card) {
        ghostCard.style.display = 'block'
        ghostTitle.textContent = card.title
        ghostDesc.textContent = card.description
      }
    }
  }))

  // Update ghost card position on every frame using spring values
  unsubs.push(engine.on(engine.frame, () => {
    const drag = dragState.value
    if (drag && ghostCard.style.display !== 'none') {
      ghostCard.style.left = `${dragSpringX.value - drag.offsetX}px`
      ghostCard.style.top = `${dragSpringY.value - drag.offsetY}px`
    }
  }))

  // Initial render
  renderCards()

  return () => {
    ;(window as any).__pulseEngine = null
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    unsubs.forEach((u) => u())
    if (ghostCard.parentNode) ghostCard.parentNode.removeChild(ghostCard)
    if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag)
  }
}
