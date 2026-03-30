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

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const currentTool = engine.signal<Tool>(
  SelectTool, 'brush', (_prev, tool) => tool,
)

export const currentColor = engine.signal<string>(
  SelectColor, '#000000', (_prev, color) => color,
)

export const currentSize = engine.signal<number>(
  SelectSize, 4, (_prev, size) => size,
)

export const layers = engine.signal<PaintLayer[]>(
  AddLayer,
  [{ id: 'layer-1', name: 'Layer 1', visible: true, opacity: 1 }],
  (prev) => {
    const num = prev.length + 1
    return [...prev, { id: `layer-${Date.now()}`, name: `Layer ${num}`, visible: true, opacity: 1 }]
  },
)

engine.signalUpdate(layers, RemoveLayer, (prev, id) =>
  prev.length > 1 ? prev.filter((l) => l.id !== id) : prev,
)

engine.signalUpdate(layers, ToggleLayerVisibility, (prev, id) =>
  prev.map((l) => l.id === id ? { ...l, visible: !l.visible } : l),
)

export const activeLayerId = engine.signal<string>(
  SelectLayer, 'layer-1', (_prev, id) => id,
)

// Drawing state
export const isDrawing = engine.signal<boolean>(
  StartStroke, false, () => true,
)
engine.signalUpdate(isDrawing, EndStroke, () => false)

// Current stroke being drawn
export const currentStroke = engine.signal<DrawStroke | null>(
  StartStroke, null, (_prev, point) => ({
    id: `stroke-${Date.now()}`,
    tool: currentTool.value,
    color: currentTool.value === 'eraser' ? '#f0f2f5' : currentColor.value,
    size: currentSize.value,
    points: [point],
    layerId: activeLayerId.value,
  }),
)

engine.signalUpdate(currentStroke, ContinueStroke, (prev, point) => {
  if (!prev) return prev
  return { ...prev, points: [...prev.points, point] }
})

engine.signalUpdate(currentStroke, EndStroke, () => null)

// Completed strokes
export const strokes = engine.signal<DrawStroke[]>(
  EndStroke, [],
  (prev) => {
    const stroke = currentStroke.value
    if (stroke && stroke.points.length > 1) {
      return [...prev, stroke]
    }
    return prev
  },
)

engine.signalUpdate(strokes, ClearCanvas, () => [])

// Undo/Redo
export const redoStack = engine.signal<DrawStroke[]>(
  UndoStroke, [], (prev) => {
    const last = strokes.value[strokes.value.length - 1]
    return last ? [...prev, last] : prev
  },
)

engine.signalUpdate(redoStack, RedoStroke, (prev) => prev.slice(0, -1))
engine.signalUpdate(redoStack, EndStroke, () => []) // clear redo on new stroke

engine.on(UndoStroke, () => {
  const current = strokes.value
  if (current.length > 0) {
    strokes.set(current.slice(0, -1))
  }
})

engine.on(RedoStroke, () => {
  const redo = redoStack.value
  if (redo.length > 0) {
    const stroke = redo[redo.length - 1]
    strokes.set([...strokes.value, stroke])
  }
})
