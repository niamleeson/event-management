import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type Tool = 'brush' | 'eraser' | 'rect' | 'circle' | 'line'

export interface Point {
  x: number
  y: number
}

export interface Stroke {
  tool: Tool
  color: string
  size: number
  points: Point[]
  layer: number
}

export interface Layer {
  id: number
  name: string
  visible: boolean
  strokes: Stroke[]
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const ToolChanged = engine.event<Tool>('ToolChanged')
export const ColorChanged = engine.event<string>('ColorChanged')
export const SizeChanged = engine.event<number>('SizeChanged')
export const StrokeStart = engine.event<Point>('StrokeStart')
export const StrokeMove = engine.event<Point>('StrokeMove')
export const StrokeEnd = engine.event('StrokeEnd')
export const UndoStroke = engine.event('UndoStroke')
export const RedoStroke = engine.event('RedoStroke')
export const LayerSelected = engine.event<number>('LayerSelected')
export const LayerToggled = engine.event<number>('LayerToggled')
export const LayerAdded = engine.event('LayerAdded')
export const StrokesChanged = engine.event('StrokesChanged')

/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */

export let currentTool = 'brush' as Tool
export const CurrentToolChanged = engine.event('CurrentToolChanged')
engine.on(ToolChanged, (v: any) => { currentTool = ((_prev, tool) => tool)(currentTool, v); engine.emit(CurrentToolChanged, currentTool) })
export let currentColor = '#ff6b6b'
export const CurrentColorChanged = engine.event('CurrentColorChanged')
engine.on(ColorChanged, (v: any) => { currentColor = ((_prev, color) => color)(currentColor, v); engine.emit(CurrentColorChanged, currentColor) })
export let brushSize = 4
export const BrushSizeChanged = engine.event('BrushSizeChanged')
engine.on(SizeChanged, (v: any) => { brushSize = ((_prev, size) => size)(brushSize, v); engine.emit(BrushSizeChanged, brushSize) })

let nextLayerId = 2
export let layers = [
    { id: 0, name: 'Background', visible: true, strokes: [] },
    { id: 1, name: 'Layer 1', visible: true, strokes: [] },
  ]
export const LayersChanged = engine.event('LayersChanged')
engine.on(LayerAdded, (v: any) => { layers = ((prev) => [...prev, { id: nextLayerId++, name: `Layer ${nextLayerId - 1}`, visible: true, strokes: [] }])(layers, v); engine.emit(LayersChanged, layers) })

engine.on(LayerToggled, (v: any) => { layers = ((prev, id) =>
  prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l))(layers, v); engine.emit(LayersChanged, layers) })

export let activeLayer = 1
export const ActiveLayerChanged = engine.event('ActiveLayerChanged')
engine.on(LayerSelected, (v: any) => { activeLayer = ((_prev, id) => id)(activeLayer, v); engine.emit(ActiveLayerChanged, activeLayer) })

/* ------------------------------------------------------------------ */
/*  Drawing state                                                     */
/* ------------------------------------------------------------------ */

export let isDrawing = false
export const IsDrawingChanged = engine.event('IsDrawingChanged')
engine.on(StrokeStart, (v: any) => { isDrawing = (() => true)(isDrawing, v); engine.emit(IsDrawingChanged, isDrawing) })
engine.on(StrokeEnd, (v: any) => { isDrawing = (() => false)(isDrawing, v); engine.emit(IsDrawingChanged, isDrawing) })

let currentStroke: Stroke | null = null
const undoStack: Stroke[] = []
const redoStack: Stroke[] = []

engine.on(StrokeStart, (point) => {
  currentStroke = {
    tool: currentTool,
    color: currentTool === 'eraser' ? '#ffffff' : currentColor,
    size: brushSize,
    points: [point],
    layer: activeLayer,
  }
})

engine.on(StrokeMove, (point) => {
  if (!currentStroke) return
  currentStroke.points.push(point)
  engine.emit(StrokesChanged, undefined)
})

engine.on(StrokeEnd, () => {
  if (!currentStroke || currentStroke.points.length < 2) {
    currentStroke = null
    return
  }

  // Add stroke to active layer
  const layerList = layers
  const layerIdx = layerList.findIndex(l => l.id === activeLayer)
  if (layerIdx >= 0) {
    const updated = layerList.map((l, i) => {
      if (i === layerIdx) return { ...l, strokes: [...l.strokes, currentStroke!] }
      return l
    })
    // We don't update layers signal directly; strokes are in the layer
    // Just push to undo stack
    undoStack.push(currentStroke)
    redoStack.length = 0
  }

  currentStroke = null
  engine.emit(StrokesChanged, undefined)
})

engine.on(UndoStroke, () => {
  if (undoStack.length === 0) return
  const stroke = undoStack.pop()!
  redoStack.push(stroke)
  engine.emit(StrokesChanged, undefined)
})

engine.on(RedoStroke, () => {
  if (redoStack.length === 0) return
  const stroke = redoStack.pop()!
  undoStack.push(stroke)
  engine.emit(StrokesChanged, undefined)
})

/* ------------------------------------------------------------------ */
/*  Export for canvas rendering                                       */
/* ------------------------------------------------------------------ */

function getCurrentStroke(): Stroke | null {
  return currentStroke
}

function getUndoStack(): Stroke[] {
  return undoStack
}

function getRedoStack(): Stroke[] {
  return redoStack
}

/* ------------------------------------------------------------------ */
/*  Color palette                                                     */
/* ------------------------------------------------------------------ */

export const PALETTE = [
  '#ff6b6b', '#ee5a24', '#feca57', '#48dbfb', '#ff9ff3',
  '#54a0ff', '#5f27cd', '#01a3a4', '#2d3436', '#ffffff',
  '#00b894', '#d63031', '#fdcb6e', '#6c5ce7', '#e17055',
]

export const TOOLS: { tool: Tool; icon: string; label: string }[] = [
  { tool: 'brush', icon: '\u270E', label: 'Brush' },
  { tool: 'eraser', icon: '\u2B1C', label: 'Eraser' },
  { tool: 'rect', icon: '\u25A1', label: 'Rectangle' },
  { tool: 'circle', icon: '\u25CB', label: 'Circle' },
  { tool: 'line', icon: '\u2571', label: 'Line' },
]


export { getCurrentStroke, getUndoStack, getRedoStack }
