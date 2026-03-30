import { Component, computed, type WritableSignal, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  FeedToggled,
  AlertDismissed,
  currentMetrics,
  alerts,
  chartData,
  feedRunning,
  startFeed,
  stopFeed,
  METRICS,
  type Alert,
  type Metric,
  type ChartDataPoint,
} from './engine'

// ---------------------------------------------------------------------------
// Chart colors
// ---------------------------------------------------------------------------

const CHART_COLORS: Record<string, string> = {
  'CPU Usage': '#4361ee',
  'Memory': '#7209b7',
  'Latency': '#f59e0b',
  'Requests/s': '#10b981',
}

@Component({
  selector: 'app-realtime-dashboard',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="container">
      <style>
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      </style>

      <div class="header">
        <div>
          <h1 class="title">
            <span
              class="live-dot"
              [class.active]="running()"
            ></span>
            Realtime Dashboard
          </h1>
          <p class="subtitle">
            Mock WebSocket pushing metrics every second. All data flows through
            Pulse events.
          </p>
        </div>
        <button
          class="toggle-btn"
          [class.running]="running()"
          (click)="toggleFeed()"
        >
          {{ running() ? 'Pause Feed' : 'Resume Feed' }}
        </button>
      </div>

      <div class="metrics-grid">
        @for (m of metricConfigs; track m.name) {
          <div
            class="metric-card"
            [class.breached]="getMetricValue(m.name) > m.threshold"
          >
            <div class="metric-name">{{ m.name }}</div>
            <div>
              <span
                class="metric-value"
                [class.breached]="getMetricValue(m.name) > m.threshold"
              >{{ formatMetricValue(m.name) }}</span>
              <span class="metric-unit">{{ m.unit }}</span>
            </div>
            <div class="metric-threshold">Threshold: {{ m.threshold }}{{ m.unit }}</div>
          </div>
        }
      </div>

      <div class="charts-section">
        @for (m of metricConfigs; track m.name) {
          <div class="chart-card">
            <div class="chart-title">{{ m.name }}</div>
            <div class="chart-area">
              @if (getChartPoints(m.name).length === 0) {
                <div class="chart-empty">Waiting for data...</div>
              } @else {
                @for (point of getChartPoints(m.name); track $index) {
                  <div
                    class="chart-bar"
                    [style.height.%]="getBarHeight(point.value, m.name)"
                    [style.background]="point.value > m.threshold ? '#ef4444' : getChartColor(m.name)"
                    [style.opacity]="0.5 + ($index / getChartPoints(m.name).length) * 0.5"
                  ></div>
                }
              }
            </div>
          </div>
        }
      </div>

      <div class="alerts-section">
        <h2 class="alerts-title">Alerts ({{ alertList().length }})</h2>
        @if (alertList().length === 0) {
          <div class="empty-alerts">
            No active alerts. Alerts trigger after 3 consecutive threshold breaches.
          </div>
        } @else {
          @for (alert of alertList(); track alert.id) {
            <div class="alert-card">
              <span class="alert-message">{{ alert.message }}</span>
              <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
              <button class="dismiss-btn" (click)="dismissAlert(alert.id)">x</button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh;
      background: #0a0a1a;
      padding: 32px 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #e2e8f0;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1100px;
      margin: 0 auto 32px;
    }
    .title {
      font-size: 32px;
      font-weight: 800;
      color: #f1f5f9;
      margin: 0;
    }
    .subtitle {
      color: #64748b;
      font-size: 13px;
      margin-top: 2px;
    }
    .live-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #64748b;
      margin-right: 8px;
    }
    .live-dot.active {
      background: #10b981;
      animation: pulse 2s infinite;
    }
    .toggle-btn {
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      background: #10b981;
      color: #fff;
      transition: background 0.2s;
    }
    .toggle-btn.running {
      background: #ef4444;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      max-width: 1100px;
      margin: 0 auto 24px;
    }
    .metric-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 20px;
      transition: border-color 0.3s;
    }
    .metric-card.breached {
      border-color: #ef4444;
    }
    .metric-name {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 36px;
      font-weight: 800;
      color: #f1f5f9;
      font-variant-numeric: tabular-nums;
      transition: color 0.3s;
    }
    .metric-value.breached {
      color: #ef4444;
    }
    .metric-unit {
      font-size: 14px;
      color: #64748b;
      margin-left: 4px;
    }
    .metric-threshold {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
    }
    .charts-section {
      max-width: 1100px;
      margin: 0 auto 24px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .chart-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 20px;
      position: relative;
    }
    .chart-title {
      font-size: 14px;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 16px;
    }
    .chart-area {
      height: 120px;
      display: flex;
      align-items: flex-end;
      gap: 2px;
    }
    .chart-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #334155;
      font-size: 13px;
    }
    .chart-bar {
      flex: 1;
      border-radius: 3px 3px 0 0;
      min-width: 3px;
      transition: height 0.3s ease-out;
    }
    .alerts-section {
      max-width: 1100px;
      margin: 0 auto;
    }
    .alerts-title {
      font-size: 18px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 16px;
    }
    .alert-card {
      background: #1a0a0a;
      border: 1px solid #7f1d1d;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideIn 0.3s ease-out;
    }
    .alert-message {
      font-size: 14px;
      color: #fca5a5;
      flex: 1;
    }
    .alert-time {
      font-size: 12px;
      color: #7f1d1d;
      margin-left: 16px;
      flex-shrink: 0;
    }
    .dismiss-btn {
      font-size: 18px;
      color: #7f1d1d;
      background: none;
      border: none;
      cursor: pointer;
      margin-left: 12px;
      padding: 0 4px;
      transition: color 0.2s;
    }
    .dismiss-btn:hover {
      color: #fca5a5;
    }
    .empty-alerts {
      text-align: center;
      padding: 32px;
      color: #334155;
      font-size: 14px;
    }
  `],
})
export class RealtimeDashboardComponent implements OnInit, OnDestroy {
  metricConfigs = METRICS

  metricsMap: WritableSignal<Record<string, Metric>>
  alertList: WritableSignal<Alert[]>
  chartDataMap: WritableSignal<Record<string, ChartDataPoint[]>>
  running: WritableSignal<boolean>

  constructor(private pulse: PulseService) {
    this.metricsMap = pulse.signal(currentMetrics)
    this.alertList = pulse.signal(alerts)
    this.chartDataMap = pulse.signal(chartData)
    this.running = pulse.signal(feedRunning)
  }

  ngOnInit(): void {
    ;(window as any).__pulseEngine = engine
    startFeed()
  }

  ngOnDestroy(): void {
    ;(window as any).__pulseEngine = null
    stopFeed()
    engine.destroy()
  }

  getMetricValue(name: string): number {
    const metric = this.metricsMap()[name]
    return metric?.value ?? 0
  }

  formatMetricValue(name: string): string {
    const value = this.getMetricValue(name)
    if (name === 'Latency') return value.toFixed(0)
    return value.toFixed(1)
  }

  getChartPoints(name: string): ChartDataPoint[] {
    return this.chartDataMap()[name] ?? []
  }

  getBarHeight(value: number, name: string): number {
    const config = METRICS.find((m) => m.name === name)!
    const points = this.getChartPoints(name)
    const maxVal = Math.max(
      ...points.map((d) => d.value),
      config.threshold * 1.1,
    )
    return (value / maxVal) * 100
  }

  getChartColor(name: string): string {
    return CHART_COLORS[name] ?? '#4361ee'
  }

  toggleFeed(): void {
    this.pulse.emit(FeedToggled, !this.running())
  }

  dismissAlert(id: string): void {
    this.pulse.emit(AlertDismissed, id)
  }

  formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString()
  }
}
