import { useSignal } from '@pulse/vue';
import { currentMetrics, METRICS } from './engine';
const metrics = useSignal(currentMetrics);
function getValue(name) {
    return metrics.value[name]?.value ?? 0;
}
function isBreach(name) {
    const config = METRICS.find((m) => m.name === name);
    if (!config)
        return false;
    return getValue(name) > config.threshold;
}
function formatValue(name) {
    const val = getValue(name);
    return name === 'Latency' ? val.toFixed(0) : val.toFixed(1);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            maxWidth: '1100px',
            margin: '0 auto 24px',
        }) },
});
for (const [config] of __VLS_getVForSourceType((__VLS_ctx.METRICS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (config.name),
        ...{ style: ({
                background: '#111827',
                border: `1px solid ${__VLS_ctx.isBreach(config.name) ? '#ef4444' : '#1e293b'}`,
                borderRadius: '12px',
                padding: '20px',
                transition: 'border-color 0.3s',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
            }) },
    });
    (config.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({
                fontSize: '36px',
                fontWeight: 800,
                color: __VLS_ctx.isBreach(config.name) ? '#ef4444' : '#f1f5f9',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 0.3s',
            }) },
    });
    (__VLS_ctx.formatValue(config.name));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ fontSize: '14px', color: '#64748b', marginLeft: '4px' }) },
    });
    (config.unit);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '12px', color: '#475569', marginTop: '4px' }) },
    });
    (config.threshold);
    (config.unit);
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            METRICS: METRICS,
            isBreach: isBreach,
            formatValue: formatValue,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
