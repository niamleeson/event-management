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
// DAG (4 levels deep)
// ---------------------------------------------------------------------------
// MetricReceived ──→ CurrentMetricsChanged ──→ ChartDataChanged ──→ AlertsChanged
// AlertDismissed ──→ AlertsChanged
// FeedToggled ──→ FeedRunningChanged
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

// Layer 0: User / external input events
export const MetricReceived = engine.event<Metric>('MetricReceived')
export const AlertDismissed = engine.event<string>('AlertDismissed')
export const FeedToggled = engine.event<boolean>('FeedToggled')

// Layer 1: Primary state events
export const CurrentMetricsChanged = engine.event<Record<string, Metric>>('CurrentMetricsChanged')
export const FeedRunningChanged = engine.event<boolean>('FeedRunningChanged')

// Layer 2: Derived state events (from metrics)
export const ChartDataChanged = engine.event<Record<string, ChartDataPoint[]>>('ChartDataChanged')

// Layer 3: Alert detection (derived from chart/metrics thresholds)
export const AlertsChanged = engine.event<Alert[]>('AlertsChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentMetrics: Record<string, Metric> = {}
let alerts: Alert[] = []
let chartData: Record<string, ChartDataPoint[]> = Object.fromEntries(
  METRICS.map((m) => [m.name, []])
)
let feedRunning = true

// Breach tracking for alert generation
let breachCount = 0
let lastBreachTime = 0

// Throttle chart updates
let lastChartUpdate = 0

// ---------------------------------------------------------------------------
// Layer 0 → Layer 1: Input handlers → primary state
// ---------------------------------------------------------------------------

engine.on(MetricReceived, [CurrentMetricsChanged], (metric, setMetrics) => {
  currentMetrics = { ...currentMetrics, [metric.name]: metric }
  setMetrics({ ...currentMetrics })
})

engine.on(FeedToggled, [FeedRunningChanged], (running, setRunning) => {
  feedRunning = running
  setRunning(running)
})

// ---------------------------------------------------------------------------
// Layer 1 → Layer 2: Primary state → chart data (throttled)
// ---------------------------------------------------------------------------

engine.on(CurrentMetricsChanged, [ChartDataChanged], (metrics, setChart) => {
  const now = Date.now()
  if (now - lastChartUpdate < 1000) return
  lastChartUpdate = now

  // Update chart data for each metric that was updated
  for (const name of Object.keys(metrics)) {
    const metric = metrics[name]
    const existing = chartData[name] ?? []
    const next = [...existing, { timestamp: metric.timestamp, value: metric.value }].slice(-ROLLING_WINDOW)
    chartData = { ...chartData, [name]: next }
  }
  setChart({ ...chartData })
})

// ---------------------------------------------------------------------------
// Layer 2 → Layer 3: Chart data → alert detection
// ---------------------------------------------------------------------------

engine.on(ChartDataChanged, [AlertsChanged], (_chartData, setAlerts) => {
  const now = Date.now()

  // Check each metric against its threshold
  for (const config of METRICS) {
    const metric = currentMetrics[config.name]
    if (!metric) continue

    if (metric.value > config.threshold) {
      breachCount++
      if (breachCount >= 3 && now - lastBreachTime > 10000) {
        lastBreachTime = now
        breachCount = 0
        const alert: Alert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          metric: config.name,
          value: metric.value,
          threshold: config.threshold,
          timestamp: Date.now(),
          message: `${config.name} exceeded threshold ${config.threshold}${config.unit} (current: ${metric.value.toFixed(1)}${config.unit})`,
        }
        alerts = [alert, ...alerts].slice(0, 20)
        setAlerts([...alerts])
        return
      }
    }
  }
})

// AlertDismissed directly updates alerts (Layer 0 → Layer 3 shortcut)
engine.on(AlertDismissed, [AlertsChanged], (id, setAlerts) => {
  alerts = alerts.filter((a) => a.id !== id)
  setAlerts([...alerts])
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

export function startLoop() {}
export function stopLoop() {}

export function resetState() {
  currentMetrics = {}
  alerts = []
  chartData = Object.fromEntries(METRICS.map((m) => [m.name, []]))
  feedRunning = true
  breachCount = 0
  lastBreachTime = 0
  lastChartUpdate = 0
  if (feedInterval) {
    clearInterval(feedInterval)
    feedInterval = null
  }
}
