import { createEngine } from '@pulse/core'
import { createPulseService } from '@pulse/ember'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricPoint {
  time: number
  value: number
}

export interface Alert {
  id: string
  metric: string
  message: string
  severity: 'warning' | 'critical'
  timestamp: number
}

export interface DashboardMetrics {
  cpu: number
  memory: number
  requests: number
  errorRate: number
  latency: number
}

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const DataTick = engine.event<DashboardMetrics>('DataTick')
export const CpuUpdated = engine.event<number>('CpuUpdated')
export const MemoryUpdated = engine.event<number>('MemoryUpdated')
export const RequestsUpdated = engine.event<number>('RequestsUpdated')
export const ErrorRateUpdated = engine.event<number>('ErrorRateUpdated')
export const LatencyUpdated = engine.event<number>('LatencyUpdated')
export const CpuThresholdBreached = engine.event<number>('CpuThresholdBreached')
export const MemoryThresholdBreached = engine.event<number>('MemoryThresholdBreached')
export const AlertRaised = engine.event<Alert>('AlertRaised')
export const AlertDismissed = engine.event<string>('AlertDismissed')
export const FeedStarted = engine.event<void>('FeedStarted')
export const FeedStopped = engine.event<void>('FeedStopped')
export const ChartTweenStart = engine.event<void>('ChartTweenStart')

// ---------------------------------------------------------------------------
// Pipes: fan out DataTick to individual metric events
// ---------------------------------------------------------------------------

engine.pipe(DataTick, CpuUpdated, (m) => m.cpu)
engine.pipe(DataTick, MemoryUpdated, (m) => m.memory)
engine.pipe(DataTick, RequestsUpdated, (m) => m.requests)
engine.pipe(DataTick, ErrorRateUpdated, (m) => m.errorRate)
engine.pipe(DataTick, LatencyUpdated, (m) => m.latency)

// ---------------------------------------------------------------------------
// Threshold detection with engine.when
// ---------------------------------------------------------------------------

// CPU signal for threshold checking
export const cpuValue = engine.signal<number>(
  CpuUpdated,
  0,
  (_prev, val) => val,
)

// Memory signal for threshold checking
export const memoryValue = engine.signal<number>(
  MemoryUpdated,
  0,
  (_prev, val) => val,
)

// Fire threshold events when values exceed limits
engine.when(cpuValue, (v) => v > 85, CpuThresholdBreached)
engine.when(memoryValue, (v) => v > 90, MemoryThresholdBreached)

// ---------------------------------------------------------------------------
// Join: both CPU and Memory breached = critical alert
// ---------------------------------------------------------------------------

engine.join([CpuThresholdBreached, MemoryThresholdBreached], AlertRaised, {
  do: (cpu: number, mem: number): Alert => ({
    id: crypto.randomUUID(),
    metric: 'system',
    message: `Critical: CPU at ${cpu.toFixed(0)}% AND Memory at ${mem.toFixed(0)}%`,
    severity: 'critical',
    timestamp: Date.now(),
  }),
})

// Individual threshold alerts
engine.pipe(CpuThresholdBreached, AlertRaised, (cpu): Alert => ({
  id: crypto.randomUUID(),
  metric: 'cpu',
  message: `CPU usage at ${cpu.toFixed(0)}%`,
  severity: 'warning',
  timestamp: Date.now(),
}))

engine.pipe(MemoryThresholdBreached, AlertRaised, (mem): Alert => ({
  id: crypto.randomUUID(),
  metric: 'memory',
  message: `Memory usage at ${mem.toFixed(0)}%`,
  severity: 'warning',
  timestamp: Date.now(),
}))

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

const MAX_HISTORY = 30

// CPU history (for chart)
export const cpuHistory = engine.signal<MetricPoint[]>(
  CpuUpdated,
  [],
  (prev, val) => {
    const next = [...prev, { time: Date.now(), value: val }]
    return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next
  },
)

// Memory history
export const memoryHistory = engine.signal<MetricPoint[]>(
  MemoryUpdated,
  [],
  (prev, val) => {
    const next = [...prev, { time: Date.now(), value: val }]
    return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next
  },
)

// Request count
export const requestCount = engine.signal<number>(
  RequestsUpdated,
  0,
  (prev, val) => prev + val,
)

// Error rate
export const errorRate = engine.signal<number>(
  ErrorRateUpdated,
  0,
  (_prev, val) => val,
)

// Latency
export const latencyValue = engine.signal<number>(
  LatencyUpdated,
  0,
  (_prev, val) => val,
)

// Alert list
export const alerts = engine.signal<Alert[]>(
  AlertRaised,
  [],
  (prev, alert) => {
    const next = [alert, ...prev]
    return next.length > 10 ? next.slice(0, 10) : next
  },
)

engine.signalUpdate(alerts, AlertDismissed, (prev, id) =>
  prev.filter((a) => a.id !== id),
)

// Feed running state
export const feedRunning = engine.signal<boolean>(
  FeedStarted,
  false,
  () => true,
)
engine.signalUpdate(feedRunning, FeedStopped, () => false)

// ---------------------------------------------------------------------------
// Tween: chart bar animation on new data
// ---------------------------------------------------------------------------

engine.pipe(DataTick, ChartTweenStart, () => undefined)

export const chartTween = engine.tween({
  start: ChartTweenStart,
  from: 0,
  to: 1,
  duration: 300,
  easing: 'easeOut',
})

// ---------------------------------------------------------------------------
// Mock data feed
// ---------------------------------------------------------------------------

let feedInterval: ReturnType<typeof setInterval> | null = null

export function startFeed(): void {
  if (feedInterval) return
  engine.emit(FeedStarted, undefined)

  feedInterval = setInterval(() => {
    engine.emit(DataTick, {
      cpu: 40 + Math.random() * 55,        // 40-95%
      memory: 50 + Math.random() * 45,     // 50-95%
      requests: Math.floor(Math.random() * 200),
      errorRate: Math.random() * 8,         // 0-8%
      latency: 20 + Math.random() * 180,    // 20-200ms
    })
  }, 1500)
}

export function stopFeed(): void {
  if (feedInterval) {
    clearInterval(feedInterval)
    feedInterval = null
  }
  engine.emit(FeedStopped, undefined)
}

// ---------------------------------------------------------------------------
// Start the frame loop for tween updates
// ---------------------------------------------------------------------------

engine.startFrameLoop()

// ---------------------------------------------------------------------------
// Pulse Service
// ---------------------------------------------------------------------------

export const pulse = createPulseService(engine)
