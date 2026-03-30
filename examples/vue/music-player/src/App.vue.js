import { providePulse, useEmit, useSignal } from '@pulse/vue';
import { engine, PLAYLIST, Play, Pause, NextTrack, PrevTrack, SelectTrack, currentTrack, isPlaying, progress, visualizerBars, albumRotation, VisualizerUpdated, } from './engine';
providePulse(engine);
const emit = useEmit();
const track = useSignal(currentTrack);
const playing = useSignal(isPlaying);
const prog = useSignal(progress);
const rotation = useSignal(albumRotation);
// Force re-render on visualizer update
const vizKey = useSignal(engine.signal(VisualizerUpdated, 0, (prev) => prev + 1));
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}
const current = () => PLAYLIST[track.value];
const elapsed = () => prog.value * current().duration;
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ width: '420px', display: 'flex', flexDirection: 'column', gap: '24px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', justifyContent: 'center' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            width: '200px', height: '200px', borderRadius: '50%',
            background: `linear-gradient(145deg, ${__VLS_ctx.current().color}cc, ${__VLS_ctx.current().color}66)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `rotate(${__VLS_ctx.rotation}deg)`,
            boxShadow: `0 0 40px ${__VLS_ctx.current().color}44`,
            border: '4px solid rgba(255,255,255,0.1)',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ style: ({ width: '40px', height: '40px', borderRadius: '50%', background: '#1a1a2e', border: '2px solid rgba(255,255,255,0.1)' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ textAlign: 'center' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ style: ({ color: '#fff', fontSize: '22px', fontWeight: 700 }) },
});
(__VLS_ctx.current().title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: '#888', fontSize: '14px', marginTop: '4px' }) },
});
(__VLS_ctx.current().artist);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', alignItems: 'flex-end', height: '80px', gap: '2px', padding: '0 10px' }) },
});
for (const [_, i] of __VLS_getVForSourceType((32))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        key: (i + '-' + __VLS_ctx.vizKey),
        ...{ style: ({
                flex: 1, borderRadius: '2px 2px 0 0',
                height: `${Math.max(4, __VLS_ctx.visualizerBars[i] * 80)}px`,
                background: `linear-gradient(to top, ${__VLS_ctx.current().color}88, ${__VLS_ctx.current().color})`,
                transition: 'height 0.05s',
            }) },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ padding: '0 10px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ style: ({ height: '100%', width: `${__VLS_ctx.prog * 100}%`, background: __VLS_ctx.current().color, borderRadius: '2px', transition: 'width 0.1s' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: ({ color: '#888', fontSize: '12px' }) },
});
(__VLS_ctx.formatTime(__VLS_ctx.elapsed()));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: ({ color: '#888', fontSize: '12px' }) },
});
(__VLS_ctx.formatTime(__VLS_ctx.current().duration));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', justifyContent: 'center', gap: '24px', alignItems: 'center' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.PrevTrack, undefined);
        } },
    ...{ style: ({ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.playing ? __VLS_ctx.emit(__VLS_ctx.Pause, undefined) : __VLS_ctx.emit(__VLS_ctx.Play, undefined);
        } },
    ...{ style: ({
            width: '56px', height: '56px', borderRadius: '50%',
            background: __VLS_ctx.current().color, border: 'none', color: '#fff',
            fontSize: '20px', cursor: 'pointer',
            boxShadow: `0 4px 20px ${__VLS_ctx.current().color}66`,
        }) },
});
(__VLS_ctx.playing ? '\u23F8' : '\u25B6');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit(__VLS_ctx.NextTrack, undefined);
        } },
    ...{ style: ({ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', flexDirection: 'column', gap: '4px' }) },
});
for (const [t, i] of __VLS_getVForSourceType((__VLS_ctx.PLAYLIST))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.SelectTrack, i);
            } },
        key: (i),
        ...{ style: ({
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                background: __VLS_ctx.track === i ? `${t.color}22` : 'transparent',
                borderRadius: '8px', cursor: 'pointer',
                border: __VLS_ctx.track === i ? `1px solid ${t.color}44` : '1px solid transparent',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ style: ({ width: '8px', height: '8px', borderRadius: '50%', background: __VLS_ctx.track === i ? t.color : '#555' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ flex: 1 }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: __VLS_ctx.track === i ? t.color : '#ccc', fontSize: '14px', fontWeight: __VLS_ctx.track === i ? 600 : 400 }) },
    });
    (t.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: '#666', fontSize: '12px' }) },
    });
    (t.artist);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: '#666', fontSize: '12px' }) },
    });
    (__VLS_ctx.formatTime(t.duration));
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PLAYLIST: PLAYLIST,
            Play: Play,
            Pause: Pause,
            NextTrack: NextTrack,
            PrevTrack: PrevTrack,
            SelectTrack: SelectTrack,
            visualizerBars: visualizerBars,
            emit: emit,
            track: track,
            playing: playing,
            prog: prog,
            rotation: rotation,
            vizKey: vizKey,
            formatTime: formatTime,
            current: current,
            elapsed: elapsed,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
