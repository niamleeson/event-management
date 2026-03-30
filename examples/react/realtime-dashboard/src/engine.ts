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

// Throttled version of MetricReceived for chart updates (max once per second)
const ChartThrottled = engine.event<Metric>('ChartThrottled')
engine.throttle(MetricReceived, 1000, ChartThrottled)

// Time-windowed join: 3 threshold breaches within 10 seconds -> AlertCreated
// Separate event types for each breach slot (joinWithin needs distinct inputs)
const Breach1 = engine.event<Metric>('Breach1')
const Breach2 = engine.event<Metric>('Breach2')
const Breach3 = engine.event<Metric>('Breach3')
let breachSlot = 0

engine.on(ThresholdBreached, (metric: Metric) => {
  const slot = breachSlot % 3
  breachSlot++
  if (slot === 0) engine.emit(Breach1, metric)
  else if (slot === 1) engine.emit(Breach2, metric)
  else engine.emit(Breach3, metric)
})

engine.joinWithin(
  [Breach1, Breach2, Breach3],
  AlertCreated,
  10000,
  {
    do: (a: Metric, _b: Metric, c: Metric) => {
      const metric = c
      const config = METRICS.find((m) => m.name === metric.name)
      return {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        metric: metric.name,
        value: metric.value,
        threshold: config?.threshold ?? 0,
        timestamp: Date.now(),
        message: `${metric.name} exceeded threshold ${config?.threshold}${config?.unit} (current: ${metric.value.toFixed(1)}${config?.unit})`,
      }
    },
  },
)

// ---------------------------------------------------------------------------
// Pipes & Rules
// ---------------------------------------------------------------------------

// ChartThrottled -> ChartDataUpdated (throttled to max once per second)
engine.pipe(ChartThrottled, ChartDataUpdated, (metric: Metric) => ({
  name: metric.name,
  point: { timestamp: metric.timestamp, value: metric.value },
}))

// MetricReceived -> ThresholdBreached (conditional: only when value > threshold)
engine.pipeIf(MetricReceived, ThresholdBreached, (metric: Metric) => {
  const config = METRICS.find((m) => m.name === metric.name)
  return config && metric.value > config.threshold ? metric : null
})

// (Breach counting is handled above by joinWithin — 3 breaches within 10s triggers alert)

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

// Current metric values
export const currentMetrics = engine.signal<Record<string, Metric>>(
  MetricReceived,
  {},
  (prev, metric) => ({ ...prev, [metric.name]: metric }),
)

// Alert list
export const alerts = engine.signal<Alert[]>(
  AlertCreated,
  [],
  (prev, alert) => [alert, ...prev].slice(0, 20),
)
engine.signalUpdate(alerts, AlertDismissed, (prev, id) =>
  prev.filter((a) => a.id !== id),
)

// Chart data (rolling window per metric)
export const chartData = engine.signal<Record<string, ChartDataPoint[]>>(
  ChartDataUpdated,
  Object.fromEntries(METRICS.map((m) => [m.name, []])),
  (prev, update) => {
    const existing = prev[update.name] ?? []
    const next = [...existing, update.point].slice(-ROLLING_WINDOW)
    return { ...prev, [update.name]: next }
  },
)

// Feed running state
export const feedRunning = engine.signal<boolean>(
  FeedToggled,
  true,
  (_prev, running) => running,
)

// ---------------------------------------------------------------------------
// Mock WebSocket data feed
// ---------------------------------------------------------------------------

let feedInterval: ReturnType<typeof setInterval> | null = null

export function startFeed() {
  if (feedInterval) return
  feedInterval = setInterval(() => {
    if (!feedRunning.value) return
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

export function stopFeed() {
  if (feedInterval) {
    clearInterval(feedInterval)
    feedInterval = null
  }
}

// Start the frame loop (for any tweens/springs we add later)
engine.startFrameLoop()
