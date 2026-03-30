import { computed } from 'vue';
import { providePulse, useEmit, useSignal } from '@pulse/vue';
import { engine, TOTAL_ITEMS, PAGE_SIZE, ITEM_HEIGHT, ScrollTo, SearchChanged, scrollTop, searchQuery, loadedPages, loadingPages, } from './engine';
providePulse(engine);
const emit = useEmit();
const top = useSignal(scrollTop);
const query = useSignal(searchQuery);
const pages = useSignal(loadedPages);
const loading = useSignal(loadingPages);
const VIEWPORT_HEIGHT = 600;
const BUFFER = 5;
const totalHeight = TOTAL_ITEMS * ITEM_HEIGHT;
const visibleRange = computed(() => {
    const startIdx = Math.max(0, Math.floor(top.value / ITEM_HEIGHT) - BUFFER);
    const endIdx = Math.min(TOTAL_ITEMS - 1, Math.ceil((top.value + VIEWPORT_HEIGHT) / ITEM_HEIGHT) + BUFFER);
    return { startIdx, endIdx };
});
function getItem(index) {
    const page = Math.floor(index / PAGE_SIZE);
    const items = pages.value.get(page);
    if (!items)
        return null;
    return items[index % PAGE_SIZE] ?? null;
}
function isLoading(index) {
    const page = Math.floor(index / PAGE_SIZE);
    return loading.value.has(page);
}
function matchesSearch(item) {
    if (!query.value || !item)
        return true;
    const q = query.value.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
}
const statusColors = {
    active: '#00b894',
    inactive: '#d63031',
    pending: '#fdcb6e',
};
function onScroll(e) {
    const target = e.target;
    emit(ScrollTo, target.scrollTop);
}
const visibleItems = computed(() => {
    const items = [];
    for (let i = visibleRange.value.startIdx; i <= visibleRange.value.endIdx; i++) {
        const item = getItem(i);
        if (!query.value || matchesSearch(item)) {
            items.push({ index: i, item, loading: isLoading(i) });
        }
    }
    return items;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ width: '600px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ fontSize: '24px', fontWeight: 700, color: '#333', marginBottom: '16px' }) },
});
(__VLS_ctx.TOTAL_ITEMS.toLocaleString());
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.SearchChanged, $event.target.value);
        } },
    value: (__VLS_ctx.query),
    placeholder: "Search by name or email...",
    ...{ style: ({
            width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #ddd',
            borderRadius: '8px', marginBottom: '16px', outline: 'none', background: '#fff',
        }) },
});
if (__VLS_ctx.loading.size > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '12px', color: '#888', marginBottom: '8px' }) },
    });
    ([...__VLS_ctx.loading].join(', '));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onScroll: (__VLS_ctx.onScroll) },
    ...{ style: ({
            height: `${__VLS_ctx.VIEWPORT_HEIGHT}px`, overflow: 'auto', background: '#fff',
            borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            position: 'relative',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ height: `${__VLS_ctx.totalHeight}px`, position: 'relative' }) },
});
for (const [{ index, item, loading: isLoad }] of __VLS_getVForSourceType((__VLS_ctx.visibleItems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (index),
        ...{ style: ({
                position: 'absolute',
                top: `${index * __VLS_ctx.ITEM_HEIGHT}px`,
                left: '0', right: '0',
                height: `${__VLS_ctx.ITEM_HEIGHT}px`,
                display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px',
                borderBottom: '1px solid #f0f0f0',
                background: index % 2 === 0 ? '#fff' : '#fafafa',
            }) },
    });
    if (!item || isLoad) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ style: ({ width: '40px', height: '12px', background: '#e0e0e0', borderRadius: '4px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ style: ({ flex: 1, height: '12px', background: '#e0e0e0', borderRadius: '4px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ style: ({ width: '180px', height: '12px', background: '#e0e0e0', borderRadius: '4px' }) },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ width: '40px', color: '#999', fontSize: '12px' }) },
        });
        (item.id);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ flex: 1, fontSize: '14px', color: '#333', fontWeight: 500 }) },
        });
        (item.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ width: '200px', fontSize: '13px', color: '#888' }) },
        });
        (item.email);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({
                    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                    color: __VLS_ctx.statusColors[item.status], padding: '2px 8px',
                    background: `${__VLS_ctx.statusColors[item.status]}18`, borderRadius: '4px',
                }) },
        });
        (item.status);
    }
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TOTAL_ITEMS: TOTAL_ITEMS,
            ITEM_HEIGHT: ITEM_HEIGHT,
            SearchChanged: SearchChanged,
            emit: emit,
            query: query,
            loading: loading,
            VIEWPORT_HEIGHT: VIEWPORT_HEIGHT,
            totalHeight: totalHeight,
            statusColors: statusColors,
            onScroll: onScroll,
            visibleItems: visibleItems,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
