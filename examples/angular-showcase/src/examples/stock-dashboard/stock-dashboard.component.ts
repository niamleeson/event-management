import { Component, type WritableSignal, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  ToggleFeed,
  DismissAlert,
  stocks,
  feedRunning,
  alerts,
  startFeed,
  stopFeed,
  type Stock,
} from './engine'

@Component({
  selector: 'app-stock-dashboard',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <div class="header">
        <h1 class="title">Stock Dashboard</h1>
        <div class="header-controls">
          <button class="feed-btn" [class.active]="running()" (click)="toggleFeed()">
            {{ running() ? 'Pause Feed' : 'Resume Feed' }}
          </button>
        </div>
      </div>

      @if (alertList().length > 0) {
        <div class="alert-bar">
          @for (alert of alertList(); track $index) {
            <div class="alert-item">
              {{ alert.message }}
              <button class="alert-dismiss" (click)="dismissAlert(alert.symbol)">x</button>
            </div>
          }
        </div>
      }

      <div class="stock-grid">
        @for (stock of stockList(); track stock.symbol) {
          <div class="stock-card" [class.alert]="stock.alert">
            <div class="stock-header">
              <span class="symbol" [style.color]="stock.color">{{ stock.symbol }}</span>
              <span class="name">{{ stock.name }}</span>
            </div>
            <div class="price-area">
              <span class="price">\${{ stock.price.toFixed(2) }}</span>
              <span class="change" [class.positive]="stock.change >= 0" [class.negative]="stock.change < 0">
                {{ stock.change >= 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}
                ({{ stock.change >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%)
              </span>
            </div>
            <div class="sparkline">
              <svg [attr.width]="200" [attr.height]="40" viewBox="0 0 200 40">
                @if (stock.history.length > 1) {
                  <polyline
                    [attr.points]="getSparklinePoints(stock)"
                    fill="none"
                    [attr.stroke]="stock.change >= 0 ? '#06d6a0' : '#ef476f'"
                    stroke-width="1.5"
                  />
                }
              </svg>
            </div>
            @if (stock.alert) {
              <div class="stock-alert">{{ stock.alert }}</div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #0f0f23;
      padding: 32px 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff;
    }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; max-width: 900px; margin-left: auto; margin-right: auto; }
    .title { font-size: 28px; font-weight: 800; }
    .feed-btn {
      padding: 8px 20px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      background: transparent;
      color: #fff;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .feed-btn.active { background: #06d6a0; border-color: #06d6a0; color: #0f0f23; }
    .alert-bar {
      max-width: 900px;
      margin: 0 auto 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .alert-item {
      background: rgba(239,71,111,0.15);
      border: 1px solid rgba(239,71,111,0.3);
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .alert-dismiss { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 14px; }
    .stock-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      max-width: 900px;
      margin: 0 auto;
    }
    .stock-card {
      background: #1a1a2e;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(255,255,255,0.06);
      transition: border-color 0.3s;
    }
    .stock-card.alert { border-color: rgba(239,71,111,0.4); }
    .stock-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
    .symbol { font-size: 18px; font-weight: 800; }
    .name { font-size: 12px; color: rgba(255,255,255,0.4); }
    .price-area { display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px; }
    .price { font-size: 24px; font-weight: 700; }
    .change { font-size: 13px; font-weight: 600; }
    .change.positive { color: #06d6a0; }
    .change.negative { color: #ef476f; }
    .sparkline { margin-top: 4px; }
    .stock-alert {
      margin-top: 8px;
      padding: 6px 10px;
      background: rgba(239,71,111,0.1);
      border-radius: 6px;
      font-size: 12px;
      color: #ef476f;
    }
  `],
})
export class StockDashboardComponent implements OnInit, OnDestroy {
  stockList: WritableSignal<Stock[]>
  running: WritableSignal<boolean>
  alertList: WritableSignal<{ symbol: string; message: string; ts: number }[]>

  constructor(private pulse: PulseService) {
    this.stockList = pulse.signal(stocks)
    this.running = pulse.signal(feedRunning)
    this.alertList = pulse.signal(alerts)
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
    startFeed()
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
    stopFeed()
  }

  toggleFeed(): void {
    this.pulse.emit(ToggleFeed, undefined)
  }

  dismissAlert(symbol: string): void {
    this.pulse.emit(DismissAlert, symbol)
  }

  getSparklinePoints(stock: Stock): string {
    const h = stock.history
    if (h.length < 2) return ''
    const min = Math.min(...h)
    const max = Math.max(...h)
    const range = max - min || 1
    return h.map((v, i) => {
      const x = (i / (h.length - 1)) * 200
      const y = 38 - ((v - min) / range) * 36
      return `${x},${y}`
    }).join(' ')
  }
}
