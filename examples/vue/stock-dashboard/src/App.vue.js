import { computed } from 'vue';
import { providePulse, useEmit, useSignal } from '@pulse/vue';
import { engine, stocks, selectedStock, alerts, StockSelected, DismissAlert } from './engine';
providePulse(engine);
const emit = useEmit();
const stockList = useSignal(stocks);
const selected = useSignal(selectedStock);
const alertList = useSignal(alerts);
const selectedData = computed(() => stockList.value.find(s => s.symbol === selected.value));
function sparklinePath(history, width, height) {
    if (history.length < 2)
        return '';
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const stepX = width / (history.length - 1);
    return history.map((v, i) => {
        const x = i * stepX;
        const y = height - ((v - min) / range) * height;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
}
function mainChartPath() {
    const data = selectedData.value;
    if (!data || data.history.length < 2)
        return '';
    return sparklinePath(data.history, 560, 200);
}
function priceColor(stock) {
    return stock.change >= 0 ? '#00b894' : '#d63031';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ fontSize: '24px', fontWeight: 300, letterSpacing: '2px', marginBottom: '24px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '20px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ width: '320px', display: 'flex', flexDirection: 'column', gap: '6px' }) },
});
for (const [stock] of __VLS_getVForSourceType((__VLS_ctx.stockList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.StockSelected, stock.symbol);
            } },
        key: (stock.symbol),
        ...{ style: ({
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                background: __VLS_ctx.selected === stock.symbol ? 'rgba(67,97,238,0.15)' : 'rgba(255,255,255,0.03)',
                border: __VLS_ctx.selected === stock.symbol ? '1px solid rgba(67,97,238,0.4)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px', cursor: 'pointer',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ flex: 1 }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '14px', fontWeight: 700 }) },
    });
    (stock.symbol);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '11px', color: '#888' }) },
    });
    (stock.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        width: (60),
        height: (24),
        ...{ style: ({ overflow: 'visible' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: (__VLS_ctx.sparklinePath(stock.history, 60, 24)),
        fill: "none",
        stroke: (__VLS_ctx.priceColor(stock)),
        'stroke-width': "1.5",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ textAlign: 'right', minWidth: '80px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '14px', fontWeight: 600 }) },
    });
    (stock.price.toFixed(2));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '11px', color: __VLS_ctx.priceColor(stock) }) },
    });
    (stock.change >= 0 ? '+' : '');
    (stock.changePercent.toFixed(2));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ flex: 1 }) },
});
if (__VLS_ctx.selectedData) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '20px', fontWeight: 700 }) },
    });
    (__VLS_ctx.selectedData.symbol);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '13px', color: '#888' }) },
    });
    (__VLS_ctx.selectedData.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ textAlign: 'right' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '28px', fontWeight: 700 }) },
    });
    (__VLS_ctx.selectedData.price.toFixed(2));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '14px', color: __VLS_ctx.priceColor(__VLS_ctx.selectedData) }) },
    });
    (__VLS_ctx.selectedData.change >= 0 ? '+' : '');
    (__VLS_ctx.selectedData.change.toFixed(2));
    (__VLS_ctx.selectedData.change >= 0 ? '+' : '');
    (__VLS_ctx.selectedData.changePercent.toFixed(2));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        width: "560",
        height: "200",
        ...{ style: ({ overflow: 'visible' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: (__VLS_ctx.mainChartPath()),
        fill: "none",
        stroke: (__VLS_ctx.priceColor(__VLS_ctx.selectedData)),
        'stroke-width': "2",
    });
}
if (__VLS_ctx.alertList.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ marginTop: '16px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ style: ({ fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '8px' }) },
    });
    for (const [alert] of __VLS_getVForSourceType((__VLS_ctx.alertList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (alert.id),
            ...{ style: ({
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                    background: alert.type === 'up' ? 'rgba(0,184,148,0.1)' : 'rgba(214,48,49,0.1)',
                    border: `1px solid ${alert.type === 'up' ? 'rgba(0,184,148,0.3)' : 'rgba(214,48,49,0.3)'}`,
                    borderRadius: '8px', marginBottom: '6px', fontSize: '13px',
                }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: ({ color: alert.type === 'up' ? '#00b894' : '#d63031', fontWeight: 700 }) },
        });
        (alert.type === 'up' ? '\u25B2' : '\u25BC');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: ({ flex: 1 }) },
        });
        (alert.message);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.alertList.length > 0))
                        return;
                    __VLS_ctx.emit(__VLS_ctx.DismissAlert, alert.id);
                } },
            ...{ style: ({ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '14px' }) },
        });
    }
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            StockSelected: StockSelected,
            DismissAlert: DismissAlert,
            emit: emit,
            stockList: stockList,
            selected: selected,
            alertList: alertList,
            selectedData: selectedData,
            sparklinePath: sparklinePath,
            mainChartPath: mainChartPath,
            priceColor: priceColor,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
