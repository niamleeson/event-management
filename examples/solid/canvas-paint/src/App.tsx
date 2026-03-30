import { For, Show, onMount, onCleanup, createSignal as solidSignal } from 'solid-js'
import { useSignal, useEmit } from '@pulse/solid'
import type { Signal } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type Tool = 'brush' | 'eraser' | 'rect' | 'circle' | 'line'

interface Point { x: number; y: number }

interface DrawAction {
  type: 'stroke' | 'shape'
  tool: Tool
  color: string
  size: number
  points: Point[]
  layer: number
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const SelectTool = engine.event<Tool>('SelectTool')
const SelectColor = engine.event<string>('SelectColor')
const SelectSize = engine.event<number>('SelectSize')
const SelectLayer = engine.event<number>('SelectLayer')
const AddLayer = engine.event('AddLayer')
const StrokeComplete = engine.event<DrawAction>('StrokeComplete')
const UndoAction = engine.event('UndoAction')
const RedoAction = engine.event('RedoAction')
const ClearCanvas = engine.event('ClearCanvas')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const currentTool = engine.signal<Tool>(SelectTool, 'brush', (_prev, t) => t)
const currentColor = engine.signal<string>(SelectColor, '#ffffff', (_prev, c) => c)
const brushSize = engine.signal<number>(SelectSize, 4, (_prev, s) => s)
const activeLayer = engine.signal<number>(SelectLayer, 0, (_prev, l) => l)
const layerCount = engine.signal<number>(AddLayer, 2, (prev) => prev + 1)

const drawHistory = engine.signal<DrawAction[]>(
  StrokeComplete, [],
  (prev, action) => [...prev, action],
)
engine.signalUpdate(drawHistory, ClearCanvas, () => [])

// Undo/Redo stacks
const undoStack = engine.signal<DrawAction[][]>(
  StrokeComplete, [],
  (prev) => [...prev, drawHistory.value],
)
engine.signalUpdate(undoStack, ClearCanvas, () => [])

const redoStack = engine.signal<DrawAction[]>(
  UndoAction, [],
  (prev) => {
    const hist = drawHistory.value
    if (hist.length > 0) return [...prev, hist[hist.length - 1]]
    return prev
  },
)
engine.signalUpdate(redoStack, StrokeComplete, () => [])
engine.signalUpdate(redoStack, ClearCanvas, () => [])

engine.on(UndoAction, () => {
  const hist = drawHistory.value
  if (hist.length > 0) {
    drawHistory._set(hist.slice(0, -1))
  }
})

engine.on(RedoAction, () => {
  const redo = redoStack.value
  if (redo.length > 0) {
    const action = redo[redo.length - 1]
    redoStack._set(redo.slice(0, -1))
    engine.emit(StrokeComplete, action)
  }
})

/* ------------------------------------------------------------------ */
/*  Color palette                                                     */
/* ------------------------------------------------------------------ */

const COLORS = [
  '#ffffff', '#cccccc', '#888888', '#333333', '#000000',
  '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#00ccff',
  '#0066ff', '#9900ff', '#ff00ff', '#ff6b6b', '#00b894',
]

/* ------------------------------------------------------------------ */
/*  Canvas renderer                                                   */
/* ------------------------------------------------------------------ */

function PaintCanvas() {
  const emit = useEmit()
  let canvasRef!: HTMLCanvasElement
  let drawing = false
  let currentPoints: Point[] = []
  let shapeStart: Point | null = null

  function drawAll(ctx: CanvasRenderingContext2D) {
    const actions = drawHistory.value
    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height)

    // Background
    ctx.fillStyle = '#2d2d2d'
    ctx.fillRect(0, 0, canvasRef.width, canvasRef.height)

    // Checkerboard for transparency
    const sq = 16
    ctx.fillStyle = '#353535'
    for (let y = 0; y < canvasRef.height; y += sq * 2) {
      for (let x = 0; x < canvasRef.width; x += sq * 2) {
        ctx.fillRect(x, y, sq, sq)
        ctx.fillRect(x + sq, y + sq, sq, sq)
      }
    }

    // Draw each action grouped by layer
    const maxLayer = layerCount.value
    for (let l = 0; l < maxLayer; l++) {
      for (const action of actions) {
        if (action.layer !== l) continue
        drawAction(ctx, action)
      }
    }
  }

  function drawAction(ctx: CanvasRenderingContext2D, action: DrawAction) {
    ctx.strokeStyle = action.tool === 'eraser' ? '#2d2d2d' : action.color
    ctx.fillStyle = action.color
    ctx.lineWidth = action.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (action.tool === 'brush' || action.tool === 'eraser') {
      if (action.points.length < 2) return
      ctx.beginPath()
      ctx.moveTo(action.points[0].x, action.points[0].y)

      // Smooth curves using quadratic bezier
      for (let i = 1; i < action.points.length - 1; i++) {
        const xc = (action.points[i].x + action.points[i + 1].x) / 2
        const yc = (action.points[i].y + action.points[i + 1].y) / 2
        ctx.quadraticCurveTo(action.points[i].x, action.points[i].y, xc, yc)
      }
      const last = action.points[action.points.length - 1]
      ctx.lineTo(last.x, last.y)
      ctx.stroke()
    } else if (action.tool === 'rect' && action.points.length >= 2) {
      const [a, b] = [action.points[0], action.points[action.points.length - 1]]
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
    } else if (action.tool === 'circle' && action.points.length >= 2) {
      const [a, b] = [action.points[0], action.points[action.points.length - 1]]
      const r = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
      ctx.beginPath()
      ctx.arc(a.x, a.y, r, 0, Math.PI * 2)
      ctx.stroke()
    } else if (action.tool === 'line' && action.points.length >= 2) {
      const [a, b] = [action.points[0], action.points[action.points.length - 1]]
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  }

  onMount(() => {
    const ctx = canvasRef.getContext('2d')!
    const resize = () => {
      canvasRef.width = canvasRef.offsetWidth
      canvasRef.height = canvasRef.offsetHeight
      drawAll(ctx)
    }
    resize()
    window.addEventListener('resize', resize)

    const dispose = engine.on(engine.frame, () => drawAll(ctx))

    // Draw current stroke preview
    const previewDispose = engine.on(engine.frame, () => {
      if (!drawing || currentPoints.length < 2) return
      const preview: DrawAction = {
        type: 'stroke', tool: currentTool.value,
        color: currentColor.value, size: brushSize.value,
        points: currentPoints, layer: activeLayer.value,
      }
      drawAction(ctx, preview)
    })

    onCleanup(() => { dispose(); previewDispose(); window.removeEventListener('resize', resize) })
  })

  const getPos = (e: PointerEvent): Point => {
    const rect = canvasRef.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ flex: '1', cursor: 'crosshair', display: 'block' }}
      onPointerDown={(e) => {
        drawing = true
        currentPoints = [getPos(e)]
        canvasRef.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!drawing) return
        currentPoints.push(getPos(e))
      }}
      onPointerUp={() => {
        if (!drawing) return
        drawing = false
        if (currentPoints.length > 1) {
          emit(StrokeComplete, {
            type: currentTool.value === 'brush' || currentTool.value === 'eraser' ? 'stroke' : 'shape',
            tool: currentTool.value, color: currentColor.value,
            size: brushSize.value, points: [...currentPoints],
            layer: activeLayer.value,
          })
        }
        currentPoints = []
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const emit = useEmit()
  const tool = useSignal(currentTool)
  const color = useSignal(currentColor)
  const size = useSignal(brushSize)
  const layer = useSignal(activeLayer)
  const layers = useSignal(layerCount)
  const hist = useSignal(drawHistory)
  const redo = useSignal(redoStack)

  const TOOLS: { id: Tool; icon: string; label: string }[] = [
    { id: 'brush', icon: '\u270E', label: 'Brush' },
    { id: 'eraser', icon: '\u2395', label: 'Eraser' },
    { id: 'rect', icon: '\u25A1', label: 'Rectangle' },
    { id: 'circle', icon: '\u25CB', label: 'Circle' },
    { id: 'line', icon: '\u2571', label: 'Line' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', 'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Toolbar */}
      <div style={{ width: '60px', background: '#1a1a1a', display: 'flex', 'flex-direction': 'column', 'align-items': 'center', padding: '12px 0', gap: '4px', 'border-right': '1px solid #444' }}>
        <For each={TOOLS}>
          {(t) => (
            <button
              onClick={() => emit(SelectTool, t.id)}
              title={t.label}
              style={{
                width: '44px', height: '44px', 'border-radius': '8px', border: 'none',
                background: tool() === t.id ? '#4361ee' : 'transparent', color: '#fff',
                cursor: 'pointer', 'font-size': '20px', display: 'flex',
                'align-items': 'center', 'justify-content': 'center',
              }}
            >{t.icon}</button>
          )}
        </For>

        <div style={{ height: '1px', width: '36px', background: '#444', margin: '8px 0' }} />

        {/* Undo/Redo */}
        <button
          onClick={() => emit(UndoAction, undefined)}
          disabled={hist().length === 0}
          title="Undo"
          style={{ width: '44px', height: '36px', 'border-radius': '8px', border: 'none', background: 'transparent', color: hist().length > 0 ? '#fff' : '#555', cursor: 'pointer', 'font-size': '16px' }}
        >\u21B6</button>
        <button
          onClick={() => emit(RedoAction, undefined)}
          disabled={redo().length === 0}
          title="Redo"
          style={{ width: '44px', height: '36px', 'border-radius': '8px', border: 'none', background: 'transparent', color: redo().length > 0 ? '#fff' : '#555', cursor: 'pointer', 'font-size': '16px' }}
        >\u21B7</button>

        <div style={{ height: '1px', width: '36px', background: '#444', margin: '8px 0' }} />

        <button
          onClick={() => emit(ClearCanvas, undefined)}
          title="Clear"
          style={{ width: '44px', height: '36px', 'border-radius': '8px', border: 'none', background: 'transparent', color: '#d63031', cursor: 'pointer', 'font-size': '14px' }}
        >{"\uD83D\uDDD1"}</button>
      </div>

      {/* Canvas */}
      <PaintCanvas />

      {/* Side panel */}
      <div style={{ width: '200px', background: '#1a1a1a', padding: '16px', 'border-left': '1px solid #444', overflow: 'auto' }}>
        {/* Color picker */}
        <div style={{ 'margin-bottom': '16px' }}>
          <div style={{ 'font-size': '11px', color: '#888', 'margin-bottom': '8px', 'text-transform': 'uppercase', 'letter-spacing': '0.5px' }}>Color</div>
          <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '4px' }}>
            <For each={COLORS}>
              {(c) => (
                <div
                  onClick={() => emit(SelectColor, c)}
                  style={{
                    width: '24px', height: '24px', 'border-radius': '4px', background: c,
                    border: color() === c ? '2px solid #4361ee' : '1px solid #444',
                    cursor: 'pointer',
                  }}
                />
              )}
            </For>
          </div>
          <input
            type="color"
            value={color()}
            onInput={(e) => emit(SelectColor, e.currentTarget.value)}
            style={{ width: '100%', height: '28px', 'margin-top': '8px', cursor: 'pointer', background: 'none', border: '1px solid #444', 'border-radius': '4px' }}
          />
        </div>

        {/* Brush size */}
        <div style={{ 'margin-bottom': '16px' }}>
          <div style={{ 'font-size': '11px', color: '#888', 'margin-bottom': '8px', 'text-transform': 'uppercase', 'letter-spacing': '0.5px' }}>
            Size: {size()}px
          </div>
          <input
            type="range" min="1" max="50" value={size()}
            onInput={(e) => emit(SelectSize, parseInt(e.currentTarget.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Layers */}
        <div>
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '8px' }}>
            <span style={{ 'font-size': '11px', color: '#888', 'text-transform': 'uppercase', 'letter-spacing': '0.5px' }}>Layers</span>
            <button
              onClick={() => emit(AddLayer, undefined)}
              style={{ background: '#333', border: 'none', color: '#fff', 'border-radius': '4px', padding: '2px 8px', cursor: 'pointer', 'font-size': '12px' }}
            >+</button>
          </div>
          <For each={Array.from({ length: layers() }, (_, i) => i)}>
            {(l) => (
              <div
                onClick={() => emit(SelectLayer, l)}
                style={{
                  padding: '6px 10px', 'border-radius': '4px', 'margin-bottom': '4px',
                  background: layer() === l ? '#4361ee33' : 'transparent',
                  border: layer() === l ? '1px solid #4361ee' : '1px solid transparent',
                  color: '#ccc', 'font-size': '12px', cursor: 'pointer',
                }}
              >Layer {l + 1}</div>
            )}
          </For>
        </div>

        <div style={{ 'margin-top': '16px', 'font-size': '11px', color: '#555' }}>
          Actions: {hist().length}
        </div>
      </div>
    </div>
  )
}
