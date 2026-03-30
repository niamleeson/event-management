import { providePulse, useEmit, useSignal, useSpring } from '@pulse/vue';
import { engine, COLS, CELL_SIZE, GAP, DragStart, DragMove, DragEnd, ShuffleItems, AddItem, RemoveItem, items, draggingId, ghostPos, posXSprings, posYSprings, } from './engine';
providePulse(engine);
const emit = useEmit();
const itemList = useSignal(items);
const dragId = useSignal(draggingId);
const ghost = useSignal(ghostPos);
const springXVals = Array.from({ length: 20 }, (_, i) => useSpring(posXSprings[i]));
const springYVals = Array.from({ length: 20 }, (_, i) => useSpring(posYSprings[i]));
let containerRect = null;
function onPointerDown(e, id) {
    const container = e.currentTarget.closest('[data-grid]');
    if (container)
        containerRect = container.getBoundingClientRect();
    const x = e.clientX - (containerRect?.left ?? 0);
    const y = e.clientY - (containerRect?.top ?? 0);
    emit(DragStart, { id, x, y });
    e.target.setPointerCapture(e.pointerId);
}
function onPointerMove(e) {
    if (dragId.value < 0)
        return;
    const x = e.clientX - (containerRect?.left ?? 0);
    const y = e.clientY - (containerRect?.top ?? 0);
    emit(DragMove, { x, y });
}
function onPointerUp() {
    if (dragId.value < 0)
        return;
    emit(DragEnd, undefined);
}
const gridWidth = COLS * (CELL_SIZE + GAP);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '12px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.ShuffleItems, undefined);
        } },
    ...{ style: ({
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.AddItem, undefined);
        } },
    ...{ style: ({
            background: 'rgba(0,184,148,0.2)', border: '1px solid rgba(0,184,148,0.4)',
            color: '#00b894', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onPointermove: (__VLS_ctx.onPointerMove) },
    ...{ onPointerup: (__VLS_ctx.onPointerUp) },
    'data-grid': true,
    ...{ style: ({
            width: `${__VLS_ctx.gridWidth}px`,
            height: `${Math.ceil(__VLS_ctx.itemList.length / __VLS_ctx.COLS) * (__VLS_ctx.CELL_SIZE + __VLS_ctx.GAP)}px`,
            position: 'relative',
            userSelect: 'none',
        }) },
});
for (const [item, i] of __VLS_getVForSourceType((__VLS_ctx.itemList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onPointerdown: ((e) => __VLS_ctx.onPointerDown(e, item.id)) },
        key: (item.id),
        ...{ style: ({
                position: 'absolute',
                left: `${__VLS_ctx.springXVals[i].value}px`,
                top: `${__VLS_ctx.springYVals[i].value}px`,
                width: `${__VLS_ctx.CELL_SIZE}px`,
                height: `${__VLS_ctx.CELL_SIZE}px`,
                background: `linear-gradient(145deg, ${item.color}cc, ${item.color}88)`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: __VLS_ctx.dragId === item.id ? 'grabbing' : 'grab',
                opacity: __VLS_ctx.dragId === item.id ? 0.5 : 1,
                boxShadow: `0 4px 16px ${item.color}44`,
                border: '1px solid rgba(255,255,255,0.1)',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: '#fff', fontSize: '14px', fontWeight: 600 }) },
    });
    (item.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.RemoveItem, item.id);
            } },
        ...{ style: ({
                background: 'rgba(0,0,0,0.2)', border: 'none', color: 'rgba(255,255,255,0.5)',
                width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }) },
    });
}
if (__VLS_ctx.dragId >= 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ style: ({
                position: 'fixed',
                left: `${__VLS_ctx.ghost.x - __VLS_ctx.CELL_SIZE / 2}px`,
                top: `${__VLS_ctx.ghost.y - __VLS_ctx.CELL_SIZE / 2}px`,
                width: `${__VLS_ctx.CELL_SIZE}px`,
                height: `${__VLS_ctx.CELL_SIZE}px`,
                background: 'rgba(67,97,238,0.3)',
                borderRadius: '12px',
                border: '2px dashed rgba(67,97,238,0.6)',
                pointerEvents: 'none',
                zIndex: 100,
            }) },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }) },
});
(__VLS_ctx.itemList.length);
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            COLS: COLS,
            CELL_SIZE: CELL_SIZE,
            GAP: GAP,
            ShuffleItems: ShuffleItems,
            AddItem: AddItem,
            RemoveItem: RemoveItem,
            emit: emit,
            itemList: itemList,
            dragId: dragId,
            ghost: ghost,
            springXVals: springXVals,
            springYVals: springYVals,
            onPointerDown: onPointerDown,
            onPointerMove: onPointerMove,
            onPointerUp: onPointerUp,
            gridWidth: gridWidth,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
