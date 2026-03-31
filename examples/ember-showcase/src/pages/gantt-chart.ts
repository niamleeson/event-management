import { engine, TOTAL_DAYS, ROW_HEIGHT, TaskDragged, TaskResized, TaskSelected, ZoomChanged, ScrollXChanged, getTasks, getSelectedTask, getZoomLevel, getScrollX, getDayWidth, GanttChanged, type ZoomLevel } from '../engines/gantt-chart'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const wrapper = document.createElement('div'); wrapper.style.cssText = 'max-width: 1100px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  wrapper.innerHTML = `<h2 style="font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;">Gantt Chart</h2><p style="color: #666; font-size: 14px; margin-bottom: 16px;">Drag tasks, SVG dependency arrows, zoom levels, cascade shifts.</p>`

  const controls = document.createElement('div'); controls.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px;'
  for (const z of ['day', 'week', 'month'] as ZoomLevel[]) {
    const btn = document.createElement('button'); btn.style.cssText = 'padding: 6px 14px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px;'; btn.textContent = z.charAt(0).toUpperCase() + z.slice(1)
    btn.addEventListener('click', () => engine.emit(ZoomChanged, z)); controls.appendChild(btn)
  }
  wrapper.appendChild(controls)

  const chartArea = document.createElement('div'); chartArea.style.cssText = 'position: relative; overflow-x: auto; border: 1px solid #e4e7ec; border-radius: 8px; background: #fafbfc;'
  chartArea.addEventListener('scroll', () => engine.emit(ScrollXChanged, chartArea.scrollLeft))
  const chartInner = document.createElement('div'); chartInner.style.cssText = 'position: relative; min-height: 400px;'
  chartArea.appendChild(chartInner); wrapper.appendChild(chartArea)

  const infoEl = document.createElement('div'); infoEl.style.cssText = 'margin-top: 12px; font-size: 13px; color: #667085;'; wrapper.appendChild(infoEl)
  container.appendChild(wrapper)

  function render() {
    const tasks = getTasks(); const zoom = getZoomLevel(); const dayW = getDayWidth(zoom); const selected = getSelectedTask()
    chartInner.style.width = `${TOTAL_DAYS * dayW + 200}px`; chartInner.style.height = `${(tasks.length + 1) * ROW_HEIGHT}px`; chartInner.innerHTML = ''

    // Day grid lines
    for (let d = 0; d <= TOTAL_DAYS; d++) {
      const line = document.createElement('div'); line.style.cssText = `position: absolute; left: ${200 + d * dayW}px; top: 0; bottom: 0; width: 1px; background: ${d % 7 === 0 ? '#d0d5dd' : '#f0f2f5'};`
      if (d % (zoom === 'day' ? 5 : zoom === 'week' ? 7 : 30) === 0) { const label = document.createElement('div'); label.style.cssText = `position: absolute; top: 4px; left: ${200 + d * dayW}px; font-size: 10px; color: #98a2b3;`; label.textContent = `Day ${d}`; chartInner.appendChild(label) }
      chartInner.appendChild(line)
    }

    // SVG for dependency arrows
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;'
    for (const task of tasks) {
      const idx = tasks.indexOf(task)
      for (const depId of task.dependencies) {
        const dep = tasks.find((t) => t.id === depId); if (!dep) continue; const depIdx = tasks.indexOf(dep)
        const x1 = 200 + (dep.start + dep.duration) * dayW; const y1 = depIdx * ROW_HEIGHT + ROW_HEIGHT / 2
        const x2 = 200 + task.start * dayW; const y2 = idx * ROW_HEIGHT + ROW_HEIGHT / 2
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', `M${x1},${y1} C${x1 + 20},${y1} ${x2 - 20},${y2} ${x2},${y2}`)
        path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#98a2b3'); path.setAttribute('stroke-width', '1.5')
        path.setAttribute('marker-end', 'url(#arrowhead)'); svg.appendChild(path)
      }
    }
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    defs.innerHTML = '<marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#98a2b3"/></marker>'
    svg.appendChild(defs); chartInner.appendChild(svg)

    // Task bars
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]; const isSelected = selected === task.id
      // Label
      const label = document.createElement('div'); label.style.cssText = `position: absolute; left: 8px; top: ${i * ROW_HEIGHT}px; width: 184px; height: ${ROW_HEIGHT}px; display: flex; align-items: center; font-size: 13px; color: #344054; font-weight: 500; cursor: pointer; padding-left: 8px; ${isSelected ? 'background: #eef0ff;' : ''}`
      label.textContent = task.name; label.addEventListener('click', () => engine.emit(TaskSelected, task.id)); chartInner.appendChild(label)
      // Bar
      const bar = document.createElement('div'); bar.style.cssText = `position: absolute; left: ${200 + task.start * dayW}px; top: ${i * ROW_HEIGHT + 8}px; width: ${task.duration * dayW}px; height: ${ROW_HEIGHT - 16}px; background: ${task.color}; border-radius: 6px; cursor: grab; display: flex; align-items: center; padding: 0 6px; font-size: 11px; color: #fff; font-weight: 600; overflow: hidden; ${isSelected ? 'box-shadow: 0 0 0 2px #4361ee;' : ''}`
      bar.textContent = `${task.progress}%`

      let dragStartX = 0; let origStart = 0
      bar.addEventListener('mousedown', (e) => { e.preventDefault(); dragStartX = e.clientX; origStart = task.start
        const onMove = (ev: MouseEvent) => { const delta = Math.round((ev.clientX - dragStartX) / dayW); engine.emit(TaskDragged, { id: task.id, newStart: origStart + delta }) }
        const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
        document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
      })
      // Progress fill
      const fill = document.createElement('div'); fill.style.cssText = `position: absolute; left: 0; top: 0; bottom: 0; width: ${task.progress}%; background: rgba(255,255,255,0.25); border-radius: 6px;`
      bar.appendChild(fill); chartInner.appendChild(bar)
    }
    infoEl.textContent = `${tasks.length} tasks | Zoom: ${zoom} | Day width: ${dayW}px${selected ? ` | Selected: ${selected}` : ''}`
  }

  unsubs.push(engine.on(GanttChanged, () => render())); render()
  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); unsubs.forEach((u) => u()) }
}
