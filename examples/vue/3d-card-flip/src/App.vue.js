import { providePulse, useEmit, useTween, useSpring } from '@pulse/vue';
import { engine, CARDS, anims } from './engine';
providePulse(engine);
const emit = useEmit();
const flipVals = CARDS.map((_, i) => useTween(anims.flipTweens[i]));
const unflipVals = CARDS.map((_, i) => useTween(anims.unflipTweens[i]));
const scales = CARDS.map((_, i) => useSpring(anims.hoverSprings[i]));
function getRotation(index) {
    if (anims.flipTweens[index].active)
        return flipVals[index].value;
    if (anims.unflipTweens[index].active)
        return unflipVals[index].value;
    return anims.flippedStates[index] ? 180 : 0;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ color: '#fff', textAlign: 'center', marginBottom: '32px', fontSize: '28px', fontWeight: 300, letterSpacing: '2px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'grid', gridTemplateColumns: 'repeat(4, 260px)', gap: '24px' }) },
});
for (const [card, i] of __VLS_getVForSourceType((__VLS_ctx.CARDS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.anims.CardClicked, i);
            } },
        ...{ onMouseenter: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.anims.HoverIn, i);
            } },
        ...{ onMouseleave: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.anims.HoverOut, i);
            } },
        key: (i),
        ...{ style: ({ perspective: '1000px', width: '260px', height: '340px', cursor: 'pointer' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                width: '100%',
                height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transform: `scale(${__VLS_ctx.scales[i].value}) rotateY(${__VLS_ctx.getRotation(i)}deg)`,
                transition: 'box-shadow 0.2s',
                borderRadius: '16px',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                position: 'absolute',
                inset: '0',
                backfaceVisibility: 'hidden',
                borderRadius: '16px',
                background: `linear-gradient(145deg, ${card.color}dd, ${card.color}88)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                padding: '24px',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                width: '140px',
                height: '140px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${card.color}44, ${card.color})`,
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                marginBottom: '20px',
            }) },
    });
    (card.title[0]);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ style: ({ color: '#fff', fontSize: '22px', fontWeight: 700, letterSpacing: '1px' }) },
    });
    (card.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                position: 'absolute',
                inset: '0',
                backfaceVisibility: 'hidden',
                borderRadius: '16px',
                background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
                transform: 'rotateY(180deg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                padding: '24px',
                gap: '16px',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ style: ({ color: card.color, fontSize: '20px', fontWeight: 700 }) },
    });
    (card.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: ({ color: '#ccc', fontSize: '14px', textAlign: 'center', lineHeight: 1.6, maxWidth: '200px' }) },
    });
    (card.desc);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ display: 'flex', gap: '24px', marginTop: '8px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ textAlign: 'center' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: card.color, fontSize: '24px', fontWeight: 700 }) },
    });
    (card.views.toLocaleString());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ textAlign: 'center' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: card.color, fontSize: '24px', fontWeight: 700 }) },
    });
    (card.likes.toLocaleString());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }) },
    });
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            CARDS: CARDS,
            anims: anims,
            emit: emit,
            scales: scales,
            getRotation: getRotation,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
