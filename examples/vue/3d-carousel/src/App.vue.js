import { providePulse, useEmit, useSpring, useSignal } from '@pulse/vue';
import { engine, ITEMS, ANGLE_STEP, DragStart, DragMove, DragEnd, ItemSelected, rotationSpring, selectedItem, selectedZSprings, } from './engine';
providePulse(engine);
const emit = useEmit();
const rotation = useSpring(rotationSpring);
const selected = useSignal(selectedItem);
const zBoosts = ITEMS.map((_, i) => useSpring(selectedZSprings[i]));
let dragging = false;
let lastX = 0;
function onPointerDown(e) {
    dragging = true;
    lastX = e.clientX;
    emit(DragStart, undefined);
    e.target.setPointerCapture(e.pointerId);
}
function onPointerMove(e) {
    if (!dragging)
        return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    emit(DragMove, { dx });
}
function onPointerUp() {
    if (!dragging)
        return;
    dragging = false;
    emit(DragEnd, undefined);
}
const RADIUS = 340;
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', userSelect: 'none' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onPointerdown: (__VLS_ctx.onPointerDown) },
    ...{ onPointermove: (__VLS_ctx.onPointerMove) },
    ...{ onPointerup: (__VLS_ctx.onPointerUp) },
    ...{ style: ({ perspective: '1000px', width: '800px', height: '300px', cursor: __VLS_ctx.dragging ? 'grabbing' : 'grab' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${__VLS_ctx.rotation}deg)`,
        }) },
});
for (const [item, i] of __VLS_getVForSourceType((__VLS_ctx.ITEMS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.ItemSelected, i);
            } },
        key: (i),
        ...{ style: ({
                position: 'absolute',
                width: '180px',
                height: '240px',
                left: '50%',
                top: '50%',
                marginLeft: '-90px',
                marginTop: '-120px',
                transform: `rotateY(${i * __VLS_ctx.ANGLE_STEP}deg) translateZ(${__VLS_ctx.RADIUS + __VLS_ctx.zBoosts[i].value}px)`,
                backfaceVisibility: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                background: __VLS_ctx.selected === i
                    ? `linear-gradient(145deg, ${item.color}ee, ${item.color}aa)`
                    : `linear-gradient(145deg, ${item.color}88, ${item.color}44)`,
                border: __VLS_ctx.selected === i ? `2px solid ${item.color}` : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: __VLS_ctx.selected === i
                    ? `0 0 30px ${item.color}66`
                    : '0 4px 20px rgba(0,0,0,0.3)',
                transition: 'background 0.3s, box-shadow 0.3s, border 0.3s',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '48px' }) },
    });
    (item.icon);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: '#fff', fontSize: '18px', fontWeight: 700, letterSpacing: '1px' }) },
    });
    (item.title);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }) },
});
if (__VLS_ctx.selected >= 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ color: __VLS_ctx.ITEMS[__VLS_ctx.selected].color, marginLeft: '12px' }) },
    });
    (__VLS_ctx.ITEMS[__VLS_ctx.selected].title);
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ITEMS: ITEMS,
            ANGLE_STEP: ANGLE_STEP,
            ItemSelected: ItemSelected,
            emit: emit,
            rotation: rotation,
            selected: selected,
            zBoosts: zBoosts,
            dragging: dragging,
            onPointerDown: onPointerDown,
            onPointerMove: onPointerMove,
            onPointerUp: onPointerUp,
            RADIUS: RADIUS,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
