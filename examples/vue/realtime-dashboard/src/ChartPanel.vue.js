import { useSignal } from '@pulse/vue';
import { chartData, METRICS } from './engine';
const data = useSignal(chartData);
const CHART_COLORS = {
    'CPU Usage': '#4361ee',
    'Memory': '#7209b7',
    'Latency': '#f59e0b',
    'Requests/s': '#10b981',
};
function getPoints(name) {
    return data.value[name] ?? [];
}
function getThreshold(name) {
    return METRICS.find((m) => m.name === name)?.threshold ?? 0;
}
function barHeight(value, maxVal) {
    return (value / maxVal) * 100;
}
function maxValue(points, threshold) {
    if (points.length === 0)
        return threshold * 1.1;
    return Math.max(...points.map((d) => d.value), threshold * 1.1);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            maxWidth: '1100px',
            margin: '0 auto 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
        }) },
});
for (const [config] of __VLS_getVForSourceType((__VLS_ctx.METRICS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (config.name),
        ...{ style: ({
                background: '#111827',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginBottom: '16px' }) },
    });
    (config.name);
    if (__VLS_ctx.getPoints(config.name).length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({
                    height: '120px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '2px',
                    justifyContent: 'center',
                    color: '#334155',
                    fontSize: '13px',
                }) },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '2px', position: 'relative' }) },
        });
        for (const [point, i] of __VLS_getVForSourceType((__VLS_ctx.getPoints(config.name)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                key: (i),
                ...{ style: ({
                        flex: 1,
                        height: `${__VLS_ctx.barHeight(point.value, __VLS_ctx.maxValue(__VLS_ctx.getPoints(config.name), config.threshold))}%`,
                        background: point.value > config.threshold ? '#ef4444' : (__VLS_ctx.CHART_COLORS[config.name] ?? '#4361ee'),
                        borderRadius: '3px 3px 0 0',
                        minWidth: '3px',
                        opacity: 0.5 + (i / __VLS_ctx.getPoints(config.name).length) * 0.5,
                        transition: 'height 0.3s ease-out',
                    }) },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ style: ({
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: `${(config.threshold / __VLS_ctx.maxValue(__VLS_ctx.getPoints(config.name), config.threshold)) * 100}%`,
                    height: '1px',
                    background: '#ef4444',
                    opacity: 0.3,
                    pointerEvents: 'none',
                }) },
        });
    }
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            METRICS: METRICS,
            CHART_COLORS: CHART_COLORS,
            getPoints: getPoints,
            barHeight: barHeight,
            maxValue: maxValue,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
