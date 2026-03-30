import { createEngine, createSignal } from '@pulse/core'
import type { Signal } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Tool = 'brush' | 'eraser' | 'line' | 'rect' | 'circle'

export interface Point {
  x: number
  y: number
  pressure: number
}

export interface Stroke {
  id: string
  tool: Tool
  color: string
  size: number
  points: Point[]
  layerId: number
}

export interface Layer {
  id: number
  name: string
  visible: boolean
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

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

// Internal
export const RenderRequest = engine.event<void>('RenderRequest')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const currentTool = engine.signal<Tool>(
  ToolChanged,
  'brush',
  (_prev, tool) => tool,
)

export const currentColor = engine.signal<string>(
  ColorChanged,
  '#3b82f6',
  (_prev, color) => color,
)

export const brushSize = engine.signal<number>(
  SizeChanged,
  4,
  (_prev, size) => size,
)

export const strokes: Signal<Stroke[]> = createSignal<Stroke[]>([])
engine['_signals'].push(strokes)

export const undoStack: Signal<Stroke[]> = createSignal<Stroke[]>([])
engine['_signals'].push(undoStack)

export const redoStack: Signal<Stroke[]> = createSignal<Stroke[]>([])
engine['_signals'].push(redoStack)

export const layers: Signal<Layer[]> = createSignal<Layer[]>([
  { id: 1, name: 'Layer 1', visible: true },
])
engine['_signals'].push(layers)

export const activeLayer = engine.signal<number>(
  LayerSelected,
  1,
  (_prev, id) => id,
)

// Current in-progress stroke
export const currentStroke: Signal<Stroke | null> = createSignal<Stroke | null>(null)
engine['_signals'].push(currentStroke)

// ---------------------------------------------------------------------------
// Stroke helpers
// ---------------------------------------------------------------------------

let strokeCounter = 0
let lastMoveTime = 0

engine.on(StrokeStart, ({ x, y }) => {
  const id = `stroke-${++strokeCounter}`
  lastMoveTime = Date.now()
  currentStroke._set({
    id,
    tool: currentTool.value,
    color: currentTool.value === 'eraser' ? '#1a1a2e' : currentColor.value,
    size: brushSize.value,
    points: [{ x, y, pressure: 1 }],
    layerId: activeLayer.value,
  })
})

engine.on(StrokeMove, ({ x, y, pressure }) => {
  const stroke = currentStroke.value
  if (!stroke) return

  // Speed-based pressure simulation
  const now = Date.now()
  const dt = now - lastMoveTime
  lastMoveTime = now

  const lastPt = stroke.points[stroke.points.length - 1]
  const dist = Math.sqrt((x - lastPt.x) ** 2 + (y - lastPt.y) ** 2)
  const speed = dt > 0 ? dist / dt : 0
  // Higher speed = less pressure (thinner line)
  const simulatedPressure = pressure ?? Math.max(0.2, Math.min(1, 1 - speed * 0.3))

  currentStroke._set({
    ...stroke,
    points: [...stroke.points, { x, y, pressure: simulatedPressure }],
  })
})

engine.on(StrokeEnd, () => {
  const stroke = currentStroke.value
  if (!stroke) return
  if (stroke.points.length > 1) {
    strokes._set([...strokes.value, stroke])
    undoStack._set([...undoStack.value, stroke])
    redoStack._set([])
  }
  currentStroke._set(null)
})

// ---------------------------------------------------------------------------
// Undo / Redo
// ---------------------------------------------------------------------------

engine.on(UndoStroke, () => {
  const stack = undoStack.value
  if (stack.length === 0) return
  const last = stack[stack.length - 1]
  undoStack._set(stack.slice(0, -1))
  redoStack._set([...redoStack.value, last])
  strokes._set(strokes.value.filter((s) => s.id !== last.id))
})

engine.on(RedoStroke, () => {
  const stack = redoStack.value
  if (stack.length === 0) return
  const last = stack[stack.length - 1]
  redoStack._set(stack.slice(0, -1))
  undoStack._set([...undoStack.value, last])
  strokes._set([...strokes.value, last])
})

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

engine.on(ClearCanvas, () => {
  strokes._set([])
  undoStack._set([])
  redoStack._set([])
  currentStroke._set(null)
})

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

let layerCounter = 1

engine.on(LayerAdded, () => {
  layerCounter++
  const newLayer: Layer = { id: layerCounter, name: `Layer ${layerCounter}`, visible: true }
  layers._set([...layers.value, newLayer])
  engine.emit(LayerSelected, layerCounter)
})

engine.on(LayerToggled, (id) => {
  layers._set(
    layers.value.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
  )
})

// ---------------------------------------------------------------------------
// Canvas rendering via frame loop
// ---------------------------------------------------------------------------

export let canvasRef: HTMLCanvasElement | null = null

export function setCanvasRef(canvas: HTMLCanvasElement | null) {
  canvasRef = canvas
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length < 2) return

  const layer = layers.value.find((l) => l.id === stroke.layerId)
  if (layer && !layer.visible) return

  ctx.strokeStyle = stroke.color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (stroke.tool === 'line') {
    const first = stroke.points[0]
    const last = stroke.points[stroke.points.length - 1]
    ctx.lineWidth = stroke.size
    ctx.beginPath()
    ctx.moveTo(first.x, first.y)
    ctx.lineTo(last.x, last.y)
    ctx.stroke()
    return
  }

  if (stroke.tool === 'rect') {
    const first = stroke.points[0]
    const last = stroke.points[stroke.points.length - 1]
    ctx.lineWidth = stroke.size
    ctx.strokeRect(
      Math.min(first.x, last.x),
      Math.min(first.y, last.y),
      Math.abs(last.x - first.x),
      Math.abs(last.y - first.y),
    )
    return
  }

  if (stroke.tool === 'circle') {
    const first = stroke.points[0]
    const last = stroke.points[stroke.points.length - 1]
    const rx = Math.abs(last.x - first.x) / 2
    const ry = Math.abs(last.y - first.y) / 2
    const cx = Math.min(first.x, last.x) + rx
    const cy = Math.min(first.y, last.y) + ry
    ctx.lineWidth = stroke.size
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()
    return
  }

  // Brush / Eraser: smooth curve with pressure-based thickness
  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
  }

  for (let i = 1; i < stroke.points.length; i++) {
    const p0 = stroke.points[i - 1]
    const p1 = stroke.points[i]
    const thickness = stroke.size * ((p0.pressure + p1.pressure) / 2)

    ctx.lineWidth = Math.max(1, thickness)
    ctx.beginPath()

    // Smooth interpolation using quadratic bezier with midpoints
    if (i > 1) {
      const pPrev = stroke.points[i - 2]
      const mx = (p0.x + p1.x) / 2
      const my = (p0.y + p1.y) / 2
      ctx.moveTo((pPrev.x + p0.x) / 2, (pPrev.y + p0.y) / 2)
      ctx.quadraticCurveTo(p0.x, p0.y, mx, my)
    } else {
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p1.x, p1.y)
    }
    ctx.stroke()
  }

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'source-over'
  }
}

// Render on every frame
engine.on(engine.frame, () => {
  if (!canvasRef) return
  const ctx = canvasRef.getContext('2d')
  if (!ctx) return

  // Clear
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvasRef.width, canvasRef.height)

  // Draw all committed strokes
  for (const stroke of strokes.value) {
    drawStroke(ctx, stroke)
  }

  // Draw current in-progress stroke
  const active = currentStroke.value
  if (active) {
    drawStroke(ctx, active)
  }
})

// ---------------------------------------------------------------------------
// Start frame loop
// ---------------------------------------------------------------------------

engine.startFrameLoop()
