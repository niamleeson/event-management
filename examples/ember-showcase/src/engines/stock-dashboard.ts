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
  history: number[]
  color: string
  alertThreshold: number | null
}

export interface StockAlert {
  id: string
  symbol: string
  price: number
  threshold: number
  timestamp: number
  type: 'above' | 'below'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const INITIAL_STOCKS: Stock[] = [
  { symbol: 'PLSE', name: 'Pulse Engine', price: 142.50, change: 0, changePercent: 0, history: [], color: '#4361ee', alertThreshold: 150 },
  { symbol: 'EVNT', name: 'EventFlow', price: 89.20, change: 0, changePercent: 0, history: [], color: '#7209b7', alertThreshold: null },
  { symbol: 'SGNL', name: 'SignalTech', price: 234.80, change: 0, changePercent: 0, history: [], color: '#f72585', alertThreshold: 240 },
  { symbol: 'SPRG', name: 'SpringMotion', price: 56.30, change: 0, changePercent: 0, history: [], color: '#4cc9f0', alertThreshold: null },
  { symbol: 'TWEN', name: 'TweenLabs', price: 178.90, change: 0, changePercent: 0, history: [], color: '#2a9d8f', alertThreshold: 180 },
  { symbol: 'DAGX', name: 'DAG Exchange', price: 312.40, change: 0, changePercent: 0, history: [], color: '#e76f51', alertThreshold: null },
  { symbol: 'ASYN', name: 'AsyncCorp', price: 67.80, change: 0, changePercent: 0, history: [], color: '#f4a261', alertThreshold: 70 },
  { symbol: 'RULE', name: 'RuleEngine', price: 445.60, change: 0, changePercent: 0, history: [], color: '#264653', alertThreshold: 450 },
]

const SPARKLINE_LENGTH = 30

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const PriceUpdated = engine.event<{ symbol: string; price: number }>('PriceUpdated')
export const AlertTriggered = engine.event<StockAlert>('AlertTriggered')
export const DismissAlert = engine.event<string>('DismissAlert')
export const SetAlertThreshold = engine.event<{ symbol: string; threshold: number | null }>('SetAlertThreshold')
export const ToggleFeed = engine.event<void>('ToggleFeed')
export const SelectStock = engine.event<string | null>('SelectStock')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const stocks = engine.signal<Stock[]>(
  PriceUpdated, INITIAL_STOCKS.map((s) => ({ ...s, history: [s.price] })),
  (prev, { symbol, price }) => prev.map((s) => {
    if (s.symbol !== symbol) return s
    const change = price - s.price
    const changePercent = (change / s.price) * 100
    const history = [...s.history, price].slice(-SPARKLINE_LENGTH)
    return { ...s, price, change, changePercent, history }
  }),
)

engine.signalUpdate(stocks, SetAlertThreshold, (prev, { symbol, threshold }) =>
  prev.map((s) => s.symbol === symbol ? { ...s, alertThreshold: threshold } : s),
)

export const alerts = engine.signal<StockAlert[]>(
  AlertTriggered, [], (prev, alert) => [alert, ...prev].slice(0, 20),
)
engine.signalUpdate(alerts, DismissAlert, (prev, id) => prev.filter((a) => a.id !== id))

export const feedRunning = engine.signal<boolean>(
  ToggleFeed, true, (prev) => !prev,
)

export const selectedStock = engine.signal<string | null>(
  SelectStock, null, (_prev, sym) => sym,
)

// ---------------------------------------------------------------------------
// Threshold alert logic
// ---------------------------------------------------------------------------

engine.on(PriceUpdated, ({ symbol, price }) => {
  const stock = stocks.value.find((s) => s.symbol === symbol)
  if (!stock || stock.alertThreshold === null) return

  const prevPrice = stock.price
  if (prevPrice <= stock.alertThreshold && price > stock.alertThreshold) {
    engine.emit(AlertTriggered, {
      id: `alert-${Date.now()}-${symbol}`,
      symbol,
      price,
      threshold: stock.alertThreshold,
      timestamp: Date.now(),
      type: 'above',
    })
  } else if (prevPrice >= stock.alertThreshold && price < stock.alertThreshold) {
    engine.emit(AlertTriggered, {
      id: `alert-${Date.now()}-${symbol}`,
      symbol,
      price,
      threshold: stock.alertThreshold,
      timestamp: Date.now(),
      type: 'below',
    })
  }
})

// ---------------------------------------------------------------------------
// Market data feed
// ---------------------------------------------------------------------------

let feedInterval: ReturnType<typeof setInterval> | null = null

export function startFeed() {
  if (feedInterval) return
  feedInterval = setInterval(() => {
    if (!feedRunning.value) return
    for (const stock of stocks.value) {
      const volatility = stock.price * 0.008
      const change = (Math.random() - 0.5) * 2 * volatility
      const newPrice = Math.max(1, stock.price + change)
      engine.emit(PriceUpdated, { symbol: stock.symbol, price: parseFloat(newPrice.toFixed(2)) })
    }
  }, 1000)
}

export function stopFeed() {
  if (feedInterval) {
    clearInterval(feedInterval)
    feedInterval = null
  }
}
