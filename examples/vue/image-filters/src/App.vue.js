import { computed } from 'vue';
import { providePulse, useEmit, useSignal } from '@pulse/vue';
import { engine, FilterValueChanged, FilterReordered, Undo, Redo, ResetAll, SplitChanged, filters, splitPosition, canUndo, canRedo, } from './engine';
providePulse(engine);
const emit = useEmit();
const filterList = useSignal(filters);
const split = useSignal(splitPosition);
const hasUndo = useSignal(canUndo);
const hasRedo = useSignal(canRedo);
const filterCSS = computed(() => {
    return filterList.value.map(f => `${f.prop}(${f.value}${f.unit})`).join(' ');
});
let dragIdx = -1;
function onDragStart(idx) { dragIdx = idx; }
function onDragOver(e, idx) {
    e.preventDefault();
    if (dragIdx >= 0 && dragIdx !== idx) {
        emit(FilterReordered, { fromIdx: dragIdx, toIdx: idx });
        dragIdx = idx;
    }
}
function onDragEnd() { dragIdx = -1; }
const IMAGE_URL = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6c5ce7"/><stop offset="50%" style="stop-color:#00b894"/><stop offset="100%" style="stop-color:#e17055"/></linearGradient></defs><rect width="600" height="400" fill="url(#g)"/><circle cx="200" cy="150" r="60" fill="#fdcb6e" opacity="0.8"/><circle cx="400" cy="250" r="80" fill="#0984e3" opacity="0.6"/><rect x="100" y="280" width="400" height="80" rx="10" fill="#2d3436" opacity="0.4"/><text x="300" y="200" text-anchor="middle" fill="white" font-size="32" font-family="sans-serif">Sample Image</text></svg>`);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ width: '900px', color: '#fff' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ fontSize: '24px', fontWeight: 300, letterSpacing: '2px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '8px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.Undo, undefined);
        } },
    disabled: (!__VLS_ctx.hasUndo),
    ...{ style: ({
            background: __VLS_ctx.hasUndo ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)', color: __VLS_ctx.hasUndo ? '#fff' : '#555',
            padding: '6px 16px', borderRadius: '6px', cursor: __VLS_ctx.hasUndo ? 'pointer' : 'default', fontSize: '13px',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.Redo, undefined);
        } },
    disabled: (!__VLS_ctx.hasRedo),
    ...{ style: ({
            background: __VLS_ctx.hasRedo ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)', color: __VLS_ctx.hasRedo ? '#fff' : '#555',
            padding: '6px 16px', borderRadius: '6px', cursor: __VLS_ctx.hasRedo ? 'pointer' : 'default', fontSize: '13px',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.ResetAll, undefined);
        } },
    ...{ style: ({
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '24px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '12px', height: '400px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: (__VLS_ctx.IMAGE_URL),
    ...{ style: ({ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: '0' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ position: 'absolute', inset: '0', overflow: 'hidden', width: `${__VLS_ctx.split}%` }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: (__VLS_ctx.IMAGE_URL),
    ...{ style: ({ width: `${10000 / __VLS_ctx.split}%`, height: '100%', objectFit: 'cover', filter: __VLS_ctx.filterCSS }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ style: ({
            position: 'absolute', top: '0', bottom: '0', left: `${__VLS_ctx.split}%`, width: '3px',
            background: '#fff', cursor: 'col-resize', transform: 'translateX(-1px)',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ position: 'absolute', top: '8px', left: '8px', fontSize: '11px', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ position: 'absolute', top: '8px', right: '8px', fontSize: '11px', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.SplitChanged, parseInt($event.target.value));
        } },
    type: "range",
    min: "0",
    max: "100",
    value: (__VLS_ctx.split),
    ...{ style: ({ position: 'absolute', bottom: '12px', left: '10%', width: '80%', opacity: 0.6 }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ width: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#888' }) },
});
for (const [f, i] of __VLS_getVForSourceType((__VLS_ctx.filterList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onDragstart: (...[$event]) => {
                __VLS_ctx.onDragStart(i);
            } },
        ...{ onDragover: ((e) => __VLS_ctx.onDragOver(e, i)) },
        ...{ onDragend: (__VLS_ctx.onDragEnd) },
        key: (f.id),
        draggable: "true",
        ...{ style: ({
                background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'grab',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ fontSize: '13px', fontWeight: 500 }) },
    });
    (f.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ fontSize: '12px', color: '#888' }) },
    });
    (Math.round(f.value));
    (f.unit);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.FilterValueChanged, { id: f.id, value: parseFloat($event.target.value) });
            } },
        type: "range",
        min: (f.min),
        max: (f.max),
        step: (f.prop === 'blur' ? 0.5 : 1),
        value: (f.value),
        ...{ style: ({ width: '100%', cursor: 'pointer' }) },
    });
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            FilterValueChanged: FilterValueChanged,
            Undo: Undo,
            Redo: Redo,
            ResetAll: ResetAll,
            SplitChanged: SplitChanged,
            emit: emit,
            filterList: filterList,
            split: split,
            hasUndo: hasUndo,
            hasRedo: hasRedo,
            filterCSS: filterCSS,
            onDragStart: onDragStart,
            onDragOver: onDragOver,
            onDragEnd: onDragEnd,
            IMAGE_URL: IMAGE_URL,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
