import { onMounted, onUnmounted } from 'vue';
import { providePulse, useSignal, useEmit } from '@pulse/vue';
import { engine, feedRunning, FeedToggled, startFeed, stopFeed, } from './engine';
import MetricCards from './MetricCards.vue';
import ChartPanel from './ChartPanel.vue';
import AlertPanel from './AlertPanel.vue';
providePulse(engine);
const emit = useEmit();
const running = useSignal(feedRunning);
onMounted(() => startFeed());
onUnmounted(() => stopFeed());
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            minHeight: '100vh',
            background: '#0a0a1a',
            padding: '32px 24px',
            fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
            color: '#e2e8f0',
        }) },
});
const __VLS_0 = (('style'));
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1100px',
            margin: '0 auto 32px',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ fontSize: '32px', fontWeight: 800, color: '#f1f5f9', margin: 0 }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
    ...{ style: ({
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: __VLS_ctx.running ? '#10b981' : '#64748b',
            marginRight: '8px',
            animation: __VLS_ctx.running ? 'pulse 2s infinite' : 'none',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: '#64748b', fontSize: '13px', marginTop: '2px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.FeedToggled, !__VLS_ctx.running);
        } },
    ...{ style: ({
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            background: __VLS_ctx.running ? '#ef4444' : '#10b981',
            color: '#fff',
            transition: 'background 0.2s',
        }) },
});
(__VLS_ctx.running ? 'Pause Feed' : 'Resume Feed');
/** @type {[typeof MetricCards, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(MetricCards, new MetricCards({}));
const __VLS_5 = __VLS_4({}, ...__VLS_functionalComponentArgsRest(__VLS_4));
/** @type {[typeof ChartPanel, ]} */ ;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent(ChartPanel, new ChartPanel({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {[typeof AlertPanel, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(AlertPanel, new AlertPanel({}));
const __VLS_11 = __VLS_10({}, ...__VLS_functionalComponentArgsRest(__VLS_10));
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            FeedToggled: FeedToggled,
            MetricCards: MetricCards,
            ChartPanel: ChartPanel,
            AlertPanel: AlertPanel,
            emit: emit,
            running: running,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
