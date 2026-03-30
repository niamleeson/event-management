import { createEngine, createSignal } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export const PriceUpdate = engine.event('PriceUpdate');
export const AlertTriggered = engine.event('AlertTriggered');
export const AlertDismissed = engine.event('AlertDismissed');
export const WatchlistAdd = engine.event('WatchlistAdd');
export const WatchlistRemove = engine.event('WatchlistRemove');
export const TimeframeChanged = engine.event('TimeframeChanged');
export const TickerPaused = engine.event('TickerPaused');
export const TickerResumed = engine.event('TickerResumed');
export const StockSelected = engine.event('StockSelected');
// Internal
const FlashClear = engine.event('FlashClear');
// ---------------------------------------------------------------------------
// Stock symbols
// ---------------------------------------------------------------------------
export const SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];
const BASE_PRICES = {
    AAPL: 178.50,
    GOOGL: 141.20,
    MSFT: 378.90,
    AMZN: 178.30,
    TSLA: 248.40,
    NVDA: 495.20,
    META: 355.70,
    NFLX: 485.60,
};
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
function initPrices() {
    const m = new Map();
    for (const sym of SYMBOLS) {
        const base = BASE_PRICES[sym];
        m.set(sym, {
            price: base,
            change: 0,
            history: Array.from({ length: 30 }, () => base + (Math.random() - 0.5) * 5),
            prevPrice: base,
            flashDirection: null,
            flashTime: 0,
        });
    }
    return m;
}
export const prices = createSignal(initPrices());
engine['_signals'].push(prices);
export const alerts = createSignal([]);
engine['_signals'].push(alerts);
export const watchlist = engine.signal(WatchlistAdd, ['AAPL', 'GOOGL', 'NVDA', 'TSLA'], (prev, symbol) => prev.includes(symbol) ? prev : [...prev, symbol]);
engine.signalUpdate(watchlist, WatchlistRemove, (prev, symbol) => prev.filter((s) => s !== symbol));
export const timeframe = engine.signal(TimeframeChanged, '1m', (_prev, tf) => tf);
export const isLive = engine.signal(TickerPaused, true, () => false);
engine.signalUpdate(isLive, TickerResumed, () => true);
export const selectedStock = engine.signal(StockSelected, 'AAPL', (_prev, sym) => sym);
// ---------------------------------------------------------------------------
// Pipe: PriceUpdate -> conditional AlertTriggered
// ---------------------------------------------------------------------------
let alertCounter = 0;
engine.pipe(PriceUpdate, AlertTriggered, (data) => {
    if (Math.abs(data.change) > 5) {
        return {
            symbol: data.symbol,
            message: `${data.symbol} ${data.change > 0 ? 'surged' : 'dropped'} ${Math.abs(data.change).toFixed(2)}%`,
        };
    }
    return undefined;
});
// ---------------------------------------------------------------------------
// Price update handler
// ---------------------------------------------------------------------------
engine.on(PriceUpdate, (data) => {
    const current = new Map(prices.value);
    const stock = current.get(data.symbol);
    if (!stock)
        return;
    const newHistory = [...stock.history.slice(-29), data.price];
    const direction = data.price >= stock.price ? 'up' : 'down';
    current.set(data.symbol, {
        price: data.price,
        change: data.change,
        history: newHistory,
        prevPrice: stock.price,
        flashDirection: direction,
        flashTime: Date.now(),
    });
    prices._set(current);
    // Clear flash after 800ms
    setTimeout(() => engine.emit(FlashClear, data.symbol), 800);
});
engine.on(FlashClear, (symbol) => {
    const current = new Map(prices.value);
    const stock = current.get(symbol);
    if (!stock)
        return;
    current.set(symbol, { ...stock, flashDirection: null });
    prices._set(current);
});
// ---------------------------------------------------------------------------
// Alert handlers
// ---------------------------------------------------------------------------
engine.on(AlertTriggered, ({ symbol, message }) => {
    const id = `alert-${++alertCounter}`;
    const alert = { id, symbol, message, timestamp: Date.now() };
    alerts._set([alert, ...alerts.value].slice(0, 20));
});
engine.on(AlertDismissed, (id) => {
    alerts._set(alerts.value.filter((a) => a.id !== id));
});
// ---------------------------------------------------------------------------
// Simulated WebSocket: price updates every 500ms
// ---------------------------------------------------------------------------
let tickerInterval = null;
function startTicker() {
    if (tickerInterval)
        return;
    tickerInterval = setInterval(() => {
        if (!isLive.value)
            return;
        for (const sym of SYMBOLS) {
            const stock = prices.value.get(sym);
            if (!stock)
                continue;
            // Random walk
            const volatility = sym === 'TSLA' ? 0.03 : sym === 'NVDA' ? 0.025 : 0.015;
            const change = (Math.random() - 0.5) * 2 * volatility;
            const newPrice = Math.max(1, stock.price * (1 + change));
            const pctChange = ((newPrice - stock.price) / stock.price) * 100;
            engine.emit(PriceUpdate, {
                symbol: sym,
                price: parseFloat(newPrice.toFixed(2)),
                change: parseFloat(pctChange.toFixed(2)),
            });
        }
    }, 500);
}
startTicker();
// ---------------------------------------------------------------------------
// Start frame loop
// ---------------------------------------------------------------------------
engine.startFrameLoop();
