import { useSignal } from '@pulse/vue';
import { userDetails, isLoadingDetails, selectedUserId } from './engine';
const details = useSignal(userDetails);
const loading = useSignal(isLoadingDetails);
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
if (__VLS_ctx.selected) {
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({
                    marginTop: '24px',
                    padding: '24px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: `2px solid ${__VLS_ctx.colors.border}`,
                }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: __VLS_ctx.colors.muted }) },
        });
    }
    else if (__VLS_ctx.details) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({
                    marginTop: '24px',
                    padding: '24px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: `2px solid ${__VLS_ctx.colors.border}`,
                }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: __VLS_ctx.colors.primary,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '22px',
                    flexShrink: 0,
                }) },
        });
        (__VLS_ctx.details.avatar);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ style: ({ margin: 0, fontSize: '22px', color: __VLS_ctx.colors.text }) },
        });
        (__VLS_ctx.details.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ style: ({ margin: '4px 0 0', color: __VLS_ctx.colors.muted, fontSize: '14px' }) },
        });
        (__VLS_ctx.details.email);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ marginBottom: '12px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: __VLS_ctx.colors.muted, letterSpacing: '0.5px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ fontSize: '15px', color: __VLS_ctx.colors.text, marginTop: '2px' }) },
        });
        (__VLS_ctx.details.role);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ marginBottom: '12px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: __VLS_ctx.colors.muted, letterSpacing: '0.5px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ fontSize: '15px', color: __VLS_ctx.colors.text, marginTop: '2px' }) },
        });
        (__VLS_ctx.details.bio);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ marginBottom: '12px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: __VLS_ctx.colors.muted, letterSpacing: '0.5px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ fontSize: '15px', color: __VLS_ctx.colors.text, marginTop: '2px' }) },
        });
        (__VLS_ctx.details.location);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ marginBottom: '12px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: __VLS_ctx.colors.muted, letterSpacing: '0.5px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ fontSize: '15px', color: __VLS_ctx.colors.text, marginTop: '2px' }) },
        });
        (__VLS_ctx.details.joinDate);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ marginBottom: '12px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: __VLS_ctx.colors.muted, letterSpacing: '0.5px' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        for (const [p] of __VLS_getVForSourceType((__VLS_ctx.details.projects))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                key: (p),
                ...{ style: ({
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: __VLS_ctx.colors.primaryLight,
                        color: __VLS_ctx.colors.primary,
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginRight: '6px',
                        marginTop: '4px',
                    }) },
            });
            (p);
        }
    }
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            details: details,
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
