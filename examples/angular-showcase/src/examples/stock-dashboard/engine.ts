import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  color: string
  history: number[]
  alert?: string
}

export interface StockUpdate {
  symbol: string
  price: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const SPARKLINE_LENGTH = 30
const ALERT_THRESHOLD = 3 // alert if change > 3%

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const PriceUpdate = engine.event<StockUpdate>('PriceUpdate')
export const AlertTriggered = engine.event<{ symbol: string; message: string }>('AlertTriggered')
export const DismissAlert = engine.event<string>('DismissAlert')
export const ToggleFeed = engine.event<void>('ToggleFeed')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const stocks = engine.signal<Stock[]>(
  PriceUpdate,
  INITIAL_STOCKS,
  (prev, update) => prev.map((s) => {
    if (s.symbol !== update.symbol) return s
    const change = update.price - s.price
    const changePercent = (change / s.price) * 100
    const history = [...s.history, update.price].slice(-SPARKLINE_LENGTH)
    return { ...s, price: update.price, change, changePercent, history }
  }),
)

engine.signalUpdate(stocks, DismissAlert, (prev, symbol) =>
  prev.map((s) => (s.symbol === symbol ? { ...s, alert: undefined } : s)),
)

engine.signalUpdate(stocks, AlertTriggered, (prev, { symbol, message }) =>
  prev.map((s) => (s.symbol === symbol ? { ...s, alert: message } : s)),
)

export const feedRunning = engine.signal<boolean>(ToggleFeed, true, (prev) => !prev)

export const alerts = engine.signal<{ symbol: string; message: string; ts: number }[]>(
  AlertTriggered,
  [],
  (prev, alert) => [{ ...alert, ts: Date.now() }, ...prev].slice(0, 10),
)

// ---------------------------------------------------------------------------
// Alert logic: check for big moves
// ---------------------------------------------------------------------------

engine.on(PriceUpdate, (update) => {
  const stock = stocks.value.find((s) => s.symbol === update.symbol)
  if (!stock || stock.history.length < 2) return
  const prevPrice = stock.price
  const changePct = Math.abs((update.price - prevPrice) / prevPrice) * 100
  if (changePct > ALERT_THRESHOLD) {
    const direction = update.price > prevPrice ? 'surged' : 'dropped'
    engine.emit(AlertTriggered, {
      symbol: update.symbol,
      message: `${stock.name} ${direction} ${changePct.toFixed(1)}%`,
    })
  }
})

// ---------------------------------------------------------------------------
// Mock data feed: update every 500ms
// ---------------------------------------------------------------------------

let feedInterval: ReturnType<typeof setInterval> | null = null

export function startFeed() {
  if (feedInterval) return
  feedInterval = setInterval(() => {
    if (!feedRunning.value) return
    for (const stock of stocks.value) {
      const volatility = stock.price * 0.008
      const change = (Math.random() - 0.48) * volatility
      const newPrice = Math.max(1, stock.price + change)
      engine.emit(PriceUpdate, { symbol: stock.symbol, price: Math.round(newPrice * 100) / 100 })
    }
  }, 500)
}

export function stopFeed() {
  if (feedInterval) {
    clearInterval(feedInterval)
    feedInterval = null
  }
}

// Start frame loop
engine.startFrameLoop()
