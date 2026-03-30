import { useSignal, useEmit } from '@pulse/vue';
import { FilterChanged, activeFilter } from './engine';
const emit = useEmit();
const filter = useSignal(activeFilter);
const filters = ['all', 'active', 'completed'];
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '8px', marginBottom: '20px' }) },
});
for (const [f] of __VLS_getVForSourceType((__VLS_ctx.filters))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.FilterChanged, f);
            } },
        key: (f),
        ...{ style: ({
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: __VLS_ctx.filter === f ? 600 : 400,
                border: __VLS_ctx.filter === f ? '2px solid #4361ee' : '2px solid #e0e0e0',
                borderRadius: '20px',
                background: __VLS_ctx.filter === f ? '#eef0ff' : '#fff',
                color: __VLS_ctx.filter === f ? '#4361ee' : '#666',
                cursor: 'pointer',
                transition: 'all 0.2s',
            }) },
    });
    (f.charAt(0).toUpperCase() + f.slice(1));
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            FilterChanged: FilterChanged,
            emit: emit,
            filter: filter,
            filters: filters,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
