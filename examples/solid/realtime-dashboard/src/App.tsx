import { For, Show, createMemo, onMount, onCleanup } from 'solid-js'
import { useSignal, useEmit } from '@pulse/solid'
import {
  currentMetrics,
  alerts,
  chartData,
  feedRunning,
  FeedToggled,
  AlertDismissed,
  startFeed,
  stopFeed,
  METRICS,
  type Alert,
  type ChartDataPoint,
} from './engine'

// ---------------------------------------------------------------------------
// Chart Colors
// ---------------------------------------------------------------------------

const CHART_COLORS: Record<string, string> = {
  'CPU Usage': '#4361ee',
  Memory: '#7209b7',
  Latency: '#f59e0b',
  'Requests/s': '#10b981',
}

// ---------------------------------------------------------------------------
// Mini chart (bar chart)
// ---------------------------------------------------------------------------

function MiniChart(props: {
  data: ChartDataPoint[]
  threshold: number
  color: string
}) {
  return (
    <Show
      when={props.data.length > 0}
      fallback={
        <div
          style={{
            height: '120px',
            display: 'flex',
            'align-items': 'flex-end',
            gap: '2px',
            'justify-content': 'center',
            color: '#334155',
            'font-size': '13px',
          }}
        >
          Waiting for data...
        </div>
      }
    >
      <div
        style={{
          height: '120px',
          display: 'flex',
          'align-items': 'flex-end',
          gap: '2px',
          position: 'relative',
        }}
      >
        <For each={props.data}>
          {(point, i) => {
            const maxVal = createMemo(() =>
              Math.max(...props.data.map((d) => d.value), props.threshold * 1.1),
            )
            const height = createMemo(() => (point.value / maxVal()) * 100)
            const breached = createMemo(() => point.value > props.threshold)

            return (
              <div
                style={{
                  flex: '1',
                  height: `${height()}%`,
                  background: breached() ? '#ef4444' : props.color,
                  'border-radius': '3px 3px 0 0',
                  'min-width': '3px',
                  opacity: `${0.5 + (i() / props.data.length) * 0.5}`,
                  transition: 'height 0.3s ease-out',
                }}
              />
            )
          }}
        </For>
        {/* Threshold line */}
        {(() => {
          const maxVal = createMemo(() =>
            Math.max(...props.data.map((d) => d.value), props.threshold * 1.1),
          )
          return (
            <div
              style={{
                position: 'absolute',
                left: '0',
                right: '0',
                bottom: `${(props.threshold / maxVal()) * 100}%`,
                height: '1px',
                background: '#ef4444',
                opacity: '0.3',
                'pointer-events': 'none',
              }}
            />
          )
        })()}
      </div>
    </Show>
  )
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard(props: { name: string }) {
  const metrics = useSignal(currentMetrics)
  const config = METRICS.find((m) => m.name === props.name)!
  const value = createMemo(() => metrics()[props.name]?.value ?? 0)
  const breached = createMemo(() => value() > config.threshold)

  return (
    <div
      style={{
        background: '#111827',
        border: `1px solid ${breached() ? '#ef4444' : '#1e293b'}`,
        'border-radius': '12px',
        padding: '20px',
        transition: 'border-color 0.3s',
      }}
    >
      <div
        style={{
          'font-size': '13px',
          'font-weight': '600',
          color: '#64748b',
          'text-transform': 'uppercase',
          'letter-spacing': '0.5px',
          'margin-bottom': '8px',
        }}
      >
        {props.name}
      </div>
      <div>
        <span
          style={{
            'font-size': '36px',
            'font-weight': '800',
            color: breached() ? '#ef4444' : '#f1f5f9',
            'font-variant-numeric': 'tabular-nums',
            transition: 'color 0.3s',
          }}
        >
          {value().toFixed(props.name === 'Latency' ? 0 : 1)}
        </span>
        <span
          style={{
            'font-size': '14px',
            color: '#64748b',
            'margin-left': '4px',
          }}
        >
          {config.unit}
        </span>
      </div>
      <div
        style={{
          'font-size': '12px',
          color: '#475569',
          'margin-top': '4px',
        }}
      >
        Threshold: {config.threshold}
        {config.unit}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chart card
// ---------------------------------------------------------------------------

function ChartCard(props: { name: string }) {
  const data = useSignal(chartData)
  const config = METRICS.find((m) => m.name === props.name)!
  const points = createMemo(() => data()[props.name] ?? [])

  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid #1e293b',
        'border-radius': '12px',
        padding: '20px',
        position: 'relative',
      }}
    >
      <div
        style={{
          'font-size': '14px',
          'font-weight': '600',
          color: '#94a3b8',
          'margin-bottom': '16px',
        }}
      >
        {props.name}
      </div>
      <MiniChart
        data={points()}
        threshold={config.threshold}
        color={CHART_COLORS[props.name] ?? '#4361ee'}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Alert list
// ---------------------------------------------------------------------------

function AlertList() {
  const emit = useEmit()
  const alertList = useSignal(alerts)

  return (
    <div
      style={{
        'max-width': '1100px',
        margin: '0 auto',
      }}
    >
      <h2
        style={{
          'font-size': '18px',
          'font-weight': '700',
          color: '#f1f5f9',
          'margin-bottom': '16px',
        }}
      >
        Alerts ({alertList().length})
      </h2>
      <Show
        when={alertList().length > 0}
        fallback={
          <div
            style={{
              'text-align': 'center',
              padding: '32px',
              color: '#334155',
              'font-size': '14px',
            }}
          >
            No active alerts. Alerts trigger after 3 consecutive threshold breaches.
          </div>
        }
      >
        <For each={alertList()}>
          {(alert) => (
            <div
              style={{
                background: '#1a0a0a',
                border: '1px solid #7f1d1d',
                'border-radius': '10px',
                padding: '14px 18px',
                'margin-bottom': '8px',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                animation: 'slideIn 0.3s ease-out',
              }}
            >
              <span
                style={{
                  'font-size': '14px',
                  color: '#fca5a5',
                  flex: '1',
                }}
              >
                {alert.message}
              </span>
              <span
                style={{
                  'font-size': '12px',
                  color: '#7f1d1d',
                  'margin-left': '16px',
                  'flex-shrink': '0',
                }}
              >
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
              <button
                style={{
                  'font-size': '18px',
                  color: '#7f1d1d',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  'margin-left': '12px',
                  padding: '0 4px',
                  transition: 'color 0.2s',
                }}
                onClick={() => emit(AlertDismissed, alert.id)}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fca5a5')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#7f1d1d')}
              >
                x
              </button>
            </div>
          )}
        </For>
      </Show>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const running = useSignal(feedRunning)

  // Start/stop feed on mount/unmount
  onMount(() => {
    startFeed()
  })
  onCleanup(() => {
    stopFeed()
  })

  return (
    <div
      style={{
        'min-height': '100vh',
        background: '#0a0a1a',
        padding: '32px 24px',
        'font-family':
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#e2e8f0',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'max-width': '1100px',
          margin: '0 auto 32px',
        }}
      >
        <div>
          <h1
            style={{
              'font-size': '32px',
              'font-weight': '800',
              color: '#f1f5f9',
              margin: '0',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                'border-radius': '50%',
                background: running() ? '#10b981' : '#64748b',
                'margin-right': '8px',
                animation: running() ? 'pulse 2s infinite' : 'none',
              }}
            />
            Realtime Dashboard
          </h1>
          <p
            style={{
              color: '#64748b',
              'font-size': '13px',
              'margin-top': '2px',
            }}
          >
            Mock WebSocket pushing metrics every second. All data flows through
            Pulse events.
          </p>
        </div>
        <button
          style={{
            padding: '10px 24px',
            'font-size': '14px',
            'font-weight': '600',
            border: 'none',
            'border-radius': '10px',
            cursor: 'pointer',
            background: running() ? '#ef4444' : '#10b981',
            color: '#fff',
            transition: 'background 0.2s',
          }}
          onClick={() => emit(FeedToggled, !running())}
        >
          {running() ? 'Pause Feed' : 'Resume Feed'}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(4, 1fr)',
          gap: '16px',
          'max-width': '1100px',
          margin: '0 auto 24px',
        }}
      >
        <For each={METRICS}>
          {(m) => <MetricCard name={m.name} />}
        </For>
      </div>

      <div
        style={{
          'max-width': '1100px',
          margin: '0 auto 24px',
          display: 'grid',
          'grid-template-columns': 'repeat(2, 1fr)',
          gap: '16px',
        }}
      >
        <For each={METRICS}>
          {(m) => <ChartCard name={m.name} />}
        </For>
      </div>

      <AlertList />
    </div>
  )
}
