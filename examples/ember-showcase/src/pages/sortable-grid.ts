import { engine, GRID_COLS, CELL_SIZE, GAP, ITEM_COUNT, DragStart, DragOver, DragEnd, Shuffle, Reset, getItems, getDraggedItem, getSpringX, getSpringY, getPosition, updateFrame, GridChanged } from '../engines/sortable-grid'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []; let rafId = 0
  const wrapper = document.createElement('div'); wrapper.style.cssText = 'max-width: 600px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center;'
  wrapper.innerHTML = `<h2 style="font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;">Sortable Grid</h2><p style="color: #666; font-size: 14px; margin-bottom: 24px;">Drag to reorder. Spring physics for smooth positions.</p>`

  const controls = document.createElement('div'); controls.style.cssText = 'display: flex; gap: 8px; margin-bottom: 24px;'
  const shuffleBtn = document.createElement('button'); shuffleBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #4361ee; color: #fff; font-weight: 600; cursor: pointer;'; shuffleBtn.textContent = 'Shuffle'; shuffleBtn.addEventListener('click', () => engine.emit(Shuffle, undefined))
  const resetBtn = document.createElement('button'); resetBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #e63946; color: #fff; font-weight: 600; cursor: pointer;'; resetBtn.textContent = 'Reset'; resetBtn.addEventListener('click', () => engine.emit(Reset, undefined))
  controls.appendChild(shuffleBtn); controls.appendChild(resetBtn); wrapper.appendChild(controls)

  const totalWidth = GRID_COLS * (CELL_SIZE + GAP) - GAP; const totalRows = Math.ceil(ITEM_COUNT / GRID_COLS); const totalHeight = totalRows * (CELL_SIZE + GAP) - GAP
  const gridEl = document.createElement('div'); gridEl.style.cssText = `position: relative; width: ${totalWidth}px; height: ${totalHeight}px;`
  const itemEls: HTMLElement[] = []
  for (let i = 0; i < ITEM_COUNT; i++) {
    const el = document.createElement('div'); const items = getItems(); const item = items.find((it) => it.id === i)!
    el.style.cssText = `position: absolute; width: ${CELL_SIZE}px; height: ${CELL_SIZE}px; border-radius: 12px; background: ${item.color}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; cursor: grab; user-select: none; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: box-shadow 0.2s;`
    el.textContent = item.label
    el.addEventListener('mousedown', (e) => { e.preventDefault(); engine.emit(DragStart, i) })
    el.addEventListener('mouseenter', () => { if (getDraggedItem() !== null && getDraggedItem() !== i) { const item = getItems().find((it) => it.id === i); if (item) engine.emit(DragOver, item.order) } })
    gridEl.appendChild(el); itemEls.push(el)
  }
  wrapper.appendChild(gridEl)

  const onMouseUp = () => { if (getDraggedItem() !== null) engine.emit(DragEnd, undefined) }
  document.addEventListener('mouseup', onMouseUp)
  container.appendChild(wrapper)

  function frame() {
    updateFrame()
    const dragged = getDraggedItem()
    for (let i = 0; i < ITEM_COUNT; i++) {
      const x = getSpringX(i); const y = getSpringY(i)
      itemEls[i].style.left = `${x}px`; itemEls[i].style.top = `${y}px`
      itemEls[i].style.opacity = dragged === i ? '0.6' : '1'
      itemEls[i].style.zIndex = dragged === i ? '10' : '1'
      itemEls[i].style.cursor = dragged !== null ? 'grabbing' : 'grab'
    }
    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)

  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); cancelAnimationFrame(rafId); document.removeEventListener('mouseup', onMouseUp); unsubs.forEach((u) => u()) }
}
