import { providePulse, useEmit, useSpring, useSignal } from '@pulse/vue';
import { engine, FACES, DragStart, DragMove, DragEnd, FaceSelected, rotXSpring, rotYSpring, selectedFace, } from './engine';
providePulse(engine);
const emit = useEmit();
const rotX = useSpring(rotXSpring);
const rotY = useSpring(rotYSpring);
const selected = useSignal(selectedFace);
let dragging = false;
let lastPos = { x: 0, y: 0 };
function onPointerDown(e) {
    dragging = true;
    lastPos = { x: e.clientX, y: e.clientY };
    emit(DragStart, undefined);
    e.target.setPointerCapture(e.pointerId);
}
function onPointerMove(e) {
    if (!dragging)
        return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    lastPos = { x: e.clientX, y: e.clientY };
    emit(DragMove, { dx, dy });
}
function onPointerUp() {
    if (!dragging)
        return;
    dragging = false;
    emit(DragEnd, undefined);
}
const faceTransforms = [
    'translateZ(150px)',
    'rotateY(90deg) translateZ(150px)',
    'rotateY(180deg) translateZ(150px)',
    'rotateY(-90deg) translateZ(150px)',
    'rotateX(90deg) translateZ(150px)',
    'rotateX(-90deg) translateZ(150px)',
];
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
    ...{ style: ({ perspective: '800px', width: '300px', height: '300px', cursor: __VLS_ctx.dragging ? 'grabbing' : 'grab' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            width: '300px',
            height: '300px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${-__VLS_ctx.rotX}deg) rotateY(${-__VLS_ctx.rotY}deg)`,
        }) },
});
for (const [face, i] of __VLS_getVForSourceType((__VLS_ctx.FACES))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.FaceSelected, i);
            } },
        key: (i),
        ...{ style: ({
                position: 'absolute',
                width: '300px',
                height: '300px',
                transform: __VLS_ctx.faceTransforms[i],
                backfaceVisibility: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: __VLS_ctx.selected === i
                    ? `linear-gradient(145deg, ${face.color}ee, ${face.color}aa)`
                    : `linear-gradient(145deg, ${face.color}88, ${face.color}44)`,
                border: __VLS_ctx.selected === i ? `2px solid ${face.color}` : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: __VLS_ctx.selected === i
                    ? `0 0 30px ${face.color}66, inset 0 0 30px ${face.color}22`
                    : '0 4px 20px rgba(0,0,0,0.3)',
                transition: 'background 0.3s, box-shadow 0.3s',
                gap: '12px',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '48px' }) },
    });
    (face.icon);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: '#fff', fontSize: '22px', fontWeight: 700, letterSpacing: '1px' }) },
    });
    (face.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }) },
    });
    (face.desc);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }) },
});
if (__VLS_ctx.selected >= 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ color: __VLS_ctx.FACES[__VLS_ctx.selected].color, marginLeft: '12px' }) },
    });
    (__VLS_ctx.FACES[__VLS_ctx.selected].label);
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            FACES: FACES,
            FaceSelected: FaceSelected,
            emit: emit,
            rotX: rotX,
            rotY: rotY,
            selected: selected,
            dragging: dragging,
            onPointerDown: onPointerDown,
            onPointerMove: onPointerMove,
            onPointerUp: onPointerUp,
            faceTransforms: faceTransforms,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
