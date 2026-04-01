// DAG
// SetTool ──→ ToolChanged
// SetColor ──→ ColorChanged
// SetSize ──→ SizeChanged
// StrokeStart ──→ LiveStrokeChanged
// StrokeMove ──→ LiveStrokeChanged
// StrokeEnd ──→ LiveStrokeChanged
//           └──→ StrokesChanged
//           └──→ CanUndoChanged
//           └──→ CanRedoChanged
// UndoDraw ──→ StrokesChanged
//          └──→ CanUndoChanged
//          └──→ CanRedoChanged
// RedoDraw ──→ StrokesChanged
//          └──→ CanUndoChanged
//          └──→ CanRedoChanged
// ClearCanvas ──→ StrokesChanged

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

engine.on(SetTool, [ToolChanged], (t, setTool) => { currentTool = t; setTool(t) })
engine.on(SetColor, [ColorChanged], (c, setColor) => { currentColor = c; setColor(c) })
engine.on(SetSize, [SizeChanged], (s, setSize) => { brushSize = s; setSize(s) })

engine.on(StrokeStart, [LiveStrokeChanged], (point, setLive) => {
  currentStroke = { id: ++strokeId, tool: currentTool, color: currentTool === 'eraser' ? '#ffffff' : currentColor, size: currentTool === 'eraser' ? brushSize * 3 : brushSize, points: [point], layer: activeLayer }
  setLive(currentStroke)
})

engine.on(StrokeMove, [LiveStrokeChanged], (point, setLive) => { if (!currentStroke) return; currentStroke = { ...currentStroke, points: [...currentStroke.points, point] }; setLive(currentStroke) })

engine.on(StrokeEnd, [LiveStrokeChanged, StrokesChanged, CanUndoChanged, CanRedoChanged], (_payload, setLive, setStrokes, setCanUndo, setCanRedo) => {
  if (currentStroke) { strokes = [...strokes, currentStroke]; undoHistory.push(currentStroke); redoHistory.length = 0 }
  currentStroke = null
  setLive(null); setStrokes(strokes)
  setCanUndo(undoHistory.length > 0); setCanRedo(false)
})

engine.on(UndoDraw, [StrokesChanged, CanUndoChanged, CanRedoChanged], (_payload, setStrokes, setCanUndo, setCanRedo) => {
  if (undoHistory.length === 0) return
  const entry = undoHistory.pop()!; redoHistory.push(entry); strokes = strokes.filter((s) => s.id !== entry.id)
  setStrokes(strokes); setCanUndo(undoHistory.length > 0); setCanRedo(true)
})

engine.on(RedoDraw, [StrokesChanged, CanUndoChanged, CanRedoChanged], (_payload, setStrokes, setCanUndo, setCanRedo) => {
  if (redoHistory.length === 0) return
  const entry = redoHistory.pop()!; undoHistory.push(entry); strokes = [...strokes, entry]
  setStrokes(strokes); setCanUndo(true); setCanRedo(redoHistory.length > 0)
})

engine.on(ClearCanvas, [StrokesChanged], (_payload, setStrokes) => { strokes = []; setStrokes(strokes) })

export function startLoop() {}
export function stopLoop() {}
