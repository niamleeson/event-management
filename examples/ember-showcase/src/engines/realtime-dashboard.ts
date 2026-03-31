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
export const AlertCreated = engine.event<Alert>('AlertCreated')
export const AlertDismissed = engine.event<string>('AlertDismissed')
export const FeedToggled = engine.event<boolean>('FeedToggled')
export const MetricsUpdated = engine.event<void>('MetricsUpdated')
export const ChartUpdated = engine.event<void>('ChartUpdated')
export const AlertsUpdated = engine.event<void>('AlertsUpdated')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _currentMetrics: Record<string, Metric> = {}
let _alerts: Alert[] = []
let _chartData: Record<string, ChartDataPoint[]> = Object.fromEntries(METRICS.map((m) => [m.name, []]))
let _feedRunning = true
let breachCounts: Record<string, number> = {}

export function getCurrentMetrics(): Record<string, Metric> { return _currentMetrics }
export function getAlerts(): Alert[] { return _alerts }
export function getChartData(): Record<string, ChartDataPoint[]> { return _chartData }
export function getFeedRunning(): boolean { return _feedRunning }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(MetricReceived, (metric: Metric) => {
  _currentMetrics = { ..._currentMetrics, [metric.name]: metric }

  // Update chart data
  const existing = _chartData[metric.name] ?? []
  _chartData = {
    ..._chartData,
    [metric.name]: [...existing, { timestamp: metric.timestamp, value: metric.value }].slice(-ROLLING_WINDOW),
  }

  // Threshold breach tracking
  const config = METRICS.find((m) => m.name === metric.name)
  if (config) {
    if (metric.value > config.threshold) {
      const key = metric.name
      breachCounts[key] = (breachCounts[key] ?? 0) + 1
      if (breachCounts[key] >= 3) {
        breachCounts[key] = 0
        engine.emit(AlertCreated, {
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          metric: metric.name,
          value: metric.value,
          threshold: config.threshold,
          timestamp: Date.now(),
          message: `${metric.name} exceeded threshold ${config.threshold}${config.unit} (current: ${metric.value.toFixed(1)}${config.unit})`,
        })
      }
    } else {
      breachCounts[metric.name] = 0
    }
  }

  engine.emit(MetricsUpdated, undefined)
  engine.emit(ChartUpdated, undefined)
})

engine.on(AlertCreated, (alert: Alert) => {
  _alerts = [alert, ..._alerts].slice(0, 20)
  engine.emit(AlertsUpdated, undefined)
})

engine.on(AlertDismissed, (id: string) => {
  _alerts = _alerts.filter((a) => a.id !== id)
  engine.emit(AlertsUpdated, undefined)
})

engine.on(FeedToggled, (running: boolean) => {
  _feedRunning = running
})

// ---------------------------------------------------------------------------
// Mock WebSocket data feed
// ---------------------------------------------------------------------------

let feedInterval: ReturnType<typeof setInterval> | null = null

export function startFeed() {
  if (feedInterval) return
  feedInterval = setInterval(() => {
    if (!_feedRunning) return
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
