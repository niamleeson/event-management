import {
  engine,
  TOTAL_DAYS,
  ROW_HEIGHT,
  TaskDragged,
  TaskSelected,
  ZoomChanged,
  ScrollXChanged,
  tasks,
  selectedTask,
  zoomLevel,
  scrollX,
  getDayWidth,
  type GanttTask,
  type ZoomLevel,
} from '../engines/gantt-chart'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 1000px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'Gantt Chart'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 16px;'
  sub.textContent = 'Drag tasks to reschedule. Dependencies auto-shift. SVG arrows show relationships. Zoom controls.'
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Toolbar
  const toolbar = document.createElement('div')
  toolbar.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px; align-items: center;'
  const zoomLabel = document.createElement('span')
  zoomLabel.style.cssText = 'font-size: 13px; color: #667085; font-weight: 600;'
  zoomLabel.textContent = 'Zoom:'
  toolbar.appendChild(zoomLabel)

  const zoomBtns: HTMLButtonElement[] = []
  for (const z of ['day', 'week', 'month'] as ZoomLevel[]) {
    const btn = document.createElement('button')
    btn.style.cssText = 'padding: 4px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;'
    btn.textContent = z.charAt(0).toUpperCase() + z.slice(1)
    btn.addEventListener('click', () => engine.emit(ZoomChanged, z))
    toolbar.appendChild(btn)
    zoomBtns.push(btn)
  }
  wrapper.appendChild(toolbar)

  // Gantt container
  const ganttContainer = document.createElement('div')
  ganttContainer.style.cssText = 'display: flex; border: 1px solid #e4e7ec; border-radius: 10px; overflow: hidden;'

  // Task list (left panel)
  const taskListPanel = document.createElement('div')
  taskListPanel.style.cssText = 'width: 200px; min-width: 200px; border-right: 1px solid #e4e7ec; background: #fff;'

  const taskListHeader = document.createElement('div')
  taskListHeader.style.cssText = `height: 36px; border-bottom: 1px solid #e4e7ec; display: flex; align-items: center; padding: 0 12px; font-size: 12px; font-weight: 700; color: #344054; background: #f8f9fa;`
  taskListHeader.textContent = 'Task Name'
  taskListPanel.appendChild(taskListHeader)

  const taskListBody = document.createElement('div')
  taskListPanel.appendChild(taskListBody)

  // Timeline (right panel)
  const timelinePanel = document.createElement('div')
  timelinePanel.style.cssText = 'flex: 1; overflow-x: auto;'

  timelinePanel.addEventListener('scroll', () => {
    engine.emit(ScrollXChanged, timelinePanel.scrollLeft)
  })

  const timelineInner = document.createElement('div')
  timelineInner.style.cssText = 'position: relative; min-height: 400px;'

  // Timeline header (day numbers)
  const timelineHeader = document.createElement('div')
  timelineHeader.style.cssText = 'height: 36px; border-bottom: 1px solid #e4e7ec; display: flex; background: #f8f9fa; position: sticky; top: 0; z-index: 1;'

  // SVG for dependency arrows
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svgEl.style.cssText = 'position: absolute; top: 36px; left: 0; width: 100%; height: 100%; pointer-events: none;'

  // Task bars container
  const barsContainer = document.createElement('div')
  barsContainer.style.cssText = 'position: relative;'

  timelineInner.appendChild(timelineHeader)
  timelineInner.appendChild(barsContainer)
  timelineInner.appendChild(svgEl)
  timelinePanel.appendChild(timelineInner)

  ganttContainer.appendChild(taskListPanel)
  ganttContainer.appendChild(timelinePanel)
  wrapper.appendChild(ganttContainer)

  // Selected task info
  const taskInfo = document.createElement('div')
  taskInfo.style.cssText = 'margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 13px; color: #667085; min-height: 40px;'
  wrapper.appendChild(taskInfo)

  container.appendChild(wrapper)

  function render() {
    const taskList = tasks.value
    const zoom = zoomLevel.value
    const dayWidth = getDayWidth(zoom)
    const totalWidth = TOTAL_DAYS * dayWidth
    const sel = selectedTask.value

    timelineInner.style.width = `${totalWidth}px`

    // Zoom buttons
    for (let i = 0; i < zoomBtns.length; i++) {
      const z = ['day', 'week', 'month'][i]
      zoomBtns[i].style.background = z === zoom ? '#4361ee' : '#e4e7ec'
      zoomBtns[i].style.color = z === zoom ? '#fff' : '#344054'
    }

    // Timeline header
    timelineHeader.innerHTML = ''
    for (let d = 0; d < TOTAL_DAYS; d++) {
      const dayEl = document.createElement('div')
      dayEl.style.cssText = `width: ${dayWidth}px; min-width: ${dayWidth}px; text-align: center; font-size: 10px; color: #98a2b3; line-height: 36px; border-right: 1px solid #f0f2f5;`
      if (zoom === 'day' || (zoom === 'week' && d % 7 === 0) || (zoom === 'month' && d % 30 === 0)) {
        dayEl.textContent = `D${d + 1}`
      }
      timelineHeader.appendChild(dayEl)
    }

    // Task list
    taskListBody.innerHTML = ''
    for (const task of taskList) {
      const row = document.createElement('div')
      row.style.cssText = `height: ${ROW_HEIGHT}px; display: flex; align-items: center; padding: 0 12px; border-bottom: 1px solid #f0f2f5; cursor: pointer; font-size: 13px; font-weight: 600; color: #344054; ${sel === task.id ? 'background: #eef0ff;' : ''}`
      row.textContent = task.name
      row.addEventListener('click', () => engine.emit(TaskSelected, task.id))
      taskListBody.appendChild(row)
    }

    // Task bars
    barsContainer.innerHTML = ''
    barsContainer.style.height = `${taskList.length * ROW_HEIGHT}px`

    for (let i = 0; i < taskList.length; i++) {
      const task = taskList[i]
      const left = task.start * dayWidth
      const width = task.duration * dayWidth
      const top = i * ROW_HEIGHT + 8

      const bar = document.createElement('div')
      bar.style.cssText = `position: absolute; left: ${left}px; top: ${top}px; width: ${width}px; height: ${ROW_HEIGHT - 16}px; background: ${task.color}; border-radius: 6px; cursor: grab; display: flex; align-items: center; padding: 0 8px; font-size: 11px; color: #fff; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1); ${sel === task.id ? 'outline: 2px solid #1a1a2e; outline-offset: 2px;' : ''}`

      // Progress fill
      const progressBar = document.createElement('div')
      progressBar.style.cssText = `position: absolute; left: 0; top: 0; height: 100%; width: ${task.progress}%; background: rgba(255,255,255,0.3); border-radius: 6px;`
      bar.appendChild(progressBar)

      const label = document.createElement('span')
      label.style.cssText = 'position: relative; z-index: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'
      label.textContent = `${task.name} (${task.progress}%)`
      bar.appendChild(label)

      // Drag to reschedule
      let dragStartX = 0
      let dragStartDay = 0

      bar.addEventListener('mousedown', (e) => {
        e.preventDefault()
        dragStartX = e.clientX
        dragStartDay = task.start
        bar.style.cursor = 'grabbing'
        bar.style.opacity = '0.8'

        const onMove = (ev: MouseEvent) => {
          const dx = ev.clientX - dragStartX
          const dayDelta = Math.round(dx / dayWidth)
          const newStart = Math.max(0, dragStartDay + dayDelta)
          engine.emit(TaskDragged, { id: task.id, newStart })
        }

        const onUp = () => {
          bar.style.cursor = 'grab'
          bar.style.opacity = '1'
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup', onUp)
        }

        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
      })

      bar.addEventListener('click', () => engine.emit(TaskSelected, task.id))

      barsContainer.appendChild(bar)
    }

    // SVG dependency arrows
    svgEl.innerHTML = ''
    svgEl.setAttribute('width', String(totalWidth))
    svgEl.setAttribute('height', String(taskList.length * ROW_HEIGHT))

    for (const task of taskList) {
      const taskIdx = taskList.indexOf(task)
      for (const depId of task.dependencies) {
        const dep = taskList.find((t) => t.id === depId)
        if (!dep) continue
        const depIdx = taskList.indexOf(dep)

        const x1 = (dep.start + dep.duration) * dayWidth
        const y1 = depIdx * ROW_HEIGHT + ROW_HEIGHT / 2
        const x2 = task.start * dayWidth
        const y2 = taskIdx * ROW_HEIGHT + ROW_HEIGHT / 2

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        const midX = (x1 + x2) / 2
        path.setAttribute('d', `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`)
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', '#98a2b3')
        path.setAttribute('stroke-width', '1.5')
        path.setAttribute('stroke-dasharray', '4,2')

        // Arrow head
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        arrow.setAttribute('points', `${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`)
        arrow.setAttribute('fill', '#98a2b3')

        svgEl.appendChild(path)
        svgEl.appendChild(arrow)
      }
    }

    // Task info
    if (sel) {
      const task = taskList.find((t) => t.id === sel)
      if (task) {
        taskInfo.innerHTML = `<strong>${task.name}</strong> | Days ${task.start + 1}-${task.start + task.duration} | Duration: ${task.duration} days | Progress: ${task.progress}% | Dependencies: ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}`
      }
    } else {
      taskInfo.textContent = 'Click a task to see details. Drag task bars to reschedule.'
    }
  }

  unsubs.push(tasks.subscribe(() => render()))
  unsubs.push(selectedTask.subscribe(() => render()))
  unsubs.push(zoomLevel.subscribe(() => render()))

  render()

  return () => {
    ;(window as any).__pulseEngine = null
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
