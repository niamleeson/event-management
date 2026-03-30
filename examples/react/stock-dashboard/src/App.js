import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSignal, useEmit } from '@pulse/react';
import { prices, alerts, watchlist, timeframe, isLive, selectedStock, SYMBOLS, AlertDismissed, WatchlistAdd, WatchlistRemove, TimeframeChanged, TickerPaused, TickerResumed, StockSelected, } from './engine';
// ---------------------------------------------------------------------------
// Sparkline SVG
// ---------------------------------------------------------------------------
function Sparkline({ data, width, height, color }) {
    if (data.length < 2)
        return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data
        .map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    })
        .join(' ');
    return (_jsx("svg", { width: width, height: height, style: { display: 'block' }, children: _jsx("polyline", { points: points, fill: "none", stroke: color, strokeWidth: 1.5, strokeLinejoin: "round" }) }));
}
// ---------------------------------------------------------------------------
// AreaChart (larger chart for selected stock)
// ---------------------------------------------------------------------------
function AreaChart({ data, width, height, color }) {
    if (data.length < 2)
        return null;
    const min = Math.min(...data) * 0.998;
    const max = Math.max(...data) * 1.002;
    const range = max - min || 1;
    const linePoints = data
        .map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 20) - 10;
        return `${x},${y}`;
    })
        .join(' ');
    const areaPoints = `0,${height} ${linePoints} ${width},${height}`;
    return (_jsxs("svg", { width: width, height: height, style: { display: 'block' }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "areaGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: color, stopOpacity: 0.3 }), _jsx("stop", { offset: "100%", stopColor: color, stopOpacity: 0.02 })] }) }), _jsx("polygon", { points: areaPoints, fill: "url(#areaGrad)" }), _jsx("polyline", { points: linePoints, fill: "none", stroke: color, strokeWidth: 2, strokeLinejoin: "round" }), _jsxs("text", { x: 4, y: 14, fontSize: 11, fill: "#64748b", fontFamily: "monospace", children: ["$", max.toFixed(2)] }), _jsxs("text", { x: 4, y: height - 4, fontSize: 11, fill: "#64748b", fontFamily: "monospace", children: ["$", min.toFixed(2)] })] }));
}
// ---------------------------------------------------------------------------
// StockRow
// ---------------------------------------------------------------------------
function StockRow({ symbol, stock, isWatched, isSelected, }) {
    const emit = useEmit();
    const priceColor = stock.change >= 0 ? '#22c55e' : '#ef4444';
    const flashBg = stock.flashDirection === 'up'
        ? 'rgba(34, 197, 94, 0.12)'
        : stock.flashDirection === 'down'
            ? 'rgba(239, 68, 68, 0.12)'
            : 'transparent';
    return (_jsxs("div", { onClick: () => emit(StockSelected, symbol), style: {
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
        }, children: [_jsx("span", { style: { fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace', fontSize: 14 }, children: symbol }), _jsxs("span", { style: {
                    fontFamily: 'monospace',
                    fontSize: 14,
                    color: priceColor,
                    fontWeight: 600,
                    transition: 'color 0.3s',
                }, children: ["$", stock.price.toFixed(2)] }), _jsxs("span", { style: {
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: priceColor,
                }, children: [stock.change >= 0 ? '+' : '', stock.change.toFixed(2), "%"] }), _jsx(Sparkline, { data: stock.history, width: 100, height: 28, color: priceColor }), _jsx("button", { onClick: (e) => {
                    e.stopPropagation();
                    emit(isWatched ? WatchlistRemove : WatchlistAdd, symbol);
                }, style: {
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: isWatched ? '#fbbf24' : '#475569',
                    padding: 0,
                }, children: isWatched ? '\u2605' : '\u2606' })] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const emit = useEmit();
    const priceData = useSignal(prices);
    const alertList = useSignal(alerts);
    const watched = useSignal(watchlist);
    const tf = useSignal(timeframe);
    const live = useSignal(isLive);
    const selected = useSignal(selectedStock);
    const selectedStockData = priceData.get(selected);
    const selectedColor = selectedStockData && selectedStockData.change >= 0 ? '#22c55e' : '#ef4444';
    const timeframes = ['1m', '5m', '1h', '1d'];
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            background: '#0a0e17',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#e2e8f0',
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gridTemplateRows: 'auto 1fr',
        }, children: [_jsxs("div", { style: {
                    gridColumn: '1 / -1',
                    padding: '16px 24px',
                    borderBottom: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 16 }, children: [_jsx("h1", { style: { fontSize: 20, fontWeight: 700, margin: 0 }, children: "Stock Dashboard" }), _jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 12,
                                    color: live ? '#22c55e' : '#ef4444',
                                }, children: [_jsx("span", { style: {
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: live ? '#22c55e' : '#ef4444',
                                            animation: live ? 'pulse-dot 2s infinite' : 'none',
                                        } }), live ? 'LIVE' : 'PAUSED'] })] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [timeframes.map((t) => (_jsx("button", { onClick: () => emit(TimeframeChanged, t), style: {
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    border: tf === t ? '1px solid #3b82f6' : '1px solid #334155',
                                    background: tf === t ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    color: tf === t ? '#3b82f6' : '#64748b',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }, children: t }, t))), _jsx("button", { onClick: () => emit(live ? TickerPaused : TickerResumed, undefined), style: {
                                    padding: '6px 16px',
                                    borderRadius: 6,
                                    border: '1px solid #334155',
                                    background: live ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                    color: live ? '#ef4444' : '#22c55e',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    marginLeft: 8,
                                }, children: live ? 'Pause' : 'Resume' })] })] }), _jsxs("div", { style: { padding: 24, overflow: 'auto' }, children: [selectedStockData && (_jsxs("div", { style: {
                            background: '#111827',
                            borderRadius: 12,
                            padding: 20,
                            marginBottom: 24,
                            border: '1px solid #1e293b',
                        }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 16 }, children: _jsxs("div", { children: [_jsx("span", { style: { fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }, children: selected }), _jsxs("span", { style: {
                                                fontSize: 24,
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                color: selectedColor,
                                                marginLeft: 16,
                                            }, children: ["$", selectedStockData.price.toFixed(2)] }), _jsxs("span", { style: {
                                                fontSize: 14,
                                                fontFamily: 'monospace',
                                                color: selectedColor,
                                                marginLeft: 8,
                                            }, children: [selectedStockData.change >= 0 ? '+' : '', selectedStockData.change.toFixed(2), "%"] })] }) }), _jsx(AreaChart, { data: selectedStockData.history, width: 600, height: 200, color: selectedColor })] })), _jsxs("div", { style: {
                            background: '#111827',
                            borderRadius: 12,
                            border: '1px solid #1e293b',
                            overflow: 'hidden',
                        }, children: [_jsxs("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: '80px 100px 80px 120px 40px',
                                    padding: '10px 16px',
                                    fontSize: 11,
                                    color: '#475569',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    borderBottom: '1px solid #1e293b',
                                }, children: [_jsx("span", { children: "Symbol" }), _jsx("span", { children: "Price" }), _jsx("span", { children: "Change" }), _jsx("span", { children: "Trend" }), _jsx("span", { children: "Watch" })] }), SYMBOLS.map((sym) => {
                                const stock = priceData.get(sym);
                                if (!stock)
                                    return null;
                                return (_jsx(StockRow, { symbol: sym, stock: stock, isWatched: watched.includes(sym), isSelected: sym === selected }, sym));
                            })] })] }), _jsxs("div", { style: {
                    borderLeft: '1px solid #1e293b',
                    padding: 20,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }, children: "Watchlist" }), watched.length === 0 && (_jsx("p", { style: { fontSize: 13, color: '#475569' }, children: "No stocks watched" })), watched.map((sym) => {
                                const stock = priceData.get(sym);
                                if (!stock)
                                    return null;
                                const color = stock.change >= 0 ? '#22c55e' : '#ef4444';
                                return (_jsxs("div", { onClick: () => emit(StockSelected, sym), style: {
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        background: sym === selected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        marginBottom: 4,
                                    }, children: [_jsx("span", { style: { fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }, children: sym }), _jsxs("span", { style: { fontFamily: 'monospace', fontSize: 13, color }, children: ["$", stock.price.toFixed(2)] })] }, sym));
                            })] }), _jsxs("div", { children: [_jsxs("h2", { style: { fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }, children: ["Alerts ", alertList.length > 0 && (_jsx("span", { style: {
                                            background: '#ef4444',
                                            color: '#fff',
                                            borderRadius: 10,
                                            padding: '2px 8px',
                                            fontSize: 11,
                                            marginLeft: 6,
                                            fontWeight: 600,
                                        }, children: alertList.length }))] }), alertList.length === 0 && (_jsx("p", { style: { fontSize: 13, color: '#475569' }, children: "No alerts" })), alertList.slice(0, 10).map((alert) => (_jsxs("div", { style: {
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
                                }, children: [_jsx("span", { children: alert.message }), _jsx("button", { onClick: () => emit(AlertDismissed, alert.id), style: {
                                            background: 'none',
                                            border: 'none',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            fontSize: 14,
                                            padding: '0 4px',
                                        }, children: "\\u2715" })] }, alert.id)))] })] }), _jsx("style", { children: `
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      ` })] }));
}
