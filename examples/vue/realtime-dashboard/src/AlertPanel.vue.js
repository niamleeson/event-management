import { useSignal, useEmit } from '@pulse/vue';
import { alerts, AlertDismissed } from './engine';
const emit = useEmit();
const alertList = useSignal(alerts);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ maxWidth: '1100px', margin: '0 auto' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ style: ({ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px' }) },
});
(__VLS_ctx.alertList.length);
if (__VLS_ctx.alertList.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ textAlign: 'center', padding: '32px', color: '#334155', fontSize: '14px' }) },
    });
}
for (const [alert] of __VLS_getVForSourceType((__VLS_ctx.alertList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (alert.id),
        ...{ style: ({
                background: '#1a0a0a',
                border: '1px solid #7f1d1d',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'slideIn 0.3s ease-out',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ fontSize: '14px', color: '#fca5a5', flex: 1 }) },
    });
    (alert.message);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ fontSize: '12px', color: '#7f1d1d', marginLeft: '16px', flexShrink: 0 }) },
    });
    (new Date(alert.timestamp).toLocaleTimeString());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.AlertDismissed, alert.id);
            } },
        ...{ onMouseenter: ((e) => e.currentTarget.style.color = '#fca5a5') },
        ...{ onMouseleave: ((e) => e.currentTarget.style.color = '#7f1d1d') },
        ...{ style: ({
                fontSize: '18px',
                color: '#7f1d1d',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginLeft: '12px',
                padding: '0 4px',
                transition: 'color 0.2s',
            }) },
    });
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AlertDismissed: AlertDismissed,
            emit: emit,
            alertList: alertList,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
