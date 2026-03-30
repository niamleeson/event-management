import { For, Show, onMount, onCleanup } from 'solid-js'
import { useSignal, useEmit } from '@pulse/solid'
import type { Signal } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Task {
  id: number
  name: string
  start: number  // day offset
  duration: number
  color: string
  deps: number[] // task IDs this depends on
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const DAY_WIDTH = 40
const ROW_HEIGHT = 44
const TOTAL_DAYS = 30
const HEADER_HEIGHT = 36

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const MoveTask = engine.event<{ id: number; newStart: number }>('MoveTask')
const ResizeTask = engine.event<{ id: number; newDuration: number }>('ResizeTask')
const SelectTask = engine.event<number>('SelectTask')
const ZoomChanged = engine.event<number>('ZoomChanged')

/* ------------------------------------------------------------------ */
/*  Initial data                                                      */
/* ------------------------------------------------------------------ */

const INITIAL_TASKS: Task[] = [
  { id: 1, name: 'Research', start: 0, duration: 4, color: '#6c5ce7', deps: [] },
  { id: 2, name: 'Design', start: 3, duration: 5, color: '#0984e3', deps: [1] },
  { id: 3, name: 'Frontend', start: 7, duration: 8, color: '#00b894', deps: [2] },
  { id: 4, name: 'Backend', start: 7, duration: 7, color: '#e17055', deps: [2] },
  { id: 5, name: 'API Integration', start: 14, duration: 4, color: '#d63031', deps: [3, 4] },
  { id: 6, name: 'Testing', start: 17, duration: 5, color: '#fdcb6e', deps: [5] },
  { id: 7, name: 'Bug Fixes', start: 21, duration: 3, color: '#a29bfe', deps: [6] },
  { id: 8, name: 'Documentation', start: 14, duration: 6, color: '#00cec9', deps: [3] },
  { id: 9, name: 'Deployment', start: 24, duration: 2, color: '#ff6b6b', deps: [7, 8] },
  { id: 10, name: 'Launch', start: 26, duration: 1, color: '#54a0ff', deps: [9] },
]

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const tasks = engine.signal<Task[]>(MoveTask, INITIAL_TASKS, (prev, { id, newStart }) =>
  prev.map(t => t.id === id ? { ...t, start: Math.max(0, newStart) } : t)
)
engine.signalUpdate(tasks, ResizeTask, (prev, { id, newDuration }) =>
  prev.map(t => t.id === id ? { ...t, duration: Math.max(1, newDuration) } : t)
)

// Auto-shift dependents when a task moves
engine.on(MoveTask, ({ id, newStart }) => {
  const allTasks = tasks.value
  const movedTask = allTasks.find(t => t.id === id)
  if (!movedTask) return

  const dependents = allTasks.filter(t => t.deps.includes(id))
  for (const dep of dependents) {
    const requiredStart = newStart + movedTask.duration
    if (dep.start < requiredStart) {
      engine.emit(MoveTask, { id: dep.id, newStart: requiredStart })
    }
  }
})

const selectedTask = engine.signal<number>(SelectTask, -1, (_prev, id) => id)
const zoom = engine.signal<number>(ZoomChanged, 1, (_prev, z) => Math.max(0.5, Math.min(2, z)))

/* ------------------------------------------------------------------ */
/*  Today line                                                        */
/* ------------------------------------------------------------------ */

const TODAY = 12 // Simulate day 12

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function DependencyArrows() {
  const allTasks = useSignal(tasks)
  const z = useSignal(zoom)
  const dw = () => DAY_WIDTH * z()

  return (
    <svg style={{
      position: 'absolute', top: `${HEADER_HEIGHT}px`, left: '0',
      width: `${TOTAL_DAYS * dw()}px`, height: `${allTasks().length * ROW_HEIGHT}px`,
      'pointer-events': 'none',
    }}>
      <For each={allTasks()}>
        {(task, ti) => (
          <For each={task.deps}>
            {(depId) => {
              const depIdx = () => allTasks().findIndex(t => t.id === depId)
              const dep = () => allTasks()[depIdx()]
              if (!dep()) return null
              const x1 = () => (dep()!.start + dep()!.duration) * dw()
              const y1 = () => depIdx() * ROW_HEIGHT + ROW_HEIGHT / 2
              const x2 = () => task.start * dw()
              const y2 = () => ti() * ROW_HEIGHT + ROW_HEIGHT / 2
              const midX = () => (x1() + x2()) / 2
              return (
                <path
                  d={`M ${x1()} ${y1()} C ${midX()} ${y1()}, ${midX()} ${y2()}, ${x2()} ${y2()}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  stroke-width="1.5"
                  marker-end="url(#arrowhead)"
                />
              )
            }}
          </For>
        )}
      </For>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.3)" />
        </marker>
      </defs>
    </svg>
  )
}

function TaskBar(props: { task: Task; index: number }) {
  const emit = useEmit()
  const sel = useSignal(selectedTask)
  const z = useSignal(zoom)
  const dw = () => DAY_WIDTH * z()
  const isSel = () => sel() === props.task.id

  let dragStartX = 0
  let origStart = 0
  let resizing = false

  const onBarPointerDown = (e: PointerEvent) => {
    if (resizing) return
    dragStartX = e.clientX
    origStart = props.task.start
    emit(SelectTask, props.task.id)
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - dragStartX
      const dayDelta = Math.round(dx / dw())
      if (dayDelta !== 0) {
        emit(MoveTask, { id: props.task.id, newStart: origStart + dayDelta })
      }
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onResizePointerDown = (e: PointerEvent) => {
    e.stopPropagation()
    resizing = true
    dragStartX = e.clientX
    const origDuration = props.task.duration
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - dragStartX
      const dayDelta = Math.round(dx / dw())
      emit(ResizeTask, { id: props.task.id, newDuration: origDuration + dayDelta })
    }
    const up = () => { resizing = false; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      onPointerDown={onBarPointerDown}
      style={{
        position: 'absolute',
        left: `${props.task.start * dw()}px`,
        top: `${props.index * ROW_HEIGHT + 8}px`,
        width: `${props.task.duration * dw() - 4}px`,
        height: `${ROW_HEIGHT - 16}px`,
        background: `linear-gradient(135deg, ${props.task.color}cc, ${props.task.color}88)`,
        'border-radius': '6px',
        cursor: 'grab',
        display: 'flex',
        'align-items': 'center',
        padding: '0 8px',
        'font-size': '12px',
        color: '#fff',
        'font-weight': '500',
        'white-space': 'nowrap',
        overflow: 'hidden',
        border: isSel() ? `2px solid ${props.task.color}` : '1px solid rgba(255,255,255,0.1)',
        'box-shadow': isSel() ? `0 0 12px ${props.task.color}44` : '0 2px 6px rgba(0,0,0,0.2)',
        'user-select': 'none',
      }}
    >
      {props.task.name}
      {/* Resize handle */}
      <div
        onPointerDown={onResizePointerDown}
        style={{
          position: 'absolute', right: '0', top: '0', bottom: '0',
          width: '8px', cursor: 'ew-resize', background: 'rgba(255,255,255,0.2)',
          'border-radius': '0 6px 6px 0',
        }}
      />
    </div>
  )
}

export default function App() {
  const emit = useEmit()
  const allTasks = useSignal(tasks)
  const z = useSignal(zoom)
  const sel = useSignal(selectedTask)
  const dw = () => DAY_WIDTH * z()

  return (
    <div style={{
      height: '100vh', display: 'flex', 'flex-direction': 'column',
      'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '12px 24px', 'border-bottom': '1px solid #e0e0e0', display: 'flex', 'align-items': 'center', gap: '16px' }}>
        <h1 style={{ 'font-size': '20px', 'font-weight': '700', color: '#333', margin: '0' }}>Gantt Chart</h1>
        <div style={{ display: 'flex', gap: '8px', 'margin-left': 'auto' }}>
          <button onClick={() => emit(ZoomChanged, z() - 0.25)} style={{ padding: '4px 12px', 'border-radius': '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>-</button>
          <span style={{ 'font-size': '13px', color: '#666', 'line-height': '28px' }}>{Math.round(z() * 100)}%</span>
          <button onClick={() => emit(ZoomChanged, z() + 0.25)} style={{ padding: '4px 12px', 'border-radius': '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>+</button>
        </div>
      </div>

      <div style={{ flex: '1', display: 'flex', overflow: 'hidden' }}>
        {/* Task list */}
        <div style={{ width: '200px', background: '#fafafa', 'border-right': '1px solid #e0e0e0', 'flex-shrink': '0' }}>
          <div style={{ height: `${HEADER_HEIGHT}px`, 'border-bottom': '1px solid #e0e0e0', padding: '8px 16px', 'font-size': '12px', 'font-weight': '600', color: '#888' }}>
            Task Name
          </div>
          <For each={allTasks()}>
            {(task) => (
              <div
                onClick={() => emit(SelectTask, task.id)}
                style={{
                  height: `${ROW_HEIGHT}px`, padding: '0 16px',
                  display: 'flex', 'align-items': 'center', gap: '8px',
                  'border-bottom': '1px solid #f0f0f0', cursor: 'pointer',
                  background: sel() === task.id ? '#e8f0fe' : 'transparent',
                  'font-size': '13px', color: '#333',
                }}
              >
                <div style={{ width: '8px', height: '8px', 'border-radius': '50%', background: task.color }} />
                {task.name}
              </div>
            )}
          </For>
        </div>

        {/* Chart area */}
        <div style={{ flex: '1', overflow: 'auto', position: 'relative', background: '#fafafa' }}>
          {/* Day headers */}
          <div style={{ display: 'flex', height: `${HEADER_HEIGHT}px`, 'border-bottom': '1px solid #e0e0e0', position: 'sticky', top: '0', background: '#fafafa', 'z-index': '5' }}>
            <For each={Array.from({ length: TOTAL_DAYS }, (_, i) => i)}>
              {(day) => (
                <div style={{
                  width: `${dw()}px`, 'min-width': `${dw()}px`, 'text-align': 'center',
                  'font-size': '11px', color: day === TODAY ? '#d63031' : '#888',
                  'font-weight': day === TODAY ? '700' : '400',
                  'line-height': `${HEADER_HEIGHT}px`,
                  'border-right': '1px solid #f0f0f0',
                }}>
                  Day {day + 1}
                </div>
              )}
            </For>
          </div>

          {/* Grid lines + tasks */}
          <div style={{ position: 'relative', 'min-height': `${allTasks().length * ROW_HEIGHT}px` }}>
            {/* Vertical grid lines */}
            <For each={Array.from({ length: TOTAL_DAYS }, (_, i) => i)}>
              {(day) => (
                <div style={{
                  position: 'absolute', left: `${day * dw()}px`, top: '0', bottom: '0',
                  width: '1px', background: '#f0f0f0',
                }} />
              )}
            </For>

            {/* Horizontal grid lines */}
            <For each={allTasks()}>
              {(_, i) => (
                <div style={{
                  position: 'absolute', left: '0', right: '0',
                  top: `${(i() + 1) * ROW_HEIGHT}px`, height: '1px', background: '#f0f0f0',
                }} />
              )}
            </For>

            {/* Today line */}
            <div style={{
              position: 'absolute', left: `${TODAY * dw()}px`, top: '0', bottom: '0',
              width: '2px', background: '#d63031', 'z-index': '3', opacity: '0.6',
            }} />

            {/* Dependency arrows */}
            <DependencyArrows />

            {/* Task bars */}
            <For each={allTasks()}>
              {(task, i) => <TaskBar task={task} index={i()} />}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}
