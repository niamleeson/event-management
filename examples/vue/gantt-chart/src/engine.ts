import { createEngine } from '@pulse/core'
export const engine = createEngine()

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface Task {
  id: number
  name: string
  start: number   // day offset from project start
  duration: number // days
  color: string
  dependsOn: number[] // task ids
}

export type ZoomLevel = 'day' | 'week' | 'month'

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const TaskMoved = engine.event<{ id: number; newStart: number }>('TaskMoved')
export const TaskResized = engine.event<{ id: number; newDuration: number }>('TaskResized')
export const ZoomChanged = engine.event<ZoomLevel>('ZoomChanged')
export const TasksUpdated = engine.event<Task[]>('TasksUpdated')

/* ------------------------------------------------------------------ */
/*  Initial tasks                                                     */
/* ------------------------------------------------------------------ */

const INITIAL_TASKS: Task[] = [
  { id: 1, name: 'Research', start: 0, duration: 5, color: '#6c5ce7', dependsOn: [] },
  { id: 2, name: 'Design', start: 5, duration: 7, color: '#00b894', dependsOn: [1] },
  { id: 3, name: 'Frontend', start: 12, duration: 10, color: '#0984e3', dependsOn: [2] },
  { id: 4, name: 'Backend', start: 12, duration: 12, color: '#e17055', dependsOn: [2] },
  { id: 5, name: 'Database', start: 10, duration: 6, color: '#fdcb6e', dependsOn: [2] },
  { id: 6, name: 'Testing', start: 24, duration: 5, color: '#d63031', dependsOn: [3, 4] },
  { id: 7, name: 'Documentation', start: 22, duration: 8, color: '#00cec9', dependsOn: [3] },
  { id: 8, name: 'Deployment', start: 29, duration: 3, color: '#a29bfe', dependsOn: [6] },
  { id: 9, name: 'Training', start: 30, duration: 4, color: '#f368e0', dependsOn: [7] },
  { id: 10, name: 'Launch', start: 32, duration: 2, color: '#ff9f43', dependsOn: [8, 9] },
]

/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */

export let tasks = INITIAL_TASKS
export const TasksChanged = engine.event('TasksChanged')
engine.on(TasksUpdated, (v: any) => { tasks = ((_prev, updated) => updated)(tasks, v); engine.emit(TasksChanged, tasks) })

export let zoom = 'day' as ZoomLevel
engine.on(ZoomChanged, (v: any) => { zoom = ((_prev, z) => z)(zoom, v); engine.emit(ZoomChanged, zoom) })

/* ------------------------------------------------------------------ */
/*  Auto-shift dependents when a task is moved                        */
/* ------------------------------------------------------------------ */

function shiftDependents(taskList: Task[], movedId: number): Task[] {
  const result = taskList.map(t => ({ ...t }))
  const movedTask = result.find(t => t.id === movedId)!
  const movedEnd = movedTask.start + movedTask.duration

  // BFS through dependents
  const queue = [movedId]
  const visited = new Set<number>()

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    const current = result.find(t => t.id === currentId)!
    const currentEnd = current.start + current.duration

    for (const dep of result) {
      if (dep.dependsOn.includes(currentId)) {
        const requiredStart = currentEnd
        if (dep.start < requiredStart) {
          dep.start = requiredStart
        }
        queue.push(dep.id)
      }
    }
  }

  return result
}

engine.on(TaskMoved, (v: any) => { engine.emit(TasksUpdated, (({ id, newStart }) => {
  let updated = tasks.map(t => t.id === id ? { ...t, start: Math.max(0, newStart) } : { ...t })
  return shiftDependents(updated, id)
})(v)) })

engine.on(TaskResized, (v: any) => { engine.emit(TasksUpdated, (({ id, newDuration }) => {
  let updated = tasks.map(t => t.id === id ? { ...t, duration: Math.max(1, newDuration) } : { ...t })
  return shiftDependents(updated, id)
})(v)) })

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

export const TOTAL_DAYS = 40

function dayWidth(z: ZoomLevel): number {
  switch (z) {
    case 'day': return 30
    case 'week': return 12
    case 'month': return 4
  }
}


export { dayWidth }
