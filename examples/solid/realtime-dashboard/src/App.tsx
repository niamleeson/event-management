import { onMount } from 'solid-js'
import { usePulse, useEmit } from '@pulse/solid'
import {
  CurrentMetricsChanged,
  AlertsChanged,
  ChartDataChanged,
  FeedRunningChanged,
  FeedToggled,
  AlertDismissed,
  startFeed,
  stopFeed,
  METRICS,
  type Alert,
  type Metric,
  type ChartDataPoint,
} from './engine'

// ---------------------------------------------------------------------------
// Styles (unchanged from original)
// ---------------------------------------------------------------------------

const styles = {
  container: {
    'min-height': '100vh',
    background: '#0a0a1a',
    padding: '32px 24px',
    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#e2e8f0',
  },
  header: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    'max-width': 1100,
    margin: '0 auto 32px',
  },
  title: { 'font-size': 32, 'font-weight': 800, color: '#f1f5f9', margin: 0 },
  subtitle: { color: '#64748b', 'font-size': 13, 'margin-top': 2 },
  toggleBtn: (active: boolean) => ({
    padding: '10px 24px', 'font-size': 14, 'font-weight': 600, border: 'none', 'border-radius': 10,
    cursor: 'pointer', background: active ? '#ef4444' : '#10b981', color: '#fff', transition: 'background 0.2s',
  }),
  metricsGrid: { display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)', gap: 16, 'max-width': 1100, margin: '0 auto 24px' },
  metricCard: (breached: boolean) => ({
    background: '#111827', border: `1px solid ${breached ? '#ef4444' : '#1e293b'}`, 'border-radius': 12, padding: 20, transition: 'border-color 0.3s',
  }),
  metricName: { 'font-size': 13, 'font-weight': 600, color: '#64748b', 'text-transform': 'uppercase' as const, 'letter-spacing': 0.5, 'margin-bottom': 8 },
  metricValue: (breached: boolean) => ({
    'font-size': 36, 'font-weight': 800, color: breached ? '#ef4444' : '#f1f5f9', 'font-variant-numeric': 'tabular-nums', transition: 'color 0.3s',
  }),
  metricUnit: { 'font-size': 14, color: '#64748b', 'margin-left': 4 },
  metricThreshold: { 'font-size': 12, color: '#475569', 'margin-top': 4 },
  chartsSection: { 'max-width': 1100, margin: '0 auto 24px', display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: 16 },
  chartCard: { background: '#111827', border: '1px solid #1e293b', 'border-radius': 12, padding: 20 },
  chartTitle: { 'font-size': 14, 'font-weight': 600, color: '#94a3b8', 'margin-bottom': 16 },
  chartArea: { height: 120, display: 'flex', 'align-items': 'flex-end', gap: 2 },
  alertsSection: { 'max-width': 1100, margin: '0 auto' },
  alertsSectionTitle: { 'font-size': 18, 'font-weight': 700, color: '#f1f5f9', 'margin-bottom': 16 },
  alertCard: {
    background: '#1a0a0a', border: '1px solid #7f1d1d', 'border-radius': 10, padding: '14px 18px', 'margin-bottom': 8,
    display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', animation: 'slideIn 0.3s ease-out',
  },
  alertMessage: { 'font-size': 14, color: '#fca5a5', flex: 1 },
  alertTime: { 'font-size': 12, color: '#7f1d1d', 'margin-left': 16, 'flex-shrink': 0 },
  dismissBtn: { 'font-size': 18, color: '#7f1d1d', background: 'none', border: 'none', cursor: 'pointer', 'margin-left': 12, padding: '0 4px', transition: 'color 0.2s' },
  emptyAlerts: { 'text-align': 'center' as const, padding: 32, color: '#334155', 'font-size': 14 },
  liveIndicator: (active: boolean) => ({
    display: 'inline-block', width: 8, height: 8, 'border-radius': '50%',
    background: active ? '#10b981' : '#64748b', 'margin-right': 8, animation: active ? 'pulse 2s infinite' : 'none',
  }),
}

// ---------------------------------------------------------------------------
// Mini chart
// ---------------------------------------------------------------------------

function MiniChart({ data, threshold, color }: { data: ChartDataPoint[]; threshold: number; color: string }) {
  if (data().length === 0) {
    return <div style={{ ...styles.chartArea, 'justify-content': 'center', color: '#334155', 'font-size': 13 }}>Waiting for data()...</div>
  }
  const maxVal = Math.max(...data.map((d) => d.value), threshold * 1.1)
  return (
    <div style={styles.chartArea}>
      {data().map((point, i) => {
        const height = (point.value / maxVal) * 100
        const breached = point.value > threshold
        return (
          <div style={{
            flex: 1, height: `${height}%`, background: breached ? '#ef4444' : color,
            'border-radius': '3px 3px 0 0', 'min-width': 3, opacity: 0.5 + (i / data().length) * 0.5, transition: 'height 0.3s ease-out',
          }} />
        )
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${(threshold / maxVal) * 100}%`, height: 1, background: '#ef4444', opacity: 0.3, 'pointer-events': 'none' }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({ name }: { name: string }) {
  const metrics = usePulse(CurrentMetricsChanged, {} as Record<string, Metric>)
  const config = METRICS.find((m) => m.name === name)!
  const metric = metrics()[name]
  const value = metric?.value ?? 0
  const breached = value > config.threshold

  return (
    <div style={styles.metricCard(breached)}>
      <div style={styles.metricName}>{name}</div>
      <div>
        <span style={styles.metricValue(breached)}>{value.toFixed(name === 'Latency' ? 0 : 1)}</span>
        <span style={styles.metricUnit}>{config.unit}</span>
      </div>
      <div style={styles.metricThreshold}>Threshold: {config.threshold}{config.unit}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chart card
// ---------------------------------------------------------------------------

const CHART_COLORS: Record<string, string> = {
  'CPU Usage': '#4361ee', Memory: '#7209b7', Latency: '#f59e0b', 'Requests/s': '#10b981',
}

function ChartCard({ name }: { name: string }) {
  const data = usePulse(ChartDataChanged, Object.fromEntries(METRICS.map((m) => [m.name, []])) as Record<string, ChartDataPoint[]>)
  const config = METRICS.find((m) => m.name === name)!
  const points = data()[name] ?? []

  return (
    <div style={{ ...styles.chartCard, position: 'relative' }}>
      <div style={styles.chartTitle}>{name}</div>
      <MiniChart data={points} threshold={config.threshold} color={CHART_COLORS[name] ?? '#4361ee'} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Alert list
// ---------------------------------------------------------------------------

function AlertList() {
  const emit = useEmit()
  const alertList = usePulse(AlertsChanged, [] as Alert[])

  return (
    <div style={styles.alertsSection}>
      <h2 style={styles.alertsSectionTitle}>Alerts ({alertList().length})</h2>
      {alertList().length === 0 ? (
        <div style={styles.emptyAlerts}>No active alerts. Alerts trigger after 3 consecutive threshold breaches.</div>
      ) : (
        alertList().map((alert) => (
          <div style={styles.alertCard}>
            <span style={styles.alertMessage}>{alert.message}</span>
            <span style={styles.alertTime}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
            <button style={styles.dismissBtn} onClick={() => emit(AlertDismissed, alert.id)}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fca5a5')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#7f1d1d')}>x</button>
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
  const running = usePulse(FeedRunningChanged, true)

  onMount(() => {
    startFeed()
    return () => stopFeed()
  })

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}><span style={styles.liveIndicator(running())} />Realtime Dashboard</h1>
          <p style={styles.subtitle}>Mock WebSocket pushing metrics every second. All data flows through Pulse events.</p>
        </div>
        <button style={styles.toggleBtn(running())} onClick={() => emit(FeedToggled, !running())}>
          {running() ? 'Pause Feed' : 'Resume Feed'}
        </button>
      </div>

      <div style={styles.metricsGrid}>{METRICS.map((m) => <MetricCard name={m.name} />)}</div>
      <div style={styles.chartsSection}>{METRICS.map((m) => <ChartCard name={m.name} />)}</div>
      <AlertList />
    </div>
  )
}
