// DAG
// MoveTask ──→ TasksChanged
// ResizeTask ──→ TasksChanged
// ZoomChange ──→ ZoomChanged
// SelectTask ──→ SelectedTaskChanged

import { createEngine } from '@pulse/core'

export const engine = createEngine()

export interface Task { id: string; name: string; start: number; duration: number; color: string; dependencies: string[] }
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

export const MoveTask = engine.event<{ id: string; start: number }>('MoveTask')
export const ResizeTask = engine.event<{ id: string; duration: number }>('ResizeTask')
export const ZoomChange = engine.event<number>('ZoomChange')
export const SelectTask = engine.event<string | null>('SelectTask')
export const TasksChanged = engine.event<Task[]>('TasksChanged')
export const ZoomChanged = engine.event<number>('ZoomChanged')
export const SelectedTaskChanged = engine.event<string | null>('SelectedTaskChanged')

let tasks = [...INITIAL_TASKS]

function autoShift(taskId: string) {
  const parent = tasks.find((t) => t.id === taskId)
  if (!parent) return
  const parentEnd = parent.start + parent.duration
  for (const dep of tasks.filter((t) => t.dependencies.includes(taskId))) {
    if (dep.start < parentEnd) {
      tasks = tasks.map((t) => t.id === dep.id ? { ...t, start: parentEnd } : t)
      autoShift(dep.id)
    }
  }
}

engine.on(MoveTask, [TasksChanged], ({ id, start }, setTasks) => {
  const task = tasks.find((t) => t.id === id); if (!task) return
  const clamped = Math.max(0, Math.min(DAYS - task.duration, start))
  tasks = tasks.map((t) => t.id === id ? { ...t, start: clamped } : t)
  autoShift(id); setTasks(tasks)
})

engine.on(ResizeTask, [TasksChanged], ({ id, duration }, setTasks) => {
  const task = tasks.find((t) => t.id === id); if (!task) return
  const clamped = Math.max(1, Math.min(DAYS - task.start, duration))
  tasks = tasks.map((t) => t.id === id ? { ...t, duration: clamped } : t)
  autoShift(id); setTasks(tasks)
})

engine.on(ZoomChange, [ZoomChanged], (z, setZoom) => setZoom(z))
engine.on(SelectTask, [SelectedTaskChanged], (id, setSelected) => setSelected(id))

export function startLoop() {}
export function stopLoop() {}
