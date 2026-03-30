import {
  engine,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
  BRUSH_SIZES,
  SelectTool,
  SelectColor,
  SelectSize,
  StartStroke,
  ContinueStroke,
  EndStroke,
  UndoStroke,
  RedoStroke,
  ClearCanvas,
  AddLayer,
  SelectLayer,
  ToggleLayerVisibility,
  currentTool,
  currentColor,
  currentSize,
  layers,
  activeLayerId,
  isDrawing,
  strokes,
  currentStroke,
  redoStack,
  type Tool,
  type DrawStroke,
} from '../engines/canvas-paint'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 900px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'Canvas Paint'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 16px;'
  sub.textContent = 'Drawing tools, color picker, brush sizes, layers, and full undo/redo support.'
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Toolbar
  const toolbar = document.createElement('div')
  toolbar.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; align-items: center;'

  // Tools
  const tools: { tool: Tool; label: string }[] = [
    { tool: 'brush', label: 'Brush' },
    { tool: 'eraser', label: 'Eraser' },
    { tool: 'line', label: 'Line' },
    { tool: 'rect', label: 'Rect' },
    { tool: 'circle', label: 'Circle' },
  ]

  const toolBtns: HTMLButtonElement[] = []
  for (const t of tools) {
    const btn = document.createElement('button')
    btn.style.cssText = 'padding: 6px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;'
    btn.textContent = t.label
    btn.addEventListener('click', () => engine.emit(SelectTool, t.tool))
    toolbar.appendChild(btn)
    toolBtns.push(btn)
  }

  // Separator
  const sep1 = document.createElement('div')
  sep1.style.cssText = 'width: 1px; height: 24px; background: #e4e7ec; margin: 0 4px;'
  toolbar.appendChild(sep1)

  // Undo/Redo
  const undoBtn = document.createElement('button')
  undoBtn.style.cssText = 'padding: 6px 12px; border: none; border-radius: 6px; background: #e4e7ec; color: #344054; font-size: 12px; font-weight: 600; cursor: pointer;'
  undoBtn.textContent = 'Undo'
  undoBtn.addEventListener('click', () => engine.emit(UndoStroke, undefined))
  toolbar.appendChild(undoBtn)

  const redoBtn = document.createElement('button')
  redoBtn.style.cssText = 'padding: 6px 12px; border: none; border-radius: 6px; background: #e4e7ec; color: #344054; font-size: 12px; font-weight: 600; cursor: pointer;'
  redoBtn.textContent = 'Redo'
  redoBtn.addEventListener('click', () => engine.emit(RedoStroke, undefined))
  toolbar.appendChild(redoBtn)

  const clearBtn = document.createElement('button')
  clearBtn.style.cssText = 'padding: 6px 12px; border: none; border-radius: 6px; background: #e63946; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer;'
  clearBtn.textContent = 'Clear'
  clearBtn.addEventListener('click', () => engine.emit(ClearCanvas, undefined))
  toolbar.appendChild(clearBtn)

  wrapper.appendChild(toolbar)

  // Color picker and size
  const optionsRow = document.createElement('div')
  optionsRow.style.cssText = 'display: flex; gap: 16px; margin-bottom: 12px; align-items: center;'

  // Colors
  const colorsContainer = document.createElement('div')
  colorsContainer.style.cssText = 'display: flex; gap: 4px; flex-wrap: wrap;'
  const colorBtns: HTMLElement[] = []
  for (const color of COLORS) {
    const btn = document.createElement('div')
    btn.style.cssText = `width: 24px; height: 24px; border-radius: 50%; background: ${color}; cursor: pointer; border: 2px solid transparent;`
    btn.addEventListener('click', () => engine.emit(SelectColor, color))
    colorsContainer.appendChild(btn)
    colorBtns.push(btn)
  }
  optionsRow.appendChild(colorsContainer)

  // Separator
  const sep2 = document.createElement('div')
  sep2.style.cssText = 'width: 1px; height: 24px; background: #e4e7ec;'
  optionsRow.appendChild(sep2)

  // Brush sizes
  const sizesContainer = document.createElement('div')
  sizesContainer.style.cssText = 'display: flex; gap: 6px; align-items: center;'
  const sizeBtns: HTMLElement[] = []
  for (const size of BRUSH_SIZES) {
    const btn = document.createElement('div')
    btn.style.cssText = `width: ${10 + size}px; height: ${10 + size}px; border-radius: 50%; background: #344054; cursor: pointer; border: 2px solid transparent;`
    btn.addEventListener('click', () => engine.emit(SelectSize, size))
    sizesContainer.appendChild(btn)
    sizeBtns.push(btn)
  }
  optionsRow.appendChild(sizesContainer)
  wrapper.appendChild(optionsRow)

  // Main area: canvas + layers panel
  const mainArea = document.createElement('div')
  mainArea.style.cssText = 'display: flex; gap: 12px;'

  // Canvas
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  canvas.style.cssText = 'border: 1px solid #e4e7ec; border-radius: 10px; background: #f0f2f5; cursor: crosshair; flex-shrink: 0;'
  const ctx = canvas.getContext('2d')!

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    engine.emit(StartStroke, { x, y })
  })

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing.value) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    engine.emit(ContinueStroke, { x, y })
  })

  const endStroke = () => {
    if (isDrawing.value) engine.emit(EndStroke, undefined)
  }
  canvas.addEventListener('mouseup', endStroke)
  canvas.addEventListener('mouseleave', endStroke)

  mainArea.appendChild(canvas)

  // Layers panel
  const layersPanel = document.createElement('div')
  layersPanel.style.cssText = 'width: 160px; border: 1px solid #e4e7ec; border-radius: 10px; background: #fff; overflow: hidden;'

  const layersHeader = document.createElement('div')
  layersHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-bottom: 1px solid #e4e7ec; background: #f8f9fa;'
  const layersTitle = document.createElement('div')
  layersTitle.style.cssText = 'font-size: 12px; font-weight: 700; color: #344054;'
  layersTitle.textContent = 'Layers'
  const addLayerBtn = document.createElement('button')
  addLayerBtn.style.cssText = 'padding: 2px 8px; border: none; border-radius: 4px; background: #4361ee; color: #fff; font-size: 11px; font-weight: 600; cursor: pointer;'
  addLayerBtn.textContent = '+ Add'
  addLayerBtn.addEventListener('click', () => engine.emit(AddLayer, undefined))
  layersHeader.appendChild(layersTitle)
  layersHeader.appendChild(addLayerBtn)
  layersPanel.appendChild(layersHeader)

  const layersList = document.createElement('div')
  layersList.style.cssText = 'padding: 4px;'
  layersPanel.appendChild(layersList)

  mainArea.appendChild(layersPanel)
  wrapper.appendChild(mainArea)

  // Info
  const info = document.createElement('div')
  info.style.cssText = 'margin-top: 12px; font-size: 12px; color: #98a2b3;'
  wrapper.appendChild(info)

  container.appendChild(wrapper)

  function drawStrokeOnCanvas(stroke: DrawStroke) {
    const { tool, color, size, points } = stroke
    if (points.length < 2 && (tool === 'brush' || tool === 'eraser')) return

    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (tool === 'brush' || tool === 'eraser') {
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.stroke()
    } else if (tool === 'line' && points.length >= 2) {
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
      ctx.stroke()
    } else if (tool === 'rect' && points.length >= 2) {
      const p0 = points[0]
      const p1 = points[points.length - 1]
      ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y)
    } else if (tool === 'circle' && points.length >= 2) {
      const p0 = points[0]
      const p1 = points[points.length - 1]
      const r = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2))
      ctx.beginPath()
      ctx.arc(p0.x, p0.y, r, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  function renderCanvas() {
    ctx.fillStyle = '#f0f2f5'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const layerList = layers.value
    const allStrokes = strokes.value

    for (const layer of layerList) {
      if (!layer.visible) continue
      const layerStrokes = allStrokes.filter((s) => s.layerId === layer.id)
      for (const stroke of layerStrokes) {
        drawStrokeOnCanvas(stroke)
      }
    }

    // Draw current stroke
    const current = currentStroke.value
    if (current && current.points.length > 1) {
      drawStrokeOnCanvas(current)
    }
  }

  function renderUI() {
    const tool = currentTool.value
    const color = currentColor.value
    const size = currentSize.value

    // Tool buttons
    for (let i = 0; i < tools.length; i++) {
      toolBtns[i].style.background = tools[i].tool === tool ? '#4361ee' : '#e4e7ec'
      toolBtns[i].style.color = tools[i].tool === tool ? '#fff' : '#344054'
    }

    // Color buttons
    for (let i = 0; i < COLORS.length; i++) {
      colorBtns[i].style.borderColor = COLORS[i] === color ? '#1a1a2e' : 'transparent'
    }

    // Size buttons
    for (let i = 0; i < BRUSH_SIZES.length; i++) {
      sizeBtns[i].style.borderColor = BRUSH_SIZES[i] === size ? '#4361ee' : 'transparent'
    }

    // Layers list
    layersList.innerHTML = ''
    const layerList = layers.value
    const activeLayer = activeLayerId.value
    for (const layer of layerList) {
      const el = document.createElement('div')
      el.style.cssText = `display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; ${layer.id === activeLayer ? 'background: #eef0ff;' : ''}`
      el.addEventListener('click', () => engine.emit(SelectLayer, layer.id))

      const vis = document.createElement('button')
      vis.style.cssText = `background: none; border: none; cursor: pointer; font-size: 12px; color: ${layer.visible ? '#4361ee' : '#98a2b3'}; padding: 0;`
      vis.textContent = layer.visible ? '\u{1F441}' : '\u{1F441}\u{200D}\u{1F5E8}'
      vis.addEventListener('click', (e) => { e.stopPropagation(); engine.emit(ToggleLayerVisibility, layer.id) })

      const name = document.createElement('span')
      name.style.cssText = 'flex: 1; color: #344054; font-weight: 500;'
      name.textContent = layer.name

      el.appendChild(vis)
      el.appendChild(name)
      layersList.appendChild(el)
    }

    const allStrokes = strokes.value
    info.textContent = `Tool: ${tool} | Color: ${color} | Size: ${size}px | Strokes: ${allStrokes.length} | Layers: ${layerList.length} | Undo: ${allStrokes.length} | Redo: ${redoStack.value.length}`
  }

  unsubs.push(strokes.subscribe(() => { renderCanvas(); renderUI() }))
  unsubs.push(currentStroke.subscribe(() => renderCanvas()))
  unsubs.push(currentTool.subscribe(() => renderUI()))
  unsubs.push(currentColor.subscribe(() => renderUI()))
  unsubs.push(currentSize.subscribe(() => renderUI()))
  unsubs.push(layers.subscribe(() => { renderCanvas(); renderUI() }))
  unsubs.push(activeLayerId.subscribe(() => renderUI()))

  renderCanvas()
  renderUI()

  return () => {
    ;(window as any).__pulseEngine = null
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
