import { computed } from 'vue';
import { providePulse, useEmit, useSignal, useTween } from '@pulse/vue';
import { engine, COLUMNS, PAGE_SIZE, STATUS_COLORS, FetchData, SortChanged, FilterChanged, PageChanged, RowExpanded, RowSelected, SelectAll, BulkDelete, SearchChanged, ColumnResized, allData, loading, sortColumn, sortDir, filterStatus, searchQuery, currentPage, expandedRow, selectedRows, columnWidths, expandTween, } from './engine';
providePulse(engine);
const emit = useEmit();
const data = useSignal(allData);
const isLoading = useSignal(loading);
const sortCol = useSignal(sortColumn);
const sortDirection = useSignal(sortDir);
const filter = useSignal(filterStatus);
const search = useSignal(searchQuery);
const page = useSignal(currentPage);
const expanded = useSignal(expandedRow);
const selected = useSignal(selectedRows);
const colWidths = useSignal(columnWidths);
const expandVal = useTween(expandTween);
const filteredData = computed(() => {
    let rows = data.value;
    if (filter.value)
        rows = rows.filter(r => r.status === filter.value);
    if (search.value) {
        const q = search.value.toLowerCase();
        rows = rows.filter(r => r.name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            r.department.toLowerCase().includes(q) ||
            r.role.toLowerCase().includes(q));
    }
    if (sortCol.value && sortDirection.value) {
        const col = sortCol.value;
        const dir = sortDirection.value === 'asc' ? 1 : -1;
        rows = [...rows].sort((a, b) => {
            const av = a[col];
            const bv = b[col];
            if (typeof av === 'number' && typeof bv === 'number')
                return (av - bv) * dir;
            return String(av).localeCompare(String(bv)) * dir;
        });
    }
    return rows;
});
const pageData = computed(() => {
    const start = page.value * PAGE_SIZE;
    return filteredData.value.slice(start, start + PAGE_SIZE);
});
const totalPages = computed(() => Math.ceil(filteredData.value.length / PAGE_SIZE));
function highlightSearch(text) {
    if (!search.value)
        return text;
    return text;
}
let resizeState = null;
function onResizeStart(e, col) {
    resizeState = { column: col, startX: e.clientX, startWidth: colWidths.value[col] ?? 120 };
    e.target.setPointerCapture(e.pointerId);
}
function onResizeMove(e) {
    if (!resizeState)
        return;
    const dx = e.clientX - resizeState.startX;
    emit(ColumnResized, { column: resizeState.column, width: resizeState.startWidth + dx });
}
function onResizeEnd() {
    resizeState = null;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ fontSize: '24px', fontWeight: 700, color: '#333' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: ({ fontSize: '14px', fontWeight: 400, color: '#888', marginLeft: '8px' }) },
});
(__VLS_ctx.filteredData.length.toLocaleString());
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '8px' }) },
});
if (__VLS_ctx.selected.size > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selected.size > 0))
                    return;
                __VLS_ctx.emit(__VLS_ctx.BulkDelete, undefined);
            } },
        ...{ style: ({ background: '#d63031', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }) },
    });
    (__VLS_ctx.selected.size);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.FetchData, undefined);
        } },
    ...{ style: ({ background: '#4361ee', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }) },
});
(__VLS_ctx.isLoading ? 'Loading...' : 'Reload');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '12px', marginBottom: '16px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.SearchChanged, $event.target.value);
        } },
    value: (__VLS_ctx.search),
    placeholder: "Search name, email, dept, role...",
    ...{ style: ({ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', outline: 'none' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.FilterChanged, $event.target.value);
        } },
    value: (__VLS_ctx.filter),
    ...{ style: ({ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#fff' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "active",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "inactive",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "pending",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'auto' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ style: ({ width: '100%', borderCollapse: 'collapse' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ style: ({ width: '40px', padding: '10px', borderBottom: '2px solid #e0e0e0', background: '#fafafa' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.SelectAll, undefined);
        } },
    type: "checkbox",
    checked: (__VLS_ctx.selected.size > 0),
});
for (const [col] of __VLS_getVForSourceType((__VLS_ctx.COLUMNS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.SortChanged, col.key);
            } },
        key: (col.key),
        ...{ style: ({
                width: `${__VLS_ctx.colWidths[col.key] ?? 120}px`,
                padding: '10px 12px', borderBottom: '2px solid #e0e0e0', background: '#fafafa',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#555',
                textAlign: 'left', position: 'relative', userSelect: 'none',
            }) },
    });
    (col.label);
    if (__VLS_ctx.sortCol === col.key) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: ({ marginLeft: '4px' }) },
        });
        (__VLS_ctx.sortDirection === 'asc' ? '\u25B2' : __VLS_ctx.sortDirection === 'desc' ? '\u25BC' : '');
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onPointerdown: ((e) => __VLS_ctx.onResizeStart(e, col.key)) },
        ...{ onPointermove: (__VLS_ctx.onResizeMove) },
        ...{ onPointerup: (__VLS_ctx.onResizeEnd) },
        ...{ style: ({
                position: 'absolute', right: '0', top: '0', bottom: '0', width: '4px',
                cursor: 'col-resize', background: 'transparent',
            }) },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
for (const [row] of __VLS_getVForSourceType((__VLS_ctx.pageData))) {
    (row.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.RowExpanded, row.id);
            } },
        ...{ style: ({
                cursor: 'pointer',
                background: __VLS_ctx.selected.has(row.id) ? '#e8f4f8' : __VLS_ctx.expanded === row.id ? '#f8f8ff' : '#fff',
                borderBottom: '1px solid #f0f0f0',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: ({ padding: '8px 10px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onClick: () => { } },
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.RowSelected, row.id);
            } },
        type: "checkbox",
        checked: (__VLS_ctx.selected.has(row.id)),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: ({ padding: '8px 12px', fontSize: '13px', fontWeight: 500, color: '#333' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ background: __VLS_ctx.search && row.name.toLowerCase().includes(__VLS_ctx.search.toLowerCase()) ? '#fdcb6e55' : 'transparent', padding: '0 2px' }) },
    });
    (row.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: ({ padding: '8px 12px', fontSize: '13px', color: '#666' }) },
    });
    (row.email);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: ({ padding: '8px 12px', fontSize: '13px', color: '#666' }) },
    });
    (row.department);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: ({ padding: '8px 12px', fontSize: '13px', color: '#666' }) },
    });
    (row.role);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: ({ padding: '8px 12px', fontSize: '13px', color: '#333', fontWeight: 500 }) },
    });
    (row.salary.toLocaleString());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: ({ padding: '8px 12px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({
                fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                color: __VLS_ctx.STATUS_COLORS[row.status], padding: '2px 8px',
                background: `${__VLS_ctx.STATUS_COLORS[row.status]}15`, borderRadius: '4px',
            }) },
    });
    (row.status);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: ({ padding: '8px 12px', fontSize: '13px', color: '#888' }) },
    });
    (row.joinDate);
    if (__VLS_ctx.expanded === row.id) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            colspan: (__VLS_ctx.COLUMNS.length + 1),
            ...{ style: ({
                    padding: '16px 24px', background: '#f8f8ff', borderBottom: '1px solid #e0e0e0',
                    opacity: __VLS_ctx.expandVal,
                }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (row.id);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (row.email);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (row.department);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (row.role);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (row.salary.toLocaleString());
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (row.joinDate);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.PageChanged, Math.max(0, __VLS_ctx.page - 1));
        } },
    disabled: (__VLS_ctx.page === 0),
    ...{ style: ({ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: __VLS_ctx.page === 0 ? 'default' : 'pointer', color: __VLS_ctx.page === 0 ? '#ccc' : '#333', fontSize: '13px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: ({ fontSize: '13px', color: '#666' }) },
});
(__VLS_ctx.page + 1);
(__VLS_ctx.totalPages);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.PageChanged, Math.min(__VLS_ctx.totalPages - 1, __VLS_ctx.page + 1));
        } },
    disabled: (__VLS_ctx.page >= __VLS_ctx.totalPages - 1),
    ...{ style: ({ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: __VLS_ctx.page >= __VLS_ctx.totalPages - 1 ? 'default' : 'pointer', color: __VLS_ctx.page >= __VLS_ctx.totalPages - 1 ? '#ccc' : '#333', fontSize: '13px' }) },
});
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            COLUMNS: COLUMNS,
            STATUS_COLORS: STATUS_COLORS,
            FetchData: FetchData,
            SortChanged: SortChanged,
            FilterChanged: FilterChanged,
            PageChanged: PageChanged,
            RowExpanded: RowExpanded,
            RowSelected: RowSelected,
            SelectAll: SelectAll,
            BulkDelete: BulkDelete,
            SearchChanged: SearchChanged,
            emit: emit,
            isLoading: isLoading,
            sortCol: sortCol,
            sortDirection: sortDirection,
            filter: filter,
            search: search,
            page: page,
            expanded: expanded,
            selected: selected,
            colWidths: colWidths,
            expandVal: expandVal,
            filteredData: filteredData,
            pageData: pageData,
            totalPages: totalPages,
            onResizeStart: onResizeStart,
            onResizeMove: onResizeMove,
            onResizeEnd: onResizeEnd,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
