import { ref as vueRef, onMounted, onUnmounted } from 'vue';
import { providePulse, useEmit, useSignal } from '@pulse/vue';
import { engine, SpawnExplosion, ClearAll, particleCount, particles } from './engine';
providePulse(engine);
const emit = useEmit();
const count = useSignal(particleCount);
const canvasRef = vueRef(null);
let disposeFrame = null;
let resizeHandler = null;
onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resize();
    resizeHandler = resize;
    window.addEventListener('resize', resize);
    disposeFrame = engine.on(engine.frame, () => {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = alpha * 0.3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    });
});
onUnmounted(() => {
    disposeFrame?.();
    if (resizeHandler)
        window.removeEventListener('resize', resizeHandler);
});
function onCanvasClick(e) {
    emit(SpawnExplosion, { x: e.clientX, y: e.clientY });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ width: '100%', height: '100%', position: 'relative' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.canvas)({
    ...{ onClick: (__VLS_ctx.onCanvasClick) },
    ref: "canvasRef",
    ...{ style: ({ position: 'absolute', inset: '0', cursor: 'crosshair' }) },
});
/** @type {typeof __VLS_ctx.canvasRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            position: 'absolute',
            top: '24px',
            left: '0',
            right: '0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            pointerEvents: 'none',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ color: '#fff', fontSize: '22px', fontWeight: 300, letterSpacing: '2px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: ({ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }) },
});
(__VLS_ctx.count);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.ClearAll, undefined);
        } },
    ...{ style: ({
            pointerEvents: 'all',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            letterSpacing: '1px',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            position: 'absolute',
            bottom: '24px',
            left: '0',
            right: '0',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '13px',
            pointerEvents: 'none',
        }) },
});
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ClearAll: ClearAll,
            emit: emit,
            count: count,
            canvasRef: canvasRef,
            onCanvasClick: onCanvasClick,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
