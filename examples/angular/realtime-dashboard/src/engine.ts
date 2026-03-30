import { createEngine } from '@pulse/core'
import type { Engine, EventType, Signal, TweenValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricUpdate {
  cpu: number
  memory: number
  requests: number
  errors: number
}

export interface Alert {
  id: number
  message: string
  severity: 'warning' | 'critical'
  timestamp: number
}

// ---------------------------------------------------------------------------
// Engine + Events
// ---------------------------------------------------------------------------

export const engine: Engine = createEngine()

export const MetricReceived: EventType<MetricUpdate> = engine.event('MetricReceived')
export const CpuHigh: EventType<number> = engine.event('CpuHigh')
export const MemoryHigh: EventType<number> = engine.event('MemoryHigh')
export const ErrorSpike: EventType<number> = engine.event('ErrorSpike')
export const CriticalAlert: EventType<Alert> = engine.event('CriticalAlert')
export const DismissAlert: EventType<number> = engine.event('DismissAlert')
export const ToggleStream: EventType<void> = engine.event('ToggleStream')
export const AnimateMetric: EventType<void> = engine.event('AnimateMetric')

// ---------------------------------------------------------------------------
// Threshold detection pipes
// ---------------------------------------------------------------------------

engine.pipe(MetricReceived, CpuHigh, (m: MetricUpdate) => {
  return m.cpu > 85 ? m.cpu : null!
})

engine.pipe(MetricReceived, MemoryHigh, (m: MetricUpdate) => {
  return m.memory > 90 ? m.memory : null!
})

engine.pipe(MetricReceived, ErrorSpike, (m: MetricUpdate) => {
  return m.errors > 50 ? m.errors : null!
})

// ---------------------------------------------------------------------------
// Join: when CPU high AND memory high at the same time -> critical alert
// ---------------------------------------------------------------------------

let alertId = 0

engine.join([CpuHigh, MemoryHigh], CriticalAlert, {
  do: (cpu: number, memory: number) => ({
    id: ++alertId,
    message: `Critical: CPU at ${cpu.toFixed(0)}% AND Memory at ${memory.toFixed(0)}%`,
    severity: 'critical' as const,
    timestamp: Date.now(),
  }),
})

// ---------------------------------------------------------------------------
// Metric animation on each update
// ---------------------------------------------------------------------------

engine.pipe(MetricReceived, AnimateMetric, () => undefined)

// ---------------------------------------------------------------------------
// Tweens for animated metric bars
// ---------------------------------------------------------------------------

export const cpuTween: TweenValue = engine.tween({
  start: AnimateMetric,
  from: () => cpuTween.value,
  to: () => cpuSig.value,
  duration: 400,
  easing: 'easeOut',
})

export const memoryTween: TweenValue = engine.tween({
  start: AnimateMetric,
  from: () => memoryTween.value,
  to: () => memorySig.value,
  duration: 400,
  easing: 'easeOut',
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const cpuSig: Signal<number> = engine.signal<number>(
  MetricReceived,
  0,
  (_prev, m) => m.cpu,
)

export const memorySig: Signal<number> = engine.signal<number>(
  MetricReceived,
  0,
  (_prev, m) => m.memory,
)

export const requestsSig: Signal<number> = engine.signal<number>(
  MetricReceived,
  0,
  (_prev, m) => m.requests,
)

export const errorsSig: Signal<number> = engine.signal<number>(
  MetricReceived,
  0,
  (_prev, m) => m.errors,
)

export const alertsSig: Signal<Alert[]> = engine.signal<Alert[]>(
  CriticalAlert,
  [],
  (prev, alert) => [alert, ...prev].slice(0, 10),
)
engine.signalUpdate(alertsSig, DismissAlert, (prev, id) =>
  prev.filter((a) => a.id !== id),
)

// Also generate single-metric alerts
engine.on(CpuHigh, (cpu) => {
  const alert: Alert = {
    id: ++alertId,
    message: `Warning: CPU at ${cpu.toFixed(0)}%`,
    severity: 'warning',
    timestamp: Date.now(),
  }
  engine.emit(CriticalAlert, alert)
})

engine.on(ErrorSpike, (errors) => {
  const alert: Alert = {
    id: ++alertId,
    message: `Warning: Error rate spiked to ${errors}/s`,
    severity: 'warning',
    timestamp: Date.now(),
  }
  engine.emit(CriticalAlert, alert)
})

export const metricHistorySig: Signal<MetricUpdate[]> = engine.signal<MetricUpdate[]>(
  MetricReceived,
  [],
  (prev, m) => [...prev.slice(-29), m],
)

export const streamActiveSig: Signal<boolean> = engine.signal<boolean>(
  ToggleStream,
  false,
  (prev) => !prev,
)

// ---------------------------------------------------------------------------
// Mock WebSocket stream
// ---------------------------------------------------------------------------

let streamInterval: ReturnType<typeof setInterval> | null = null

export function startMockStream(): void {
  if (streamInterval) return
  streamInterval = setInterval(() => {
    const metric: MetricUpdate = {
      cpu: 40 + Math.random() * 55,
      memory: 50 + Math.random() * 45,
      requests: Math.floor(100 + Math.random() * 400),
      errors: Math.floor(Math.random() * 80),
    }
    engine.emit(MetricReceived, metric)
  }, 1000)
}

export function stopMockStream(): void {
  if (streamInterval) {
    clearInterval(streamInterval)
    streamInterval = null
  }
}

// Start frame loop for tweens
engine.startFrameLoop()
