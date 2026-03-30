import { Component, computed, type WritableSignal, OnDestroy } from '@angular/core'
import { PulseService } from '@pulse/angular'
import {
  ToggleStream,
  DismissAlert,
  cpuSig,
  memorySig,
  requestsSig,
  errorsSig,
  alertsSig,
  streamActiveSig,
  metricHistorySig,
  cpuTween,
  memoryTween,
  startMockStream,
  stopMockStream,
  type Alert,
  type MetricUpdate,
} from './engine'

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [PulseService],
  template: `
    <div class="container">
      <div class="header">
        <h1>Realtime Dashboard</h1>
        <button
          (click)="toggleStream()"
          [class.active]="streamActive()"
        >
          {{ streamActive() ? 'Stop Stream' : 'Start Stream' }}
        </button>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">CPU</div>
          <div class="metric-value" [class.danger]="cpu() > 85">{{ cpu().toFixed(1) }}%</div>
          <div class="bar">
            <div class="bar-fill cpu" [style.width.%]="cpuAnimated()"></div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Memory</div>
          <div class="metric-value" [class.danger]="memory() > 90">{{ memory().toFixed(1) }}%</div>
          <div class="bar">
            <div class="bar-fill memory" [style.width.%]="memoryAnimated()"></div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Requests/s</div>
          <div class="metric-value">{{ requests() }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Errors/s</div>
          <div class="metric-value" [class.danger]="errors() > 50">{{ errors() }}</div>
        </div>
      </div>

      @if (alerts().length > 0) {
        <div class="alerts">
          <h2>Alerts</h2>
          @for (alert of alerts(); track alert.id) {
            <div class="alert" [class]="'alert ' + alert.severity">
              <span class="alert-msg">{{ alert.message }}</span>
              <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
              <button class="dismiss" (click)="dismissAlert(alert.id)">x</button>
            </div>
          }
        </div>
      }

      <div class="history">
        <h2>Recent History ({{ history().length }} points)</h2>
        <div class="sparkline">
          @for (point of history(); track $index) {
            <div
              class="spark-bar"
              [style.height.%]="point.cpu"
              [title]="'CPU: ' + point.cpu.toFixed(0) + '%'"
            ></div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    h1 { font-size: 1.5rem; }
    h2 { font-size: 1rem; margin-bottom: 0.75rem; color: #888; }
    button {
      padding: 0.5rem 1.25rem;
      border: 2px solid #3498db;
      border-radius: 6px;
      background: transparent;
      color: #3498db;
      font-size: 0.9rem;
      cursor: pointer;
    }
    button.active {
      background: #e74c3c;
      border-color: #e74c3c;
      color: white;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .metric-card {
      background: #1a1a35;
      border-radius: 8px;
      padding: 1.25rem;
    }
    .metric-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #666;
      margin-bottom: 0.25rem;
    }
    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: #eee;
    }
    .metric-value.danger {
      color: #e74c3c;
    }
    .bar {
      height: 6px;
      background: #333;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: background 0.3s;
    }
    .bar-fill.cpu {
      background: #3498db;
    }
    .bar-fill.memory {
      background: #2ecc71;
    }
    .alerts {
      background: #1a1a35;
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
    }
    .alert.warning {
      background: rgba(243, 156, 18, 0.15);
      border-left: 3px solid #f39c12;
    }
    .alert.critical {
      background: rgba(231, 76, 60, 0.15);
      border-left: 3px solid #e74c3c;
    }
    .alert-msg { flex: 1; }
    .alert-time { color: #666; font-size: 0.75rem; white-space: nowrap; }
    .dismiss {
      border: none;
      background: transparent;
      color: #888;
      cursor: pointer;
      padding: 0;
      font-size: 0.9rem;
    }
    .history {
      background: #1a1a35;
      border-radius: 8px;
      padding: 1.25rem;
    }
    .sparkline {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 80px;
    }
    .spark-bar {
      flex: 1;
      background: #3498db;
      border-radius: 2px 2px 0 0;
      min-height: 2px;
      transition: height 0.3s;
    }
  `],
})
export class AppComponent implements OnDestroy {
  cpu: WritableSignal<number>
  memory: WritableSignal<number>
  requests: WritableSignal<number>
  errors: WritableSignal<number>
  alerts: WritableSignal<Alert[]>
  streamActive: WritableSignal<boolean>
  history: WritableSignal<MetricUpdate[]>
  cpuAnimated: WritableSignal<number>
  memoryAnimated: WritableSignal<number>

  constructor(private pulse: PulseService) {
    this.cpu = pulse.signal(cpuSig)
    this.memory = pulse.signal(memorySig)
    this.requests = pulse.signal(requestsSig)
    this.errors = pulse.signal(errorsSig)
    this.alerts = pulse.signal(alertsSig)
    this.streamActive = pulse.signal(streamActiveSig)
    this.history = pulse.signal(metricHistorySig)
    this.cpuAnimated = pulse.tween(cpuTween)
    this.memoryAnimated = pulse.tween(memoryTween)
  }

  ngOnDestroy(): void {
    stopMockStream()
  }

  toggleStream(): void {
    this.pulse.emit(ToggleStream, undefined)
    if (this.streamActive()) {
      // The signal just toggled, so if it is now true, start
      startMockStream()
    } else {
      stopMockStream()
    }
  }

  dismissAlert(id: number): void {
    this.pulse.emit(DismissAlert, id)
  }

  formatTime(ts: number): string {
    const d = new Date(ts)
    return d.toLocaleTimeString()
  }
}
