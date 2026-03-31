import { onMount } from 'solid-js'
import { usePulse, useEmit } from '@pulse/solid'
import {
  StrokeStart,
  StrokeMove,
  StrokeEnd,
  ToolChanged,
  ColorChanged,
  SizeChanged,
  UndoStroke,
  RedoStroke,
  ClearCanvas,
  LayerAdded,
  LayerSelected,
  LayerToggled,
  setCanvasRef,
  saveProject,
  loadProject,
} from './engine'
import type { Tool } from './engine'

// ---------------------------------------------------------------------------
// Color presets
// ---------------------------------------------------------------------------

const COLOR_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#ffffff', '#000000',
]

// ---------------------------------------------------------------------------
// Tool config
// ---------------------------------------------------------------------------

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'brush', label: 'Brush', icon: '\u270E' },
  { id: 'eraser', label: 'Eraser', icon: '\u2B1C' },
  { id: 'line', label: 'Line', icon: '\u2571' },
  { id: 'rect', label: 'Rectangle', icon: '\u25AD' },
  { id: 'circle', label: 'Circle', icon: '\u25CB' },
]

// ---------------------------------------------------------------------------
// HueWheel + color picker
// ---------------------------------------------------------------------------

function ColorPicker({ color, onColorChange }: { color: string; onColorChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: 8 }}>
      <div
        style={{
          width: 32,
          height: 32,
          'border-radius': 8,
          background: color,
          border: '2px solid #475569',
        }}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.currentTarget.value)}
        style={{
          width: 32,
          height: 24,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      />
      <div style={{ display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)', gap: 3 }}>
        {COLOR_PRESETS.map((c) => (
          <div
            onClick={() => onColorChange(c)}
            style={{
              width: 18,
              height: 18,
              'border-radius': 4,
              background: c,
              cursor: 'pointer',
              border: color === c ? '2px solid #fff' : '1px solid #33415544',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const tool = usePulse(currentTool)
  const color = usePulse(currentColor)
  const size = usePulse(brushSize)
  const strokeList = usePulse(strokes)
  const undos = usePulse(undoStack)
  const redos = usePulse(redoStack)
  const layerList = usePulse(layers)
  const activeLayerId = usePulse(activeLayer)
  let canvasContainerRef = null
  let canvasElRef = null
  let isDrawing = false

  // Set canvas ref for engine rendering
  onMount(() => {
    if (canvasElRef) {
      setCanvasRef(canvasElRef)
    }
    return () => setCanvasRef(null)
  })

  // Resize canvas
  onMount(() => {
    const canvas = canvasElRef
    const container = canvasContainerRef
    if (!canvas || !container) return

    const resize = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  })

  // Keyboard shortcuts
  onMount(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          emit(RedoStroke, undefined)
        } else {
          emit(UndoStroke, undefined)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const getCanvasPos = (e: MouseEvent) => {
    const canvas = canvasElRef
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseDown = 
    (e: MouseEvent) => {
      isDrawing = true
      const pos = getCanvasPos(e)
      emit(StrokeStart, pos)
    }
  const handleMouseMove = 
    (e: MouseEvent) => {
      if (!isDrawing) return
      const pos = getCanvasPos(e)
      emit(StrokeMove, { ...pos })
    }
  const handleMouseUp = () => {
    if (!isDrawing) return
    isDrawing = false
    emit(StrokeEnd, undefined)
  }

  return (
    <div
      style={{
        height: '100vh',
        background: '#0f172a',
        'font-family':
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'grid',
        'grid-template-columns': '64px 1fr 200px',
        'grid-template-rows': '48px 1fr',
        overflow: 'hidden',
      }}
    >
      {/* Top toolbar */}
      <div
        style={{
          'grid-column': '1 / -1',
          background: '#1e293b',
          'border-bottom': '1px solid #334155',
          display: 'flex',
          'align-items': 'center',
          padding: '0 16px',
          gap: 16,
        }}
      >
        <h1 style={{ 'font-size': 16, 'font-weight': 700, color: '#f1f5f9', margin: 0, 'margin-right': 16 }}>
          Canvas Paint
        </h1>

        {/* Tool buttons */}
        {TOOLS.map((t) => (
          <button
            onClick={() => emit(ToolChanged, t.id)}
            title={t.label}
            style={{
              padding: '6px 12px',
              'border-radius': 6,
              border: tool === t.id ? '1px solid #3b82f6' : '1px solid transparent',
              background: tool === t.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: tool === t.id ? '#60a5fa' : '#94a3b8',
              'font-size': 16,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.icon}
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: '#334155' }} />

        {/* Size slider */}
        <div style={{ display: 'flex', 'align-items': 'center', gap: 8 }}>
          <span style={{ 'font-size': 12, color: '#64748b' }}>Size:</span>
          <input
            type="range"
            min={1}
            max={40}
            value={size}
            onChange={(e) => emit(SizeChanged, parseInt(e.currentTarget.value))}
            style={{ width: 80, 'accent-color': '#3b82f6' }}
          />
          <div
            style={{
              width: Math.max(4, size),
              height: Math.max(4, size),
              'border-radius': '50%',
              background: color,
              border: '1px solid #475569',
              'max-width': 28,
              'max-height': 28,
            }}
          />
        </div>

        <div style={{ width: 1, height: 24, background: '#334155' }} />

        {/* Undo / Redo */}
        <button
          onClick={() => emit(UndoStroke, undefined)}
          disabled={undos.length === 0}
          title="Undo (Cmd+Z)"
          style={{
            padding: '4px 10px',
            'border-radius': 6,
            border: '1px solid #334155',
            background: 'transparent',
            color: undos.length > 0 ? '#94a3b8' : '#334155',
            'font-size': 14,
            cursor: undos.length > 0 ? 'pointer' : 'default',
          }}
        >
          \u21B6
        </button>
        <button
          onClick={() => emit(RedoStroke, undefined)}
          disabled={redos.length === 0}
          title="Redo (Cmd+Shift+Z)"
          style={{
            padding: '4px 10px',
            'border-radius': 6,
            border: '1px solid #334155',
            background: 'transparent',
            color: redos.length > 0 ? '#94a3b8' : '#334155',
            'font-size': 14,
            cursor: redos.length > 0 ? 'pointer' : 'default',
          }}
        >
          \u21B7
        </button>
        <button
          onClick={() => emit(ClearCanvas, undefined)}
          title="Clear canvas"
          style={{
            padding: '4px 10px',
            'border-radius': 6,
            border: '1px solid #ef444440',
            background: 'transparent',
            color: '#f87171',
            'font-size': 12,
            'font-weight': 600,
            cursor: 'pointer',
          }}
        >
          Clear
        </button>

        <div style={{ width: 1, height: 24, background: '#334155' }} />

        {/* Save / Load project via engine.snapshot() / engine.restore() */}
        <button
          onClick={() => {
            const snap = saveProject()
            const serializable = Object.fromEntries(snap)
            localStorage.setItem('pulse-paint-project', JSON.stringify(serializable))
          }}
          title="Save project to localStorage"
          style={{
            padding: '4px 10px',
            'border-radius': 6,
            border: '1px solid #10b98140',
            background: 'transparent',
            color: '#34d399',
            'font-size': 12,
            'font-weight': 600,
            cursor: 'pointer',
          }}
        >
          Save
        </button>
        <button
          onClick={() => {
            const raw = localStorage.getItem('pulse-paint-project')
            if (!raw) return
            const parsed = JSON.parse(raw)
            const snap = new Map(Object.entries(parsed))
            loadProject(snap)
          }}
          title="Load project from localStorage"
          style={{
            padding: '4px 10px',
            'border-radius': 6,
            border: '1px solid #6366f140',
            background: 'transparent',
            color: '#818cf8',
            'font-size': 12,
            'font-weight': 600,
            cursor: 'pointer',
          }}
        >
          Load
        </button>

        <div style={{ flex: 1 }} />
        <span style={{ 'font-size': 11, color: '#475569' }}>
          Right-click to save | {strokeList.length} strokes
        </span>
      </div>

      {/* Left sidebar: colors */}
      <div
        style={{
          background: '#1e293b',
          'border-right': '1px solid #334155',
          padding: '12px 8px',
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
        }}
      >
        <ColorPicker
          color={color}
          onColorChange={(c) => emit(ColorChanged, c)}
        />
      </div>

      {/* Canvas */}
      <div
        ref={canvasContainerRef}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <canvas
          ref={canvasElRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            display: 'block',
            cursor: tool === 'eraser' ? 'crosshair' : 'crosshair',
          }}
        />
      </div>

      {/* Right sidebar: layers */}
      <div
        style={{
          background: '#1e293b',
          'border-left': '1px solid #334155',
          padding: 12,
          display: 'flex',
          'flex-direction': 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'margin-bottom': 12,
          }}
        >
          <span style={{ 'font-size': 12, 'font-weight': 700, color: '#94a3b8', 'text-transform': 'uppercase', 'letter-spacing': 1 }}>
            Layers
          </span>
          <button
            onClick={() => emit(LayerAdded, undefined)}
            style={{
              padding: '4px 8px',
              'border-radius': 4,
              border: '1px solid #334155',
              background: 'transparent',
              color: '#94a3b8',
              'font-size': 14,
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </div>

        {[...layerList].reverse().map((layer) => (
          <div
            onClick={() => emit(LayerSelected, layer.id)}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: 8,
              padding: '8px 10px',
              'border-radius': 6,
              background:
                layer.id === activeLayerId
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'transparent',
              cursor: 'pointer',
              'margin-bottom': 4,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                emit(LayerToggled, layer.id)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: layer.visible ? '#22c55e' : '#475569',
                cursor: 'pointer',
                'font-size': 14,
                padding: 0,
              }}
            >
              {layer.visible ? '\u25C9' : '\u25CB'}
            </button>
            <span
              style={{
                'font-size': 13,
                color:
                  layer.id === activeLayerId ? '#e2e8f0' : '#94a3b8',
                flex: 1,
              }}
            >
              {layer.name}
            </span>
          </div>
        ))}

        <div style={{ flex: 1 }} />

        {/* Keyboard shortcuts help */}
        <div style={{ 'font-size': 11, color: '#475569', 'line-height': 1.6, 'margin-top': 16 }}>
          <div>Cmd+Z: Undo</div>
          <div>Cmd+Shift+Z: Redo</div>
        </div>
      </div>
    </div>
  )
}
