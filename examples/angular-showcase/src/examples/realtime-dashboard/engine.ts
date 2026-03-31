import { createEngine } from '@pulse/core'

export const engine = createEngine()

export interface Metric { name: string; value: number; unit: string; timestamp: number }
export interface Alert { id: string; metric: string; value: number; threshold: number; timestamp: number; message: string }
export interface ChartDataPoint { timestamp: number; value: number }

export const METRICS = [
  { name: 'CPU Usage', unit: '%', threshold: 80, baseValue: 45 },
  { name: 'Memory', unit: '%', threshold: 85, baseValue: 62 },
  { name: 'Latency', unit: 'ms', threshold: 200, baseValue: 120 },
  { name: 'Requests/s', unit: 'req/s', threshold: 1000, baseValue: 650 },
]

const ROLLING_WINDOW = 30

// Events
export const MetricReceived = engine.event<Metric>('MetricReceived')
export const AlertDismissed = engine.event<string>('AlertDismissed')
export const FeedToggled = engine.event<boolean>('FeedToggled')

// State events
export const CurrentMetricsChanged = engine.event<Record<string, Metric>>('CurrentMetricsChanged')
export const AlertsChanged = engine.event<Alert[]>('AlertsChanged')
export const ChartDataChanged = engine.event<Record<string, ChartDataPoint[]>>('ChartDataChanged')
export const FeedRunningChanged = engine.event<boolean>('FeedRunningChanged')

// State
let currentMetrics: Record<string, Metric> = {}
let alerts: Alert[] = []
let chartData: Record<string, ChartDataPoint[]> = Object.fromEntries(METRICS.map((m) => [m.name, []]))
let feedRunning = true
let breachCounts: Record<string, number> = {}

engine.on(MetricReceived, (metric) => {
  currentMetrics = { ...currentMetrics, [metric.name]: metric }
  engine.emit(CurrentMetricsChanged, currentMetrics)

  // Update chart
  const existing = chartData[metric.name] ?? []
  const next = [...existing, { timestamp: metric.timestamp, value: metric.value }].slice(-ROLLING_WINDOW)
  chartData = { ...chartData, [metric.name]: next }
  engine.emit(ChartDataChanged, chartData)

  // Threshold check
  const config = METRICS.find((m) => m.name === metric.name)
  if (config && metric.value > config.threshold) {
    breachCounts[metric.name] = (breachCounts[metric.name] ?? 0) + 1
    if (breachCounts[metric.name] >= 3) {
      breachCounts[metric.name] = 0
      const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        metric: metric.name, value: metric.value, threshold: config.threshold,
        timestamp: Date.now(),
        message: `${metric.name} exceeded threshold ${config.threshold}${config.unit} (current: ${metric.value.toFixed(1)}${config.unit})`,
      }
      alerts = [alert, ...alerts].slice(0, 20)
      engine.emit(AlertsChanged, alerts)
    }
  } else if (config) {
    breachCounts[metric.name] = 0
  }
})

engine.on(AlertDismissed, (id) => {
  alerts = alerts.filter((a) => a.id !== id)
  engine.emit(AlertsChanged, alerts)
})

engine.on(FeedToggled, (running) => {
  feedRunning = running
  engine.emit(FeedRunningChanged, running)
})

let feedInterval: ReturnType<typeof setInterval> | null = null

export function startFeed() {
  if (feedInterval) return
  feedInterval = setInterval(() => {
    if (!feedRunning) return
    for (const config of METRICS) {
      const spike = Math.random() < 0.15 ? config.threshold * 0.4 : 0
      const noise = (Math.random() - 0.5) * config.baseValue * 0.3
      const value = Math.max(0, config.baseValue + noise + spike)
      engine.emit(MetricReceived, { name: config.name, value, unit: config.unit, timestamp: Date.now() })
    }
  }, 1000)
}

export function stopFeed() {
  if (feedInterval) { clearInterval(feedInterval); feedInterval = null }
}
