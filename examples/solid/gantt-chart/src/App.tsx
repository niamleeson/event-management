import { usePulse, useEmit } from '@pulse/solid'
import {
  TaskDragStart,
  TaskDragMove,
  TaskDragEnd,
  ZoomChanged,
  ViewChanged,
  formatDate,
  dayToDate,
  type Task,
  type ZoomLevel,
  type ViewRange,
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
    'flex-direction': 'column' as const,
    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f8f9fa',
    overflow: 'hidden',
  },
  topBar: {
    background: '#fff',
    'border-bottom': '1px solid #e0e0e0',
    padding: '10px 20px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    'box-shadow': '0 1px 3px rgba(0,0,0,0.05)',
    'z-index': 20,
  },
  title: {
    'font-size': 18,
    'font-weight': 700,
    color: '#1a1a2e',
  },
  zoomControls: {
    display: 'flex',
    gap: 4,
  },
  zoomBtn: (active: boolean) => ({
    padding: '6px 14px',
    'font-size': 12,
    'font-weight': 600,
    border: '1px solid #d0d0d0',
    'border-radius': 6,
    background: active ? '#4361ee' : '#fff',
    color: active ? '#fff' : '#333',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  legend: {
    display: 'flex',
    gap: 12,
    'font-size': 12,
    'align-items': 'center',
  },
  legendItem: (color: string) => ({
    display: 'flex',
    'align-items': 'center',
    gap: 4,
    color: '#666',
  }),
  legendDot: (color: string) => ({
    width: 10,
    height: 10,
    'border-radius': 3,
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
    'border-right': '1px solid #e0e0e0',
    display: 'flex',
    'flex-direction': 'column' as const,
    'flex-shrink': 0,
    'z-index': 10,
  },
  sidebarHeader: {
    height: HEADER_HEIGHT,
    padding: '0 16px',
    display: 'flex',
    'align-items': 'center',
    'border-bottom': '1px solid #e0e0e0',
    'font-weight': 700,
    'font-size': 13,
    color: '#666',
    background: '#fafafa',
  },
  sidebarRow: (isActive: boolean) => ({
    height: TASK_ROW_HEIGHT,
    padding: '0 16px',
    display: 'flex',
    'align-items': 'center',
    gap: 8,
    'border-bottom': '1px solid #f0f0f0',
    background: isActive ? '#f0f4ff' : '#fff',
    'font-size': 13,
    cursor: 'default',
  }),
  taskDot: (color: string) => ({
    width: 8,
    height: 8,
    'border-radius': 2,
    background: color,
    'flex-shrink': 0,
  }),
  taskLabel: {
    flex: 1,
    overflow: 'hidden' as const,
    'text-overflow': 'ellipsis' as const,
    'white-space': 'nowrap' as const,
    'font-size': 13,
    color: '#333',
  },
  taskDates: {
    'font-size': 11,
    color: '#999',
    'white-space': 'nowrap' as const,
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
    'border-bottom': '1px solid #e0e0e0',
    'z-index': 5,
    display: 'flex',
  },
  timeCell: (width: number, isWeekend: boolean) => ({
    width,
    'min-width': width,
    height: '100%',
    display: 'flex',
    'flex-direction': 'column' as const,
    'align-items': 'center',
    'justify-content': 'center',
    'border-right': '1px solid #eee',
    'font-size': 11,
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
    'z-index': 8,
  }),
  todayLabel: {
    position: 'absolute' as const,
    top: -HEADER_HEIGHT + 4,
    left: -14,
    'font-size': 10,
    'font-weight': 700,
    color: '#e63946',
    background: '#fff',
    padding: '1px 4px',
    'border-radius': 3,
    border: '1px solid #e63946',
  },
  taskBar: (left: number, width: number, top: number, color: string, isDragging: boolean) => ({
    position: 'absolute' as const,
    left,
    width: Math.max(width, 8),
    top: top + 8,
    height: TASK_ROW_HEIGHT - 16,
    background: color,
    'border-radius': 4,
    cursor: isDragging ? 'grabbing' : 'grab',
    display: 'flex',
    'align-items': 'center',
    'padding-left': 8,
    'font-size': 11,
    'font-weight': 600,
    color: '#fff',
    'box-shadow': isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.15)',
    transition: isDragging ? 'none' : 'box-shadow 0.2s',
    'z-index': isDragging ? 9 : 1,
    overflow: 'hidden' as const,
    'white-space': 'nowrap' as const,
    'user-select': 'none' as const,
  }),
  resizeHandle: {
    position: 'absolute' as const,
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    cursor: 'ew-resize',
    background: 'rgba(255,255,255,0.3)',
    'border-radius': '0 4px 4px 0',
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
// Components
// ---------------------------------------------------------------------------

function TopBar() {
  const emit = useEmit()
  const currentZoom = usePulse(zoom)

  const zoomLevels: ZoomLevel[] = ['day', 'week', 'month']
  const categories = Object.entries(categoryColors)

  return (
    <div style={styles.topBar}>
      <div style={styles.title}>Pulse Gantt Chart</div>
      <div style={styles.legend}>
        {categories.map(([name, color]) => (
          <div style={styles.legendItem(color)}>
            <div style={styles.legendDot(color)} />
            {name}
          </div>
        ))}
      </div>
      <div style={styles.zoomControls}>
        {zoomLevels.map(z => (
          <button
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
  const allTasks = usePulse(tasks)
  const drag = usePulse(dragState)

  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>Task</div>
      {allTasks.map(task => (
        <div
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

  const lines: any[] = []

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
        'pointer-events': 'none',
        'z-index': 2,
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
  const allTasks = usePulse(tasks)
  const currentView = usePulse(view)
  const currentZoom = usePulse(zoom)
  const drag = usePulse(dragState)
  const snapVal = usePulse(snapSpring)

  const dayWidth = getDayWidth(currentZoom)
  const totalDays = currentView.end - currentView.start
  const totalWidth = totalDays * dayWidth

  let dragStartX = 0

  const handleMouseDown = (taskId: string, type: 'move' | 'resize', e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragStartX = e.clientX
    emit(TaskDragStart, { id: taskId, type })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!drag.taskId) return
    const dx = e.clientX - dragStartX
    emit(TaskDragMove, { id: drag.taskId, dx })
  }

  const handleMouseUp = () => {
    if (drag.taskId) {
      emit(TaskDragEnd, { id: drag.taskId })
    }
  }

  // Time header cells
  const headerCells: any[] = []
  const gridLines: any[] = []
  for (let d = 0; d < totalDays; d++) {
    const day = currentView.start + d
    const date = dayToDate(day)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const left = d * dayWidth

    if (currentZoom === 'day') {
      headerCells.push(
        <div style={styles.timeCell(dayWidth, isWeekend)}>
          <span style={{ 'font-size': 10, color: '#bbb' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
          </span>
          <span>{date.getDate()}</span>
        </div>
      )
    } else if (currentZoom === 'week' && date.getDay() === 1) {
      headerCells.push(
        <div style={styles.timeCell(dayWidth * 7, false)}>
          <span>{formatDate(day)}</span>
        </div>
      )
    } else if (currentZoom === 'month' && date.getDate() === 1) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      headerCells.push(
        <div style={styles.timeCell(dayWidth * 30, false)}>
          <span>{months[date.getMonth()]} {date.getFullYear()}</span>
        </div>
      )
    }

    gridLines.push(
      <div style={styles.gridLine(left, isWeekend)} />
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
        style={styles.taskBar(left, width, top, task.color, isDragging)}
        onMouseDown={(e) => handleMouseDown(task.id, 'move', e)}
      >
        <span style={{ overflow: 'hidden', 'text-overflow': 'ellipsis' }}>
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
