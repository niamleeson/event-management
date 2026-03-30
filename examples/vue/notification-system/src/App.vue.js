import { providePulse, useEmit, useSignal, useTween, useSpring } from '@pulse/vue';
import { engine, AddNotification, DismissNotification, FloodNotifications, notifications, entranceTweens, reflowSprings, PRIORITY_COLORS, PRIORITY_ICONS, } from './engine';
providePulse(engine);
const emit = useEmit();
const notifs = useSignal(notifications);
const entranceVals = Array.from({ length: 20 }, (_, i) => useTween(entranceTweens[i]));
const reflowVals = Array.from({ length: 20 }, (_, i) => useSpring(reflowSprings[i]));
const DEMO_TYPES = [
    { priority: 'info', title: 'Info', message: 'This is an informational notification.' },
    { priority: 'success', title: 'Success', message: 'Operation completed successfully!' },
    { priority: 'warning', title: 'Warning', message: 'Please review your settings.' },
    { priority: 'error', title: 'Error', message: 'Something went wrong. Please try again.' },
];
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ padding: '40px', position: 'relative', minHeight: '100vh' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ maxWidth: '600px', margin: '0 auto' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px', marginBottom: '24px', textAlign: 'center' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }) },
});
for (const [demo] of __VLS_getVForSourceType((__VLS_ctx.DEMO_TYPES))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.AddNotification, demo);
            } },
        key: (demo.priority),
        ...{ style: ({
                background: __VLS_ctx.PRIORITY_COLORS[demo.priority],
                border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            }) },
    });
    (demo.priority);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ textAlign: 'center' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.FloodNotifications, undefined);
        } },
    ...{ style: ({
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', padding: '10px 24px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '14px', letterSpacing: '1px',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '24px', fontSize: '13px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ position: 'fixed', top: '20px', right: '20px', width: '340px', zIndex: 1000 }) },
});
for (const [notif, i] of __VLS_getVForSourceType((__VLS_ctx.notifs))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (notif.id),
        ...{ style: ({
                position: 'absolute',
                top: `${__VLS_ctx.reflowVals[i % 20].value}px`,
                right: '0',
                width: '100%',
                transform: `translateX(${i === 0 ? __VLS_ctx.entranceVals[0].value : 0}%)`,
                background: '#16213e',
                borderRadius: '10px',
                padding: '14px 16px',
                borderLeft: `4px solid ${__VLS_ctx.PRIORITY_COLORS[notif.priority]}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                width: '28px', height: '28px', borderRadius: '50%',
                background: `${__VLS_ctx.PRIORITY_COLORS[notif.priority]}22`,
                color: __VLS_ctx.PRIORITY_COLORS[notif.priority],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, flexShrink: 0,
            }) },
    });
    (__VLS_ctx.PRIORITY_ICONS[notif.priority]);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ flex: 1, minWidth: 0 }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: '#fff', fontSize: '14px', fontWeight: 600 }) },
    });
    (notif.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: '#888', fontSize: '12px', marginTop: '2px' }) },
    });
    (notif.message);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.DismissNotification, notif.id);
            } },
        ...{ style: ({
                background: 'none', border: 'none', color: '#555', fontSize: '16px',
                cursor: 'pointer', padding: '0 4px', lineHeight: 1,
            }) },
    });
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AddNotification: AddNotification,
            DismissNotification: DismissNotification,
            FloodNotifications: FloodNotifications,
            PRIORITY_COLORS: PRIORITY_COLORS,
            PRIORITY_ICONS: PRIORITY_ICONS,
            emit: emit,
            notifs: notifs,
            entranceVals: entranceVals,
            reflowVals: reflowVals,
            DEMO_TYPES: DEMO_TYPES,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
