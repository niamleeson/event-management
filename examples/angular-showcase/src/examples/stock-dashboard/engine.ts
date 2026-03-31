import { createEngine } from '@pulse/core'

export const engine = createEngine()
export interface Stock { symbol: string; name: string; price: number; change: number; changePercent: number; color: string; history: number[]; alert?: string }

export const INITIAL_STOCKS: Stock[] = [
  { symbol: 'PLSE', name: 'Pulse Engine', price: 142.50, change: 0, changePercent: 0, color: '#4361ee', history: [] },
  { symbol: 'TWNN', name: 'Tween Corp', price: 89.20, change: 0, changePercent: 0, color: '#7209b7', history: [] },
  { symbol: 'SPRG', name: 'Spring Dynamics', price: 215.80, change: 0, changePercent: 0, color: '#f72585', history: [] },
  { symbol: 'EVNT', name: 'Event Systems', price: 56.40, change: 0, changePercent: 0, color: '#4cc9f0', history: [] },
  { symbol: 'SGNL', name: 'Signal Tech', price: 178.90, change: 0, changePercent: 0, color: '#2a9d8f', history: [] },
  { symbol: 'PIPE', name: 'Pipeline Inc', price: 324.60, change: 0, changePercent: 0, color: '#e76f51', history: [] },
  { symbol: 'ASNC', name: 'Async Holdings', price: 67.30, change: 0, changePercent: 0, color: '#06d6a0', history: [] },
  { symbol: 'FRAM', name: 'Framework Ltd', price: 198.70, change: 0, changePercent: 0, color: '#ffd166', history: [] },
]

export const PriceUpdate = engine.event<{ symbol: string; price: number }>('PriceUpdate')
export const DismissAlert = engine.event<string>('DismissAlert')
export const ToggleFeed = engine.event<void>('ToggleFeed')
export const StocksChanged = engine.event<Stock[]>('StocksChanged')
export const FeedRunningChanged = engine.event<boolean>('FeedRunningChanged')

let stocks = [...INITIAL_STOCKS]
let feedRunning = true

engine.on(PriceUpdate, (update) => {
  stocks = stocks.map((s) => {
    if (s.symbol !== update.symbol) return s
    const change = update.price - s.price
    const changePercent = (change / s.price) * 100
    const history = [...s.history, update.price].slice(-30)
    return { ...s, price: update.price, change, changePercent, history }
  })
  engine.emit(StocksChanged, stocks)
})
engine.on(DismissAlert, (sym) => { stocks = stocks.map((s) => s.symbol === sym ? { ...s, alert: undefined } : s); engine.emit(StocksChanged, stocks) })
engine.on(ToggleFeed, () => { feedRunning = !feedRunning; engine.emit(FeedRunningChanged, feedRunning) })

let feedInterval: ReturnType<typeof setInterval> | null = null
export function startFeed() {
  if (feedInterval) return
  feedInterval = setInterval(() => {
    if (!feedRunning) return
    for (const stock of stocks) {
      const v = stock.price * 0.008
      engine.emit(PriceUpdate, { symbol: stock.symbol, price: Math.round(Math.max(1, stock.price + (Math.random() - 0.48) * v) * 100) / 100 })
    }
  }, 500)
}
export function stopFeed() { if (feedInterval) { clearInterval(feedInterval); feedInterval = null } }
