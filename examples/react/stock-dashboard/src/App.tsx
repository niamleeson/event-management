import { usePulse, useEmit } from '@pulse/react'
import { useCallback } from 'react'
import {
  PricesChanged,
  AlertsChanged,
  WatchlistChanged,
  TimeframeStateChanged,
  IsLiveChanged,
  SelectedStockChanged,
  SYMBOLS,
  AlertDismissed,
  WatchlistAdd,
  WatchlistRemove,
  TimeframeChanged,
  TickerPaused,
  TickerResumed,
  StockSelected,
} from './engine'
import type { StockState, Timeframe, AlertData } from './engine'

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
        gridTemplateColumns: '80px 100px 80px 120px 40px',
        alignItems: 'center',
        padding: '10px 16px',
        background: isSelected
          ? 'rgba(59, 130, 246, 0.1)'
          : flashBg,
        borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.3s',
        borderRadius: 4,
      }}
    >
      <span style={{ fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace', fontSize: 14 }}>
        {symbol}
      </span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 14,
          color: priceColor,
          fontWeight: 600,
          transition: 'color 0.3s',
        }}
      >
        ${stock.price.toFixed(2)}
      </span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 12,
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
          fontSize: 16,
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
  const priceData = usePulse(PricesChanged, new Map<string, StockState>())
  const alertList = usePulse(AlertsChanged, [] as AlertData[])
  const watched = usePulse(WatchlistChanged, ['AAPL', 'GOOGL', 'NVDA', 'TSLA'])
  const tf = usePulse(TimeframeStateChanged, '1m' as Timeframe)
  const live = usePulse(IsLiveChanged, true)
  const selected = usePulse(SelectedStockChanged, 'AAPL')

  const selectedStockData = priceData.get(selected)
  const selectedColor =
    selectedStockData && selectedStockData.change >= 0 ? '#22c55e' : '#ef4444'

  const timeframes: Timeframe[] = ['1m', '5m', '1h', '1d']

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0e17',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#e2e8f0',
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gridTemplateRows: 'auto 1fr',
      }}
    >
      {/* Header */}
      <div
        style={{
          gridColumn: '1 / -1',
          padding: '16px 24px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            Stock Dashboard
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: live ? '#22c55e' : '#ef4444',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
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
              key={t}
              onClick={() => emit(TimeframeChanged, t)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: tf === t ? '1px solid #3b82f6' : '1px solid #334155',
                background: tf === t ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: tf === t ? '#3b82f6' : '#64748b',
                fontSize: 12,
                fontWeight: 600,
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
              borderRadius: 6,
              border: '1px solid #334155',
              background: live ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              color: live ? '#ef4444' : '#22c55e',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: 8,
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
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
              border: '1px solid #1e293b',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }}>
                  {selected}
                </span>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: selectedColor,
                    marginLeft: 16,
                  }}
                >
                  ${selectedStockData.price.toFixed(2)}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontFamily: 'monospace',
                    color: selectedColor,
                    marginLeft: 8,
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
            borderRadius: 12,
            border: '1px solid #1e293b',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 100px 80px 120px 40px',
              padding: '10px 16px',
              fontSize: 11,
              color: '#475569',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              borderBottom: '1px solid #1e293b',
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
                key={sym}
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
          borderLeft: '1px solid #1e293b',
          padding: 20,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Watchlist */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Watchlist
          </h2>
          {watched.length === 0 && (
            <p style={{ fontSize: 13, color: '#475569' }}>No stocks watched</p>
          )}
          {watched.map((sym) => {
            const stock = priceData.get(sym)
            if (!stock) return null
            const color = stock.change >= 0 ? '#22c55e' : '#ef4444'
            return (
              <div
                key={sym}
                onClick={() => emit(StockSelected, sym)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: sym === selected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}>{sym}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, color }}>
                  ${stock.price.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Alerts */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Alerts {alertList.length > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '2px 8px',
                  fontSize: 11,
                  marginLeft: 6,
                  fontWeight: 600,
                }}
              >
                {alertList.length}
              </span>
            )}
          </h2>
          {alertList.length === 0 && (
            <p style={{ fontSize: 13, color: '#475569' }}>No alerts</p>
          )}
          {alertList.slice(0, 10).map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.08)',
                borderRadius: 8,
                marginBottom: 6,
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: 12,
                color: '#f87171',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
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
                  fontSize: 14,
                  padding: '0 4px',
                }}
              >
                {'\u2715'}
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
