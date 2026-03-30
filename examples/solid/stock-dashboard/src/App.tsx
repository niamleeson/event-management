import { For, Show, onMount, onCleanup } from 'solid-js'
import { useSignal, useEmit } from '@pulse/solid'
import type { Signal } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  history: number[]
  color: string
}

interface Alert {
  id: number
  symbol: string
  message: string
  type: 'up' | 'down'
  timestamp: number
}

/* ------------------------------------------------------------------ */
/*  Initial stocks                                                    */
/* ------------------------------------------------------------------ */

const INITIAL_STOCKS: StockData[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.50, change: 0, changePercent: 0, history: [], color: '#0984e3' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.20, change: 0, changePercent: 0, history: [], color: '#00b894' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.90, change: 0, changePercent: 0, history: [], color: '#6c5ce7' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: 0, changePercent: 0, history: [], color: '#e17055' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 238.45, change: 0, changePercent: 0, history: [], color: '#d63031' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30, change: 0, changePercent: 0, history: [], color: '#00cec9' },
  { symbol: 'META', name: 'Meta Platforms', price: 505.75, change: 0, changePercent: 0, history: [], color: '#a29bfe' },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 628.90, change: 0, changePercent: 0, history: [], color: '#fdcb6e' },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const PriceUpdate = engine.event<{ symbol: string; price: number }>('PriceUpdate')
const SelectStock = engine.event<string>('SelectStock')
const AlertTriggered = engine.event<Alert>('AlertTriggered')
const DismissAlert = engine.event<number>('DismissAlert')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const stocks = engine.signal<StockData[]>(
  PriceUpdate, INITIAL_STOCKS.map(s => ({ ...s, history: [s.price] })),
  (prev, { symbol, price }) => prev.map(s => {
    if (s.symbol !== symbol) return s
    const change = price - s.history[0]
    const changePercent = (change / s.history[0]) * 100
    const history = [...s.history.slice(-99), price]
    return { ...s, price, change, changePercent, history }
  }),
)

const selectedStock = engine.signal<string>(SelectStock, 'AAPL', (_prev, sym) => sym)

let alertId = 0
const alerts = engine.signal<Alert[]>(
  AlertTriggered, [],
  (prev, alert) => [alert, ...prev].slice(0, 10),
)
engine.signalUpdate(alerts, DismissAlert, (prev, id) => prev.filter(a => a.id !== id))

/* ------------------------------------------------------------------ */
/*  Price update simulation (500ms interval)                          */
/* ------------------------------------------------------------------ */

const PriceTick = engine.event('PriceTick')
let tickTimer: number

function startPriceFeed() {
  tickTimer = setInterval(() => {
    engine.emit(PriceTick, undefined)
  }, 500) as unknown as number
}

engine.on(PriceTick, () => {
  for (const stock of stocks.value) {
    const volatility = 0.002 + Math.random() * 0.008
    const direction = Math.random() > 0.48 ? 1 : -1
    const newPrice = Math.round((stock.price * (1 + direction * volatility)) * 100) / 100
    engine.emit(PriceUpdate, { symbol: stock.symbol, price: newPrice })
  }
})

// Alert logic: trigger when change > 5%
engine.on(PriceUpdate, ({ symbol, price }) => {
  const stock = stocks.value.find(s => s.symbol === symbol)
  if (!stock || stock.history.length < 2) return
  const pct = Math.abs((price - stock.history[0]) / stock.history[0]) * 100
  if (pct > 5) {
    engine.emit(AlertTriggered, {
      id: alertId++, symbol,
      message: `${symbol} ${price > stock.history[0] ? 'surged' : 'dropped'} ${pct.toFixed(1)}%`,
      type: price > stock.history[0] ? 'up' : 'down',
      timestamp: Date.now(),
    })
  }
})

/* ------------------------------------------------------------------ */
/*  Sparkline (canvas)                                                */
/* ------------------------------------------------------------------ */

function Sparkline(props: { data: number[]; color: string; width: number; height: number }) {
  let canvasRef!: HTMLCanvasElement

  onMount(() => {
    const draw = () => {
      const ctx = canvasRef.getContext('2d')!
      const w = props.width
      const h = props.height
      canvasRef.width = w
      canvasRef.height = h
      ctx.clearRect(0, 0, w, h)

      if (props.data.length < 2) return

      const min = Math.min(...props.data)
      const max = Math.max(...props.data)
      const range = max - min || 1

      ctx.beginPath()
      ctx.strokeStyle = props.color
      ctx.lineWidth = 1.5

      for (let i = 0; i < props.data.length; i++) {
        const x = (i / (props.data.length - 1)) * w
        const y = h - ((props.data[i] - min) / range) * (h - 4) - 2
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    const dispose = engine.on(engine.frame, draw)
    onCleanup(dispose)
  })

  return <canvas ref={canvasRef} style={{ width: `${props.width}px`, height: `${props.height}px` }} />
}

/* ------------------------------------------------------------------ */
/*  Main chart (canvas)                                               */
/* ------------------------------------------------------------------ */

function MainChart() {
  const sel = useSignal(selectedStock)
  const allStocks = useSignal(stocks)
  let canvasRef!: HTMLCanvasElement

  onMount(() => {
    const dispose = engine.on(engine.frame, () => {
      const stock = allStocks().find(s => s.symbol === sel())
      if (!stock || !canvasRef) return
      const ctx = canvasRef.getContext('2d')!
      const w = canvasRef.width = canvasRef.offsetWidth * 2
      const h = canvasRef.height = canvasRef.offsetHeight * 2
      ctx.scale(2, 2)
      const dw = canvasRef.offsetWidth
      const dh = canvasRef.offsetHeight

      ctx.clearRect(0, 0, dw, dh)

      // Grid
      ctx.strokeStyle = '#21262d'
      ctx.lineWidth = 0.5
      for (let i = 0; i < 5; i++) {
        const y = (i / 4) * dh
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dw, y); ctx.stroke()
      }

      if (stock.history.length < 2) return

      const min = Math.min(...stock.history) * 0.998
      const max = Math.max(...stock.history) * 1.002
      const range = max - min || 1

      // Fill area
      ctx.beginPath()
      for (let i = 0; i < stock.history.length; i++) {
        const x = (i / (stock.history.length - 1)) * dw
        const y = dh - ((stock.history[i] - min) / range) * (dh - 20) - 10
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.lineTo(dw, dh)
      ctx.lineTo(0, dh)
      ctx.closePath()
      const gradient = ctx.createLinearGradient(0, 0, 0, dh)
      gradient.addColorStop(0, stock.color + '33')
      gradient.addColorStop(1, stock.color + '05')
      ctx.fillStyle = gradient
      ctx.fill()

      // Line
      ctx.beginPath()
      ctx.strokeStyle = stock.color
      ctx.lineWidth = 2
      for (let i = 0; i < stock.history.length; i++) {
        const x = (i / (stock.history.length - 1)) * dw
        const y = dh - ((stock.history[i] - min) / range) * (dh - 20) - 10
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Price label
      ctx.fillStyle = stock.color
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(`$${stock.price.toFixed(2)}`, 8, 20)
    })
    onCleanup(dispose)
  })

  return <canvas ref={canvasRef} style={{ width: '100%', height: '200px' }} />
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const emit = useEmit()
  const allStocks = useSignal(stocks)
  const sel = useSignal(selectedStock)
  const allAlerts = useSignal(alerts)

  onMount(() => startPriceFeed())
  onCleanup(() => clearInterval(tickTimer))

  return (
    <div style={{ 'min-height': '100vh', padding: '24px', 'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <h1 style={{ 'font-size': '24px', 'font-weight': '700', 'margin-bottom': '24px' }}>Stock Dashboard</h1>

      {/* Main chart */}
      <div style={{ background: '#161b22', 'border-radius': '12px', 'margin-bottom': '24px', overflow: 'hidden', border: '1px solid #21262d' }}>
        <div style={{ padding: '16px 20px', 'border-bottom': '1px solid #21262d', display: 'flex', 'align-items': 'center', gap: '12px' }}>
          <span style={{ 'font-weight': '700', 'font-size': '18px', color: allStocks().find(s => s.symbol === sel())?.color }}>{sel()}</span>
          <span style={{ color: '#8b949e', 'font-size': '14px' }}>{allStocks().find(s => s.symbol === sel())?.name}</span>
        </div>
        <MainChart />
      </div>

      {/* Stock grid */}
      <div style={{ display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)', gap: '12px', 'margin-bottom': '24px' }}>
        <For each={allStocks()}>
          {(stock) => {
            const isUp = () => stock.change >= 0
            return (
              <div
                onClick={() => emit(SelectStock, stock.symbol)}
                style={{
                  background: sel() === stock.symbol ? '#161b22' : '#0d1117',
                  border: sel() === stock.symbol ? `1px solid ${stock.color}44` : '1px solid #21262d',
                  'border-radius': '10px', padding: '16px', cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '8px' }}>
                  <span style={{ 'font-weight': '700', color: stock.color }}>{stock.symbol}</span>
                  <span style={{ 'font-size': '12px', color: isUp() ? '#3fb950' : '#f85149', 'font-weight': '600' }}>
                    {isUp() ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div style={{ 'font-size': '20px', 'font-weight': '600', 'margin-bottom': '8px' }}>
                  ${stock.price.toFixed(2)}
                </div>
                <Sparkline data={stock.history} color={stock.color} width={160} height={32} />
              </div>
            )
          }}
        </For>
      </div>

      {/* Alerts */}
      <Show when={allAlerts().length > 0}>
        <div style={{ background: '#161b22', 'border-radius': '12px', border: '1px solid #21262d', padding: '16px' }}>
          <h3 style={{ 'font-size': '14px', 'font-weight': '600', color: '#8b949e', 'margin-bottom': '12px', 'text-transform': 'uppercase', 'letter-spacing': '0.5px' }}>
            Alerts (&gt;5% change)
          </h3>
          <For each={allAlerts()}>
            {(alert) => (
              <div style={{
                display: 'flex', 'align-items': 'center', gap: '12px', padding: '8px',
                'border-bottom': '1px solid #21262d', 'font-size': '13px',
              }}>
                <span style={{ color: alert.type === 'up' ? '#3fb950' : '#f85149' }}>
                  {alert.type === 'up' ? '\u25B2' : '\u25BC'}
                </span>
                <span style={{ flex: '1', color: '#c9d1d9' }}>{alert.message}</span>
                <span style={{ color: '#484f58', 'font-size': '11px' }}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => emit(DismissAlert, alert.id)}
                  style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', 'font-size': '14px' }}
                >\u2715</button>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
