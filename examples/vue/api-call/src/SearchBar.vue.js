import { useSignal, useEmit } from '@pulse/vue';
import { SearchInput, searchQuery, isSearching } from './engine';
const emit = useEmit();
const query = useSignal(searchQuery);
const loading = useSignal(isSearching);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ position: 'relative', marginBottom: '24px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: ({
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6c757d',
            fontSize: '18px',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: ((e) => __VLS_ctx.emit(__VLS_ctx.SearchInput, e.target.value)) },
    ...{ style: ({
            width: '100%',
            padding: '14px 16px 14px 44px',
            fontSize: '16px',
            border: '2px solid #e9ecef',
            borderRadius: '12px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
        }) },
    value: (__VLS_ctx.query),
    placeholder: "Search users by name, email, or role...",
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ style: ({
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                border: '2px solid #e9ecef',
                borderTop: '2px solid #4361ee',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }) },
    });
}
const __VLS_0 = (('style'));
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
var __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SearchInput: SearchInput,
            emit: emit,
            query: query,
            loading: loading,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
