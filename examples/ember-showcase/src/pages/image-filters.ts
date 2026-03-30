import {
  engine,
  FILTER_DEFS,
  FilterValueChanged,
  FilterToggled,
  UndoFilter,
  RedoFilter,
  ResetFilters,
  ToggleSplitView,
  filters,
  splitView,
  undoHistory,
  redoHistory,
  buildFilterCSS,
} from '../engines/image-filters'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 900px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'Image Filters'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 16px;'
  sub.textContent = 'CSS filter pipeline with reorder, toggle, undo/redo, and split view comparison.'
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Toolbar
  const toolbar = document.createElement('div')
  toolbar.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;'

  const undoBtn = document.createElement('button')
  undoBtn.style.cssText = 'padding: 6px 14px; border: none; border-radius: 6px; background: #e4e7ec; color: #344054; font-size: 13px; font-weight: 600; cursor: pointer;'
  undoBtn.textContent = 'Undo'
  undoBtn.addEventListener('click', () => engine.emit(UndoFilter, undefined))

  const redoBtn = document.createElement('button')
  redoBtn.style.cssText = 'padding: 6px 14px; border: none; border-radius: 6px; background: #e4e7ec; color: #344054; font-size: 13px; font-weight: 600; cursor: pointer;'
  redoBtn.textContent = 'Redo'
  redoBtn.addEventListener('click', () => engine.emit(RedoFilter, undefined))

  const resetBtn = document.createElement('button')
  resetBtn.style.cssText = 'padding: 6px 14px; border: none; border-radius: 6px; background: #e63946; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;'
  resetBtn.textContent = 'Reset All'
  resetBtn.addEventListener('click', () => engine.emit(ResetFilters, undefined))

  const splitBtn = document.createElement('button')
  splitBtn.style.cssText = 'padding: 6px 14px; border: none; border-radius: 6px; background: #4361ee; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;'
  splitBtn.addEventListener('click', () => engine.emit(ToggleSplitView, undefined))

  toolbar.appendChild(undoBtn)
  toolbar.appendChild(redoBtn)
  toolbar.appendChild(resetBtn)
  toolbar.appendChild(splitBtn)
  wrapper.appendChild(toolbar)

  // Image preview area
  const previewArea = document.createElement('div')
  previewArea.style.cssText = 'display: flex; gap: 0; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1px solid #e4e7ec; position: relative;'

  // Generate a gradient "image" placeholder
  const imageCSS = 'width: 100%; height: 280px; background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #ffc413 100%); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); font-size: 18px; font-weight: 600;'

  const filteredImage = document.createElement('div')
  filteredImage.style.cssText = imageCSS
  filteredImage.textContent = 'Filtered Preview'

  const originalImage = document.createElement('div')
  originalImage.style.cssText = imageCSS + ' display: none;'
  originalImage.textContent = 'Original'

  previewArea.appendChild(filteredImage)
  previewArea.appendChild(originalImage)
  wrapper.appendChild(previewArea)

  // Filter CSS display
  const cssDisplay = document.createElement('div')
  cssDisplay.style.cssText = 'font-family: monospace; font-size: 12px; color: #667085; background: #f8f9fa; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; word-break: break-all;'
  wrapper.appendChild(cssDisplay)

  // Filter controls
  const filtersPanel = document.createElement('div')
  filtersPanel.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;'

  const sliderEls: Record<string, { slider: HTMLInputElement; valueLabel: HTMLElement; toggleBtn: HTMLButtonElement }> = {}

  for (const def of FILTER_DEFS) {
    const card = document.createElement('div')
    card.style.cssText = 'background: #fff; border: 1px solid #e4e7ec; border-radius: 8px; padding: 12px;'

    const headerRow = document.createElement('div')
    headerRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;'

    const label = document.createElement('div')
    label.style.cssText = 'font-size: 13px; font-weight: 700; color: #344054;'
    label.textContent = def.name

    const toggleBtn = document.createElement('button')
    toggleBtn.style.cssText = 'padding: 2px 8px; border: none; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;'
    toggleBtn.addEventListener('click', () => engine.emit(FilterToggled, def.id))

    headerRow.appendChild(label)
    headerRow.appendChild(toggleBtn)

    const sliderRow = document.createElement('div')
    sliderRow.style.cssText = 'display: flex; align-items: center; gap: 8px;'

    const slider = document.createElement('input')
    slider.type = 'range'
    slider.min = String(def.min)
    slider.max = String(def.max)
    slider.step = String(def.step)
    slider.style.cssText = 'flex: 1; accent-color: #4361ee;'
    slider.addEventListener('input', () => {
      engine.emit(FilterValueChanged, { id: def.id, value: parseFloat(slider.value) })
    })

    const valueLabel = document.createElement('div')
    valueLabel.style.cssText = 'font-size: 12px; font-weight: 600; color: #4361ee; min-width: 50px; text-align: right;'

    sliderRow.appendChild(slider)
    sliderRow.appendChild(valueLabel)

    card.appendChild(headerRow)
    card.appendChild(sliderRow)
    filtersPanel.appendChild(card)

    sliderEls[def.id] = { slider, valueLabel, toggleBtn }
  }

  wrapper.appendChild(filtersPanel)
  container.appendChild(wrapper)

  // Render
  function render() {
    const currentFilters = filters.value
    const isSplit = splitView.value
    const filterCSS = buildFilterCSS(currentFilters)

    // Preview
    filteredImage.style.filter = filterCSS
    filteredImage.style.width = isSplit ? '50%' : '100%'
    originalImage.style.display = isSplit ? 'flex' : 'none'
    originalImage.style.width = '50%'

    splitBtn.textContent = isSplit ? 'Hide Original' : 'Split View'

    // CSS display
    cssDisplay.textContent = `filter: ${filterCSS || 'none'};`

    // Slider states
    for (const f of currentFilters) {
      const el = sliderEls[f.id]
      if (!el) continue
      const def = FILTER_DEFS.find((d) => d.id === f.id)!

      el.slider.value = String(f.value)
      el.valueLabel.textContent = `${f.value}${def.unit}`
      el.slider.disabled = !f.enabled
      el.slider.style.opacity = f.enabled ? '1' : '0.4'
      el.toggleBtn.textContent = f.enabled ? 'ON' : 'OFF'
      el.toggleBtn.style.background = f.enabled ? '#ecfdf3' : '#fef3f2'
      el.toggleBtn.style.color = f.enabled ? '#065f46' : '#b42318'
    }

    // Undo/redo button states
    undoBtn.disabled = undoHistory.value.length === 0
    undoBtn.style.opacity = undoHistory.value.length === 0 ? '0.5' : '1'
    redoBtn.disabled = redoHistory.value.length === 0
    redoBtn.style.opacity = redoHistory.value.length === 0 ? '0.5' : '1'
  }

  unsubs.push(filters.subscribe(() => render()))
  unsubs.push(splitView.subscribe(() => render()))
  unsubs.push(undoHistory.subscribe(() => render()))
  unsubs.push(redoHistory.subscribe(() => render()))

  render()

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
