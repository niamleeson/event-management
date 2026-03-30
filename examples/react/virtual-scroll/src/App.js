import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useCallback } from 'react';
import { useSignal, useEmit } from '@pulse/react';
import { items, visibleRange, filter, sort, loadingPages, selectedItem, ScrollChanged, FilterChanged, SortChanged, ItemClicked, TOTAL_ITEMS, ITEM_HEIGHT, } from './engine';
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
    container: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8f9fa',
    },
    header: {
        background: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: 20,
        fontWeight: 700,
        color: '#1a1a2e',
        margin: 0,
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    searchInput: {
        padding: '8px 14px',
        fontSize: 14,
        border: '1px solid #d0d0d0',
        borderRadius: 8,
        outline: 'none',
        width: 240,
        transition: 'border-color 0.2s',
    },
    sortBtn: (active) => ({
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 600,
        border: '1px solid #d0d0d0',
        borderRadius: 8,
        background: active ? '#4361ee' : '#fff',
        color: active ? '#fff' : '#333',
        cursor: 'pointer',
        transition: 'all 0.2s',
    }),
    stats: {
        fontSize: 13,
        color: '#888',
        padding: '8px 24px',
        background: '#fff',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
    },
    viewport: {
        flex: 1,
        overflow: 'auto',
        position: 'relative',
    },
    scrollContent: (height) => ({
        height,
        position: 'relative',
    }),
    itemRow: (top, isSelected) => ({
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid #eee',
        background: isSelected ? '#eef0ff' : '#fff',
        cursor: 'pointer',
        transition: 'background 0.15s',
        boxSizing: 'border-box',
    }),
    itemIndex: {
        width: 60,
        fontSize: 12,
        color: '#999',
        fontWeight: 600,
        flexShrink: 0,
    },
    itemContent: {
        flex: 1,
        overflow: 'hidden',
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#1a1a2e',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    itemDesc: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    itemCategory: (cat) => {
        const colors = {
            Engineering: '#4361ee',
            Design: '#e91e63',
            Marketing: '#ff9800',
            Sales: '#4caf50',
            Support: '#00bcd4',
            Product: '#9c27b0',
            Finance: '#607d8b',
            Legal: '#795548',
        };
        return {
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 10,
            background: (colors[cat] ?? '#999') + '20',
            color: colors[cat] ?? '#999',
            flexShrink: 0,
        };
    },
    skeleton: {
        position: 'absolute',
        left: 24,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        height: ITEM_HEIGHT,
        boxSizing: 'border-box',
    },
    skeletonBar: (width) => ({
        height: 12,
        width,
        background: '#e8e8e8',
        borderRadius: 6,
        animation: 'shimmer 1.5s infinite',
    }),
    loadingBadge: {
        fontSize: 11,
        color: '#4361ee',
        fontWeight: 600,
    },
};
const globalStyle = `
body { margin: 0; }
@keyframes shimmer {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}
`;
// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function Toolbar() {
    const emit = useEmit();
    const currentSort = useSignal(sort);
    const currentFilter = useSignal(filter);
    const handleFilterChange = (e) => {
        emit(FilterChanged, e.target.value);
    };
    const toggleSort = () => {
        const next = currentSort === 'asc' ? 'desc' : 'asc';
        emit(SortChanged, next);
    };
    return (_jsxs("div", { style: styles.header, children: [_jsx("h1", { style: styles.title, children: "Virtual Scroll" }), _jsxs("div", { style: styles.toolbar, children: [_jsx("input", { style: styles.searchInput, placeholder: "Search items...", defaultValue: currentFilter, onChange: handleFilterChange }), _jsxs("button", { style: styles.sortBtn(true), onClick: toggleSort, children: ["Sort: ", currentSort === 'asc' ? 'A-Z ↑' : 'Z-A ↓'] })] })] }));
}
function StatsBar() {
    const loadedItems = useSignal(items);
    const loading = useSignal(loadingPages);
    const range = useSignal(visibleRange);
    const currentFilter = useSignal(filter);
    const loadedCount = loadedItems.size;
    const filtered = currentFilter
        ? Array.from(loadedItems.values()).filter(it => it.title.toLowerCase().includes(currentFilter.toLowerCase()) ||
            it.category.toLowerCase().includes(currentFilter.toLowerCase())).length
        : loadedCount;
    return (_jsxs("div", { style: styles.stats, children: [_jsx("span", { children: currentFilter
                    ? `${filtered} matching of ${loadedCount} loaded / ${TOTAL_ITEMS.toLocaleString()} total`
                    : `${loadedCount} of ${TOTAL_ITEMS.toLocaleString()} items loaded` }), _jsxs("span", { children: ["Viewing rows ", range.start + 1, " - ", range.end + 1, loading.size > 0 && (_jsxs("span", { style: styles.loadingBadge, children: [" | Loading ", loading.size, " page(s)..."] }))] })] }));
}
function SkeletonRow({ top }) {
    return (_jsxs("div", { style: { ...styles.skeleton, top }, children: [_jsx("div", { style: styles.skeletonBar(40) }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: styles.skeletonBar(180) }), _jsx("div", { style: { ...styles.skeletonBar(250), marginTop: 6, height: 8 } })] }), _jsx("div", { style: styles.skeletonBar(60) })] }));
}
function VirtualList() {
    const emit = useEmit();
    const allItems = useSignal(items);
    const range = useSignal(visibleRange);
    const selected = useSignal(selectedItem);
    const currentFilter = useSignal(filter);
    const currentSort = useSignal(sort);
    const viewportRef = useRef(null);
    const handleScroll = useCallback(() => {
        if (viewportRef.current) {
            emit(ScrollChanged, viewportRef.current.scrollTop);
        }
    }, [emit]);
    // Build filtered + sorted index mapping
    // For virtual scroll with filter, we still show full height but filter visible items
    const totalHeight = TOTAL_ITEMS * ITEM_HEIGHT;
    // Render items in visible range
    const rows = [];
    const overscan = 3;
    const start = Math.max(0, range.start - overscan);
    const end = Math.min(TOTAL_ITEMS - 1, range.end + overscan);
    for (let i = start; i <= end; i++) {
        const item = allItems.get(i);
        const top = i * ITEM_HEIGHT;
        if (!item) {
            rows.push(_jsx(SkeletonRow, { top: top }, `skeleton-${i}`));
            continue;
        }
        // Apply filter
        if (currentFilter) {
            const matchesFilter = item.title.toLowerCase().includes(currentFilter.toLowerCase()) ||
                item.category.toLowerCase().includes(currentFilter.toLowerCase());
            if (!matchesFilter) {
                rows.push(_jsxs("div", { style: {
                        ...styles.itemRow(top, false),
                        opacity: 0.15,
                        pointerEvents: 'none',
                    }, children: [_jsxs("div", { style: styles.itemIndex, children: ["#", i + 1] }), _jsx("div", { style: styles.itemContent, children: _jsx("div", { style: styles.itemTitle, children: item.title }) })] }, item.id));
                continue;
            }
        }
        rows.push(_jsxs("div", { style: styles.itemRow(top, selected === item.id), onClick: () => emit(ItemClicked, item.id), children: [_jsxs("div", { style: styles.itemIndex, children: ["#", i + 1] }), _jsxs("div", { style: styles.itemContent, children: [_jsx("div", { style: styles.itemTitle, children: item.title }), _jsx("div", { style: styles.itemDesc, children: item.description })] }), _jsx("div", { style: styles.itemCategory(item.category), children: item.category })] }, item.id));
    }
    return (_jsx("div", { ref: viewportRef, style: styles.viewport, onScroll: handleScroll, children: _jsx("div", { style: styles.scrollContent(totalHeight), children: rows }) }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: globalStyle }), _jsxs("div", { style: styles.container, children: [_jsx(Toolbar, {}), _jsx(StatsBar, {}), _jsx(VirtualList, {})] })] }));
}
