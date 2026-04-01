// DAG
// PriceUpdate ──→ StocksChanged
//             └──→ AlertTriggered (conditional, >5% change)
// StockSelected ──→ SelectedStockChanged
// AlertTriggered ──→ AlertsChanged
// DismissAlert ──→ AlertsChanged

import { createEngine } from '@pulse/core'
export const engine = createEngine()

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  history: number[]
}

export interface Alert {
  id: number
  symbol: string
  message: string
  time: number
  type: 'up' | 'down'
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const PriceUpdate = engine.event<{ symbol: string; price: number }>('PriceUpdate')
export const StockSelected = engine.event<string>('StockSelected')
export const AlertTriggered = engine.event<Alert>('AlertTriggered')
export const DismissAlert = engine.event<number>('DismissAlert')

/* ------------------------------------------------------------------ */
/*  Initial stocks                                                    */
/* ------------------------------------------------------------------ */

const INITIAL_STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.50, change: 0, changePercent: 0, history: [178.50] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.20, change: 0, changePercent: 0, history: [141.20] },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.90, change: 0, changePercent: 0, history: [378.90] },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.60, change: 0, changePercent: 0, history: [185.60] },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.30, change: 0, changePercent: 0, history: [245.30] },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.40, change: 0, changePercent: 0, history: [875.40] },
  { symbol: 'META', name: 'Meta Platforms', price: 505.80, change: 0, changePercent: 0, history: [505.80] },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 628.90, change: 0, changePercent: 0, history: [628.90] },
]

/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */

export let stocks = INITIAL_STOCKS
export const StocksChanged = engine.event('StocksChanged')
engine.on(PriceUpdate, [StocksChanged], ({ symbol, price }, setStocks) => {
  stocks = stocks.map(s => {
    if (s.symbol !== symbol) return s
    const change = price - s.history[0]
    const changePercent = (change / s.history[0]) * 100
    const history = [...s.history, price].slice(-60)
    return { ...s, price, change, changePercent, history }
  })
  setStocks(stocks)
})

export let selectedStock = 'AAPL'
export const SelectedStockChanged = engine.event('SelectedStockChanged')
engine.on(StockSelected, [SelectedStockChanged], (sym, setSelected) => {
  selectedStock = sym
  setSelected(selectedStock)
})

let alertId = 0
export let alerts = [] as Alert[]
export const AlertsChanged = engine.event('AlertsChanged')
engine.on(AlertTriggered, [AlertsChanged], (alert, setAlerts) => {
  alerts = [alert, ...alerts].slice(0, 10)
  setAlerts(alerts)
})
engine.on(DismissAlert, [AlertsChanged], (id, setAlerts) => {
  alerts = alerts.filter(a => a.id !== id)
  setAlerts(alerts)
})

/* ------------------------------------------------------------------ */
/*  Alert on >5% change                                               */
/* ------------------------------------------------------------------ */

engine.on(PriceUpdate, [AlertTriggered], ({ symbol, price }, setAlert) => {
  const stock = stocks.find(s => s.symbol === symbol)
  if (!stock || stock.history.length < 2) return
  const basePrice = stock.history[0]
  const percentChange = Math.abs((price - basePrice) / basePrice * 100)
  if (percentChange <= 5) return
  const direction = price > basePrice ? 'up' : 'down'
  setAlert({
    id: alertId++,
    symbol,
    message: `${symbol} moved ${direction === 'up' ? '+' : ''}${percentChange.toFixed(1)}% since open`,
    time: Date.now(),
    type: direction,
  })
})

/* ------------------------------------------------------------------ */
/*  Price simulation (500ms updates)                                  */
/* ------------------------------------------------------------------ */

setInterval(() => {
  for (const stock of stocks) {
    const volatility = 0.003 + Math.random() * 0.007
    const direction = Math.random() > 0.48 ? 1 : -1
    const change = stock.price * volatility * direction
    const newPrice = Math.max(1, stock.price + change)
    engine.emit(PriceUpdate, { symbol: stock.symbol, price: Math.round(newPrice * 100) / 100 })
  }
}, 500)

export function startLoop() {}
export function stopLoop() {}
