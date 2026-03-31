import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Tool = 'brush' | 'eraser' | 'line' | 'rect' | 'circle'

export interface DrawPoint {
  x: number
  y: number
}

export interface DrawStroke {
  id: string
  tool: Tool
  color: string
  size: number
  points: DrawPoint[]
  layerId: string
}

export interface PaintLayer {
  id: string
  name: string
  visible: boolean
  opacity: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CANVAS_WIDTH = 600
export const CANVAS_HEIGHT = 400

export const COLORS = [
  '#000000', '#ffffff', '#e63946', '#f4a261', '#fcc419',
  '#51cf66', '#4361ee', '#7209b7', '#f72585', '#4cc9f0',
  '#2a9d8f', '#e76f51', '#264653', '#845ef7',
]

export const BRUSH_SIZES = [2, 4, 8, 12, 20]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const SelectTool = engine.event<Tool>('SelectTool')
export const SelectColor = engine.event<string>('SelectColor')
export const SelectSize = engine.event<number>('SelectSize')
export const StartStroke = engine.event<DrawPoint>('StartStroke')
export const ContinueStroke = engine.event<DrawPoint>('ContinueStroke')
export const EndStroke = engine.event<void>('EndStroke')
export const UndoStroke = engine.event<void>('UndoStroke')
export const RedoStroke = engine.event<void>('RedoStroke')
export const ClearCanvas = engine.event<void>('ClearCanvas')
export const AddLayer = engine.event<void>('AddLayer')
export const RemoveLayer = engine.event<string>('RemoveLayer')
export const SelectLayer = engine.event<string>('SelectLayer')
export const ToggleLayerVisibility = engine.event<string>('ToggleLayerVisibility')
export const PaintChanged = engine.event<void>('PaintChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _currentTool: Tool = 'brush'
let _currentColor = '#000000'
let _currentSize = 4
let _layers: PaintLayer[] = [{ id: 'layer-1', name: 'Layer 1', visible: true, opacity: 1 }]
let _activeLayerId = 'layer-1'
let _isDrawing = false
let _currentStroke: DrawStroke | null = null
let _strokes: DrawStroke[] = []
let _redoStack: DrawStroke[] = []

export function getCurrentTool(): Tool { return _currentTool }
export function getCurrentColor(): string { return _currentColor }
export function getCurrentSize(): number { return _currentSize }
export function getLayers(): PaintLayer[] { return _layers }
export function getActiveLayerId(): string { return _activeLayerId }
export function getIsDrawing(): boolean { return _isDrawing }
export function getCurrentStroke(): DrawStroke | null { return _currentStroke }
export function getStrokes(): DrawStroke[] { return _strokes }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(SelectTool, (tool: Tool) => {
  _currentTool = tool
  engine.emit(PaintChanged, undefined)
})

engine.on(SelectColor, (color: string) => {
  _currentColor = color
  engine.emit(PaintChanged, undefined)
})

engine.on(SelectSize, (size: number) => {
  _currentSize = size
  engine.emit(PaintChanged, undefined)
})

engine.on(StartStroke, (point: DrawPoint) => {
  _isDrawing = true
  _currentStroke = {
    id: `stroke-${Date.now()}`,
    tool: _currentTool,
    color: _currentTool === 'eraser' ? '#f0f2f5' : _currentColor,
    size: _currentSize,
    points: [point],
    layerId: _activeLayerId,
  }
  engine.emit(PaintChanged, undefined)
})

engine.on(ContinueStroke, (point: DrawPoint) => {
  if (_currentStroke) {
    _currentStroke = { ..._currentStroke, points: [..._currentStroke.points, point] }
    engine.emit(PaintChanged, undefined)
  }
})

engine.on(EndStroke, () => {
  if (_currentStroke && _currentStroke.points.length > 1) {
    _strokes = [..._strokes, _currentStroke]
    _redoStack = []
  }
  _isDrawing = false
  _currentStroke = null
  engine.emit(PaintChanged, undefined)
})

engine.on(UndoStroke, () => {
  if (_strokes.length > 0) {
    const last = _strokes[_strokes.length - 1]
    _redoStack = [..._redoStack, last]
    _strokes = _strokes.slice(0, -1)
    engine.emit(PaintChanged, undefined)
  }
})

engine.on(RedoStroke, () => {
  if (_redoStack.length > 0) {
    const stroke = _redoStack[_redoStack.length - 1]
    _strokes = [..._strokes, stroke]
    _redoStack = _redoStack.slice(0, -1)
    engine.emit(PaintChanged, undefined)
  }
})

engine.on(ClearCanvas, () => {
  _strokes = []
  _redoStack = []
  engine.emit(PaintChanged, undefined)
})

engine.on(AddLayer, () => {
  const num = _layers.length + 1
  _layers = [..._layers, { id: `layer-${Date.now()}`, name: `Layer ${num}`, visible: true, opacity: 1 }]
  engine.emit(PaintChanged, undefined)
})

engine.on(RemoveLayer, (id: string) => {
  if (_layers.length > 1) {
    _layers = _layers.filter((l) => l.id !== id)
    engine.emit(PaintChanged, undefined)
  }
})

engine.on(SelectLayer, (id: string) => {
  _activeLayerId = id
  engine.emit(PaintChanged, undefined)
})

engine.on(ToggleLayerVisibility, (id: string) => {
  _layers = _layers.map((l) => l.id === id ? { ...l, visible: !l.visible } : l)
  engine.emit(PaintChanged, undefined)
})
