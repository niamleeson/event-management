import {
  engine,
  GRID_COLS,
  CELL_SIZE,
  GAP,
  ITEM_COUNT,
  DragStart,
  DragOver,
  DragEnd,
  Shuffle,
  Reset,
  items,
  draggedItem,
  itemSpringsX,
  itemSpringsY,
  getPosition,
} from '../engines/sortable-grid'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 600px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'Sortable Grid'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 16px;'
  sub.textContent = 'Drag to reorder items with spring-animated position transitions. Shuffle for randomized reflow.'
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Controls
  const controls = document.createElement('div')
  controls.style.cssText = 'display: flex; gap: 8px; margin-bottom: 20px;'

  const shuffleBtn = document.createElement('button')
  shuffleBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #4361ee; color: #fff; font-weight: 600; cursor: pointer;'
  shuffleBtn.textContent = 'Shuffle'
  shuffleBtn.addEventListener('click', () => engine.emit(Shuffle, undefined))

  const resetBtn = document.createElement('button')
  resetBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #e4e7ec; color: #344054; font-weight: 600; cursor: pointer;'
  resetBtn.textContent = 'Reset'
  resetBtn.addEventListener('click', () => engine.emit(Reset, undefined))

  controls.appendChild(shuffleBtn)
  controls.appendChild(resetBtn)
  wrapper.appendChild(controls)

  // Grid container
  const rows = Math.ceil(ITEM_COUNT / GRID_COLS)
  const gridWidth = GRID_COLS * (CELL_SIZE + GAP) - GAP
  const gridHeight = rows * (CELL_SIZE + GAP) - GAP

  const gridContainer = document.createElement('div')
  gridContainer.style.cssText = `position: relative; width: ${gridWidth}px; height: ${gridHeight}px; margin: 0 auto;`

  const itemEls: HTMLElement[] = []

  for (let i = 0; i < ITEM_COUNT; i++) {
    const item = items.value[i]
    const el = document.createElement('div')
    el.style.cssText = `position: absolute; width: ${CELL_SIZE}px; height: ${CELL_SIZE}px; border-radius: 16px; background: ${item.color}; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 28px; font-weight: 800; cursor: grab; user-select: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: none;`
    el.textContent = item.label

    // Drag handling
    el.addEventListener('mousedown', (e) => {
      e.preventDefault()
      el.style.cursor = 'grabbing'
      el.style.zIndex = '10'
      el.style.transform = 'scale(1.1)'
      engine.emit(DragStart, i)

      const onMove = (ev: MouseEvent) => {
        // Determine which grid cell the mouse is over
        const rect = gridContainer.getBoundingClientRect()
        const x = ev.clientX - rect.left
        const y = ev.clientY - rect.top
        const col = Math.min(GRID_COLS - 1, Math.max(0, Math.floor(x / (CELL_SIZE + GAP))))
        const row = Math.min(rows - 1, Math.max(0, Math.floor(y / (CELL_SIZE + GAP))))
        const targetOrder = row * GRID_COLS + col
        if (targetOrder < ITEM_COUNT) {
          engine.emit(DragOver, targetOrder)
        }
      }

      const onUp = () => {
        el.style.cursor = 'grab'
        el.style.zIndex = ''
        el.style.transform = ''
        engine.emit(DragEnd, undefined)
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })

    gridContainer.appendChild(el)
    itemEls.push(el)
  }

  wrapper.appendChild(gridContainer)

  // Info
  const info = document.createElement('div')
  info.style.cssText = 'margin-top: 16px; font-size: 12px; color: #98a2b3; text-align: center;'
  wrapper.appendChild(info)

  container.appendChild(wrapper)

  // Frame loop — update spring positions
  unsubs.push(engine.on(engine.frame, () => {
    const dragging = draggedItem.value

    for (let i = 0; i < ITEM_COUNT; i++) {
      const x = itemSpringsX[i].value
      const y = itemSpringsY[i].value
      const el = itemEls[i]

      if (dragging === i) {
        // Dragged item follows spring but with scale
        el.style.left = `${x}px`
        el.style.top = `${y}px`
      } else {
        el.style.left = `${x}px`
        el.style.top = `${y}px`
      }
    }

    const currentItems = items.value
    const order = currentItems.map((it) => it.label).join(', ')
    info.textContent = `Order: ${order}`
  }))

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
