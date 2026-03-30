import { onMounted, onUnmounted } from 'vue';
import { providePulse, useEmit, useSignal, useTween } from '@pulse/vue';
import { engine, OpenModal, CloseModal, CloseTopModal, modalStack, backdropOpacity, scaleEntranceTweens, fadeEntranceTweens, SIZE_WIDTHS, } from './engine';
providePulse(engine);
const emit = useEmit();
const stack = useSignal(modalStack);
const backdrop = useTween(backdropOpacity);
const scaleVals = Array.from({ length: 10 }, (_, i) => useTween(scaleEntranceTweens[i]));
const fadeVals = Array.from({ length: 10 }, (_, i) => useTween(fadeEntranceTweens[i]));
function onKeyDown(e) {
    if (e.key === 'Escape')
        emit(CloseTopModal, undefined);
}
onMounted(() => document.addEventListener('keydown', onKeyDown));
onUnmounted(() => document.removeEventListener('keydown', onKeyDown));
const DEMO_MODALS = [
    { title: 'Small Modal', content: 'This is a small modal dialog. You can stack multiple modals!', size: 'sm' },
    { title: 'Medium Modal', content: 'This is a medium-sized modal with more content space. Try opening another modal on top of this one to see the stacking effect with offset positioning.', size: 'md' },
    { title: 'Large Modal', content: 'This is a large modal. It has the most content space. Modals stack with scale/fade tweens, backdrop blur, and offset positioning. Press Escape to close the top modal, or click the X button. Focus is trapped within the modal.', size: 'lg' },
];
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '12px' }) },
});
for (const [demo] of __VLS_getVForSourceType((__VLS_ctx.DEMO_MODALS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.OpenModal, demo);
            } },
        key: (demo.size),
        ...{ style: ({
                background: 'rgba(67,97,238,0.2)', border: '1px solid rgba(67,97,238,0.4)',
                color: '#4361ee', padding: '10px 24px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            }) },
    });
    (demo.size.toUpperCase());
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }) },
});
if (__VLS_ctx.stack.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.stack.length > 0))
                    return;
                __VLS_ctx.emit(__VLS_ctx.CloseTopModal, undefined);
            } },
        ...{ style: ({
                position: 'fixed', inset: '0', zIndex: 1000,
                background: `rgba(0,0,0,${0.5 * __VLS_ctx.backdrop})`,
                backdropFilter: `blur(${4 * __VLS_ctx.backdrop}px)`,
            }) },
    });
}
for (const [modal, i] of __VLS_getVForSourceType((__VLS_ctx.stack))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (modal.id),
        ...{ style: ({
                position: 'fixed', inset: '0', zIndex: 1001 + i,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                pointerEvents: 'none',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: () => { } },
        ...{ style: ({
                width: `${__VLS_ctx.SIZE_WIDTHS[modal.size]}px`,
                background: '#16213e',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                pointerEvents: 'all',
                transform: `scale(${__VLS_ctx.scaleVals[i % 10].value}) translateY(${i * -12}px)`,
                opacity: __VLS_ctx.fadeVals[i % 10].value,
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ style: ({ color: '#fff', fontSize: '18px', fontWeight: 600 }) },
    });
    (modal.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.CloseModal, modal.id);
            } },
        ...{ style: ({
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#888',
                width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: ({ color: '#ccc', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }) },
    });
    (modal.content);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ display: 'flex', gap: '8px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.OpenModal, { title: `Stacked Modal #${__VLS_ctx.stack.length + 1}`, content: 'This is a stacked modal! You can keep stacking them.', size: 'sm' });
            } },
        ...{ style: ({
                background: 'rgba(67,97,238,0.2)', border: '1px solid rgba(67,97,238,0.4)',
                color: '#4361ee', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.CloseModal, modal.id);
            } },
        ...{ style: ({
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#888', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
            }) },
    });
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            OpenModal: OpenModal,
            CloseModal: CloseModal,
            CloseTopModal: CloseTopModal,
            SIZE_WIDTHS: SIZE_WIDTHS,
            emit: emit,
            stack: stack,
            backdrop: backdrop,
            scaleVals: scaleVals,
            fadeVals: fadeVals,
            DEMO_MODALS: DEMO_MODALS,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
