import Component from '@glimmer/component'
import { action } from '@ember/object'
import { TrackedSignal, TrackedTween } from '@pulse/ember'
import {
  pulse,
  cpuValue,
  memoryValue,
  requestCount,
  errorRate,
  latencyValue,
  cpuHistory,
  memoryHistory,
  alerts,
  feedRunning,
  chartTween,
  startFeed,
  stopFeed,
  AlertDismissed,
  type MetricPoint,
  type Alert,
} from './engine'

// ---------------------------------------------------------------------------
// DashboardApp — root component
// ---------------------------------------------------------------------------

// Template: see components/app.hbs

export default class DashboardApp extends Component {
  cpu: TrackedSignal<number>
  memory: TrackedSignal<number>
  requests: TrackedSignal<number>
  errRate: TrackedSignal<number>
  latency: TrackedSignal<number>
  cpuHist: TrackedSignal<MetricPoint[]>
  memHist: TrackedSignal<MetricPoint[]>
  alertList: TrackedSignal<Alert[]>
  running: TrackedSignal<boolean>
  chart: TrackedTween

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args)
    this.cpu = pulse.createSignal(cpuValue)
    this.memory = pulse.createSignal(memoryValue)
    this.requests = pulse.createSignal(requestCount)
    this.errRate = pulse.createSignal(errorRate)
    this.latency = pulse.createSignal(latencyValue)
    this.cpuHist = pulse.createSignal(cpuHistory)
    this.memHist = pulse.createSignal(memoryHistory)
    this.alertList = pulse.createSignal(alerts)
    this.running = pulse.createSignal(feedRunning)
    this.chart = pulse.createTween(chartTween)
  }

  get cpuColor(): string {
    const v = this.cpu.value
    if (v > 85) return '#e63946'
    if (v > 60) return '#f4a261'
    return '#2a9d8f'
  }

  get memoryColor(): string {
    const v = this.memory.value
    if (v > 90) return '#e63946'
    if (v > 70) return '#f4a261'
    return '#2a9d8f'
  }

  get cpuBarWidth(): string {
    return `${Math.min(this.cpu.value, 100)}%`
  }

  get memoryBarWidth(): string {
    return `${Math.min(this.memory.value, 100)}%`
  }

  get formattedLatency(): string {
    return `${this.latency.value.toFixed(0)}ms`
  }

  get formattedErrorRate(): string {
    return `${this.errRate.value.toFixed(1)}%`
  }

  get hasAlerts(): boolean {
    return this.alertList.value.length > 0
  }

  // Simplified sparkline: convert history to a series of bar heights
  cpuSparklineBars(): { height: string; color: string }[] {
    return this.cpuHist.value.map((point) => ({
      height: `${point.value}%`,
      color: point.value > 85 ? '#e63946' : '#2a9d8f',
    }))
  }

  memorySparklineBars(): { height: string; color: string }[] {
    return this.memHist.value.map((point) => ({
      height: `${point.value}%`,
      color: point.value > 90 ? '#e63946' : '#4361ee',
    }))
  }

  @action
  toggleFeed(): void {
    if (this.running.value) {
      stopFeed()
    } else {
      startFeed()
    }
  }

  @action
  dismissAlert(alertId: string): void {
    pulse.emit(AlertDismissed, alertId)
  }

  willDestroy(): void {
    super.willDestroy()
    stopFeed()
    this.cpu.destroy()
    this.memory.destroy()
    this.requests.destroy()
    this.errRate.destroy()
    this.latency.destroy()
    this.cpuHist.destroy()
    this.memHist.destroy()
    this.alertList.destroy()
    this.running.destroy()
    this.chart.destroy()
  }
}
