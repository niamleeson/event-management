// DAG
// MetricReceived ──→ CurrentMetricsChanged
//                └──→ ChartDataChanged
//                └──→ AlertsChanged (via threshold breach)
// AlertDismissed ──→ AlertsChanged
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

const ROLLING_WINDOW = 30

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const MetricReceived = engine.event<Metric>('MetricReceived')
export const AlertDismissed = engine.event<string>('AlertDismissed')
export const FeedToggled = engine.event<boolean>('FeedToggled')

// State change events
export const CurrentMetricsChanged = engine.event<Record<string, Metric>>('CurrentMetricsChanged')
export const AlertsChanged = engine.event<Alert[]>('AlertsChanged')
export const ChartDataChanged = engine.event<Record<string, ChartDataPoint[]>>('ChartDataChanged')
export const FeedRunningChanged = engine.event<boolean>('FeedRunningChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentMetrics: Record<string, Metric> = {}
let alerts: Alert[] = []
let chartData: Record<string, ChartDataPoint[]> = Object.fromEntries(
  METRICS.map((m) => [m.name, []])
)
let feedRunning = true
let breachCount = 0
let lastBreachTime = 0
let lastChartUpdate = 0

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

engine.on(MetricReceived, [CurrentMetricsChanged, ChartDataChanged, AlertsChanged], (metric, setMetrics, setChart, setAlerts) => {
  // Update current metrics
  currentMetrics = { ...currentMetrics, [metric.name]: metric }
  setMetrics({ ...currentMetrics })

  // Throttled chart update (max once per second)
  const now = Date.now()
  if (now - lastChartUpdate >= 1000) {
    lastChartUpdate = now
    const existing = chartData[metric.name] ?? []
    const next = [...existing, { timestamp: metric.timestamp, value: metric.value }].slice(-ROLLING_WINDOW)
    chartData = { ...chartData, [metric.name]: next }
    setChart({ ...chartData })
  }

  // Threshold breach detection
  const config = METRICS.find((m) => m.name === metric.name)
  if (config && metric.value > config.threshold) {
    breachCount++
    if (breachCount >= 3 && now - lastBreachTime > 10000) {
      lastBreachTime = now
      breachCount = 0
      const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        metric: metric.name,
        value: metric.value,
        threshold: config.threshold,
        timestamp: Date.now(),
        message: `${metric.name} exceeded threshold ${config.threshold}${config.unit} (current: ${metric.value.toFixed(1)}${config.unit})`,
      }
      alerts = [alert, ...alerts].slice(0, 20)
      setAlerts([...alerts])
    }
  }
})

engine.on(AlertDismissed, [AlertsChanged], (id, setAlerts) => {
  alerts = alerts.filter((a) => a.id !== id)
  setAlerts([...alerts])
})

engine.on(FeedToggled, [FeedRunningChanged], (running, setRunning) => {
  feedRunning = running
  setRunning(running)
})

// ---------------------------------------------------------------------------
// Mock WebSocket data feed
// ---------------------------------------------------------------------------

let feedInterval: ReturnType<typeof setInterval> | null = null

export function startFeed() {
  if (feedInterval) return
  feedInterval = setInterval(() => {
    if (!feedRunning) return
    for (const config of METRICS) {
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

export function stopFeed() {
  if (feedInterval) {
    clearInterval(feedInterval)
    feedInterval = null
  }
}

export function startLoop() { startFeed() }
export function stopLoop() { stopFeed() }
