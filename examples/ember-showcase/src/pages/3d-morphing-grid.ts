import {
  engine,
  GRID_SIZE,
  CELL_COUNT,
  SHAPES,
  CycleNext,
  ToggleAutoCycle,
  RandomizeColors,
  MorphCell,
  CellMorphStart,
  cells,
  currentShapeIndex,
  autoCycle,
  cellScale,
  startAutoCycle,
  stopAutoCycle,
  type Shape,
} from '../engines/3d-morphing-grid'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #1a1a2e; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center;'

  const h1 = document.createElement('h1')
  h1.style.cssText = 'color: #fff; font-size: 36px; font-weight: 800; margin-bottom: 8px; text-align: center;'
  h1.textContent = '3D Morphing Grid'
  wrapper.appendChild(h1)

  const sub = document.createElement('p')
  sub.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 30px; text-align: center;'
  sub.textContent = '4x4 grid morphs between shapes with staggered diagonal tweens. Click cells or use controls.'
  wrapper.appendChild(sub)

  // Controls
  const controls = document.createElement('div')
  controls.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 30px;'

  const cycleBtn = document.createElement('button')
  cycleBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #4361ee; color: #fff; font-weight: 600; cursor: pointer;'
  cycleBtn.textContent = 'Cycle Shape'
  cycleBtn.addEventListener('click', () => engine.emit(CycleNext, undefined))

  const autoBtn = document.createElement('button')
  autoBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #2a9d8f; color: #fff; font-weight: 600; cursor: pointer;'
  autoBtn.addEventListener('click', () => engine.emit(ToggleAutoCycle, undefined))

  const colorBtn = document.createElement('button')
  colorBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #7209b7; color: #fff; font-weight: 600; cursor: pointer;'
  colorBtn.textContent = 'Randomize Colors'
  colorBtn.addEventListener('click', () => engine.emit(RandomizeColors, undefined))

  // Shape buttons
  for (const shape of SHAPES) {
    const btn = document.createElement('button')
    btn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 8px; background: rgba(255,255,255,0.1); color: #fff; font-weight: 600; cursor: pointer;'
    btn.textContent = shape.charAt(0).toUpperCase() + shape.slice(1)
    btn.addEventListener('click', () => {
      for (let i = 0; i < CELL_COUNT; i++) {
        const row = Math.floor(i / GRID_SIZE)
        const col = i % GRID_SIZE
        setTimeout(() => {
          engine.emit(CellMorphStart[i], i)
          engine.emit(MorphCell, { index: i, shape })
        }, (row + col) * 60)
      }
    })
    controls.appendChild(btn)
  }

  controls.insertBefore(cycleBtn, controls.firstChild)
  controls.insertBefore(autoBtn, controls.children[1])
  controls.insertBefore(colorBtn, controls.children[2])
  wrapper.appendChild(controls)

  // Grid
  const CELL_PX = 100
  const GAP = 12
  const gridEl = document.createElement('div')
  gridEl.style.cssText = `display: grid; grid-template-columns: repeat(${GRID_SIZE}, ${CELL_PX}px); gap: ${GAP}px;`

  const cellEls: HTMLElement[] = []
  const shapeEls: HTMLElement[] = []

  for (let i = 0; i < CELL_COUNT; i++) {
    const cellEl = document.createElement('div')
    cellEl.style.cssText = `width: ${CELL_PX}px; height: ${CELL_PX}px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: rgba(255,255,255,0.03); border-radius: 12px;`

    const shapeEl = document.createElement('div')
    shapeEl.style.cssText = 'width: 60px; height: 60px; transition: none;'
    cellEl.appendChild(shapeEl)

    cellEl.addEventListener('click', () => {
      const nextShape = SHAPES[(SHAPES.indexOf(cells.value[i].shape) + 1) % SHAPES.length]
      engine.emit(CellMorphStart[i], i)
      engine.emit(MorphCell, { index: i, shape: nextShape })
    })

    gridEl.appendChild(cellEl)
    cellEls.push(cellEl)
    shapeEls.push(shapeEl)
  }

  wrapper.appendChild(gridEl)

  // Info
  const info = document.createElement('div')
  info.style.cssText = 'color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 24px; text-align: center;'
  wrapper.appendChild(info)

  container.appendChild(wrapper)

  startAutoCycle()

  function applyShape(el: HTMLElement, shape: Shape, color: string, scale: number) {
    el.style.transform = `scale(${scale})`

    if (shape === 'circle') {
      el.style.cssText = `width: 60px; height: 60px; border-radius: 50%; background: ${color}; transform: scale(${scale});`
    } else if (shape === 'square') {
      el.style.cssText = `width: 60px; height: 60px; border-radius: 8px; background: ${color}; transform: scale(${scale});`
    } else if (shape === 'diamond') {
      el.style.cssText = `width: 50px; height: 50px; border-radius: 4px; background: ${color}; transform: rotate(45deg) scale(${scale});`
    } else if (shape === 'triangle') {
      el.style.cssText = `width: 0; height: 0; border-left: 30px solid transparent; border-right: 30px solid transparent; border-bottom: 55px solid ${color}; background: transparent; transform: scale(${scale});`
    }
  }

  // Frame update
  unsubs.push(engine.on(engine.frame, () => {
    const cellStates = cells.value
    for (let i = 0; i < CELL_COUNT; i++) {
      const cell = cellStates[i]
      const scale = cellScale[i].active ? cellScale[i].value : 1
      applyShape(shapeEls[i], cell.shape, cell.color, scale)
    }

    autoBtn.textContent = autoCycle.value ? 'Auto: ON' : 'Auto: OFF'
    autoBtn.style.background = autoCycle.value ? '#2a9d8f' : '#666'

    const nextShape = SHAPES[currentShapeIndex.value]
    info.textContent = `Next shape: ${nextShape} | Click cells to cycle individually`
  }))

  return () => {
    ;(window as any).__pulseEngine = null
    stopAutoCycle()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
