import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ---------------------------------------------------------------------------
// DAG (4 levels deep)
// ---------------------------------------------------------------------------
// ToolChanged ──→ CurrentToolChanged
// ColorChanged ──→ CurrentColorChanged
// SizeChanged ──→ BrushSizeChanged
// LayerSelected ──→ ActiveLayerChanged
// LayerAdded ──→ LayersChanged
// LayerToggled ──→ LayersChanged
//
// StrokeStart ──→ CurrentStrokeChanged
// StrokeMove ──→ CurrentStrokeChanged
//
// StrokeEnd ──→ StrokesChanged ──┬──→ UndoStackChanged
//                                └──→ RedoStackChanged
//
// UndoStroke ──→ StrokesChanged ──┬──→ UndoStackChanged
//                                 └──→ RedoStackChanged
//
// RedoStroke ──→ StrokesChanged ──┬──→ UndoStackChanged
//                                 └──→ RedoStackChanged
//
// ClearCanvas ──→ StrokesChanged ──┬──→ UndoStackChanged
//                                  └──→ RedoStackChanged
//
// Frame (renders canvas — terminal)
// ---------------------------------------------------------------------------

export type Tool = 'brush' | 'eraser' | 'line' | 'rect' | 'circle'
export interface Point { x: number; y: number; pressure: number }
export interface Stroke { id: string; tool: Tool; color: string; size: number; points: Point[]; layerId: number }
export interface Layer { id: number; name: string; visible: boolean }

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

// Layer 0: User input events
export const StrokeStart = engine.event<{ x: number; y: number }>('StrokeStart')
export const StrokeMove = engine.event<{ x: number; y: number; pressure?: number }>('StrokeMove')
export const StrokeEnd = engine.event<void>('StrokeEnd')
export const ToolChanged = engine.event<Tool>('ToolChanged')
export const ColorChanged = engine.event<string>('ColorChanged')
export const SizeChanged = engine.event<number>('SizeChanged')
export const UndoStroke = engine.event<void>('UndoStroke')
export const RedoStroke = engine.event<void>('RedoStroke')
export const ClearCanvas = engine.event<void>('ClearCanvas')
export const LayerAdded = engine.event<void>('LayerAdded')
export const LayerSelected = engine.event<number>('LayerSelected')
export const LayerToggled = engine.event<number>('LayerToggled')
export const Frame = engine.event<number>('Frame')

// Layer 1: Primary state events
export const CurrentToolChanged = engine.event<Tool>('CurrentToolChanged')
export const CurrentColorChanged = engine.event<string>('CurrentColorChanged')
export const BrushSizeChanged = engine.event<number>('BrushSizeChanged')
export const ActiveLayerChanged = engine.event<number>('ActiveLayerChanged')
export const LayersChanged = engine.event<Layer[]>('LayersChanged')
export const CurrentStrokeChanged = engine.event<Stroke | null>('CurrentStrokeChanged')

// Layer 2: Collection state events
export const StrokesChanged = engine.event<Stroke[]>('StrokesChanged')

// Layer 3: Derived undo/redo state (from strokes changes)
export const UndoStackChanged = engine.event<Stroke[]>('UndoStackChanged')
export const RedoStackChanged = engine.event<Stroke[]>('RedoStackChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentTool: Tool = 'brush', currentColor = '#3b82f6', brushSize = 4
let strokes: Stroke[] = [], undoArr: Stroke[] = [], redoArr: Stroke[] = []
let layers: Layer[] = [{ id: 1, name: 'Layer 1', visible: true }], activeLayer = 1
let currentStroke: Stroke | null = null, strokeCounter = 0, lastMoveTime = 0, layerCounter = 1

// Track what kind of stroke change happened for undo/redo derivation
let lastStrokeAction: 'add' | 'undo' | 'redo' | 'clear' = 'add'
let lastUndoneStroke: Stroke | null = null
let lastRedoneStroke: Stroke | null = null

// ---------------------------------------------------------------------------
// Layer 0 → Layer 1: Input handlers → primary state
// ---------------------------------------------------------------------------

engine.on(ToolChanged, [CurrentToolChanged], (t, setTool) => { currentTool = t; setTool(t) })
engine.on(ColorChanged, [CurrentColorChanged], (c, setColor) => { currentColor = c; setColor(c) })
engine.on(SizeChanged, [BrushSizeChanged], (s, setSize) => { brushSize = s; setSize(s) })
engine.on(LayerSelected, [ActiveLayerChanged], (id, setActive) => { activeLayer = id; setActive(id) })

engine.on(StrokeStart, [CurrentStrokeChanged], ({ x, y }, setCurrentStroke) => {
  lastMoveTime = Date.now()
  currentStroke = { id: `s-${++strokeCounter}`, tool: currentTool, color: currentTool === 'eraser' ? '#1a1a2e' : currentColor, size: brushSize, points: [{ x, y, pressure: 1 }], layerId: activeLayer }
  setCurrentStroke(currentStroke)
})

engine.on(StrokeMove, [CurrentStrokeChanged], ({ x, y, pressure }, setCurrentStroke) => {
  if (!currentStroke) return
  const now = Date.now(), dt = now - lastMoveTime
  lastMoveTime = now
  const lp = currentStroke.points[currentStroke.points.length - 1]
  const d = Math.sqrt((x - lp.x) ** 2 + (y - lp.y) ** 2)
  const sp = dt > 0 ? d / dt : 0
  currentStroke = { ...currentStroke, points: [...currentStroke.points, { x, y, pressure: pressure ?? Math.max(0.2, Math.min(1, 1 - sp * 0.3)) }] }
  setCurrentStroke(currentStroke)
})

// ---------------------------------------------------------------------------
// Layer 0/1 → Layer 2: Actions → strokes collection
// ---------------------------------------------------------------------------

engine.on(StrokeEnd, [StrokesChanged], (_, setStrokes) => {
  if (!currentStroke) return
  if (currentStroke.points.length > 1) {
    strokes = [...strokes, currentStroke]
    undoArr = [...undoArr, currentStroke]
    redoArr = []
    lastStrokeAction = 'add'
    setStrokes([...strokes])
  }
  currentStroke = null
})

engine.on(UndoStroke, [StrokesChanged], (_, setStrokes) => {
  if (!undoArr.length) return
  const l = undoArr[undoArr.length - 1]
  undoArr = undoArr.slice(0, -1)
  redoArr = [...redoArr, l]
  strokes = strokes.filter(s => s.id !== l.id)
  lastStrokeAction = 'undo'
  lastUndoneStroke = l
  setStrokes([...strokes])
})

engine.on(RedoStroke, [StrokesChanged], (_, setStrokes) => {
  if (!redoArr.length) return
  const l = redoArr[redoArr.length - 1]
  redoArr = redoArr.slice(0, -1)
  undoArr = [...undoArr, l]
  strokes = [...strokes, l]
  lastStrokeAction = 'redo'
  lastRedoneStroke = l
  setStrokes([...strokes])
})

engine.on(ClearCanvas, [StrokesChanged], (_, setStrokes) => {
  strokes = []
  undoArr = []
  redoArr = []
  currentStroke = null
  lastStrokeAction = 'clear'
  setStrokes([])
})

// ---------------------------------------------------------------------------
// Layer 2 → Layer 3: Strokes → derived undo/redo stacks
// ---------------------------------------------------------------------------

engine.on(StrokesChanged, [UndoStackChanged, RedoStackChanged], (_strokes, setUndo, setRedo) => {
  setUndo([...undoArr])
  setRedo([...redoArr])
})

// ---------------------------------------------------------------------------
// Layer management
// ---------------------------------------------------------------------------

engine.on(LayerAdded, [LayersChanged], (_, setLayers) => {
  layerCounter++
  layers = [...layers, { id: layerCounter, name: `Layer ${layerCounter}`, visible: true }]
  setLayers([...layers])
  engine.emit(LayerSelected, layerCounter)
})

engine.on(LayerToggled, [LayersChanged], (id, setLayers) => {
  layers = layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
  setLayers([...layers])
})

// ---------------------------------------------------------------------------
// Canvas rendering (Frame handler — terminal node)
// ---------------------------------------------------------------------------

export let canvasRef: HTMLCanvasElement | null = null
export function setCanvasRef(c: HTMLCanvasElement | null) { canvasRef = c }

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  if (s.points.length < 2) return; const ly = layers.find(l => l.id === s.layerId); if (ly && !ly.visible) return
  ctx.strokeStyle = s.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  if (s.tool === 'line') { const f = s.points[0], l = s.points[s.points.length - 1]; ctx.lineWidth = s.size; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(l.x, l.y); ctx.stroke(); return }
  if (s.tool === 'rect') { const f = s.points[0], l = s.points[s.points.length - 1]; ctx.lineWidth = s.size; ctx.strokeRect(Math.min(f.x, l.x), Math.min(f.y, l.y), Math.abs(l.x - f.x), Math.abs(l.y - f.y)); return }
  if (s.tool === 'circle') { const f = s.points[0], l = s.points[s.points.length - 1]; ctx.lineWidth = s.size; ctx.beginPath(); ctx.ellipse(Math.min(f.x, l.x) + Math.abs(l.x - f.x) / 2, Math.min(f.y, l.y) + Math.abs(l.y - f.y) / 2, Math.abs(l.x - f.x) / 2, Math.abs(l.y - f.y) / 2, 0, 0, Math.PI * 2); ctx.stroke(); return }
  if (s.tool === 'eraser') ctx.globalCompositeOperation = 'destination-out'
  for (let i = 1; i < s.points.length; i++) { const p0 = s.points[i - 1], p1 = s.points[i]; ctx.lineWidth = Math.max(1, s.size * ((p0.pressure + p1.pressure) / 2)); ctx.beginPath(); if (i > 1) { const pp = s.points[i - 2]; ctx.moveTo((pp.x + p0.x) / 2, (pp.y + p0.y) / 2); ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) / 2, (p0.y + p1.y) / 2) } else { ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y) }; ctx.stroke() }
  if (s.tool === 'eraser') ctx.globalCompositeOperation = 'source-over'
}

let _rafId: number | null = null
export function startLoop() {
  if (_rafId !== null) return
  let last = performance.now()
  const loop = () => {
    const now = performance.now()
    engine.emit(Frame, now - last)
    last = now
    _rafId = requestAnimationFrame(loop)
  }
  _rafId = requestAnimationFrame(loop)
}
export function stopLoop() {
  if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null }
}
engine.on(Frame, () => { if (!canvasRef) return; const ctx = canvasRef.getContext('2d'); if (!ctx) return; ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvasRef.width, canvasRef.height); for (const s of strokes) drawStroke(ctx, s); if (currentStroke) drawStroke(ctx, currentStroke) })

export function resetState() {
  currentTool = 'brush'
  currentColor = '#3b82f6'
  brushSize = 4
  strokes = []
  undoArr = []
  redoArr = []
  layers = [{ id: 1, name: 'Layer 1', visible: true }]
  activeLayer = 1
  currentStroke = null
  strokeCounter = 0
  lastMoveTime = 0
  layerCounter = 1
  lastStrokeAction = 'add'
  lastUndoneStroke = null
  lastRedoneStroke = null
  canvasRef = null
  _rafId = null
}

export function saveProject() { return new Map() }
export function loadProject(_snap: any) {}
