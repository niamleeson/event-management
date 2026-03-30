import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Task {
  id: string
  name: string
  start: number  // day offset
  duration: number
  color: string
  dependencies: string[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DAYS = 30
export const DAY_WIDTH = 32

export const INITIAL_TASKS: Task[] = [
  { id: 't1', name: 'Requirements', start: 0, duration: 3, color: '#4361ee', dependencies: [] },
  { id: 't2', name: 'Design', start: 3, duration: 4, color: '#7209b7', dependencies: ['t1'] },
  { id: 't3', name: 'Frontend', start: 7, duration: 6, color: '#f72585', dependencies: ['t2'] },
  { id: 't4', name: 'Backend', start: 7, duration: 5, color: '#4cc9f0', dependencies: ['t2'] },
  { id: 't5', name: 'Database', start: 5, duration: 4, color: '#2a9d8f', dependencies: ['t2'] },
  { id: 't6', name: 'Testing', start: 13, duration: 4, color: '#e76f51', dependencies: ['t3', 't4'] },
  { id: 't7', name: 'Integration', start: 12, duration: 3, color: '#06d6a0', dependencies: ['t4', 't5'] },
  { id: 't8', name: 'QA Review', start: 17, duration: 3, color: '#ffd166', dependencies: ['t6'] },
  { id: 't9', name: 'Deployment', start: 20, duration: 2, color: '#ef476f', dependencies: ['t7', 't8'] },
  { id: 't10', name: 'Launch', start: 22, duration: 1, color: '#8338ec', dependencies: ['t9'] },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const MoveTask = engine.event<{ id: string; start: number }>('MoveTask')
export const ResizeTask = engine.event<{ id: string; duration: number }>('ResizeTask')
export const TaskUpdated = engine.event<Task>('TaskUpdated')
export const AutoShift = engine.event<string>('AutoShift')
export const ZoomChange = engine.event<number>('ZoomChange')
export const SelectTask = engine.event<string | null>('SelectTask')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const tasks = engine.signal<Task[]>(
  TaskUpdated,
  INITIAL_TASKS,
  (prev, updated) => prev.map((t) => (t.id === updated.id ? updated : t)),
)

export const zoomLevel = engine.signal<number>(ZoomChange, 1, (_prev, z) => z)
export const selectedTaskId = engine.signal<string | null>(SelectTask, null, (_prev, id) => id)

// ---------------------------------------------------------------------------
// Pipes: move/resize -> update task -> auto-shift dependents
// ---------------------------------------------------------------------------

engine.on(MoveTask, ({ id, start }) => {
  const task = tasks.value.find((t) => t.id === id)
  if (!task) return
  const clamped = Math.max(0, Math.min(DAYS - task.duration, start))
  engine.emit(TaskUpdated, { ...task, start: clamped })
  engine.emit(AutoShift, id)
})

engine.on(ResizeTask, ({ id, duration }) => {
  const task = tasks.value.find((t) => t.id === id)
  if (!task) return
  const clamped = Math.max(1, Math.min(DAYS - task.start, duration))
  engine.emit(TaskUpdated, { ...task, duration: clamped })
  engine.emit(AutoShift, id)
})

// Auto-shift dependent tasks when a task moves/resizes
engine.on(AutoShift, (taskId) => {
  const parentTask = tasks.value.find((t) => t.id === taskId)
  if (!parentTask) return

  const parentEnd = parentTask.start + parentTask.duration
  const dependents = tasks.value.filter((t) => t.dependencies.includes(taskId))

  for (const dep of dependents) {
    if (dep.start < parentEnd) {
      engine.emit(TaskUpdated, { ...dep, start: parentEnd })
      engine.emit(AutoShift, dep.id)
    }
  }
})

// Start frame loop
engine.startFrameLoop()
