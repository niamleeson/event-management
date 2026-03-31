import { Component, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, INITIAL_STOCKS, ToggleFeed, DismissAlert, StocksChanged, FeedRunningChanged, startFeed, stopFeed, type Stock } from './engine'
@Component({ selector: 'app-stock-dashboard', standalone: true, providers: [providePulse(engine), PulseService],
  template: `<div class="page"><div class="header"><h1 class="title">Stock Dashboard</h1><button class="toggle-btn" [class.running]="running()" (click)="toggle()">{{ running() ? 'Pause' : 'Resume' }}</button></div><div class="grid">@for (stock of stockList(); track stock.symbol) {<div class="stock-card" [style.border-left-color]="stock.color"><div class="sh"><span class="sym">{{ stock.symbol }}</span><span class="nm">{{ stock.name }}</span></div><div class="pr">${'$'}{{ stock.price.toFixed(2) }}</div><div class="ch" [class.up]="stock.change >= 0" [class.down]="stock.change < 0">{{ stock.change >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%</div><div class="sp">@for (h of stock.history; track $index; let i = $index) {<div class="sb" [style.height.%]="getSparkHeight(stock, h)" [style.background]="stock.color" [style.opacity]="0.3 + (i / stock.history.length) * 0.7"></div>}</div></div>}</div></div>`,
  styles: [`.page{min-height:100vh;background:#0a0a1a;padding:32px 24px;font-family:sans-serif;color:#e2e8f0}.header{display:flex;justify-content:space-between;align-items:center;max-width:1100px;margin:0 auto 24px}.title{font-size:28px;font-weight:800;color:#f1f5f9;margin:0}.toggle-btn{padding:8px 20px;border:none;border-radius:8px;font-weight:600;cursor:pointer;background:#10b981;color:#fff}.toggle-btn.running{background:#ef4444}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;max-width:1100px;margin:0 auto}.stock-card{background:#111827;border:1px solid #1e293b;border-left:4px solid;border-radius:12px;padding:16px}.sh{display:flex;justify-content:space-between;margin-bottom:8px}.sym{font-weight:800;font-size:16px;color:#f1f5f9}.nm{font-size:11px;color:#64748b}.pr{font-size:28px;font-weight:800;color:#f1f5f9}.ch{font-size:14px;font-weight:600;margin-top:4px}.ch.up{color:#10b981}.ch.down{color:#ef4444}.sp{display:flex;align-items:flex-end;gap:1px;height:40px;margin-top:12px}.sb{flex:1;min-width:2px;border-radius:1px}`],
})
export class StockDashboardComponent implements OnInit, OnDestroy {
  stockList = this.pulse.use(StocksChanged, INITIAL_STOCKS as Stock[])
  running = this.pulse.use(FeedRunningChanged, true)
  constructor(private pulse: PulseService) {}
  ngOnInit(): void { (window as any).__pulseEngine = engine; startFeed() }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; stopFeed(); engine.destroy() }
  toggle(): void { this.pulse.emit(ToggleFeed, undefined) }
  dismiss(symbol: string): void { this.pulse.emit(DismissAlert, symbol) }
  getSparkHeight(stock: Stock, value: number): number {
    if (stock.history.length < 2) return 50
    const min = Math.min(...stock.history), max = Math.max(...stock.history)
    return max === min ? 50 : ((value - min) / (max - min)) * 100
  }
}
