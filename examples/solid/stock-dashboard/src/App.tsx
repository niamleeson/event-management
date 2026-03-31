import { usePulse, useEmit } from '@pulse/solid'
import {
  SYMBOLS,
  PriceUpdate,
  AlertDismissed,
  WatchlistAdd,
  WatchlistRemove,
  TimeframeChanged,
  TickerPaused,
  TickerResumed,
  StockSelected,
} from './engine'
import type { StockState, Timeframe } from './engine'

// ---------------------------------------------------------------------------
// Sparkline SVG
// ---------------------------------------------------------------------------

function Sparkline({ data, width, height, color }: { data: number[]; width: number; height: number; color: string }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// AreaChart (larger chart for selected stock)
// ---------------------------------------------------------------------------

function AreaChart({ data, width, height, color }: { data: number[]; width: number; height: number; color: string }) {
  if (data.length < 2) return null
  const min = Math.min(...data) * 0.998
  const max = Math.max(...data) * 1.002
  const range = max - min || 1

  const linePoints = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 20) - 10
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = `0,${height} ${linePoints} ${width},${height}`

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#areaGrad)" />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Labels */}
      <text x={4} y={14} fontSize={11} fill="#64748b" fontFamily="monospace">
        ${max.toFixed(2)}
      </text>
      <text x={4} y={height - 4} fontSize={11} fill="#64748b" fontFamily="monospace">
        ${min.toFixed(2)}
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// StockRow
// ---------------------------------------------------------------------------

function StockRow({
  symbol,
  stock,
  isWatched,
  isSelected,
}: {
  symbol: string
  stock: StockState
  isWatched: boolean
  isSelected: boolean
}) {
  const emit = useEmit()
  const priceColor = stock.change >= 0 ? '#22c55e' : '#ef4444'
  const flashBg =
    stock.flashDirection === 'up'
      ? 'rgba(34, 197, 94, 0.12)'
      : stock.flashDirection === 'down'
        ? 'rgba(239, 68, 68, 0.12)'
        : 'transparent'

  return (
    <div
      onClick={() => emit(StockSelected, symbol)}
      style={{
        display: 'grid',
        'grid-template-columns': '80px 100px 80px 120px 40px',
        'align-items': 'center',
        padding: '10px 16px',
        background: isSelected
          ? 'rgba(59, 130, 246, 0.1)'
          : flashBg,
        'border-left': isSelected ? '2px solid #3b82f6' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.3s',
        'border-radius': 4,
      }}
    >
      <span style={{ 'font-weight': 700, color: '#e2e8f0', 'font-family': 'monospace', 'font-size': 14 }}>
        {symbol}
      </span>
      <span
        style={{
          'font-family': 'monospace',
          'font-size': 14,
          color: priceColor,
          'font-weight': 600,
          transition: 'color 0.3s',
        }}
      >
        ${stock.price.toFixed(2)}
      </span>
      <span
        style={{
          'font-family': 'monospace',
          'font-size': 12,
          color: priceColor,
        }}
      >
        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
      </span>
      <Sparkline data={stock.history} width={100} height={28} color={priceColor} />
      <button
        onClick={(e) => {
          e.stopPropagation()
          emit(isWatched ? WatchlistRemove : WatchlistAdd, symbol)
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          'font-size': 16,
          color: isWatched ? '#fbbf24' : '#475569',
          padding: 0,
        }}
      >
        {isWatched ? '\u2605' : '\u2606'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const priceData = usePulse(prices)
  const alertList = usePulse(alerts)
  const watched = usePulse(watchlist)
  const tf = usePulse(timeframe)
  const live = usePulse(isLive)
  const selected = usePulse(selectedStock)

  const selectedStockData = priceData.get(selected)
  const selectedColor =
    selectedStockData && selectedStockData.change >= 0 ? '#22c55e' : '#ef4444'

  const timeframes: Timeframe[] = ['1m', '5m', '1h', '1d']

  return (
    <div
      style={{
        'min-height': '100vh',
        background: '#0a0e17',
        'font-family':
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#e2e8f0',
        display: 'grid',
        'grid-template-columns': '1fr 280px',
        'grid-template-rows': 'auto 1fr',
      }}
    >
      {/* Header */}
      <div
        style={{
          'grid-column': '1 / -1',
          padding: '16px 24px',
          'border-bottom': '1px solid #1e293b',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'center', gap: 16 }}>
          <h1 style={{ 'font-size': 20, 'font-weight': 700, margin: 0 }}>
            Stock Dashboard
          </h1>
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: 6,
              'font-size': 12,
              color: live ? '#22c55e' : '#ef4444',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                'border-radius': '50%',
                background: live ? '#22c55e' : '#ef4444',
                animation: live ? 'pulse-dot 2s infinite' : 'none',
              }}
            />
            {live ? 'LIVE' : 'PAUSED'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Timeframe selector */}
          {timeframes.map((t) => (
            <button
              onClick={() => emit(TimeframeChanged, t)}
              style={{
                padding: '6px 12px',
                'border-radius': 6,
                border: tf === t ? '1px solid #3b82f6' : '1px solid #334155',
                background: tf === t ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: tf === t ? '#3b82f6' : '#64748b',
                'font-size': 12,
                'font-weight': 600,
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => emit(live ? TickerPaused : TickerResumed, undefined)}
            style={{
              padding: '6px 16px',
              'border-radius': 6,
              border: '1px solid #334155',
              background: live ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              color: live ? '#ef4444' : '#22c55e',
              'font-size': 12,
              'font-weight': 600,
              cursor: 'pointer',
              'margin-left': 8,
            }}
          >
            {live ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: 24, overflow: 'auto' }}>
        {/* Selected stock chart */}
        {selectedStockData && (
          <div
            style={{
              background: '#111827',
              'border-radius': 12,
              padding: 20,
              'margin-bottom': 24,
              border: '1px solid #1e293b',
            }}
          >
            <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': 16 }}>
              <div>
                <span style={{ 'font-size': 24, 'font-weight': 700, 'font-family': 'monospace' }}>
                  {selected}
                </span>
                <span
                  style={{
                    'font-size': 24,
                    'font-weight': 700,
                    'font-family': 'monospace',
                    color: selectedColor,
                    'margin-left': 16,
                  }}
                >
                  ${selectedStockData.price.toFixed(2)}
                </span>
                <span
                  style={{
                    'font-size': 14,
                    'font-family': 'monospace',
                    color: selectedColor,
                    'margin-left': 8,
                  }}
                >
                  {selectedStockData.change >= 0 ? '+' : ''}
                  {selectedStockData.change.toFixed(2)}%
                </span>
              </div>
            </div>
            <AreaChart
              data={selectedStockData.history}
              width={600}
              height={200}
              color={selectedColor!}
            />
          </div>
        )}

        {/* Stock list */}
        <div
          style={{
            background: '#111827',
            'border-radius': 12,
            border: '1px solid #1e293b',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              'grid-template-columns': '80px 100px 80px 120px 40px',
              padding: '10px 16px',
              'font-size': 11,
              color: '#475569',
              'font-weight': 600,
              'text-transform': 'uppercase',
              'letter-spacing': 1,
              'border-bottom': '1px solid #1e293b',
            }}
          >
            <span>Symbol</span>
            <span>Price</span>
            <span>Change</span>
            <span>Trend</span>
            <span>Watch</span>
          </div>
          {SYMBOLS.map((sym) => {
            const stock = priceData.get(sym)
            if (!stock) return null
            return (
              <StockRow
                symbol={sym}
                stock={stock}
                isWatched={watched.includes(sym)}
                isSelected={sym === selected}
              />
            )
          })}
        </div>
      </div>

      {/* Sidebar: Watchlist + Alerts */}
      <div
        style={{
          'border-left': '1px solid #1e293b',
          padding: 20,
          overflow: 'auto',
          display: 'flex',
          'flex-direction': 'column',
          gap: 24,
        }}
      >
        {/* Watchlist */}
        <div>
          <h2 style={{ 'font-size': 14, 'font-weight': 700, color: '#94a3b8', 'margin-bottom': 12, 'text-transform': 'uppercase', 'letter-spacing': 1 }}>
            Watchlist
          </h2>
          {watched.length === 0 && (
            <p style={{ 'font-size': 13, color: '#475569' }}>No stocks watched</p>
          )}
          {watched.map((sym) => {
            const stock = priceData.get(sym)
            if (!stock) return null
            const color = stock.change >= 0 ? '#22c55e' : '#ef4444'
            return (
              <div
                onClick={() => emit(StockSelected, sym)}
                style={{
                  display: 'flex',
                  'justify-content': 'space-between',
                  'align-items': 'center',
                  padding: '8px 12px',
                  'border-radius': 8,
                  cursor: 'pointer',
                  background: sym === selected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  'margin-bottom': 4,
                }}
              >
                <span style={{ 'font-family': 'monospace', 'font-weight': 600, 'font-size': 13 }}>{sym}</span>
                <span style={{ 'font-family': 'monospace', 'font-size': 13, color }}>
                  ${stock.price.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Alerts */}
        <div>
          <h2 style={{ 'font-size': 14, 'font-weight': 700, color: '#94a3b8', 'margin-bottom': 12, 'text-transform': 'uppercase', 'letter-spacing': 1 }}>
            Alerts {alertList.length > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  'border-radius': 10,
                  padding: '2px 8px',
                  'font-size': 11,
                  'margin-left': 6,
                  'font-weight': 600,
                }}
              >
                {alertList.length}
              </span>
            )}
          </h2>
          {alertList.length === 0 && (
            <p style={{ 'font-size': 13, color: '#475569' }}>No alerts</p>
          )}
          {alertList.slice(0, 10).map((alert) => (
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.08)',
                'border-radius': 8,
                'margin-bottom': 6,
                border: '1px solid rgba(239, 68, 68, 0.2)',
                'font-size': 12,
                color: '#f87171',
                display: 'flex',
                'justify-content': 'space-between',
                'align-items': 'center',
              }}
            >
              <span>{alert.message}</span>
              <button
                onClick={() => emit(AlertDismissed, alert.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  'font-size': 14,
                  padding: '0 4px',
                }}
              >
                \u2715
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Inject animation keyframes */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
