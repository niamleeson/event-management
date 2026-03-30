import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Tool = 'brush' | 'eraser' | 'line' | 'rect'

export interface DrawPoint {
  x: number
  y: number
  pressure: number
}

export interface DrawStroke {
  id: number
  tool: Tool
  color: string
  size: number
  points: DrawPoint[]
  layer: number
}

export interface Layer {
  id: number
  name: string
  visible: boolean
}

export interface HistoryEntry {
  type: 'add' | 'remove'
  stroke: DrawStroke
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const StrokeStart = engine.event<DrawPoint>('StrokeStart')
export const StrokeMove = engine.event<DrawPoint>('StrokeMove')
export const StrokeEnd = engine.event<void>('StrokeEnd')
export const SetTool = engine.event<Tool>('SetTool')
export const SetColor = engine.event<string>('SetColor')
export const SetSize = engine.event<number>('SetSize')
export const SetLayer = engine.event<number>('SetLayer')
export const ToggleLayerVisibility = engine.event<number>('ToggleLayerVisibility')
export const UndoDraw = engine.event<void>('UndoDraw')
export const RedoDraw = engine.event<void>('RedoDraw')
export const ClearCanvas = engine.event<void>('ClearCanvas')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const currentTool = engine.signal<Tool>(SetTool, 'brush', (_prev, tool) => tool)
export const currentColor = engine.signal<string>(SetColor, '#4361ee', (_prev, color) => color)
export const brushSize = engine.signal<number>(SetSize, 4, (_prev, size) => size)
export const activeLayer = engine.signal<number>(SetLayer, 0, (_prev, layer) => layer)

export const layers = engine.signal<Layer[]>(
  ToggleLayerVisibility,
  [
    { id: 0, name: 'Layer 1', visible: true },
    { id: 1, name: 'Layer 2', visible: true },
    { id: 2, name: 'Layer 3', visible: true },
  ],
  (prev, layerId) => prev.map((l) =>
    l.id === layerId ? { ...l, visible: !l.visible } : l,
  ),
)

let strokeId = 0
let currentStroke: DrawStroke | null = null

export const strokes = engine.signal<DrawStroke[]>(StrokeEnd, [], (prev) => {
  if (!currentStroke) return prev
  const finished = { ...currentStroke }
  currentStroke = null
  return [...prev, finished]
})

engine.signalUpdate(strokes, ClearCanvas, () => [])

// Undo/redo
const undoHistory: HistoryEntry[] = []
const redoHistory: HistoryEntry[] = []

engine.on(StrokeEnd, () => {
  const current = strokes.value
  if (current.length > 0) {
    undoHistory.push({ type: 'add', stroke: current[current.length - 1] })
    redoHistory.length = 0
  }
})

engine.on(UndoDraw, () => {
  if (undoHistory.length === 0) return
  const entry = undoHistory.pop()!
  redoHistory.push(entry)
  strokes._set(strokes.value.filter((s) => s.id !== entry.stroke.id))
})

engine.on(RedoDraw, () => {
  if (redoHistory.length === 0) return
  const entry = redoHistory.pop()!
  undoHistory.push(entry)
  strokes._set([...strokes.value, entry.stroke])
})

// Track current stroke in-progress for live drawing
export const liveStroke = engine.signal<DrawStroke | null>(
  StrokeStart,
  null,
  (_prev, point) => {
    currentStroke = {
      id: ++strokeId,
      tool: currentTool.value,
      color: currentTool.value === 'eraser' ? '#ffffff' : currentColor.value,
      size: currentTool.value === 'eraser' ? brushSize.value * 3 : brushSize.value,
      points: [point],
      layer: activeLayer.value,
    }
    return currentStroke
  },
)

engine.signalUpdate(liveStroke, StrokeMove, (prev, point) => {
  if (!currentStroke) return prev
  currentStroke.points.push(point)
  return { ...currentStroke }
})

engine.signalUpdate(liveStroke, StrokeEnd, () => null)

export const canUndo = engine.signal<boolean>(StrokeEnd, false, () => undoHistory.length > 0)
engine.signalUpdate(canUndo, UndoDraw, () => undoHistory.length > 0)
engine.signalUpdate(canUndo, RedoDraw, () => undoHistory.length > 0)

export const canRedo = engine.signal<boolean>(RedoDraw, false, () => redoHistory.length > 0)
engine.signalUpdate(canRedo, UndoDraw, () => redoHistory.length > 0)
engine.signalUpdate(canRedo, StrokeEnd, () => false)

// Start frame loop
engine.startFrameLoop()
