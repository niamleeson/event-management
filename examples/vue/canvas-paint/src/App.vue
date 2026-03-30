<script setup lang="ts">
import { ref as vueRef, onMounted, onUnmounted } from 'vue'
import { providePulse, useEmit, useSignal } from '@pulse/vue'
import {
  engine, PALETTE, TOOLS,
  ToolChanged, ColorChanged, SizeChanged, StrokeStart, StrokeMove, StrokeEnd,
  UndoStroke, RedoStroke, LayerSelected, LayerToggled, LayerAdded,
  currentTool, currentColor, brushSize, layers, activeLayer, isDrawing,
  getCurrentStroke, getUndoStack, getRedoStack, StrokesChanged,
} from './engine'
import type { Tool, Stroke, Point } from './engine'

providePulse(engine)

const emit = useEmit()
const tool = useSignal(currentTool)
const color = useSignal(currentColor)
const size = useSignal(brushSize)
const layerList = useSignal(layers)
const active = useSignal(activeLayer)
const drawing = useSignal(isDrawing)

const canvasRef = vueRef<HTMLCanvasElement | null>(null)

let disposeFrame: (() => void) | null = null

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length < 2) return

  ctx.strokeStyle = stroke.color
  ctx.lineWidth = stroke.size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (stroke.tool === 'brush' || stroke.tool === 'eraser') {
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1]
      const curr = stroke.points[i]
      const mx = (prev.x + curr.x) / 2
      const my = (prev.y + curr.y) / 2
      ctx.quadraticCurveTo(prev.x, prev.y, mx, my)
    }
    ctx.stroke()
  } else if (stroke.tool === 'rect') {
    const start = stroke.points[0]
    const end = stroke.points[stroke.points.length - 1]
    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
  } else if (stroke.tool === 'circle') {
    const start = stroke.points[0]
    const end = stroke.points[stroke.points.length - 1]
    const rx = Math.abs(end.x - start.x) / 2
    const ry = Math.abs(end.y - start.y) / 2
    const cx = (start.x + end.x) / 2
    const cy = (start.y + end.y) / 2
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else if (stroke.tool === 'line') {
    const start = stroke.points[0]
    const end = stroke.points[stroke.points.length - 1]
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight

  disposeFrame = engine.on(engine.frame, () => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw all committed strokes from visible layers
    const undoStack = getUndoStack()
    for (const layer of layerList.value) {
      if (!layer.visible) continue
      for (const stroke of undoStack) {
        if (stroke.layer === layer.id) drawStroke(ctx, stroke)
      }
    }

    // Draw current in-progress stroke
    const current = getCurrentStroke()
    if (current) drawStroke(ctx, current)
  })
})

onUnmounted(() => disposeFrame?.())

function getCanvasPoint(e: MouseEvent): Point {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}
</script>

<template>
  <div :style="{ display: 'flex', height: '100vh' }">
    <!-- Toolbar -->
    <div :style="{ width: '60px', background: '#16162a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: '4px' }">
      <div
        v-for="t in TOOLS"
        :key="t.tool"
        @click="emit(ToolChanged, t.tool)"
        :title="t.label"
        :style="{
          width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '18px',
          background: tool === t.tool ? 'rgba(67,97,238,0.3)' : 'transparent',
          color: tool === t.tool ? '#4361ee' : '#888',
          border: tool === t.tool ? '1px solid rgba(67,97,238,0.4)' : '1px solid transparent',
        }"
      >{{ t.icon }}</div>

      <div :style="{ width: '36px', height: '1px', background: '#333', margin: '8px 0' }" />

      <!-- Color palette -->
      <div
        v-for="c in PALETTE"
        :key="c"
        @click="emit(ColorChanged, c)"
        :style="{
          width: '24px', height: '24px', borderRadius: '50%', background: c, cursor: 'pointer',
          border: color === c ? '2px solid #fff' : '2px solid transparent',
          marginBottom: '2px',
        }"
      />

      <div :style="{ width: '36px', height: '1px', background: '#333', margin: '8px 0' }" />

      <!-- Brush size -->
      <div :style="{ color: '#888', fontSize: '10px', marginBottom: '4px' }">{{ size }}px</div>
      <input
        type="range" min="1" max="30"
        :value="size"
        @input="emit(SizeChanged, parseInt(($event.target as HTMLInputElement).value))"
        :style="{ width: '40px', transform: 'rotate(-90deg)', transformOrigin: 'center', marginTop: '20px', marginBottom: '20px' }"
      />

      <div :style="{ width: '36px', height: '1px', background: '#333', margin: '8px 0' }" />

      <!-- Undo/Redo -->
      <div
        @click="emit(UndoStroke, undefined)"
        :style="{ width: '40px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', fontSize: '14px', borderRadius: '6px' }"
        title="Undo"
      >&#x21A9;</div>
      <div
        @click="emit(RedoStroke, undefined)"
        :style="{ width: '40px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', fontSize: '14px', borderRadius: '6px' }"
        title="Redo"
      >&#x21AA;</div>
    </div>

    <!-- Canvas -->
    <div :style="{ flex: 1, position: 'relative' }">
      <canvas
        ref="canvasRef"
        :style="{ width: '100%', height: '100%', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }"
        @mousedown="(e) => emit(StrokeStart, getCanvasPoint(e))"
        @mousemove="(e) => { if (drawing) emit(StrokeMove, getCanvasPoint(e)) }"
        @mouseup="emit(StrokeEnd, undefined)"
        @mouseleave="() => { if (drawing) emit(StrokeEnd, undefined) }"
      />
    </div>

    <!-- Layers panel -->
    <div :style="{ width: '180px', background: '#16162a', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }">
      <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
        <span :style="{ color: '#888', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }">Layers</span>
        <button
          @click="emit(LayerAdded, undefined)"
          :style="{ background: 'rgba(67,97,238,0.2)', border: '1px solid rgba(67,97,238,0.3)', color: '#4361ee', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }"
        >+</button>
      </div>
      <div
        v-for="layer in [...layerList].reverse()"
        :key="layer.id"
        @click="emit(LayerSelected, layer.id)"
        :style="{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px',
          borderRadius: '6px', cursor: 'pointer',
          background: active === layer.id ? 'rgba(67,97,238,0.15)' : 'transparent',
          border: active === layer.id ? '1px solid rgba(67,97,238,0.3)' : '1px solid transparent',
        }"
      >
        <div
          @click.stop="emit(LayerToggled, layer.id)"
          :style="{
            width: '16px', height: '16px', borderRadius: '3px', cursor: 'pointer',
            background: layer.visible ? '#4361ee' : 'transparent',
            border: layer.visible ? 'none' : '1px solid #555',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '10px',
          }"
        >{{ layer.visible ? '\u2713' : '' }}</div>
        <span :style="{ color: '#ccc', fontSize: '13px' }">{{ layer.name }}</span>
      </div>
    </div>
  </div>
</template>
