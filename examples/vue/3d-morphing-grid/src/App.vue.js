import { providePulse, useEmit, useSignal, useTween } from '@pulse/vue';
import { engine, GRID, CELL_COUNT, SHAPES, COLORS, MorphToShape, currentShape, cellRX, cellRY, cellTZ, } from './engine';
providePulse(engine);
const emit = useEmit();
const shape = useSignal(currentShape);
const rxVals = Array.from({ length: CELL_COUNT }, (_, i) => useTween(cellRX[i]));
const ryVals = Array.from({ length: CELL_COUNT }, (_, i) => useTween(cellRY[i]));
const tzVals = Array.from({ length: CELL_COUNT }, (_, i) => useTween(cellTZ[i]));
function gridItems() {
    const items = [];
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            items.push({ row: r, col: c, idx: r * GRID + c });
        }
    }
    return items;
}
const items = gridItems();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '12px' }) },
});
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.SHAPES))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.MorphToShape, s);
            } },
        key: (s),
        ...{ style: ({
                background: __VLS_ctx.shape === s ? 'rgba(108,92,231,0.8)' : 'rgba(255,255,255,0.1)',
                border: __VLS_ctx.shape === s ? '1px solid #6c5ce7' : '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '8px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                letterSpacing: '1px',
                textTransform: 'capitalize',
            }) },
    });
    (s);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ perspective: '800px', width: '400px', height: '400px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transform: 'rotateX(15deg) rotateY(-15deg)',
            position: 'relative',
        }) },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.items))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (item.idx),
        ...{ style: ({
                position: 'absolute',
                width: '70px',
                height: '70px',
                left: `${item.col * 90 + 25}px`,
                top: `${item.row * 90 + 25}px`,
                transformStyle: 'preserve-3d',
                transform: `rotateX(${__VLS_ctx.rxVals[item.idx].value}deg) rotateY(${__VLS_ctx.ryVals[item.idx].value}deg) translateZ(${__VLS_ctx.tzVals[item.idx].value}px)`,
                background: `linear-gradient(145deg, ${__VLS_ctx.COLORS[item.idx]}cc, ${__VLS_ctx.COLORS[item.idx]}88)`,
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: `0 4px 20px ${__VLS_ctx.COLORS[item.idx]}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '12px',
                fontWeight: 600,
            }) },
    });
    (item.row);
    (item.col);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }) },
});
(__VLS_ctx.shape);
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SHAPES: SHAPES,
            COLORS: COLORS,
            MorphToShape: MorphToShape,
            emit: emit,
            shape: shape,
            rxVals: rxVals,
            ryVals: ryVals,
            tzVals: tzVals,
            items: items,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
