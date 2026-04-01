import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// PriceUpdate ──→ FlashClear (via setTimeout)
//
// AlertTriggered ──→ (appends to alerts signal)
// AlertDismissed ──→ (removes from alerts signal)
// FlashClear     ──→ (clears flash on stock)

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Timeframe = '1m' | '5m' | '1h' | '1d'

export interface PriceData {
  symbol: string
  price: number
  change: number
}

export interface StockState {
  price: number
  change: number
  history: number[]
  prevPrice: number
  flashDirection: 'up' | 'down' | null
  flashTime: number
}

export interface AlertData {
  id: string
  symbol: string
  message: string
  timestamp: number
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const PriceUpdate = engine.event<PriceData>('PriceUpdate')
export const AlertTriggered = engine.event<{ symbol: string; message: string }>('AlertTriggered')
export const AlertDismissed = engine.event<string>('AlertDismissed')
export const WatchlistAdd = engine.event<string>('WatchlistAdd')
export const WatchlistRemove = engine.event<string>('WatchlistRemove')
export const TimeframeChanged = engine.event<Timeframe>('TimeframeChanged')
export const TickerPaused = engine.event<void>('TickerPaused')
export const TickerResumed = engine.event<void>('TickerResumed')
export const StockSelected = engine.event<string>('StockSelected')

// Internal
const FlashClear = engine.event<string>('FlashClear')

// State change events
export const AlertsChanged = engine.event<AlertData[]>('AlertsChanged')
export const WatchlistChanged = engine.event<string[]>('WatchlistChanged')
export const IsLiveChanged = engine.event<boolean>('IsLiveChanged')
export const SelectedStockChanged = engine.event<string>('SelectedStockChanged')

// ---------------------------------------------------------------------------
// Stock symbols
// ---------------------------------------------------------------------------

export const SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX']

const BASE_PRICES: Record<string, number> = {
  AAPL: 178.50,
  GOOGL: 141.20,
  MSFT: 378.90,
  AMZN: 178.30,
  TSLA: 248.40,
  NVDA: 495.20,
  META: 355.70,
  NFLX: 485.60,
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

function initPrices(): Map<string, StockState> {
  const m = new Map<string, StockState>()
  for (const sym of SYMBOLS) {
    const base = BASE_PRICES[sym]
    m.set(sym, {
      price: base,
      change: 0,
      history: Array.from({ length: 30 }, () => base + (Math.random() - 0.5) * 5),
      prevPrice: base,
      flashDirection: null,
      flashTime: 0,
    })
  }
  return m
}


// ---------------------------------------------------------------------------
// Pipe: PriceUpdate -> conditional AlertTriggered
// ---------------------------------------------------------------------------

let alertCounter = 0


// ---------------------------------------------------------------------------
// Price update handler
// ---------------------------------------------------------------------------

engine.on(PriceUpdate, (data) => {
  const current = new Map(prices.value)
  const stock = current.get(data.symbol)
  if (!stock) return

  const newHistory = [...stock.history.slice(-29), data.price]
  const direction: 'up' | 'down' = data.price >= stock.price ? 'up' : 'down'

  current.set(data.symbol, {
    price: data.price,
    change: data.change,
    history: newHistory,
    prevPrice: stock.price,
    flashDirection: direction,
    flashTime: Date.now(),
  })
  prices.set(current)

  // Clear flash after 800ms
  setTimeout(() => engine.emit(FlashClear, data.symbol), 800)
})

engine.on(FlashClear, (symbol) => {
  const current = new Map(prices.value)
  const stock = current.get(symbol)
  if (!stock) return
  current.set(symbol, { ...stock, flashDirection: null })
  prices.set(current)
})

// ---------------------------------------------------------------------------
// Alert handlers
// ---------------------------------------------------------------------------

engine.on(AlertTriggered, ({ symbol, message }) => {
  const id = `alert-${++alertCounter}`
  const alert: AlertData = { id, symbol, message, timestamp: Date.now() }
  alerts.set([alert, ...alerts.value].slice(0, 20))
})

engine.on(AlertDismissed, (id) => {
  alerts.set(alerts.value.filter((a) => a.id !== id))
})

// ---------------------------------------------------------------------------
// Simulated WebSocket: price updates every 500ms
// ---------------------------------------------------------------------------

let tickerInterval: ReturnType<typeof setInterval> | null = null

function startTicker() {
  if (tickerInterval) return
  tickerInterval = setInterval(() => {
    if (!isLive.value) return
    for (const sym of SYMBOLS) {
      const stock = prices.value.get(sym)
      if (!stock) continue
      // Random walk
      const volatility = sym === 'TSLA' ? 0.03 : sym === 'NVDA' ? 0.025 : 0.015
      const change = (Math.random() - 0.5) * 2 * volatility
      const newPrice = Math.max(1, stock.price * (1 + change))
      const pctChange = ((newPrice - stock.price) / stock.price) * 100
      engine.emit(PriceUpdate, {
        symbol: sym,
        price: parseFloat(newPrice.toFixed(2)),
        change: parseFloat(pctChange.toFixed(2)),
      })
    }
  }, 500)
}

startTicker()

// ---------------------------------------------------------------------------
// Start/stop frame loop
// ---------------------------------------------------------------------------

export function startLoop() {}
export function stopLoop() {}
