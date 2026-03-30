import { createEngine } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const TOTAL_ITEMS = 10000;
export const PAGE_SIZE = 50;
export const ITEM_HEIGHT = 60;
export const VIEWPORT_HEIGHT = 900;
const categories = ['Engineering', 'Design', 'Marketing', 'Sales', 'Support', 'Product', 'Finance', 'Legal'];
const adjectives = ['Efficient', 'Dynamic', 'Robust', 'Scalable', 'Innovative', 'Critical', 'Strategic', 'Advanced'];
const nouns = ['System', 'Module', 'Service', 'Pipeline', 'Framework', 'Platform', 'Dashboard', 'Workflow'];
function generateItem(index) {
    const adj = adjectives[index % adjectives.length];
    const noun = nouns[Math.floor(index / adjectives.length) % nouns.length];
    return {
        id: `item-${index}`,
        title: `${adj} ${noun} #${index + 1}`,
        description: `Item ${index + 1} of ${TOTAL_ITEMS} — belongs to ${categories[index % categories.length]} department`,
        category: categories[index % categories.length],
        timestamp: Date.now() - (TOTAL_ITEMS - index) * 60000,
    };
}
// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------
export const ScrollChanged = engine.event('ScrollChanged');
export const PageRequested = engine.event('PageRequested');
export const PageLoaded = engine.event('PageLoaded');
export const ItemClicked = engine.event('ItemClicked');
export const FilterChanged = engine.event('FilterChanged');
export const SortChanged = engine.event('SortChanged');
export const DebounceFilterApply = engine.event('DebounceFilterApply');
// ---------------------------------------------------------------------------
// Async: PageRequested -> PageLoaded (simulated API)
// ---------------------------------------------------------------------------
const requestedPages = new Set();
engine.async(PageRequested, {
    done: PageLoaded,
    strategy: 'all',
    do: async (page) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
        const start = page * PAGE_SIZE;
        const items = [];
        for (let i = start; i < start + PAGE_SIZE && i < TOTAL_ITEMS; i++) {
            items.push(generateItem(i));
        }
        return { page, items };
    },
});
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
export const items = engine.signal(PageLoaded, new Map(), (prev, payload) => {
    const next = new Map(prev);
    for (const item of payload.items) {
        const idx = parseInt(item.id.split('-')[1]);
        next.set(idx, item);
    }
    return next;
});
export const scrollPosition = engine.signal(ScrollChanged, 0, (_prev, pos) => pos);
export const visibleRange = engine.signal(ScrollChanged, { start: 0, end: Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) }, (_prev, scrollTop) => {
    const start = Math.floor(scrollTop / ITEM_HEIGHT);
    const end = Math.min(TOTAL_ITEMS - 1, start + Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) + 1);
    return { start, end };
});
export const filter = engine.signal(DebounceFilterApply, '', (_prev, val) => val);
export const sort = engine.signal(SortChanged, 'asc', (_prev, dir) => dir);
export const loadingPages = engine.signal(PageRequested, new Set(), (prev, page) => {
    const next = new Set(prev);
    next.add(page);
    return next;
});
engine.signalUpdate(loadingPages, PageLoaded, (prev, payload) => {
    const next = new Set(prev);
    next.delete(payload.page);
    return next;
});
export const selectedItem = engine.signal(ItemClicked, null, (_prev, id) => id);
// ---------------------------------------------------------------------------
// Pipe: ScrollChanged -> prefetch pages
// ---------------------------------------------------------------------------
engine.on(ScrollChanged, (scrollTop) => {
    const startIdx = Math.floor(scrollTop / ITEM_HEIGHT);
    const endIdx = startIdx + Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) + 1;
    // Calculate which pages we need
    const startPage = Math.floor(startIdx / PAGE_SIZE);
    const endPage = Math.floor(endIdx / PAGE_SIZE);
    // Also prefetch next page
    const prefetchPage = endPage + 1;
    for (let p = startPage; p <= prefetchPage; p++) {
        if (p * PAGE_SIZE >= TOTAL_ITEMS)
            break;
        if (!requestedPages.has(p)) {
            requestedPages.add(p);
            engine.emit(PageRequested, p);
        }
    }
});
// ---------------------------------------------------------------------------
// Debounced filter
// ---------------------------------------------------------------------------
let filterTimer = null;
engine.on(FilterChanged, (text) => {
    if (filterTimer)
        clearTimeout(filterTimer);
    filterTimer = setTimeout(() => {
        engine.emit(DebounceFilterApply, text);
    }, 300);
});
// ---------------------------------------------------------------------------
// Load initial page
// ---------------------------------------------------------------------------
requestedPages.add(0);
engine.emit(PageRequested, 0);
