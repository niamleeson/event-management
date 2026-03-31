import { engine, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, BRUSH_SIZES, SelectTool, SelectColor, SelectSize, StartStroke, ContinueStroke, EndStroke, UndoStroke, RedoStroke, ClearCanvas, AddLayer, RemoveLayer, SelectLayer, ToggleLayerVisibility, getCurrentTool, getCurrentColor, getCurrentSize, getLayers, getActiveLayerId, getIsDrawing, getCurrentStroke, getStrokes, PaintChanged, type Tool } from '../engines/canvas-paint'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const wrapper = document.createElement('div'); wrapper.style.cssText = 'max-width: 900px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  wrapper.innerHTML = `<h2 style="font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;">Canvas Paint</h2><p style="color: #666; font-size: 14px; margin-bottom: 16px;">Tools, colors, layers, undo/redo. All state via Pulse events.</p>`

  // Toolbar
  const toolbar = document.createElement('div'); toolbar.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; align-items: center;'
  const tools: Tool[] = ['brush', 'eraser', 'line', 'rect', 'circle']
  const toolBtns: Record<string, HTMLButtonElement> = {}
  for (const tool of tools) { const btn = document.createElement('button'); btn.style.cssText = 'padding: 6px 12px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px;'; btn.textContent = tool; btn.addEventListener('click', () => engine.emit(SelectTool, tool)); toolbar.appendChild(btn); toolBtns[tool] = btn }
  toolbar.innerHTML += '<span style="color: #e0e0e0;">|</span>'
  const undoBtn = document.createElement('button'); undoBtn.style.cssText = 'padding: 6px 12px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px;'; undoBtn.textContent = 'Undo'; undoBtn.addEventListener('click', () => engine.emit(UndoStroke, undefined)); toolbar.appendChild(undoBtn)
  const redoBtn = document.createElement('button'); redoBtn.style.cssText = 'padding: 6px 12px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px;'; redoBtn.textContent = 'Redo'; redoBtn.addEventListener('click', () => engine.emit(RedoStroke, undefined)); toolbar.appendChild(redoBtn)
  const clearAllBtn = document.createElement('button'); clearAllBtn.style.cssText = 'padding: 6px 12px; border: 1px solid #e63946; border-radius: 6px; background: #fff; color: #e63946; cursor: pointer; font-size: 13px;'; clearAllBtn.textContent = 'Clear'; clearAllBtn.addEventListener('click', () => engine.emit(ClearCanvas, undefined)); toolbar.appendChild(clearAllBtn)
  wrapper.appendChild(toolbar)

  // Colors
  const colorRow = document.createElement('div'); colorRow.style.cssText = 'display: flex; gap: 4px; margin-bottom: 8px;'
  for (const color of COLORS) { const swatch = document.createElement('div'); swatch.style.cssText = `width: 24px; height: 24px; border-radius: 4px; background: ${color}; cursor: pointer; border: 2px solid transparent;`; swatch.addEventListener('click', () => engine.emit(SelectColor, color)); colorRow.appendChild(swatch) }
  wrapper.appendChild(colorRow)

  // Sizes
  const sizeRow = document.createElement('div'); sizeRow.style.cssText = 'display: flex; gap: 6px; margin-bottom: 12px; align-items: center;'
  sizeRow.innerHTML = '<span style="font-size: 12px; color: #667085; margin-right: 4px;">Size:</span>'
  for (const size of BRUSH_SIZES) { const btn = document.createElement('button'); btn.style.cssText = 'padding: 4px 10px; border: 1px solid #e0e0e0; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px;'; btn.textContent = String(size); btn.addEventListener('click', () => engine.emit(SelectSize, size)); sizeRow.appendChild(btn) }
  wrapper.appendChild(sizeRow)

  // Canvas
  const canvas = document.createElement('canvas'); canvas.width = CANVAS_WIDTH; canvas.height = CANVAS_HEIGHT
  canvas.style.cssText = 'border: 1px solid #e4e7ec; border-radius: 8px; cursor: crosshair; background: #f0f2f5; max-width: 100%;'
  const ctx = canvas.getContext('2d')!
  wrapper.appendChild(canvas)

  function getCanvasPos(e: MouseEvent): { x: number; y: number } { const rect = canvas.getBoundingClientRect(); return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) } }
  canvas.addEventListener('mousedown', (e) => engine.emit(StartStroke, getCanvasPos(e)))
  canvas.addEventListener('mousemove', (e) => { if (getIsDrawing()) engine.emit(ContinueStroke, getCanvasPos(e)) })
  canvas.addEventListener('mouseup', () => engine.emit(EndStroke, undefined))
  canvas.addEventListener('mouseleave', () => { if (getIsDrawing()) engine.emit(EndStroke, undefined) })

  // Layers
  const layersPanel = document.createElement('div'); layersPanel.style.cssText = 'margin-top: 12px; border: 1px solid #e4e7ec; border-radius: 8px; overflow: hidden;'
  const layersHeader = document.createElement('div'); layersHeader.style.cssText = 'display: flex; justify-content: space-between; padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e4e7ec;'
  layersHeader.innerHTML = '<span style="font-weight: 600; font-size: 13px;">Layers</span>'
  const addLayerBtn = document.createElement('button'); addLayerBtn.style.cssText = 'padding: 2px 8px; border: 1px solid #e0e0e0; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px;'; addLayerBtn.textContent = '+ Add'; addLayerBtn.addEventListener('click', () => engine.emit(AddLayer, undefined))
  layersHeader.appendChild(addLayerBtn); layersPanel.appendChild(layersHeader)
  const layersList = document.createElement('div'); layersPanel.appendChild(layersList); wrapper.appendChild(layersPanel)
  container.appendChild(wrapper)

  function drawAll() {
    ctx.fillStyle = '#f0f2f5'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    const allStrokes = getStrokes(); const currentStr = getCurrentStroke()
    for (const stroke of [...allStrokes, ...(currentStr ? [currentStr] : [])]) {
      if (stroke.points.length < 2) continue
      ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.beginPath(); ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      ctx.stroke()
    }
  }

  function render() {
    drawAll()
    const activeTool = getCurrentTool()
    for (const [tool, btn] of Object.entries(toolBtns)) { btn.style.background = tool === activeTool ? '#4361ee' : '#fff'; btn.style.color = tool === activeTool ? '#fff' : '#344054' }
    // Layers list
    layersList.innerHTML = ''
    for (const layer of getLayers()) {
      const row = document.createElement('div'); row.style.cssText = `display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: ${layer.id === getActiveLayerId() ? '#eef0ff' : '#fff'}; border-bottom: 1px solid #f0f2f5; cursor: pointer;`
      row.innerHTML = `<span style="font-size: 13px; flex: 1; font-weight: ${layer.id === getActiveLayerId() ? 600 : 400};">${layer.name}</span>`
      const visBtn = document.createElement('button'); visBtn.style.cssText = 'border: none; background: none; cursor: pointer; font-size: 12px;'; visBtn.textContent = layer.visible ? 'visible' : 'hidden'; visBtn.addEventListener('click', (e) => { e.stopPropagation(); engine.emit(ToggleLayerVisibility, layer.id) })
      row.appendChild(visBtn)
      row.addEventListener('click', () => engine.emit(SelectLayer, layer.id)); layersList.appendChild(row)
    }
  }

  unsubs.push(engine.on(PaintChanged, () => render())); render()
  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); unsubs.forEach((u) => u()) }
}
