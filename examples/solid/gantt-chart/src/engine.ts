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
  title: string
  category: string
  start: number   // day offset from project start
  duration: number // in days
  dependencies: string[] // ids of tasks this depends on
  color: string
}

export interface DragState {
  taskId: string | null
  type: 'move' | 'resize' | null
  startX: number
  originalStart: number
  originalDuration: number
}

export interface ViewRange {
  start: number
  end: number
}

export interface Dependency {
  from: string
  to: string
}

export type ZoomLevel = 'day' | 'week' | 'month'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const categoryColors: Record<string, string> = {
  'Planning': '#4361ee',
  'Design': '#e91e63',
  'Development': '#4caf50',
  'Testing': '#ff9800',
  'Deployment': '#9c27b0',
}

export const PROJECT_START = new Date(2026, 0, 5) // Jan 5, 2026

export function dayToDate(day: number): Date {
  const d = new Date(PROJECT_START)
  d.setDate(d.getDate() + day)
  return d
}

export function formatDate(day: number): string {
  const d = dayToDate(day)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

// ---------------------------------------------------------------------------
// Sample tasks
// ---------------------------------------------------------------------------

const initialTasks: Task[] = [
  { id: 't1', title: 'Project Kickoff', category: 'Planning', start: 0, duration: 3, dependencies: [], color: categoryColors['Planning'] },
  { id: 't2', title: 'Requirements Gathering', category: 'Planning', start: 3, duration: 5, dependencies: ['t1'], color: categoryColors['Planning'] },
  { id: 't3', title: 'UI/UX Design', category: 'Design', start: 8, duration: 7, dependencies: ['t2'], color: categoryColors['Design'] },
  { id: 't4', title: 'Architecture Design', category: 'Design', start: 8, duration: 5, dependencies: ['t2'], color: categoryColors['Design'] },
  { id: 't5', title: 'Frontend Development', category: 'Development', start: 15, duration: 14, dependencies: ['t3'], color: categoryColors['Development'] },
  { id: 't6', title: 'Backend Development', category: 'Development', start: 13, duration: 16, dependencies: ['t4'], color: categoryColors['Development'] },
  { id: 't7', title: 'API Integration', category: 'Development', start: 29, duration: 5, dependencies: ['t5', 't6'], color: categoryColors['Development'] },
  { id: 't8', title: 'Unit Testing', category: 'Testing', start: 29, duration: 7, dependencies: ['t5'], color: categoryColors['Testing'] },
  { id: 't9', title: 'Integration Testing', category: 'Testing', start: 34, duration: 5, dependencies: ['t7', 't8'], color: categoryColors['Testing'] },
  { id: 't10', title: 'Deployment & Launch', category: 'Deployment', start: 39, duration: 3, dependencies: ['t9'], color: categoryColors['Deployment'] },
]

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const TaskDragStart = engine.event<{ id: string; type: 'move' | 'resize' }>('TaskDragStart')
export const TaskDragMove = engine.event<{ id: string; dx: number }>('TaskDragMove')
export const TaskDragEnd = engine.event<{ id: string }>('TaskDragEnd')
export const TaskCreated = engine.event<Task>('TaskCreated')
export const TaskUpdated = engine.event<Task>('TaskUpdated')
export const DependencyAdded = engine.event<Dependency>('DependencyAdded')
export const ViewChanged = engine.event<ViewRange>('ViewChanged')
export const ZoomChanged = engine.event<ZoomLevel>('ZoomChanged')

// State-changed events for React subscriptions
export const TasksChanged = engine.event<Task[]>('TasksChanged')
export const ViewStateChanged = engine.event<ViewRange>('ViewStateChanged')
export const ZoomStateChanged = engine.event<ZoomLevel>('ZoomStateChanged')
export const DragStateChanged = engine.event<DragState>('DragStateChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let tasks: Task[] = initialTasks
let view: ViewRange = { start: -2, end: 50 }
let zoom: ZoomLevel = 'day'
let dragState: DragState = { taskId: null, type: null, startX: 0, originalStart: 0, originalDuration: 0 }

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// ViewChanged ──→ ViewStateChanged
// ZoomChanged ──→ ZoomStateChanged
// TaskDragStart ──→ DragStateChanged
// TaskDragEnd ──→ DragStateChanged
// TaskCreated ──→ TasksChanged
// TaskDragMove ──→ TasksChanged
// TaskUpdated ──→ TasksChanged
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(ViewChanged, [ViewStateChanged], (range, setView) => {
  view = range
  setView(view)
})

engine.on(ZoomChanged, [ZoomStateChanged], (level, setZoom) => {
  zoom = level
  setZoom(zoom)
})

engine.on(TaskDragStart, [DragStateChanged], (payload, setDrag) => {
  const task = tasks.find(t => t.id === payload.id)
  if (!task) return
  dragState = {
    taskId: payload.id,
    type: payload.type,
    startX: 0,
    originalStart: task.start,
    originalDuration: task.duration,
  }
  setDrag(dragState)
})

engine.on(TaskDragEnd, [DragStateChanged], (_, setDrag) => {
  dragState = { taskId: null, type: null, startX: 0, originalStart: 0, originalDuration: 0 }
  setDrag(dragState)
})

engine.on(TaskCreated, [TasksChanged], (task, setTasks) => {
  tasks = [...tasks, task]
  setTasks(tasks)
})

// ---------------------------------------------------------------------------
// Cascade dependencies when a task moves
// ---------------------------------------------------------------------------

function cascadeDependencies(taskList: Task[], movedTaskId: string): Task[] {
  const result = taskList.map(t => ({ ...t }))
  const taskMap = new Map(result.map(t => [t.id, t]))

  // BFS from moved task through dependents
  const visited = new Set<string>()
  const queue = [movedTaskId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    const current = taskMap.get(currentId)
    if (!current) continue

    // Find tasks that depend on current
    for (const task of result) {
      if (task.dependencies.includes(currentId)) {
        const depEnd = current.start + current.duration
        if (task.start < depEnd) {
          task.start = depEnd
        }
        queue.push(task.id)
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Drag handling
// ---------------------------------------------------------------------------

engine.on(TaskDragMove, [TasksChanged], (payload, setTasks) => {
  if (!dragState.taskId || dragState.taskId !== payload.id) return

  const task = tasks.find(t => t.id === payload.id)
  if (!task) return

  // Convert dx (pixels) to days based on zoom
  const dayWidth = zoom === 'day' ? 40 : zoom === 'week' ? 20 : 8
  const dayDelta = Math.round(payload.dx / dayWidth)

  let updated: Task
  if (dragState.type === 'move') {
    const newStart = Math.max(0, dragState.originalStart + dayDelta)
    updated = { ...task, start: newStart }
  } else {
    // Resize
    const newDuration = Math.max(1, dragState.originalDuration + dayDelta)
    updated = { ...task, duration: newDuration }
  }

  // Update the single task
  let newTasks = tasks.map(t => t.id === payload.id ? updated : t)

  // Cascade dependencies
  newTasks = cascadeDependencies(newTasks, payload.id)

  tasks = newTasks
  setTasks(tasks)
})

engine.on(TaskUpdated, [TasksChanged], (updated, setTasks) => {
  let newTasks = tasks.map(t => t.id === updated.id ? updated : t)
  newTasks = cascadeDependencies(newTasks, updated.id)
  tasks = newTasks
  setTasks(tasks)
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { categoryColors }

export function startLoop() {}
export function stopLoop() {}

export function resetState() {
  tasks = initialTasks
  view = { start: -2, end: 50 }
  zoom = 'day'
  dragState = { taskId: null, type: null, startX: 0, originalStart: 0, originalDuration: 0 }
}
