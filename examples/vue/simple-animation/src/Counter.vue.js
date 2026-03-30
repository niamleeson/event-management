import { computed } from 'vue';
import { useSignal, useTween, useEmit } from '@pulse/vue';
import { count, animatedCount, colorIntensity, bounceScale, Increment, Decrement, } from './engine';
const emit = useEmit();
const currentCount = useSignal(count);
const animCount = useTween(animatedCount);
const colorT = useTween(colorIntensity);
const bounce = useTween(bounceScale);
function lerpColor(r1, g1, b1, r2, g2, b2, t) {
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r}, ${g}, ${b})`;
}
function getBackgroundColor(intensity) {
    if (intensity <= 0) {
        const t = Math.abs(intensity);
        return lerpColor(248, 249, 250, 255, 200, 200, t);
    }
    else {
        return lerpColor(248, 249, 250, 200, 255, 210, intensity);
    }
}
function getTextColor(intensity) {
    if (intensity <= -0.3)
        return '#c0392b';
    if (intensity >= 0.3)
        return '#27ae60';
    return '#1a1a2e';
}
const bgColor = computed(() => getBackgroundColor(colorT.value));
const textColor = computed(() => getTextColor(colorT.value));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            minHeight: '100vh',
            background: __VLS_ctx.bgColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
            transition: 'background 0.1s',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: '#6c757d', fontSize: '14px', marginBottom: '48px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ transform: `scale(${__VLS_ctx.bounce})`, marginBottom: '48px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            fontSize: '120px',
            fontWeight: 800,
            color: __VLS_ctx.textColor,
            lineHeight: 1,
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            transition: 'color 0.3s',
            userSelect: 'none',
        }) },
});
(Math.round(__VLS_ctx.animCount));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ textAlign: 'center', fontSize: '14px', color: '#aaa', marginTop: '8px' }) },
});
(__VLS_ctx.currentCount);
(__VLS_ctx.animCount.toFixed(1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '16px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.Decrement, undefined);
        } },
    ...{ onMousedown: ((e) => e.currentTarget.style.transform = 'scale(0.95)') },
    ...{ onMouseup: ((e) => e.currentTarget.style.transform = 'scale(1)') },
    ...{ onMouseleave: ((e) => e.currentTarget.style.transform = 'scale(1)') },
    ...{ style: ({
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            border: 'none',
            background: '#e63946',
            color: '#fff',
            fontSize: '36px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(230, 57, 70, 0.3)',
            transition: 'transform 0.1s, box-shadow 0.1s',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.Increment, undefined);
        } },
    ...{ onMousedown: ((e) => e.currentTarget.style.transform = 'scale(0.95)') },
    ...{ onMouseup: ((e) => e.currentTarget.style.transform = 'scale(1)') },
    ...{ onMouseleave: ((e) => e.currentTarget.style.transform = 'scale(1)') },
    ...{ style: ({
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            border: 'none',
            background: '#4361ee',
            color: '#fff',
            fontSize: '36px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
            transition: 'transform 0.1s, box-shadow 0.1s',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ marginTop: '48px', color: '#bbb', fontSize: '13px' }) },
});
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Increment: Increment,
            Decrement: Decrement,
            emit: emit,
            currentCount: currentCount,
            animCount: animCount,
            bounce: bounce,
            bgColor: bgColor,
            textColor: textColor,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
