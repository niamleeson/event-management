// DAG
// MetricReceived ──→ ChartDataUpdated
//                └──→ ThresholdBreached (conditional)
//                └──→ CurrentMetricsChanged
// ThresholdBreached ──→ AlertCreated (after 3 breaches)
// AlertCreated ──→ AlertsChanged
// AlertDismissed ──→ AlertsChanged
// ChartDataUpdated ──→ ChartDataChanged
// FeedToggled ──→ FeedRunningChanged

import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Metric {
  name: string
  value: number
  unit: string
  timestamp: number
}

export interface Alert {
  id: string
  metric: string
  value: number
  threshold: number
  timestamp: number
  message: string
}

export interface ChartDataPoint {
  timestamp: number
  value: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const METRICS = [
  { name: 'CPU Usage', unit: '%', threshold: 80, baseValue: 45 },
  { name: 'Memory', unit: '%', threshold: 85, baseValue: 62 },
  { name: 'Latency', unit: 'ms', threshold: 200, baseValue: 120 },
  { name: 'Requests/s', unit: 'req/s', threshold: 1000, baseValue: 650 },
]

const ROLLING_WINDOW = 30 // keep last 30 data points per metric

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const MetricReceived = engine.event<Metric>('MetricReceived')
export const ThresholdBreached = engine.event<Metric>('ThresholdBreached')
export const AlertCreated = engine.event<Alert>('AlertCreated')
export const AlertDismissed = engine.event<string>('AlertDismissed')
export const ChartDataUpdated = engine.event<{ name: string; point: ChartDataPoint }>('ChartDataUpdated')
export const FeedToggled = engine.event<boolean>('FeedToggled')

// ---------------------------------------------------------------------------
// State-changed events
// ---------------------------------------------------------------------------

export const CurrentMetricsChanged = engine.event<Record<string, Metric>>('CurrentMetricsChanged')
export const AlertsChanged = engine.event<Alert[]>('AlertsChanged')
export const ChartDataChanged = engine.event<Record<string, ChartDataPoint[]>>('ChartDataChanged')
export const FeedRunningChanged = engine.event<boolean>('FeedRunningChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentMetrics: Record<string, Metric> = {}
let alerts: Alert[] = []
let chartData: Record<string, ChartDataPoint[]> = Object.fromEntries(METRICS.map((m) => [m.name, []]))
let feedRunning = true

// ---------------------------------------------------------------------------
// Pipes & Rules
// ---------------------------------------------------------------------------

// MetricReceived -> ChartDataUpdated (always fires for every metric)
engine.on(MetricReceived, [ChartDataUpdated], (metric, setChart) => {
  setChart({
    name: metric.name,
    point: { timestamp: metric.timestamp, value: metric.value },
  })
})

// MetricReceived -> ThresholdBreached (conditional: only when value > threshold)
engine.on(MetricReceived, [ThresholdBreached], (metric, setBreach) => {
  const config = METRICS.find((m) => m.name === metric.name)
  if (config && metric.value > config.threshold) {
    setBreach(metric)
  }
})

// Track breach counts per metric; create alert when count hits 3
let breachCounts: Record<string, number> = {}

engine.on(ThresholdBreached, [AlertCreated], (metric: Metric, setAlert) => {
  const key = metric.name
  breachCounts[key] = (breachCounts[key] ?? 0) + 1
  if (breachCounts[key] >= 3) {
    breachCounts[key] = 0
    const config = METRICS.find((m) => m.name === metric.name)
    setAlert({
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      metric: metric.name,
      value: metric.value,
      threshold: config?.threshold ?? 0,
      timestamp: Date.now(),
      message: `${metric.name} exceeded threshold ${config?.threshold}${config?.unit} (current: ${metric.value.toFixed(1)}${config?.unit})`,
    })
  }
})

// Reset breach count when metric goes back below threshold
engine.on(MetricReceived, (metric: Metric) => {
  const config = METRICS.find((m) => m.name === metric.name)
  if (config && metric.value <= config.threshold) {
    breachCounts[metric.name] = 0
  }
})

// ---------------------------------------------------------------------------
// State reducers
// ---------------------------------------------------------------------------

// Current metric values
engine.on(MetricReceived, [CurrentMetricsChanged], (metric, setMetrics) => {
  currentMetrics = { ...currentMetrics, [metric.name]: metric }
  setMetrics(currentMetrics)
})

// Alert list
engine.on(AlertCreated, [AlertsChanged], (alert, setAlerts) => {
  alerts = [alert, ...alerts].slice(0, 20)
  setAlerts(alerts)
})
engine.on(AlertDismissed, [AlertsChanged], (id, setAlerts) => {
  alerts = alerts.filter((a) => a.id !== id)
  setAlerts(alerts)
})

// Chart data (rolling window per metric)
engine.on(ChartDataUpdated, [ChartDataChanged], (update, setChartData) => {
  const existing = chartData[update.name] ?? []
  const next = [...existing, update.point].slice(-ROLLING_WINDOW)
  chartData = { ...chartData, [update.name]: next }
  setChartData(chartData)
})

// Feed running state
engine.on(FeedToggled, [FeedRunningChanged], (running, setRunning) => {
  feedRunning = running
  setRunning(feedRunning)
})

// ---------------------------------------------------------------------------
// Mock WebSocket data feed
// ---------------------------------------------------------------------------

let feedInterval: ReturnType<typeof setInterval> | null = null

function startFeed() {
  if (feedInterval) return
  feedInterval = setInterval(() => {
    if (!feedRunning) return
    for (const config of METRICS) {
      // Generate realistic-looking random data with occasional spikes
      const spike = Math.random() < 0.15 ? config.threshold * 0.4 : 0
      const noise = (Math.random() - 0.5) * config.baseValue * 0.3
      const value = Math.max(0, config.baseValue + noise + spike)

      engine.emit(MetricReceived, {
        name: config.name,
        value,
        unit: config.unit,
        timestamp: Date.now(),
      })
    }
  }, 1000)
}

function stopFeed() {
  if (feedInterval) {
    clearInterval(feedInterval)
    feedInterval = null
  }
}

// ---------------------------------------------------------------------------
// Initial values
// ---------------------------------------------------------------------------

export function getCurrentMetrics() { return currentMetrics }
export function getAlerts() { return alerts }
export function getChartData() { return chartData }
export function getFeedRunning() { return feedRunning }

export { startFeed, stopFeed }

export function startLoop() {}
export function stopLoop() {}
