import { engine, GRID_SIZE, CELL_COUNT, SHAPES, CycleNext, ToggleAutoCycle, RandomizeColors, getCells, getCellScale, getAutoCycle, updateFrame, startAutoCycle, stopAutoCycle, CellsChanged, type Shape } from '../engines/3d-morphing-grid'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  let rafId = 0; const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #1a1a2e; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center;'
  wrapper.innerHTML = `<h1 style="color: #fff; font-size: 36px; font-weight: 800; margin-bottom: 8px;">3D Morphing Grid</h1><p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 30px;">4x4 grid morphs between shapes with staggered diagonal tweens.</p>`

  const controls = document.createElement('div'); controls.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 30px;'
  const cycleBtn = document.createElement('button'); cycleBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #4361ee; color: #fff; font-weight: 600; cursor: pointer;'; cycleBtn.textContent = 'Cycle Shape'; cycleBtn.addEventListener('click', () => engine.emit(CycleNext, undefined)); controls.appendChild(cycleBtn)
  const autoBtn = document.createElement('button'); autoBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #2a9d8f; color: #fff; font-weight: 600; cursor: pointer;'; autoBtn.addEventListener('click', () => engine.emit(ToggleAutoCycle, undefined)); controls.appendChild(autoBtn)
  const colorBtn = document.createElement('button'); colorBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #7209b7; color: #fff; font-weight: 600; cursor: pointer;'; colorBtn.textContent = 'Randomize Colors'; colorBtn.addEventListener('click', () => engine.emit(RandomizeColors, undefined)); controls.appendChild(colorBtn)
  wrapper.appendChild(controls)

  const CELL_PX = 100
  const gridEl = document.createElement('div'); gridEl.style.cssText = `display: grid; grid-template-columns: repeat(${GRID_SIZE}, ${CELL_PX}px); gap: 12px;`
  const shapeEls: HTMLElement[] = []
  for (let i = 0; i < CELL_COUNT; i++) {
    const cellEl = document.createElement('div'); cellEl.style.cssText = `width: ${CELL_PX}px; height: ${CELL_PX}px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: rgba(255,255,255,0.03); border-radius: 12px;`
    const shapeEl = document.createElement('div'); shapeEl.style.cssText = 'width: 60px; height: 60px;'
    cellEl.appendChild(shapeEl)
    cellEl.addEventListener('click', () => { const nextShape = SHAPES[(SHAPES.indexOf(getCells()[i].shape) + 1) % SHAPES.length]; engine.emit(CycleNext, undefined) })
    gridEl.appendChild(cellEl); shapeEls.push(shapeEl)
  }
  wrapper.appendChild(gridEl)
  const info = document.createElement('div'); info.style.cssText = 'color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 24px;'; wrapper.appendChild(info)
  container.appendChild(wrapper); startAutoCycle()

  function applyShape(el: HTMLElement, shape: Shape, color: string, scale: number) {
    if (shape === 'circle') el.style.cssText = `width: 60px; height: 60px; border-radius: 50%; background: ${color}; transform: scale(${scale});`
    else if (shape === 'square') el.style.cssText = `width: 60px; height: 60px; border-radius: 8px; background: ${color}; transform: scale(${scale});`
    else if (shape === 'diamond') el.style.cssText = `width: 50px; height: 50px; border-radius: 4px; background: ${color}; transform: rotate(45deg) scale(${scale});`
    else el.style.cssText = `width: 0; height: 0; border-left: 30px solid transparent; border-right: 30px solid transparent; border-bottom: 55px solid ${color}; background: transparent; transform: scale(${scale});`
  }

  function frame(now: number) {
    updateFrame(now)
    const cellStates = getCells()
    for (let i = 0; i < CELL_COUNT; i++) { const cell = cellStates[i]; applyShape(shapeEls[i], cell.shape, cell.color, getCellScale(i)) }
    autoBtn.textContent = getAutoCycle() ? 'Auto: ON' : 'Auto: OFF'; autoBtn.style.background = getAutoCycle() ? '#2a9d8f' : '#666'
    info.textContent = 'Click cells to cycle individually'
    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)

  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); cancelAnimationFrame(rafId); stopAutoCycle(); unsubs.forEach((u) => u()) }
}
