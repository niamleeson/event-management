import { useTween, useSpring, useEmit } from '@pulse/vue';
import { HoverCard, UnhoverCard, cardOpacity, cardTranslateY, cardHoverScale, cardHoverShadow, } from './engine';
const props = defineProps();
const emit = useEmit();
const opacity = useTween(cardOpacity[props.index]);
const translateY = useTween(cardTranslateY[props.index]);
const scale = useTween(cardHoverScale[props.index]);
const shadowSize = useSpring(cardHoverShadow[props.index]);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onMouseenter: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.HoverCard[__VLS_ctx.index], __VLS_ctx.index);
        } },
    ...{ onMouseleave: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.UnhoverCard[__VLS_ctx.index], __VLS_ctx.index);
        } },
    ...{ style: ({
            opacity: __VLS_ctx.opacity,
            transform: `translateY(${__VLS_ctx.translateY}px) scale(${__VLS_ctx.scale})`,
            background: '#fff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: `0 ${2 + __VLS_ctx.shadowSize * 0.5}px ${8 + __VLS_ctx.shadowSize}px rgba(0,0,0,${0.06 + __VLS_ctx.shadowSize * 0.008})`,
            cursor: 'pointer',
            borderTop: `4px solid ${__VLS_ctx.card.color}`,
            transition: 'box-shadow 0.05s',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ fontSize: '36px', marginBottom: '12px' }) },
});
(__VLS_ctx.card.icon);
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ style: ({
            margin: 0,
            fontSize: '20px',
            fontWeight: 700,
            color: '#1a1a2e',
            marginBottom: '8px',
        }) },
});
(__VLS_ctx.card.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({
            margin: 0,
            fontSize: '14px',
            color: '#6c757d',
            lineHeight: 1.5,
        }) },
});
(__VLS_ctx.card.description);
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            HoverCard: HoverCard,
            UnhoverCard: UnhoverCard,
            emit: emit,
            opacity: opacity,
            translateY: translateY,
            scale: scale,
            shadowSize: shadowSize,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
