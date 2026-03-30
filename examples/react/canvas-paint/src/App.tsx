import { useSignal, useEmit } from '@pulse/react'
import { useRef, useEffect, useCallback } from 'react'
import {
  currentTool,
  currentColor,
  brushSize,
  strokes,
  undoStack,
  redoStack,
  layers,
  activeLayer,
  currentStroke,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: color,
          border: '2px solid #475569',
        }}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        style={{
          width: 32,
          height: 24,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
        {COLOR_PRESETS.map((c) => (
          <div
            key={c}
            onClick={() => onColorChange(c)}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
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
  const tool = useSignal(currentTool)
  const color = useSignal(currentColor)
  const size = useSignal(brushSize)
  const strokeList = useSignal(strokes)
  const undos = useSignal(undoStack)
  const redos = useSignal(redoStack)
  const layerList = useSignal(layers)
  const activeLayerId = useSignal(activeLayer)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)

  // Set canvas ref for engine rendering
  useEffect(() => {
    if (canvasElRef.current) {
      setCanvasRef(canvasElRef.current)
    }
    return () => setCanvasRef(null)
  }, [])

  // Resize canvas
  useEffect(() => {
    const canvas = canvasElRef.current
    const container = canvasContainerRef.current
    if (!canvas || !container) return

    const resize = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
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
  }, [emit])

  const getCanvasPos = useCallback((e: React.MouseEvent) => {
    const canvas = canvasElRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDrawing.current = true
      const pos = getCanvasPos(e)
      emit(StrokeStart, pos)
    },
    [emit, getCanvasPos],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing.current) return
      const pos = getCanvasPos(e)
      emit(StrokeMove, { ...pos })
    },
    [emit, getCanvasPos],
  )

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false
    emit(StrokeEnd, undefined)
  }, [emit])

  return (
    <div
      style={{
        height: '100vh',
        background: '#0f172a',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'grid',
        gridTemplateColumns: '64px 1fr 200px',
        gridTemplateRows: '48px 1fr',
        overflow: 'hidden',
      }}
    >
      {/* Top toolbar */}
      <div
        style={{
          gridColumn: '1 / -1',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0, marginRight: 16 }}>
          Canvas Paint
        </h1>

        {/* Tool buttons */}
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => emit(ToolChanged, t.id)}
            title={t.label}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: tool === t.id ? '1px solid #3b82f6' : '1px solid transparent',
              background: tool === t.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: tool === t.id ? '#60a5fa' : '#94a3b8',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.icon}
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: '#334155' }} />

        {/* Size slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Size:</span>
          <input
            type="range"
            min={1}
            max={40}
            value={size}
            onChange={(e) => emit(SizeChanged, parseInt(e.target.value))}
            style={{ width: 80, accentColor: '#3b82f6' }}
          />
          <div
            style={{
              width: Math.max(4, size),
              height: Math.max(4, size),
              borderRadius: '50%',
              background: color,
              border: '1px solid #475569',
              maxWidth: 28,
              maxHeight: 28,
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
            borderRadius: 6,
            border: '1px solid #334155',
            background: 'transparent',
            color: undos.length > 0 ? '#94a3b8' : '#334155',
            fontSize: 14,
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
            borderRadius: 6,
            border: '1px solid #334155',
            background: 'transparent',
            color: redos.length > 0 ? '#94a3b8' : '#334155',
            fontSize: 14,
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
            borderRadius: 6,
            border: '1px solid #ef444440',
            background: 'transparent',
            color: '#f87171',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Clear
        </button>

        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#475569' }}>
          Right-click to save | {strokeList.length} strokes
        </span>
      </div>

      {/* Left sidebar: colors */}
      <div
        style={{
          background: '#1e293b',
          borderRight: '1px solid #334155',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
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
          borderLeft: '1px solid #334155',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Layers
          </span>
          <button
            onClick={() => emit(LayerAdded, undefined)}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #334155',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </div>

        {[...layerList].reverse().map((layer) => (
          <div
            key={layer.id}
            onClick={() => emit(LayerSelected, layer.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 6,
              background:
                layer.id === activeLayerId
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'transparent',
              cursor: 'pointer',
              marginBottom: 4,
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
                fontSize: 14,
                padding: 0,
              }}
            >
              {layer.visible ? '\u25C9' : '\u25CB'}
            </button>
            <span
              style={{
                fontSize: 13,
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
        <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, marginTop: 16 }}>
          <div>Cmd+Z: Undo</div>
          <div>Cmd+Shift+Z: Redo</div>
        </div>
      </div>
    </div>
  )
}
