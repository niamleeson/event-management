import { createEngine } from '@pulse/core'

export const engine = createEngine()
export type Tool = 'brush' | 'eraser' | 'line' | 'rect'
export interface DrawPoint { x: number; y: number; pressure: number }
export interface DrawStroke { id: number; tool: Tool; color: string; size: number; points: DrawPoint[]; layer: number }
export interface Layer { id: number; name: string; visible: boolean }

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

export const ToolChanged = engine.event<Tool>('ToolChanged')
export const ColorChanged = engine.event<string>('ColorChanged')
export const SizeChanged = engine.event<number>('SizeChanged')
export const StrokesChanged = engine.event<DrawStroke[]>('StrokesChanged')
export const LiveStrokeChanged = engine.event<DrawStroke | null>('LiveStrokeChanged')
export const CanUndoChanged = engine.event<boolean>('CanUndoChanged')
export const CanRedoChanged = engine.event<boolean>('CanRedoChanged')

let currentTool: Tool = 'brush', currentColor = '#4361ee', brushSize = 4, activeLayer = 0
let strokes: DrawStroke[] = [], currentStroke: DrawStroke | null = null, strokeId = 0
const undoHistory: DrawStroke[] = [], redoHistory: DrawStroke[] = []

engine.on(SetTool, (t) => { currentTool = t; engine.emit(ToolChanged, t) })
engine.on(SetColor, (c) => { currentColor = c; engine.emit(ColorChanged, c) })
engine.on(SetSize, (s) => { brushSize = s; engine.emit(SizeChanged, s) })
engine.on(StrokeStart, (point) => {
  currentStroke = { id: ++strokeId, tool: currentTool, color: currentTool === 'eraser' ? '#ffffff' : currentColor, size: currentTool === 'eraser' ? brushSize * 3 : brushSize, points: [point], layer: activeLayer }
  engine.emit(LiveStrokeChanged, currentStroke)
})
engine.on(StrokeMove, (point) => { if (!currentStroke) return; currentStroke = { ...currentStroke, points: [...currentStroke.points, point] }; engine.emit(LiveStrokeChanged, currentStroke) })
engine.on(StrokeEnd, () => {
  if (currentStroke) { strokes = [...strokes, currentStroke]; undoHistory.push(currentStroke); redoHistory.length = 0 }
  currentStroke = null
  engine.emit(LiveStrokeChanged, null); engine.emit(StrokesChanged, strokes)
  engine.emit(CanUndoChanged, undoHistory.length > 0); engine.emit(CanRedoChanged, false)
})
engine.on(UndoDraw, () => {
  if (undoHistory.length === 0) return
  const entry = undoHistory.pop()!; redoHistory.push(entry); strokes = strokes.filter((s) => s.id !== entry.id)
  engine.emit(StrokesChanged, strokes); engine.emit(CanUndoChanged, undoHistory.length > 0); engine.emit(CanRedoChanged, true)
})
engine.on(RedoDraw, () => {
  if (redoHistory.length === 0) return
  const entry = redoHistory.pop()!; undoHistory.push(entry); strokes = [...strokes, entry]
  engine.emit(StrokesChanged, strokes); engine.emit(CanUndoChanged, true); engine.emit(CanRedoChanged, redoHistory.length > 0)
})
engine.on(ClearCanvas, () => { strokes = []; engine.emit(StrokesChanged, strokes) })
