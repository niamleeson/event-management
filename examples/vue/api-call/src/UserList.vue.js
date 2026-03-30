import { useSignal, useEmit } from '@pulse/vue';
import { searchResults, searchQuery, isSearching, selectedUserId, UserSelected, } from './engine';
const emit = useEmit();
const results = useSignal(searchResults);
const query = useSignal(searchQuery);
const loading = useSignal(isSearching);
const selected = useSignal(selectedUserId);
const colors = {
    primary: '#4361ee',
    primaryLight: '#eef0ff',
    text: '#1a1a2e',
    muted: '#6c757d',
    border: '#e9ecef',
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.loading && __VLS_ctx.results.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: __VLS_ctx.colors.muted }) },
    });
}
else if (__VLS_ctx.query.length > 0 && __VLS_ctx.results.length === 0 && !__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ textAlign: 'center', padding: '40px', color: __VLS_ctx.colors.muted }) },
    });
    (__VLS_ctx.query);
}
else if (__VLS_ctx.results.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ textAlign: 'center', padding: '40px', color: __VLS_ctx.colors.muted }) },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }) },
    });
    for (const [user] of __VLS_getVForSourceType((__VLS_ctx.results))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading && __VLS_ctx.results.length === 0))
                        return;
                    if (!!(__VLS_ctx.query.length > 0 && __VLS_ctx.results.length === 0 && !__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.results.length === 0))
                        return;
                    __VLS_ctx.emit(__VLS_ctx.UserSelected, user.id);
                } },
            ...{ onMouseenter: ((e) => {
                    if (__VLS_ctx.selected !== user.id) {
                        e.currentTarget.style.borderColor = __VLS_ctx.colors.primary;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                }) },
            ...{ onMouseleave: ((e) => {
                    if (__VLS_ctx.selected !== user.id) {
                        e.currentTarget.style.borderColor = __VLS_ctx.colors.border;
                        e.currentTarget.style.transform = 'translateY(0)';
                    }
                }) },
            key: (user.id),
            ...{ style: ({
                    padding: '16px',
                    background: __VLS_ctx.selected === user.id ? __VLS_ctx.colors.primaryLight : '#ffffff',
                    borderRadius: '12px',
                    border: `2px solid ${__VLS_ctx.selected === user.id ? __VLS_ctx.colors.primary : __VLS_ctx.colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: __VLS_ctx.colors.primary,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '16px',
                    marginBottom: '8px',
                }) },
        });
        (user.avatar);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ style: ({ fontWeight: 600, fontSize: '16px', color: __VLS_ctx.colors.text, margin: 0 }) },
        });
        (user.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ style: ({ fontSize: '13px', color: __VLS_ctx.colors.muted, margin: '2px 0 0' }) },
        });
        (user.role);
    }
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            UserSelected: UserSelected,
            emit: emit,
            results: results,
            query: query,
            loading: loading,
            selected: selected,
            colors: colors,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
