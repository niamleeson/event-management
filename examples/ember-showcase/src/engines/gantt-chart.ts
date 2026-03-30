import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GanttTask {
  id: string
  name: string
  start: number   // day offset from project start
  duration: number // days
  color: string
  dependencies: string[]
  progress: number // 0-100
}

export type ZoomLevel = 'day' | 'week' | 'month'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DAY_WIDTH_BASE = 40 // pixels per day at default zoom
export const TOTAL_DAYS = 60
export const ROW_HEIGHT = 44

const INITIAL_TASKS: GanttTask[] = [
  { id: 't1', name: 'Requirements', start: 0, duration: 5, color: '#4361ee', dependencies: [], progress: 100 },
  { id: 't2', name: 'Design', start: 5, duration: 7, color: '#7209b7', dependencies: ['t1'], progress: 80 },
  { id: 't3', name: 'Backend API', start: 12, duration: 10, color: '#2a9d8f', dependencies: ['t2'], progress: 40 },
  { id: 't4', name: 'Frontend UI', start: 12, duration: 12, color: '#f72585', dependencies: ['t2'], progress: 30 },
  { id: 't5', name: 'Database', start: 14, duration: 6, color: '#e76f51', dependencies: ['t2'], progress: 60 },
  { id: 't6', name: 'Integration', start: 24, duration: 5, color: '#f4a261', dependencies: ['t3', 't4', 't5'], progress: 0 },
  { id: 't7', name: 'Testing', start: 29, duration: 8, color: '#264653', dependencies: ['t6'], progress: 0 },
  { id: 't8', name: 'Deployment', start: 37, duration: 3, color: '#4361ee', dependencies: ['t7'], progress: 0 },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const TaskDragged = engine.event<{ id: string; newStart: number }>('TaskDragged')
export const TaskResized = engine.event<{ id: string; newDuration: number }>('TaskResized')
export const TaskSelected = engine.event<string | null>('TaskSelected')
export const ZoomChanged = engine.event<ZoomLevel>('ZoomChanged')
export const ScrollXChanged = engine.event<number>('ScrollXChanged')
export const AddTask = engine.event<GanttTask>('AddTask')
export const RemoveTask = engine.event<string>('RemoveTask')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const tasks = engine.signal<GanttTask[]>(
  TaskDragged, [...INITIAL_TASKS],
  (prev, { id, newStart }) => {
    const task = prev.find((t) => t.id === id)
    if (!task) return prev
    const delta = newStart - task.start

    // Auto-shift dependent tasks
    const next = prev.map((t) => {
      if (t.id === id) return { ...t, start: Math.max(0, newStart) }
      return t
    })

    // Cascade: shift tasks that depend on this task
    return cascadeDependencies(next, id, delta)
  },
)

engine.signalUpdate(tasks, TaskResized, (prev, { id, newDuration }) =>
  prev.map((t) => t.id === id ? { ...t, duration: Math.max(1, newDuration) } : t),
)

engine.signalUpdate(tasks, AddTask, (prev, task) => [...prev, task])
engine.signalUpdate(tasks, RemoveTask, (prev, id) => prev.filter((t) => t.id !== id))

export const selectedTask = engine.signal<string | null>(
  TaskSelected, null, (_prev, id) => id,
)

export const zoomLevel = engine.signal<ZoomLevel>(
  ZoomChanged, 'day', (_prev, level) => level,
)

export const scrollX = engine.signal<number>(
  ScrollXChanged, 0, (_prev, x) => Math.max(0, x),
)

// ---------------------------------------------------------------------------
// Helper: cascade dependency shifts
// ---------------------------------------------------------------------------

function cascadeDependencies(taskList: GanttTask[], changedId: string, delta: number): GanttTask[] {
  if (delta === 0) return taskList
  const result = [...taskList]

  function shift(id: string) {
    for (let i = 0; i < result.length; i++) {
      const t = result[i]
      if (t.dependencies.includes(id)) {
        const depTask = result.find((d) => d.id === id)!
        const minStart = depTask.start + depTask.duration
        if (t.start < minStart) {
          result[i] = { ...t, start: minStart }
          shift(t.id) // recurse
        }
      }
    }
  }

  shift(changedId)
  return result
}

// ---------------------------------------------------------------------------
// Zoom helpers
// ---------------------------------------------------------------------------

export function getDayWidth(zoom: ZoomLevel): number {
  switch (zoom) {
    case 'day': return DAY_WIDTH_BASE
    case 'week': return DAY_WIDTH_BASE / 2
    case 'month': return DAY_WIDTH_BASE / 4
  }
}
