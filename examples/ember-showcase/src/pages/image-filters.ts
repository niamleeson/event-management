import { engine, FILTER_DEFS, FilterValueChanged, FilterToggled, UndoFilter, RedoFilter, ResetFilters, ToggleSplitView, getFilters, getSplitView, getUndoHistory, getRedoHistory, buildFilterCSS, FiltersChanged } from '../engines/image-filters'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const wrapper = document.createElement('div'); wrapper.style.cssText = 'max-width: 900px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  wrapper.innerHTML = `<h2 style="font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;">Image Filters</h2><p style="color: #666; font-size: 14px; margin-bottom: 16px;">CSS filter pipeline with toggle, undo/redo.</p>`

  const controls = document.createElement('div'); controls.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;'
  const undoBtn = document.createElement('button'); undoBtn.style.cssText = 'padding: 6px 14px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px;'; undoBtn.textContent = 'Undo'; undoBtn.addEventListener('click', () => engine.emit(UndoFilter, undefined))
  const redoBtn = document.createElement('button'); redoBtn.style.cssText = 'padding: 6px 14px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px;'; redoBtn.textContent = 'Redo'; redoBtn.addEventListener('click', () => engine.emit(RedoFilter, undefined))
  const resetBtn = document.createElement('button'); resetBtn.style.cssText = 'padding: 6px 14px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px;'; resetBtn.textContent = 'Reset'; resetBtn.addEventListener('click', () => engine.emit(ResetFilters, undefined))
  const splitBtn = document.createElement('button'); splitBtn.style.cssText = 'padding: 6px 14px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px;'; splitBtn.textContent = 'Split View'; splitBtn.addEventListener('click', () => engine.emit(ToggleSplitView, undefined))
  controls.appendChild(undoBtn); controls.appendChild(redoBtn); controls.appendChild(resetBtn); controls.appendChild(splitBtn); wrapper.appendChild(controls)

  const imageArea = document.createElement('div'); imageArea.style.cssText = 'display: flex; gap: 16px; margin-bottom: 24px;'
  const imgEl = document.createElement('div'); imgEl.style.cssText = 'flex: 1; height: 300px; background: linear-gradient(135deg, #4361ee, #7209b7, #f72585, #4cc9f0); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #fff; transition: filter 0.3s;'; imgEl.textContent = 'Sample Image'
  const origEl = document.createElement('div'); origEl.style.cssText = 'flex: 1; height: 300px; background: linear-gradient(135deg, #4361ee, #7209b7, #f72585, #4cc9f0); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #fff; display: none;'; origEl.textContent = 'Original'
  imageArea.appendChild(imgEl); imageArea.appendChild(origEl); wrapper.appendChild(imageArea)

  const slidersArea = document.createElement('div'); slidersArea.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;'
  const sliderEls: Record<string, HTMLInputElement> = {}; const valueEls: Record<string, HTMLElement> = {}
  for (const def of FILTER_DEFS) {
    const group = document.createElement('div'); group.style.cssText = 'padding: 12px; background: #f8f9fa; border-radius: 8px;'
    const header = document.createElement('div'); header.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 6px;'
    header.innerHTML = `<span style="font-size: 13px; font-weight: 600; color: #344054;">${def.name}</span>`
    const valueSpan = document.createElement('span'); valueSpan.style.cssText = 'font-size: 12px; color: #667085;'; header.appendChild(valueSpan); valueEls[def.id] = valueSpan
    const slider = document.createElement('input'); slider.type = 'range'; slider.min = String(def.min); slider.max = String(def.max); slider.step = String(def.step); slider.style.cssText = 'width: 100%;'
    slider.addEventListener('input', () => engine.emit(FilterValueChanged, { id: def.id, value: Number(slider.value) })); sliderEls[def.id] = slider
    const toggleBtn = document.createElement('button'); toggleBtn.style.cssText = 'font-size: 11px; padding: 2px 8px; border: 1px solid #e0e0e0; border-radius: 4px; background: #fff; cursor: pointer; margin-top: 4px;'; toggleBtn.textContent = 'Toggle'; toggleBtn.addEventListener('click', () => engine.emit(FilterToggled, def.id))
    group.appendChild(header); group.appendChild(slider); group.appendChild(toggleBtn); slidersArea.appendChild(group)
  }
  wrapper.appendChild(slidersArea)
  const cssOutput = document.createElement('div'); cssOutput.style.cssText = 'margin-top: 16px; font-size: 12px; color: #667085; font-family: monospace; background: #f8f9fa; padding: 12px; border-radius: 8px; word-break: break-all;'; wrapper.appendChild(cssOutput)
  container.appendChild(wrapper)

  function render() {
    const filters = getFilters(); const css = buildFilterCSS(filters); imgEl.style.filter = css; origEl.style.display = getSplitView() ? 'flex' : 'none'
    for (const f of filters) { if (sliderEls[f.id]) sliderEls[f.id].value = String(f.value); if (valueEls[f.id]) { const def = FILTER_DEFS.find((d) => d.id === f.id)!; valueEls[f.id].textContent = `${f.value}${def.unit}${f.enabled ? '' : ' (off)'}` } }
    cssOutput.textContent = `filter: ${css || 'none'}`; splitBtn.style.background = getSplitView() ? '#4361ee' : '#fff'; splitBtn.style.color = getSplitView() ? '#fff' : '#344054'
  }
  unsubs.push(engine.on(FiltersChanged, () => render())); render()
  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); unsubs.forEach((u) => u()) }
}
