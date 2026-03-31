<script setup lang="ts">
import { providePulse, useEmit, usePulse } from '@pulse/vue'
import {
  engine,
  tasks,
  zoom,
  TaskMoved,
  TaskResized,
  ZoomChanged,
  TOTAL_DAYS,
  dayWidth,
  TasksChanged,
} from './engine'
import type { Task, ZoomLevel } from './engine'

providePulse(engine)

const emit = useEmit()
const taskList = usePulse(TasksChanged, tasks)
const zoomLevel = usePulse(ZoomChanged, zoom)

const ZOOM_OPTIONS: ZoomLevel[] = ['day', 'week', 'month']
const ROW_HEIGHT = 40
const LABEL_WIDTH = 140

let dragState: { taskId: number; mode: 'move' | 'resize'; startX: number; origStart: number; origDuration: number } | null = null

function onPointerDown(e: PointerEvent, task: Task, mode: 'move' | 'resize') {
  dragState = { taskId: task.id, mode, startX: e.clientX, origStart: task.start, origDuration: task.duration }
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragState) return
  const dx = e.clientX - dragState.startX
  const dw = dayWidth(zoomLevel.value)
  const dayDelta = Math.round(dx / dw)

  if (dragState.mode === 'move') {
    emit(TaskMoved, { id: dragState.taskId, newStart: Math.max(0, dragState.origStart + dayDelta) })
  } else {
    emit(TaskResized, { id: dragState.taskId, newDuration: Math.max(1, dragState.origDuration + dayDelta) })
  }
}

function onPointerUp() {
  dragState = null
}

const today = 15

function depLines(task: Task) {
  const dw = dayWidth(zoomLevel.value)
  return task.dependsOn.map(depId => {
    const dep = taskList.value.find(t => t.id === depId)
    if (!dep) return null
    const fromX = (dep.start + dep.duration) * dw
    const fromY = taskList.value.indexOf(dep) * ROW_HEIGHT + ROW_HEIGHT / 2
    const toX = task.start * dw
    const toY = taskList.value.indexOf(task) * ROW_HEIGHT + ROW_HEIGHT / 2
    return { fromX, fromY, toX, toY, depId }
  }).filter(Boolean)
}
</script>

<template>
  <div>
    <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }">
      <h1 :style="{ fontSize: '24px', fontWeight: 700, color: '#333' }">Gantt Chart</h1>
      <div :style="{ display: 'flex', gap: '8px' }">
        <button
          v-for="z in ZOOM_OPTIONS"
          :key="z"
          @click="emit(ZoomChanged, z)"
          :style="{
            background: zoomLevel === z ? '#4361ee' : '#fff',
            color: zoomLevel === z ? '#fff' : '#333',
            border: '1px solid #ddd', padding: '6px 16px', borderRadius: '6px',
            cursor: 'pointer', fontSize: '13px', textTransform: 'capitalize',
          }"
        >{{ z }}</button>
      </div>
    </div>

    <div :style="{ display: 'flex', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }">
      <!-- Task labels -->
      <div :style="{ width: `${LABEL_WIDTH}px`, borderRight: '1px solid #e0e0e0', flexShrink: 0 }">
        <div :style="{ height: '32px', background: '#f8f8f8', borderBottom: '1px solid #e0e0e0', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#888' }">
          Task
        </div>
        <div
          v-for="task in taskList"
          :key="task.id"
          :style="{
            height: `${ROW_HEIGHT}px`, display: 'flex', alignItems: 'center', padding: '0 12px',
            borderBottom: '1px solid #f0f0f0', fontSize: '13px', fontWeight: 500, color: '#333',
          }"
        >
          <div :style="{ width: '8px', height: '8px', borderRadius: '50%', background: task.color, marginRight: '8px' }" />
          {{ task.name }}
        </div>
      </div>

      <!-- Timeline -->
      <div :style="{ flex: 1, overflow: 'auto', position: 'relative' }" @pointermove="onPointerMove" @pointerup="onPointerUp">
        <!-- Day headers -->
        <div :style="{ display: 'flex', height: '32px', background: '#f8f8f8', borderBottom: '1px solid #e0e0e0' }">
          <div
            v-for="d in TOTAL_DAYS"
            :key="d"
            :style="{
              width: `${dayWidth(zoomLevel)}px`, minWidth: `${dayWidth(zoomLevel)}px`,
              borderRight: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', color: '#999',
            }"
          >
            {{ zoomLevel === 'day' ? d : '' }}
          </div>
        </div>

        <!-- SVG for dependency arrows -->
        <svg :style="{ position: 'absolute', top: '32px', left: '0', pointerEvents: 'none', width: `${TOTAL_DAYS * dayWidth(zoomLevel)}px`, height: `${taskList.length * ROW_HEIGHT}px` }">
          <template v-for="task in taskList" :key="'dep-' + task.id">
            <line
              v-for="line in depLines(task)"
              :key="line!.depId"
              :x1="line!.fromX" :y1="line!.fromY"
              :x2="line!.toX" :y2="line!.toY"
              stroke="#ccc" stroke-width="1.5" stroke-dasharray="4,3"
              marker-end="url(#arrow)"
            />
          </template>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#ccc" />
            </marker>
          </defs>
        </svg>

        <!-- Today marker -->
        <div :style="{
          position: 'absolute', top: '32px', bottom: '0',
          left: `${today * dayWidth(zoomLevel)}px`,
          width: '2px', background: '#d63031', opacity: 0.5, zIndex: 5,
        }" />
        <div :style="{
          position: 'absolute', top: '20px',
          left: `${today * dayWidth(zoomLevel) - 16}px`,
          fontSize: '10px', color: '#d63031', fontWeight: 600, zIndex: 5,
        }">Today</div>

        <!-- Task bars -->
        <div :style="{ position: 'relative' }">
          <div
            v-for="(task, idx) in taskList"
            :key="task.id"
            :style="{
              position: 'absolute',
              top: `${idx * ROW_HEIGHT + 8}px`,
              left: `${task.start * dayWidth(zoomLevel)}px`,
              width: `${task.duration * dayWidth(zoomLevel)}px`,
              height: `${ROW_HEIGHT - 16}px`,
              background: task.color,
              borderRadius: '4px',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '6px',
              fontSize: '11px',
              color: '#fff',
              fontWeight: 600,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }"
            @pointerdown="(e) => onPointerDown(e, task, 'move')"
          >
            {{ task.name }}
            <!-- Resize handle -->
            <div
              :style="{
                position: 'absolute', right: '0', top: '0', bottom: '0', width: '8px',
                cursor: 'ew-resize', background: 'rgba(0,0,0,0.15)',
              }"
              @pointerdown.stop="(e) => onPointerDown(e, task, 'resize')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
