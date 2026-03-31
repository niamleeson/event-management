import { useRef, useCallback } from 'react'
import { usePulse, useEmit } from '@pulse/react'
import {
  TasksChanged,
  ViewStateChanged,
  ZoomStateChanged,
  DragStateChanged,
  TaskDragStart,
  TaskDragMove,
  TaskDragEnd,
  ZoomChanged,
  ViewChanged,
  formatDate,
  dayToDate,
  categoryColors,
  type Task,
  type ZoomLevel,
  type ViewRange,
  type DragState,
} from './engine'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TASK_ROW_HEIGHT = 44
const HEADER_HEIGHT = 60
const SIDEBAR_WIDTH = 240

function getDayWidth(z: ZoomLevel): number {
  switch (z) {
    case 'day': return 40
    case 'week': return 20
    case 'month': return 8
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f8f9fa',
    overflow: 'hidden',
  },
  topBar: {
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    zIndex: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  zoomControls: {
    display: 'flex',
    gap: 4,
  },
  zoomBtn: (active: boolean) => ({
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid #d0d0d0',
    borderRadius: 6,
    background: active ? '#4361ee' : '#fff',
    color: active ? '#fff' : '#333',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  legend: {
    display: 'flex',
    gap: 12,
    fontSize: 12,
    alignItems: 'center',
  },
  legendItem: (color: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: '#666',
  }),
  legendDot: (color: string) => ({
    width: 10,
    height: 10,
    borderRadius: 3,
    background: color,
  }),
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    background: '#fff',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column' as const,
    flexShrink: 0,
    zIndex: 10,
  },
  sidebarHeader: {
    height: HEADER_HEIGHT,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #e0e0e0',
    fontWeight: 700,
    fontSize: 13,
    color: '#666',
    background: '#fafafa',
  },
  sidebarRow: (isActive: boolean) => ({
    height: TASK_ROW_HEIGHT,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderBottom: '1px solid #f0f0f0',
    background: isActive ? '#f0f4ff' : '#fff',
    fontSize: 13,
    cursor: 'default',
  }),
  taskDot: (color: string) => ({
    width: 8,
    height: 8,
    borderRadius: 2,
    background: color,
    flexShrink: 0,
  }),
  taskLabel: {
    flex: 1,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    fontSize: 13,
    color: '#333',
  },
  taskDates: {
    fontSize: 11,
    color: '#999',
    whiteSpace: 'nowrap' as const,
  },
  chart: {
    flex: 1,
    overflow: 'auto' as const,
    position: 'relative' as const,
  },
  timeHeader: {
    position: 'sticky' as const,
    top: 0,
    height: HEADER_HEIGHT,
    background: '#fafafa',
    borderBottom: '1px solid #e0e0e0',
    zIndex: 5,
    display: 'flex',
  },
  timeCell: (width: number, isWeekend: boolean) => ({
    width,
    minWidth: width,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid #eee',
    fontSize: 11,
    color: isWeekend ? '#bbb' : '#888',
    background: isWeekend ? '#f5f5f5' : 'transparent',
  }),
  gridArea: {
    position: 'relative' as const,
  },
  gridLine: (left: number, isWeekend: boolean) => ({
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    left,
    width: 1,
    background: isWeekend ? '#f0f0f0' : '#f8f8f8',
  }),
  todayLine: (left: number) => ({
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    left,
    width: 2,
    background: '#e63946',
    zIndex: 8,
  }),
  todayLabel: {
    position: 'absolute' as const,
    top: -HEADER_HEIGHT + 4,
    left: -14,
    fontSize: 10,
    fontWeight: 700,
    color: '#e63946',
    background: '#fff',
    padding: '1px 4px',
    borderRadius: 3,
    border: '1px solid #e63946',
  },
  taskBar: (left: number, width: number, top: number, color: string, isDragging: boolean) => ({
    position: 'absolute' as const,
    left,
    width: Math.max(width, 8),
    top: top + 8,
    height: TASK_ROW_HEIGHT - 16,
    background: color,
    borderRadius: 4,
    cursor: isDragging ? 'grabbing' : 'grab',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 8,
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.15)',
    transition: isDragging ? 'none' : 'box-shadow 0.2s',
    zIndex: isDragging ? 9 : 1,
    overflow: 'hidden' as const,
    whiteSpace: 'nowrap' as const,
    userSelect: 'none' as const,
  }),
  resizeHandle: {
    position: 'absolute' as const,
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    cursor: 'ew-resize',
    background: 'rgba(255,255,255,0.3)',
    borderRadius: '0 4px 4px 0',
  },
  depLine: {
    stroke: '#999',
    strokeWidth: 1.5,
    fill: 'none',
    markerEnd: 'url(#arrowhead)',
  },
}

const globalStyle = `
body { margin: 0; overflow: hidden; }
`

// ---------------------------------------------------------------------------
// Initial values for usePulse
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

const initialDragState: DragState = { taskId: null, type: null, startX: 0, originalStart: 0, originalDuration: 0 }

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function TopBar() {
  const emit = useEmit()
  const currentZoom = usePulse(ZoomStateChanged, 'day' as ZoomLevel)

  const zoomLevels: ZoomLevel[] = ['day', 'week', 'month']
  const categories = Object.entries(categoryColors)

  return (
    <div style={styles.topBar}>
      <div style={styles.title}>Pulse Gantt Chart</div>
      <div style={styles.legend}>
        {categories.map(([name, color]) => (
          <div key={name} style={styles.legendItem(color)}>
            <div style={styles.legendDot(color)} />
            {name}
          </div>
        ))}
      </div>
      <div style={styles.zoomControls}>
        {zoomLevels.map(z => (
          <button
            key={z}
            style={styles.zoomBtn(currentZoom === z)}
            onClick={() => emit(ZoomChanged, z)}
          >
            {z.charAt(0).toUpperCase() + z.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}

function Sidebar() {
  const allTasks = usePulse(TasksChanged, initialTasks)
  const drag = usePulse(DragStateChanged, initialDragState)

  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>Task</div>
      {allTasks.map(task => (
        <div
          key={task.id}
          style={styles.sidebarRow(drag.taskId === task.id)}
        >
          <div style={styles.taskDot(task.color)} />
          <div style={styles.taskLabel} title={task.title}>{task.title}</div>
          <div style={styles.taskDates}>
            {formatDate(task.start)} - {formatDate(task.start + task.duration)}
          </div>
        </div>
      ))}
    </div>
  )
}

function DependencyArrows({ taskList, dayWidth, viewStart }: {
  taskList: Task[]
  dayWidth: number
  viewStart: number
}) {
  const taskMap = new Map(taskList.map(t => [t.id, t]))
  const taskIndexMap = new Map(taskList.map((t, i) => [t.id, i]))

  const lines: React.ReactNode[] = []

  taskList.forEach((task, _toIdx) => {
    task.dependencies.forEach(depId => {
      const depTask = taskMap.get(depId)
      if (!depTask) return

      const fromIdx = taskIndexMap.get(depId)!
      const toIdx = taskIndexMap.get(task.id)!

      const fromX = (depTask.start + depTask.duration - viewStart) * dayWidth
      const fromY = fromIdx * TASK_ROW_HEIGHT + TASK_ROW_HEIGHT / 2
      const toX = (task.start - viewStart) * dayWidth
      const toY = toIdx * TASK_ROW_HEIGHT + TASK_ROW_HEIGHT / 2

      const midX = fromX + (toX - fromX) / 2

      lines.push(
        <path
          key={`${depId}-${task.id}`}
          d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
          style={styles.depLine}
        />
      )
    })
  })

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: taskList.length * TASK_ROW_HEIGHT,
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#999" />
        </marker>
      </defs>
      {lines}
    </svg>
  )
}

function ChartBody() {
  const emit = useEmit()
  const allTasks = usePulse(TasksChanged, initialTasks)
  const currentView = usePulse(ViewStateChanged, { start: -2, end: 50 } as ViewRange)
  const currentZoom = usePulse(ZoomStateChanged, 'day' as ZoomLevel)
  const drag = usePulse(DragStateChanged, initialDragState)

  const dayWidth = getDayWidth(currentZoom)
  const totalDays = currentView.end - currentView.start
  const totalWidth = totalDays * dayWidth

  const dragStartX = useRef(0)

  const handleMouseDown = useCallback((taskId: string, type: 'move' | 'resize', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragStartX.current = e.clientX
    emit(TaskDragStart, { id: taskId, type })
  }, [emit])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.taskId) return
    const dx = e.clientX - dragStartX.current
    emit(TaskDragMove, { id: drag.taskId, dx })
  }, [drag.taskId, emit])

  const handleMouseUp = useCallback(() => {
    if (drag.taskId) {
      emit(TaskDragEnd, { id: drag.taskId })
    }
  }, [drag.taskId, emit])

  // Time header cells
  const headerCells: React.ReactNode[] = []
  const gridLines: React.ReactNode[] = []
  for (let d = 0; d < totalDays; d++) {
    const day = currentView.start + d
    const date = dayToDate(day)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const left = d * dayWidth

    if (currentZoom === 'day') {
      headerCells.push(
        <div key={d} style={styles.timeCell(dayWidth, isWeekend)}>
          <span style={{ fontSize: 10, color: '#bbb' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
          </span>
          <span>{date.getDate()}</span>
        </div>
      )
    } else if (currentZoom === 'week' && date.getDay() === 1) {
      headerCells.push(
        <div key={d} style={styles.timeCell(dayWidth * 7, false)}>
          <span>{formatDate(day)}</span>
        </div>
      )
    } else if (currentZoom === 'month' && date.getDate() === 1) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      headerCells.push(
        <div key={d} style={styles.timeCell(dayWidth * 30, false)}>
          <span>{months[date.getMonth()]} {date.getFullYear()}</span>
        </div>
      )
    }

    gridLines.push(
      <div key={`gl-${d}`} style={styles.gridLine(left, isWeekend)} />
    )
  }

  // Today marker
  const today = new Date()
  const todayOffset = Math.floor((today.getTime() - dayToDate(currentView.start).getTime()) / (1000 * 60 * 60 * 24))
  const todayLeft = todayOffset * dayWidth

  // Task bars
  const taskBars = allTasks.map((task, i) => {
    const left = (task.start - currentView.start) * dayWidth
    const width = task.duration * dayWidth
    const top = i * TASK_ROW_HEIGHT
    const isDragging = drag.taskId === task.id

    return (
      <div
        key={task.id}
        style={styles.taskBar(left, width, top, task.color, isDragging)}
        onMouseDown={(e) => handleMouseDown(task.id, 'move', e)}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.title}
        </span>
        <div
          style={styles.resizeHandle}
          onMouseDown={(e) => {
            e.stopPropagation()
            handleMouseDown(task.id, 'resize', e)
          }}
        />
      </div>
    )
  })

  const gridHeight = allTasks.length * TASK_ROW_HEIGHT

  return (
    <div
      style={styles.chart}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Time header */}
      <div style={{ ...styles.timeHeader, width: totalWidth }}>
        {headerCells}
      </div>

      {/* Grid area */}
      <div style={{ ...styles.gridArea, width: totalWidth, height: gridHeight }}>
        {gridLines}

        {/* Today line */}
        {todayLeft > 0 && todayLeft < totalWidth && (
          <div style={styles.todayLine(todayLeft)}>
            <div style={styles.todayLabel}>Today</div>
          </div>
        )}

        {/* Dependency arrows */}
        <DependencyArrows
          taskList={allTasks}
          dayWidth={dayWidth}
          viewStart={currentView.start}
        />

        {/* Task bars */}
        {taskBars}

        {/* Row lines */}
        {allTasks.map((_, i) => (
          <div
            key={`row-${i}`}
            style={{
              position: 'absolute',
              top: (i + 1) * TASK_ROW_HEIGHT,
              left: 0,
              right: 0,
              height: 1,
              background: '#f0f0f0',
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
  return (
    <>
      <style>{globalStyle}</style>
      <div style={styles.container}>
        <TopBar />
        <div style={styles.body}>
          <Sidebar />
          <ChartBody />
        </div>
      </div>
    </>
  )
}
