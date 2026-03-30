import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useSignal, useEmit } from '@pulse/react';
import { currentMetrics, alerts, chartData, feedRunning, FeedToggled, AlertDismissed, startFeed, stopFeed, METRICS, } from './engine';
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
    container: {
        minHeight: '100vh',
        background: '#0a0a1a',
        padding: '32px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#e2e8f0',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1100,
        margin: '0 auto 32px',
    },
    title: {
        fontSize: 32,
        fontWeight: 800,
        color: '#f1f5f9',
        margin: 0,
    },
    subtitle: {
        color: '#64748b',
        fontSize: 13,
        marginTop: 2,
    },
    toggleBtn: (active) => ({
        padding: '10px 24px',
        fontSize: 14,
        fontWeight: 600,
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        background: active ? '#ef4444' : '#10b981',
        color: '#fff',
        transition: 'background 0.2s',
    }),
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        maxWidth: 1100,
        margin: '0 auto 24px',
    },
    metricCard: (breached) => ({
        background: '#111827',
        border: `1px solid ${breached ? '#ef4444' : '#1e293b'}`,
        borderRadius: 12,
        padding: 20,
        transition: 'border-color 0.3s',
    }),
    metricName: {
        fontSize: 13,
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    metricValue: (breached) => ({
        fontSize: 36,
        fontWeight: 800,
        color: breached ? '#ef4444' : '#f1f5f9',
        fontVariantNumeric: 'tabular-nums',
        transition: 'color 0.3s',
    }),
    metricUnit: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 4,
    },
    metricThreshold: {
        fontSize: 12,
        color: '#475569',
        marginTop: 4,
    },
    chartsSection: {
        maxWidth: 1100,
        margin: '0 auto 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
    },
    chartCard: {
        background: '#111827',
        border: '1px solid #1e293b',
        borderRadius: 12,
        padding: 20,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#94a3b8',
        marginBottom: 16,
    },
    chartArea: {
        height: 120,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
    },
    alertsSection: {
        maxWidth: 1100,
        margin: '0 auto',
    },
    alertsSectionTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: '#f1f5f9',
        marginBottom: 16,
    },
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
    },
    alertMessage: {
        fontSize: 14,
        color: '#fca5a5',
        flex: 1,
    },
    alertTime: {
        fontSize: 12,
        color: '#7f1d1d',
        marginLeft: 16,
        flexShrink: 0,
    },
    dismissBtn: {
        fontSize: 18,
        color: '#7f1d1d',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        marginLeft: 12,
        padding: '0 4px',
        transition: 'color 0.2s',
    },
    emptyAlerts: {
        textAlign: 'center',
        padding: 32,
        color: '#334155',
        fontSize: 14,
    },
    liveIndicator: (active) => ({
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: active ? '#10b981' : '#64748b',
        marginRight: 8,
        animation: active ? 'pulse 2s infinite' : 'none',
    }),
};
// ---------------------------------------------------------------------------
// Mini chart (bar chart)
// ---------------------------------------------------------------------------
function MiniChart({ data, threshold, color, }) {
    if (data.length === 0) {
        return (_jsx("div", { style: { ...styles.chartArea, justifyContent: 'center', color: '#334155', fontSize: 13 }, children: "Waiting for data..." }));
    }
    const maxVal = Math.max(...data.map((d) => d.value), threshold * 1.1);
    return (_jsxs("div", { style: styles.chartArea, children: [data.map((point, i) => {
                const height = (point.value / maxVal) * 100;
                const breached = point.value > threshold;
                return (_jsx("div", { style: {
                        flex: 1,
                        height: `${height}%`,
                        background: breached ? '#ef4444' : color,
                        borderRadius: '3px 3px 0 0',
                        minWidth: 3,
                        opacity: 0.5 + (i / data.length) * 0.5,
                        transition: 'height 0.3s ease-out',
                    } }, i));
            }), _jsx("div", { style: {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: `${(threshold / maxVal) * 100}%`,
                    height: 1,
                    background: '#ef4444',
                    opacity: 0.3,
                    pointerEvents: 'none',
                } })] }));
}
// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------
function MetricCard({ name }) {
    const metrics = useSignal(currentMetrics);
    const config = METRICS.find((m) => m.name === name);
    const metric = metrics[name];
    const value = metric?.value ?? 0;
    const breached = value > config.threshold;
    return (_jsxs("div", { style: styles.metricCard(breached), children: [_jsx("div", { style: styles.metricName, children: name }), _jsxs("div", { children: [_jsx("span", { style: styles.metricValue(breached), children: value.toFixed(name === 'Latency' ? 0 : 1) }), _jsx("span", { style: styles.metricUnit, children: config.unit })] }), _jsxs("div", { style: styles.metricThreshold, children: ["Threshold: ", config.threshold, config.unit] })] }));
}
// ---------------------------------------------------------------------------
// Chart card
// ---------------------------------------------------------------------------
const CHART_COLORS = {
    'CPU Usage': '#4361ee',
    Memory: '#7209b7',
    Latency: '#f59e0b',
    'Requests/s': '#10b981',
};
function ChartCard({ name }) {
    const data = useSignal(chartData);
    const config = METRICS.find((m) => m.name === name);
    const points = data[name] ?? [];
    return (_jsxs("div", { style: { ...styles.chartCard, position: 'relative' }, children: [_jsx("div", { style: styles.chartTitle, children: name }), _jsx(MiniChart, { data: points, threshold: config.threshold, color: CHART_COLORS[name] ?? '#4361ee' })] }));
}
// ---------------------------------------------------------------------------
// Alert list
// ---------------------------------------------------------------------------
function AlertList() {
    const emit = useEmit();
    const alertList = useSignal(alerts);
    return (_jsxs("div", { style: styles.alertsSection, children: [_jsxs("h2", { style: styles.alertsSectionTitle, children: ["Alerts (", alertList.length, ")"] }), alertList.length === 0 ? (_jsx("div", { style: styles.emptyAlerts, children: "No active alerts. Alerts trigger after 3 consecutive threshold breaches." })) : (alertList.map((alert) => (_jsxs("div", { style: styles.alertCard, children: [_jsx("span", { style: styles.alertMessage, children: alert.message }), _jsx("span", { style: styles.alertTime, children: new Date(alert.timestamp).toLocaleTimeString() }), _jsx("button", { style: styles.dismissBtn, onClick: () => emit(AlertDismissed, alert.id), onMouseEnter: (e) => (e.currentTarget.style.color = '#fca5a5'), onMouseLeave: (e) => (e.currentTarget.style.color = '#7f1d1d'), children: "x" })] }, alert.id))))] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const emit = useEmit();
    const running = useSignal(feedRunning);
    // Start/stop feed on mount/unmount
    useEffect(() => {
        startFeed();
        return () => stopFeed();
    }, []);
    return (_jsxs("div", { style: styles.container, children: [_jsx("style", { children: `
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      ` }), _jsxs("div", { style: styles.header, children: [_jsxs("div", { children: [_jsxs("h1", { style: styles.title, children: [_jsx("span", { style: styles.liveIndicator(running) }), "Realtime Dashboard"] }), _jsx("p", { style: styles.subtitle, children: "Mock WebSocket pushing metrics every second. All data flows through Pulse events." })] }), _jsx("button", { style: styles.toggleBtn(running), onClick: () => emit(FeedToggled, !running), children: running ? 'Pause Feed' : 'Resume Feed' })] }), _jsx("div", { style: styles.metricsGrid, children: METRICS.map((m) => (_jsx(MetricCard, { name: m.name }, m.name))) }), _jsx("div", { style: styles.chartsSection, children: METRICS.map((m) => (_jsx(ChartCard, { name: m.name }, m.name))) }), _jsx(AlertList, {})] }));
}
