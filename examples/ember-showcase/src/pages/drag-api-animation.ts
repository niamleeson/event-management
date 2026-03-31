import {
  engine,
  getCards,
  getDragState,
  getCardStatuses,
  getDragSpringX,
  getDragSpringY,
  updateFrame,
  DragStart,
  DragMove,
  DragEnd,
  CardMoved,
  UndoRequested,
  CardsChanged,
  StatusesChanged,
  type KanbanCard,
  type ColumnId,
  type CardStatus,
} from '../engines/drag-api-animation'

const COLUMNS: { id: ColumnId; title: string; color: string }[] = [
  { id: 'todo', title: 'Todo', color: '#4361ee' },
  { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' },
]

const PRIORITY_COLORS: Record<string, string> = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' }

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []
  let rafId = 0

  const styleTag = document.createElement('style')
  styleTag.textContent = `
    @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
    @keyframes flashGreen { 0% { background: #10b98122; } 100% { background: #0f172a; } }
  `
  document.head.appendChild(styleTag)

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #0f172a; padding: 32px 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  container.appendChild(wrapper)

  const headerDiv = document.createElement('div')
  headerDiv.style.cssText = 'text-align: center; margin-bottom: 32px;'
  headerDiv.innerHTML = `<h1 style="font-size: 36px; font-weight: 800; color: #f1f5f9; margin: 0;">Pulse Kanban</h1><p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">Drag cards between columns. Smooth follow. Saves auto-retry on failure.</p>`
  wrapper.appendChild(headerDiv)

  const board = document.createElement('div')
  board.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1100px; margin: 0 auto;'

  const columnElements: Record<string, HTMLElement> = {}

  for (const col of COLUMNS) {
    const column = document.createElement('div')
    column.style.cssText = `background: #1e293b; border-radius: 16px; padding: 16px; min-height: 400px; border-top: 3px solid ${col.color};`
    column.dataset.columnId = col.id
    columnElements[col.id] = column

    const colHeader = document.createElement('div')
    colHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 0 4px;'
    colHeader.innerHTML = `<span style="font-size: 16px; font-weight: 700; color: #e2e8f0;">${col.title}</span><span class="col-count" style="font-size: 13px; font-weight: 600; color: ${col.color}; background: ${col.color}22; padding: 2px 10px; border-radius: 12px;"></span>`
    column.appendChild(colHeader)

    const cardsContainer = document.createElement('div')
    cardsContainer.className = 'cards-container'
    column.appendChild(cardsContainer)

    const dropZone = document.createElement('div')
    dropZone.className = 'drop-zone'
    dropZone.style.cssText = 'min-height: 60px; border: 2px dashed transparent; border-radius: 8px; transition: border-color 0.2s, background 0.2s; display: none;'
    dropZone.innerHTML = `<div style="padding: 20px; text-align: center; color: #475569; font-size: 13px;">Drop here</div>`
    dropZone.addEventListener('mouseenter', () => { dropZone.style.borderColor = '#4361ee'; dropZone.style.background = '#4361ee11' })
    dropZone.addEventListener('mouseleave', () => { dropZone.style.borderColor = 'transparent'; dropZone.style.background = 'transparent' })
    dropZone.addEventListener('mouseup', () => {
      const drag = getDragState()
      if (drag) {
        const card = getCards().find((c) => c.id === drag.cardId)
        if (card && card.column !== col.id) {
          engine.emit(CardMoved, { cardId: drag.cardId, fromColumn: card.column, toColumn: col.id })
        }
        engine.emit(DragEnd, undefined)
      }
    })
    column.appendChild(dropZone)
    board.appendChild(column)
  }

  wrapper.appendChild(board)

  const ghostCard = document.createElement('div')
  ghostCard.style.cssText = 'position: fixed; pointer-events: none; z-index: 1000; width: 300px; background: #1e293b; border: 2px solid #4361ee; border-radius: 12px; padding: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); display: none;'
  const ghostTitle = document.createElement('p')
  ghostTitle.style.cssText = 'font-size: 15px; font-weight: 600; color: #e2e8f0; margin: 0; margin-bottom: 4px;'
  const ghostDesc = document.createElement('p')
  ghostDesc.style.cssText = 'font-size: 13px; color: #94a3b8; margin: 0;'
  ghostCard.appendChild(ghostTitle)
  ghostCard.appendChild(ghostDesc)
  document.body.appendChild(ghostCard)

  function getStatusLabel(s: CardStatus): string { return { idle: '', saving: 'Saving...', saved: 'Saved', error: 'Error - retrying', settled: '' }[s] }
  function getStatusColor(s: CardStatus): string { return { idle: '#64748b', saving: '#f59e0b', saved: '#10b981', error: '#ef4444', settled: '#64748b' }[s] }
  function getCardBorder(s: CardStatus): string { return { idle: '#334155', saving: '#f59e0b', saved: '#10b981', error: '#ef4444', settled: '#334155' }[s] }

  function renderCards() {
    const allCards = getCards()
    const statuses = getCardStatuses()
    const drag = getDragState()
    const isDragging = drag !== null

    for (const col of COLUMNS) {
      const column = columnElements[col.id]
      const cardsContainer = column.querySelector('.cards-container')!
      cardsContainer.innerHTML = ''
      const colCards = allCards.filter((c) => c.column === col.id)
      column.querySelector('.col-count')!.textContent = String(colCards.length)

      for (const card of colCards) {
        const status: CardStatus = statuses[card.id] ?? 'idle'
        const isCardDragging = drag?.cardId === card.id
        const cardEl = document.createElement('div')
        cardEl.style.cssText = `background: ${status === 'saved' ? '#10b98108' : status === 'error' ? '#ef444408' : '#0f172a'}; border: 2px solid ${getCardBorder(status)}; border-radius: 12px; padding: 16px; margin-bottom: 10px; cursor: ${isCardDragging ? 'grabbing' : 'grab'}; opacity: ${isCardDragging ? 0.4 : 1}; transition: border-color 0.3s, background 0.3s, opacity 0.15s; user-select: none;`
        if (status === 'error') cardEl.style.animation = 'shake 0.5s ease-in-out'
        else if (status === 'saved') cardEl.style.animation = 'flashGreen 0.6s ease-out'

        cardEl.innerHTML = `<p style="font-size: 15px; font-weight: 600; color: #e2e8f0; margin: 0 0 4px;">${card.title}</p><p style="font-size: 13px; color: #94a3b8; margin: 0 0 10px;">${card.description}</p>`
        const footerEl = document.createElement('div')
        footerEl.style.cssText = 'display: flex; align-items: center; justify-content: space-between;'
        const pColor = PRIORITY_COLORS[card.priority] ?? '#94a3b8'
        footerEl.innerHTML = `<span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: ${pColor}; background: ${pColor}22; padding: 2px 8px; border-radius: 8px;">${card.priority}</span>`
        const rightSpan = document.createElement('span')
        const label = getStatusLabel(status)
        if (label) { const s = document.createElement('span'); s.style.cssText = `font-size: 11px; font-weight: 600; color: ${getStatusColor(status)};`; s.textContent = label; rightSpan.appendChild(s) }
        if (status === 'saved' || status === 'error') {
          const undoBtn = document.createElement('button')
          undoBtn.style.cssText = 'font-size: 12px; color: #94a3b8; background: none; border: 1px solid #334155; border-radius: 6px; padding: 2px 8px; cursor: pointer; margin-left: 8px;'
          undoBtn.textContent = 'Undo'
          undoBtn.addEventListener('click', (e) => { e.stopPropagation(); engine.emit(UndoRequested, card.id) })
          rightSpan.appendChild(undoBtn)
        }
        footerEl.appendChild(rightSpan)
        cardEl.appendChild(footerEl)

        cardEl.addEventListener('mousedown', (e) => {
          e.preventDefault()
          const rect = cardEl.getBoundingClientRect()
          engine.emit(DragStart, { cardId: card.id, startX: e.clientX, startY: e.clientY, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top })
        })
        cardsContainer.appendChild(cardEl)
      }
      const dropZone = column.querySelector('.drop-zone') as HTMLElement
      dropZone.style.display = isDragging ? 'block' : 'none'
    }
  }

  function handleMouseMove(e: MouseEvent) { if (getDragState()) engine.emit(DragMove, { x: e.clientX, y: e.clientY }) }
  function handleMouseUp() { if (getDragState()) engine.emit(DragEnd, undefined) }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)

  unsubs.push(engine.on(CardsChanged, () => {
    renderCards()
    const drag = getDragState()
    if (!drag) { ghostCard.style.display = 'none' }
    else { const card = getCards().find((c) => c.id === drag.cardId); if (card) { ghostCard.style.display = 'block'; ghostTitle.textContent = card.title; ghostDesc.textContent = card.description } }
  }))
  unsubs.push(engine.on(StatusesChanged, () => renderCards()))

  function frame() {
    updateFrame()
    const drag = getDragState()
    if (drag && ghostCard.style.display !== 'none') {
      ghostCard.style.left = `${getDragSpringX() - drag.offsetX}px`
      ghostCard.style.top = `${getDragSpringY() - drag.offsetY}px`
    }
    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)

  renderCards()

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    cancelAnimationFrame(rafId)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    unsubs.forEach((u) => u())
    if (ghostCard.parentNode) ghostCard.parentNode.removeChild(ghostCard)
    if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag)
  }
}
