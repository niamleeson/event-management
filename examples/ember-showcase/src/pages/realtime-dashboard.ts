import { engine, getCurrentMetrics, getAlerts, getChartData, getFeedRunning, FeedToggled, AlertDismissed, MetricsUpdated, ChartUpdated, AlertsUpdated, startFeed, stopFeed, METRICS, type Alert, type ChartDataPoint } from '../engines/realtime-dashboard'

const CHART_COLORS: Record<string, string> = { 'CPU Usage': '#4361ee', 'Memory': '#7209b7', 'Latency': '#f59e0b', 'Requests/s': '#10b981' }

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const styleTag = document.createElement('style')
  styleTag.textContent = `@keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`
  document.head.appendChild(styleTag)

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #0a0a1a; padding: 32px 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #e2e8f0;'
  container.appendChild(wrapper)

  const headerRow = document.createElement('div')
  headerRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; max-width: 1100px; margin: 0 auto 32px;'
  const headerLeft = document.createElement('div')
  const titleEl = document.createElement('h1')
  titleEl.style.cssText = 'font-size: 32px; font-weight: 800; color: #f1f5f9; margin: 0;'
  const liveIndicator = document.createElement('span')
  liveIndicator.style.cssText = 'display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px;'
  titleEl.appendChild(liveIndicator)
  titleEl.appendChild(document.createTextNode('Realtime Dashboard'))
  const subtitleEl = document.createElement('p')
  subtitleEl.style.cssText = 'color: #64748b; font-size: 13px; margin-top: 2px;'
  subtitleEl.textContent = 'Mock WebSocket pushing metrics every second. All data flows through Pulse events.'
  headerLeft.appendChild(titleEl)
  headerLeft.appendChild(subtitleEl)
  const toggleBtn = document.createElement('button')
  toggleBtn.addEventListener('click', () => engine.emit(FeedToggled, !getFeedRunning()))
  headerRow.appendChild(headerLeft)
  headerRow.appendChild(toggleBtn)
  wrapper.appendChild(headerRow)

  const metricsGrid = document.createElement('div')
  metricsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; max-width: 1100px; margin: 0 auto 24px;'
  const metricCards: Record<string, { card: HTMLElement; valueEl: HTMLElement }> = {}
  for (const config of METRICS) {
    const card = document.createElement('div')
    card.style.cssText = 'background: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; transition: border-color 0.3s;'
    card.innerHTML = `<div style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${config.name}</div>`
    const valueEl = document.createElement('span')
    valueEl.style.cssText = 'font-size: 36px; font-weight: 800; color: #f1f5f9; font-variant-numeric: tabular-nums; transition: color 0.3s;'
    const unitEl = document.createElement('span')
    unitEl.style.cssText = 'font-size: 14px; color: #64748b; margin-left: 4px;'
    unitEl.textContent = config.unit
    const row = document.createElement('div')
    row.appendChild(valueEl); row.appendChild(unitEl); card.appendChild(row)
    card.innerHTML += `<div style="font-size: 12px; color: #475569; margin-top: 4px;">Threshold: ${config.threshold}${config.unit}</div>`
    metricsGrid.appendChild(card)
    metricCards[config.name] = { card, valueEl }
  }
  wrapper.appendChild(metricsGrid)

  const chartsSection = document.createElement('div')
  chartsSection.style.cssText = 'max-width: 1100px; margin: 0 auto 24px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;'
  const chartElements: Record<string, { container: HTMLElement; barsArea: HTMLElement }> = {}
  for (const config of METRICS) {
    const chartCard = document.createElement('div')
    chartCard.style.cssText = 'background: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; position: relative;'
    chartCard.innerHTML = `<div style="font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 16px;">${config.name}</div>`
    const barsArea = document.createElement('div')
    barsArea.style.cssText = 'height: 120px; display: flex; align-items: flex-end; gap: 2px;'
    chartCard.appendChild(barsArea)
    chartsSection.appendChild(chartCard)
    chartElements[config.name] = { container: chartCard, barsArea }
  }
  wrapper.appendChild(chartsSection)

  const alertsSection = document.createElement('div')
  alertsSection.style.cssText = 'max-width: 1100px; margin: 0 auto;'
  const alertsTitle = document.createElement('h2')
  alertsTitle.style.cssText = 'font-size: 18px; font-weight: 700; color: #f1f5f9; margin-bottom: 16px;'
  const alertsList = document.createElement('div')
  alertsSection.appendChild(alertsTitle)
  alertsSection.appendChild(alertsList)
  wrapper.appendChild(alertsSection)

  function updateHeader() {
    const running = getFeedRunning()
    liveIndicator.style.background = running ? '#10b981' : '#64748b'
    liveIndicator.style.animation = running ? 'pulse 2s infinite' : 'none'
    toggleBtn.style.cssText = `padding: 10px 24px; font-size: 14px; font-weight: 600; border: none; border-radius: 10px; cursor: pointer; background: ${running ? '#ef4444' : '#10b981'}; color: #fff; transition: background 0.2s;`
    toggleBtn.textContent = running ? 'Pause Feed' : 'Resume Feed'
  }

  function updateMetrics() {
    const metrics = getCurrentMetrics()
    for (const config of METRICS) {
      const metric = metrics[config.name]
      const value = metric?.value ?? 0
      const breached = value > config.threshold
      const { card, valueEl } = metricCards[config.name]
      card.style.borderColor = breached ? '#ef4444' : '#1e293b'
      valueEl.style.color = breached ? '#ef4444' : '#f1f5f9'
      valueEl.textContent = value.toFixed(config.name === 'Latency' ? 0 : 1)
    }
  }

  function updateCharts() {
    const data = getChartData()
    for (const config of METRICS) {
      const points: ChartDataPoint[] = data[config.name] ?? []
      const { barsArea, container: chartContainer } = chartElements[config.name]
      const color = CHART_COLORS[config.name] ?? '#4361ee'
      if (points.length === 0) { barsArea.innerHTML = '<div style="width: 100%; display: flex; justify-content: center; align-items: center; color: #334155; font-size: 13px;">Waiting for data...</div>'; continue }
      const maxVal = Math.max(...points.map((d) => d.value), config.threshold * 1.1)
      barsArea.innerHTML = ''
      for (let i = 0; i < points.length; i++) {
        const point = points[i]; const height = (point.value / maxVal) * 100; const breached = point.value > config.threshold
        const bar = document.createElement('div')
        bar.style.cssText = `flex: 1; height: ${height}%; background: ${breached ? '#ef4444' : color}; border-radius: 3px 3px 0 0; min-width: 3px; opacity: ${0.5 + (i / points.length) * 0.5}; transition: height 0.3s ease-out;`
        barsArea.appendChild(bar)
      }
      const oldLine = chartContainer.querySelector('.threshold-line'); if (oldLine) oldLine.remove()
      const thresholdLine = document.createElement('div')
      thresholdLine.className = 'threshold-line'
      thresholdLine.style.cssText = `position: absolute; left: 20px; right: 20px; bottom: ${20 + (config.threshold / maxVal) * 120}px; height: 1px; background: #ef4444; opacity: 0.3; pointer-events: none;`
      chartContainer.appendChild(thresholdLine)
    }
  }

  function updateAlerts() {
    const alertList = getAlerts()
    alertsTitle.textContent = `Alerts (${alertList.length})`
    alertsList.innerHTML = ''
    if (alertList.length === 0) { alertsList.innerHTML = '<div style="text-align: center; padding: 32px; color: #334155; font-size: 14px;">No active alerts. Alerts trigger after 3 consecutive threshold breaches.</div>'; return }
    for (const alert of alertList) {
      const alertCard = document.createElement('div')
      alertCard.style.cssText = 'background: #1a0a0a; border: 1px solid #7f1d1d; border-radius: 10px; padding: 14px 18px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; animation: slideIn 0.3s ease-out;'
      alertCard.innerHTML = `<span style="font-size: 14px; color: #fca5a5; flex: 1;">${alert.message}</span><span style="font-size: 12px; color: #7f1d1d; margin-left: 16px; flex-shrink: 0;">${new Date(alert.timestamp).toLocaleTimeString()}</span>`
      const dismissBtn = document.createElement('button')
      dismissBtn.style.cssText = 'font-size: 18px; color: #7f1d1d; background: none; border: none; cursor: pointer; margin-left: 12px; padding: 0 4px;'
      dismissBtn.textContent = 'x'
      dismissBtn.addEventListener('click', () => engine.emit(AlertDismissed, alert.id))
      alertCard.appendChild(dismissBtn)
      alertsList.appendChild(alertCard)
    }
  }

  unsubs.push(engine.on(FeedToggled, () => updateHeader()))
  unsubs.push(engine.on(MetricsUpdated, () => updateMetrics()))
  unsubs.push(engine.on(ChartUpdated, () => updateCharts()))
  unsubs.push(engine.on(AlertsUpdated, () => updateAlerts()))

  updateHeader(); updateMetrics(); updateCharts(); updateAlerts()
  startFeed()

  return () => {
    ;(window as any).__pulseEngine = null; engine.destroy(); unsubs.forEach((u) => u()); stopFeed()
    if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag)
  }
}
