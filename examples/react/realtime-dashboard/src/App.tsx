import { useEffect } from 'react'
import { useSignal, useEmit } from '@pulse/react'
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
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a1a',
    padding: '32px 24px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#e2e8f0',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1100,
    margin: '0 auto 32px',
  } as React.CSSProperties,
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: '#f1f5f9',
    margin: 0,
  } as React.CSSProperties,
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  } as React.CSSProperties,
  toggleBtn: (active: boolean) =>
    ({
      padding: '10px 24px',
      fontSize: 14,
      fontWeight: 600,
      border: 'none',
      borderRadius: 10,
      cursor: 'pointer',
      background: active ? '#ef4444' : '#10b981',
      color: '#fff',
      transition: 'background 0.2s',
    }) as React.CSSProperties,
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    maxWidth: 1100,
    margin: '0 auto 24px',
  } as React.CSSProperties,
  metricCard: (breached: boolean) =>
    ({
      background: '#111827',
      border: `1px solid ${breached ? '#ef4444' : '#1e293b'}`,
      borderRadius: 12,
      padding: 20,
      transition: 'border-color 0.3s',
    }) as React.CSSProperties,
  metricName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  } as React.CSSProperties,
  metricValue: (breached: boolean) =>
    ({
      fontSize: 36,
      fontWeight: 800,
      color: breached ? '#ef4444' : '#f1f5f9',
      fontVariantNumeric: 'tabular-nums',
      transition: 'color 0.3s',
    }) as React.CSSProperties,
  metricUnit: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  } as React.CSSProperties,
  metricThreshold: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  } as React.CSSProperties,
  chartsSection: {
    maxWidth: 1100,
    margin: '0 auto 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  } as React.CSSProperties,
  chartCard: {
    background: '#111827',
    border: '1px solid #1e293b',
    borderRadius: 12,
    padding: 20,
  } as React.CSSProperties,
  chartTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 16,
  } as React.CSSProperties,
  chartArea: {
    height: 120,
    display: 'flex',
    alignItems: 'flex-end',
    gap: 2,
  } as React.CSSProperties,
  alertsSection: {
    maxWidth: 1100,
    margin: '0 auto',
  } as React.CSSProperties,
  alertsSectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: 16,
  } as React.CSSProperties,
  alertCard: {
    background: '#1a0a0a',
    border: '1px solid #7f1d1d',
    borderRadius: 10,
    padding: '14px 18px',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    animation: 'slideIn 0.3s ease-out',
  } as React.CSSProperties,
  alertMessage: {
    fontSize: 14,
    color: '#fca5a5',
    flex: 1,
  } as React.CSSProperties,
  alertTime: {
    fontSize: 12,
    color: '#7f1d1d',
    marginLeft: 16,
    flexShrink: 0,
  } as React.CSSProperties,
  dismissBtn: {
    fontSize: 18,
    color: '#7f1d1d',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginLeft: 12,
    padding: '0 4px',
    transition: 'color 0.2s',
  } as React.CSSProperties,
  emptyAlerts: {
    textAlign: 'center' as const,
    padding: 32,
    color: '#334155',
    fontSize: 14,
  } as React.CSSProperties,
  liveIndicator: (active: boolean) =>
    ({
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: active ? '#10b981' : '#64748b',
      marginRight: 8,
      animation: active ? 'pulse 2s infinite' : 'none',
    }) as React.CSSProperties,
}

// ---------------------------------------------------------------------------
// Mini chart (bar chart)
// ---------------------------------------------------------------------------

function MiniChart({
  data,
  threshold,
  color,
}: {
  data: ChartDataPoint[]
  threshold: number
  color: string
}) {
  if (data.length === 0) {
    return (
      <div style={{ ...styles.chartArea, justifyContent: 'center', color: '#334155', fontSize: 13 }}>
        Waiting for data...
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d) => d.value), threshold * 1.1)

  return (
    <div style={styles.chartArea}>
      {data.map((point, i) => {
        const height = (point.value / maxVal) * 100
        const breached = point.value > threshold
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${height}%`,
              background: breached ? '#ef4444' : color,
              borderRadius: '3px 3px 0 0',
              minWidth: 3,
              opacity: 0.5 + (i / data.length) * 0.5,
              transition: 'height 0.3s ease-out',
            }}
          />
        )
      })}
      {/* Threshold line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `${(threshold / maxVal) * 100}%`,
          height: 1,
          background: '#ef4444',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({ name }: { name: string }) {
  const metrics = useSignal(currentMetrics)
  const config = METRICS.find((m) => m.name === name)!
  const metric = metrics[name]
  const value = metric?.value ?? 0
  const breached = value > config.threshold

  return (
    <div style={styles.metricCard(breached)}>
      <div style={styles.metricName}>{name}</div>
      <div>
        <span style={styles.metricValue(breached)}>
          {value.toFixed(name === 'Latency' ? 0 : 1)}
        </span>
        <span style={styles.metricUnit}>{config.unit}</span>
      </div>
      <div style={styles.metricThreshold}>
        Threshold: {config.threshold}
        {config.unit}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chart card
// ---------------------------------------------------------------------------

const CHART_COLORS: Record<string, string> = {
  'CPU Usage': '#4361ee',
  Memory: '#7209b7',
  Latency: '#f59e0b',
  'Requests/s': '#10b981',
}

function ChartCard({ name }: { name: string }) {
  const data = useSignal(chartData)
  const config = METRICS.find((m) => m.name === name)!
  const points = data[name] ?? []

  return (
    <div style={{ ...styles.chartCard, position: 'relative' }}>
      <div style={styles.chartTitle}>{name}</div>
      <MiniChart
        data={points}
        threshold={config.threshold}
        color={CHART_COLORS[name] ?? '#4361ee'}
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
    <div style={styles.alertsSection}>
      <h2 style={styles.alertsSectionTitle}>
        Alerts ({alertList.length})
      </h2>
      {alertList.length === 0 ? (
        <div style={styles.emptyAlerts}>
          No active alerts. Alerts trigger after 3 consecutive threshold breaches.
        </div>
      ) : (
        alertList.map((alert) => (
          <div key={alert.id} style={styles.alertCard}>
            <span style={styles.alertMessage}>{alert.message}</span>
            <span style={styles.alertTime}>
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
            <button
              style={styles.dismissBtn}
              onClick={() => emit(AlertDismissed, alert.id)}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fca5a5')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#7f1d1d')}
            >
              x
            </button>
          </div>
        ))
      )}
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
  useEffect(() => {
    startFeed()
    return () => stopFeed()
  }, [])

  return (
    <div style={styles.container}>
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

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <span style={styles.liveIndicator(running)} />
            Realtime Dashboard
          </h1>
          <p style={styles.subtitle}>
            Mock WebSocket pushing metrics every second. All data flows through
            Pulse events.
          </p>
        </div>
        <button
          style={styles.toggleBtn(running)}
          onClick={() => emit(FeedToggled, !running)}
        >
          {running ? 'Pause Feed' : 'Resume Feed'}
        </button>
      </div>

      <div style={styles.metricsGrid}>
        {METRICS.map((m) => (
          <MetricCard key={m.name} name={m.name} />
        ))}
      </div>

      <div style={styles.chartsSection}>
        {METRICS.map((m) => (
          <ChartCard key={m.name} name={m.name} />
        ))}
      </div>

      <AlertList />
    </div>
  )
}
