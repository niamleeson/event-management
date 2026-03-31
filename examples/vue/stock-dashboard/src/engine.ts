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
engine.on(PriceUpdate, (v: any) => { stocks = ((prev, { symbol, price }) => prev.map(s => {
    if (s.symbol !== symbol) return s
    const change = price - s.history[0]
    const changePercent = (change / s.history[0]) * 100
    const history = [...s.history, price].slice(-60)
    return { ...s, price, change, changePercent, history }
  }))(stocks, v); engine.emit(StocksChanged, stocks) })

export let selectedStock = 'AAPL'
export const SelectedStockChanged = engine.event('SelectedStockChanged')
engine.on(StockSelected, (v: any) => { selectedStock = ((_prev, sym) => sym)(selectedStock, v); engine.emit(SelectedStockChanged, selectedStock) })

let alertId = 0
export let alerts = [] as Alert[]
export const AlertsChanged = engine.event('AlertsChanged')
engine.on(AlertTriggered, (v: any) => { alerts = ((prev, alert) => [alert, ...prev].slice(0, 10))(alerts, v); engine.emit(AlertsChanged, alerts) })
engine.on(DismissAlert, (v: any) => { alerts = ((prev, id) => prev.filter(a => a.id !== id))(alerts, v); engine.emit(AlertsChanged, alerts) })

/* ------------------------------------------------------------------ */
/*  Alert on >5% change                                               */
/* ------------------------------------------------------------------ */

engine.on(PriceUpdate, (v: any) => { const _r = (({ symbol, price }) => {
  const stock = stocks.find(s => s.symbol === symbol)
  if (!stock || stock.history.length < 2) return null
  const basePrice = stock.history[0]
  const percentChange = Math.abs((price - basePrice) / basePrice * 100)
  if (percentChange <= 5) return null
  const direction = price > basePrice ? 'up' : 'down'
  return {
    id: alertId++,
    symbol,
    message: `${symbol} moved ${direction === 'up' ? '+' : ''}${percentChange.toFixed(1)}% since open`,
    time: Date.now(),
    type: direction,
  }
})(v); if (_r != null) engine.emit(AlertTriggered, _r) })

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
