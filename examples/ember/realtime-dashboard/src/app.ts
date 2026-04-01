import Component from '@glimmer/component'
import { action } from '@ember/object'
import { type PulseBinding } from '@pulse/ember'
import {
  pulse,
  startLoop,
  startFeed,
  stopFeed,
  AlertDismissed,
  FeedToggled,
  CurrentMetricsChanged,
  AlertsChanged,
  ChartDataChanged,
  FeedRunningChanged,
  type Metric,
  type Alert,
  type ChartDataPoint,
} from './engine'

// ---------------------------------------------------------------------------
// DashboardApp — root component
// ---------------------------------------------------------------------------

// Template: see components/app.hbs

export default class DashboardApp extends Component {
  metrics: PulseBinding<Record<string, Metric>>
  alertList: PulseBinding<Alert[]>
  chartData: PulseBinding<Record<string, ChartDataPoint[]>>
  running: PulseBinding<boolean>

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args)
    startLoop()
    this.metrics = pulse.bind(CurrentMetricsChanged, {})
    this.alertList = pulse.bind(AlertsChanged, [])
    this.chartData = pulse.bind(ChartDataChanged, {})
    this.running = pulse.bind(FeedRunningChanged, true)
  }

  get cpuValue(): number {
    return this.metrics.value['CPU Usage']?.value ?? 0
  }

  get memoryValue(): number {
    return this.metrics.value['Memory']?.value ?? 0
  }

  get latencyValue(): number {
    return this.metrics.value['Latency']?.value ?? 0
  }

  get requestsValue(): number {
    return this.metrics.value['Requests/s']?.value ?? 0
  }

  get cpuColor(): string {
    const v = this.cpuValue
    if (v > 85) return '#e63946'
    if (v > 60) return '#f4a261'
    return '#2a9d8f'
  }

  get memoryColor(): string {
    const v = this.memoryValue
    if (v > 90) return '#e63946'
    if (v > 70) return '#f4a261'
    return '#2a9d8f'
  }

  get cpuBarWidth(): string {
    return `${Math.min(this.cpuValue, 100)}%`
  }

  get memoryBarWidth(): string {
    return `${Math.min(this.memoryValue, 100)}%`
  }

  get formattedLatency(): string {
    return `${this.latencyValue.toFixed(0)}ms`
  }

  get hasAlerts(): boolean {
    return this.alertList.value.length > 0
  }

  // Simplified sparkline: convert history to a series of bar heights
  cpuSparklineBars(): { height: string; color: string }[] {
    const data = this.chartData.value['CPU Usage'] ?? []
    return data.map((point) => ({
      height: `${point.value}%`,
      color: point.value > 85 ? '#e63946' : '#2a9d8f',
    }))
  }

  memorySparklineBars(): { height: string; color: string }[] {
    const data = this.chartData.value['Memory'] ?? []
    return data.map((point) => ({
      height: `${point.value}%`,
      color: point.value > 90 ? '#e63946' : '#4361ee',
    }))
  }

  @action
  toggleFeed(): void {
    if (this.running.value) {
      stopFeed()
      pulse.emit(FeedToggled, false)
    } else {
      startFeed()
      pulse.emit(FeedToggled, true)
    }
  }

  @action
  dismissAlert(alertId: string): void {
    pulse.emit(AlertDismissed, alertId)
  }

  willDestroy(): void {
    super.willDestroy()
    stopFeed()
    this.metrics.destroy()
    this.alertList.destroy()
    this.chartData.destroy()
    this.running.destroy()
  }
}
