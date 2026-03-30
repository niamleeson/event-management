import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { useEmit, useSignal, useSpring, useTween } from '@pulse/react';
import { engine } from './engine';
/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */
const MouseMove = engine.event('MouseMove');
const SceneLoaded = engine.event('SceneLoaded');
const LayerAnimDone = engine.event('LayerAnimDone');
const DayNightToggle = engine.event('DayNightToggle');
const DayNightDone = engine.event('DayNightDone');
// Entrance events per layer
const layerEnterEvents = Array.from({ length: 5 }, (_, i) => engine.event(`LayerEnter_${i}`));
const layerEnterDoneEvents = Array.from({ length: 5 }, (_, i) => engine.event(`LayerEnterDone_${i}`));
// Cloud float events
const CloudFloatStart = engine.event('CloudFloatStart');
const CloudFloatDone = engine.event('CloudFloatDone');
/* ------------------------------------------------------------------ */
/*  Mouse-driven camera                                               */
/* ------------------------------------------------------------------ */
const mouseXTarget = engine.signal(MouseMove, 0, (_prev, { x }) => (x - 0.5) * 15);
const mouseYTarget = engine.signal(MouseMove, 0, (_prev, { y }) => (y - 0.5) * 10);
const cameraRotYSpring = engine.spring(mouseXTarget, { stiffness: 50, damping: 15 });
const cameraRotXSpring = engine.spring(mouseYTarget, { stiffness: 50, damping: 15 });
/* ------------------------------------------------------------------ */
/*  Entrance animation: staggered layer fade-in                       */
/* ------------------------------------------------------------------ */
const layerOpacityTweens = layerEnterEvents.map((startEvt, i) => engine.tween({
    start: startEvt,
    done: layerEnterDoneEvents[i],
    from: 0,
    to: 1,
    duration: 800,
    easing: 'easeOut',
}));
// When each layer enter done, emit LayerAnimDone
layerEnterDoneEvents.forEach((evt, i) => {
    engine.on(evt, () => engine.emit(LayerAnimDone, i));
});
// Join: all layers done -> SceneLoaded
engine.join(layerEnterDoneEvents, SceneLoaded, { do: () => undefined });
// Stagger trigger: fire entrance events with delay via frame counting
let entranceTriggered = false;
let entranceFrame = 0;
engine.on(engine.frame, () => {
    if (entranceTriggered)
        return;
    entranceFrame++;
    // Trigger each layer at staggered intervals (every 10 frames ~166ms)
    for (let i = 0; i < 5; i++) {
        if (entranceFrame === 10 + i * 15) {
            engine.emit(layerEnterEvents[i], undefined);
        }
    }
    if (entranceFrame > 10 + 4 * 15 + 60) {
        entranceTriggered = true;
    }
});
/* ------------------------------------------------------------------ */
/*  Day/night toggle                                                  */
/* ------------------------------------------------------------------ */
const isNight = engine.signal(DayNightToggle, false, (prev) => !prev);
const dayNightTween = engine.tween({
    start: DayNightToggle,
    done: DayNightDone,
    from: () => isNight.value ? 1 : 0,
    to: () => isNight.value ? 0 : 1,
    duration: 1500,
    easing: 'easeInOut',
});
/* ------------------------------------------------------------------ */
/*  Floating clouds tween (continuous)                                */
/* ------------------------------------------------------------------ */
const cloudFloat = engine.tween({
    start: CloudFloatStart,
    done: CloudFloatDone,
    from: -20,
    to: 20,
    duration: 4000,
    easing: 'easeInOut',
});
// Restart cloud float with reverse direction
let cloudDirection = 1;
engine.on(CloudFloatDone, () => {
    cloudDirection *= -1;
    // We need to create a new approach: just restart by emitting again
    // The tween will snap from/to so we toggle the approach
    engine.emit(CloudFloatStart, undefined);
});
// Kick off cloud float
setTimeout(() => engine.emit(CloudFloatStart, undefined), 500);
const LAYERS = [
    { z: -500, dayBg: 'linear-gradient(180deg, #74b9ff 0%, #a29bfe 50%, #dfe6e9 100%)', nightBg: 'linear-gradient(180deg, #0c0c1d 0%, #1a1a3e 50%, #2d3436 100%)', content: 'sky' },
    { z: -400, dayBg: 'transparent', nightBg: 'transparent', content: 'far-mountains' },
    { z: -250, dayBg: 'transparent', nightBg: 'transparent', content: 'near-mountains' },
    { z: -150, dayBg: 'transparent', nightBg: 'transparent', content: 'clouds' },
    { z: -100, dayBg: 'transparent', nightBg: 'transparent', content: 'trees' },
];
/* ------------------------------------------------------------------ */
/*  Layer rendering helpers                                           */
/* ------------------------------------------------------------------ */
function SkyLayer({ nightBlend }) {
    const dayColor1 = [116, 185, 255];
    const dayColor2 = [223, 230, 233];
    const nightColor1 = [12, 12, 29];
    const nightColor2 = [45, 52, 54];
    const c1 = dayColor1.map((d, i) => Math.round(d + (nightColor1[i] - d) * nightBlend));
    const c2 = dayColor2.map((d, i) => Math.round(d + (nightColor2[i] - d) * nightBlend));
    return (_jsx("div", { style: {
            position: 'absolute', inset: 0,
            background: `linear-gradient(180deg, rgb(${c1.join(',')}) 0%, rgb(${c2.join(',')}) 100%)`,
        }, children: nightBlend > 0.3 && Array.from({ length: 40 }, (_, i) => (_jsx("div", { style: {
                position: 'absolute',
                left: `${(i * 37 + 13) % 100}%`,
                top: `${(i * 23 + 7) % 60}%`,
                width: 2, height: 2, borderRadius: '50%',
                background: '#fff',
                opacity: Math.max(0, (nightBlend - 0.3) / 0.7) * (0.3 + (i % 3) * 0.3),
            } }, i))) }));
}
function FarMountains({ nightBlend }) {
    const r = Math.round(108 + (30 - 108) * nightBlend);
    const g = Math.round(92 + (30 - 92) * nightBlend);
    const b = Math.round(231 + (60 - 231) * nightBlend);
    return (_jsx("div", { style: { position: 'absolute', bottom: 0, left: '-10%', right: '-10%', height: '60%' }, children: _jsx("svg", { viewBox: "0 0 1200 400", preserveAspectRatio: "none", style: { width: '100%', height: '100%' }, children: _jsx("path", { d: `M0,400 L0,280 Q150,120 300,200 Q450,80 600,180 Q750,60 900,160 Q1050,100 1200,220 L1200,400 Z`, fill: `rgb(${r},${g},${b})` }) }) }));
}
function NearMountains({ nightBlend }) {
    const r = Math.round(85 + (20 - 85) * nightBlend);
    const g = Math.round(239 + (40 - 239) * nightBlend);
    const b = Math.round(196 + (50 - 196) * nightBlend);
    return (_jsx("div", { style: { position: 'absolute', bottom: 0, left: '-10%', right: '-10%', height: '50%' }, children: _jsx("svg", { viewBox: "0 0 1200 400", preserveAspectRatio: "none", style: { width: '100%', height: '100%' }, children: _jsx("path", { d: `M0,400 L0,300 Q100,180 250,250 Q400,120 550,220 Q700,140 850,200 Q1000,150 1200,260 L1200,400 Z`, fill: `rgb(${r},${g},${b})` }) }) }));
}
function Clouds({ nightBlend, floatOffset }) {
    const opacity = Math.max(0.2, 1 - nightBlend * 0.7);
    const clouds = [
        { left: '10%', top: '15%', w: 180, h: 60 },
        { left: '55%', top: '25%', w: 220, h: 70 },
        { left: '75%', top: '10%', w: 150, h: 50 },
        { left: '30%', top: '35%', w: 200, h: 55 },
    ];
    return (_jsx("div", { style: { position: 'absolute', inset: 0 }, children: clouds.map((c, i) => (_jsx("div", { style: {
                position: 'absolute',
                left: c.left,
                top: c.top,
                width: c.w,
                height: c.h,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, rgba(255,255,255,${opacity * 0.8}) 0%, rgba(255,255,255,${opacity * 0.2}) 70%, transparent 100%)`,
                transform: `translateY(${floatOffset * (i % 2 === 0 ? 1 : -0.7)}px)`,
                filter: `blur(${2 + i}px)`,
            } }, i))) }));
}
function Trees({ nightBlend }) {
    const r = Math.round(0 + (10 - 0) * nightBlend);
    const g = Math.round(148 + (30 - 148) * nightBlend);
    const b = Math.round(50 + (20 - 50) * nightBlend);
    return (_jsx("div", { style: { position: 'absolute', bottom: 0, left: '-10%', right: '-10%', height: '35%' }, children: _jsxs("svg", { viewBox: "0 0 1200 300", preserveAspectRatio: "none", style: { width: '100%', height: '100%' }, children: [_jsx("path", { d: `M0,300 L0,200 L30,120 L60,200 L80,100 L110,200 L140,140 L170,200 L200,80 L230,200 L260,150 L290,200 L320,110 L350,200 L380,130 L410,200 L440,90 L470,200 L500,160 L530,200 L560,100 L590,200 L620,140 L650,200 L680,70 L710,200 L740,150 L770,200 L800,120 L830,200 L860,90 L890,200 L920,160 L950,200 L980,110 L1010,200 L1040,130 L1070,200 L1100,80 L1130,200 L1160,140 L1200,200 L1200,300 Z`, fill: `rgb(${r},${g},${b})` }), _jsx("rect", { x: "0", y: "200", width: "1200", height: "100", fill: `rgb(${Math.round(34 + (10 - 34) * nightBlend)},${Math.round(139 + (20 - 139) * nightBlend)},${Math.round(34 + (10 - 34) * nightBlend)})` })] }) }));
}
/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */
export default function App() {
    const emit = useEmit();
    const camRotX = useSpring(cameraRotXSpring);
    const camRotY = useSpring(cameraRotYSpring);
    const night = useSignal(isNight);
    const nightBlend = useTween(dayNightTween);
    const cloudFloatVal = useTween(cloudFloat);
    const layerOpacities = [
        useTween(layerOpacityTweens[0]),
        useTween(layerOpacityTweens[1]),
        useTween(layerOpacityTweens[2]),
        useTween(layerOpacityTweens[3]),
        useTween(layerOpacityTweens[4]),
    ];
    // Compute actual night blend: if tween is active use it, otherwise use static
    const actualNight = dayNightTween.active ? nightBlend : (night ? 1 : 0);
    const onMouseMove = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        emit(MouseMove, { x, y });
    }, [emit]);
    const contentRenderers = {
        sky: (nb) => _jsx(SkyLayer, { nightBlend: nb }),
        'far-mountains': (nb) => _jsx(FarMountains, { nightBlend: nb }),
        'near-mountains': (nb) => _jsx(NearMountains, { nightBlend: nb }),
        clouds: (nb, cf) => _jsx(Clouds, { nightBlend: nb, floatOffset: cf }),
        trees: (nb) => _jsx(Trees, { nightBlend: nb }),
    };
    return (_jsxs("div", { onMouseMove: onMouseMove, style: {
            width: '100%',
            height: '100%',
            perspective: 1000,
            overflow: 'hidden',
            cursor: 'crosshair',
        }, children: [_jsx("div", { style: {
                    width: '100%',
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    transform: `rotateX(${camRotX}deg) rotateY(${camRotY}deg)`,
                }, children: LAYERS.map((layer, i) => (_jsx("div", { style: {
                        position: 'absolute',
                        inset: '-20%',
                        transform: `translateZ(${layer.z}px)`,
                        opacity: layerOpacityTweens[i].active ? layerOpacities[i] : (entranceTriggered ? 1 : 0),
                    }, children: contentRenderers[layer.content](actualNight, cloudFloatVal) }, i))) }), _jsxs("div", { style: {
                    position: 'absolute',
                    top: 24,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 24,
                    zIndex: 10,
                }, children: [_jsx("h1", { style: { color: '#fff', fontSize: 22, fontWeight: 300, letterSpacing: 2, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }, children: "3D Layered Parallax" }), _jsx("button", { onClick: () => emit(DayNightToggle, undefined), style: {
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: '#fff',
                            padding: '8px 20px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            letterSpacing: 1,
                            backdropFilter: 'blur(4px)',
                        }, children: night ? '\u2600 Day' : '\u263E Night' })] }), _jsx("div", { style: {
                    position: 'absolute',
                    bottom: 24,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 13,
                    zIndex: 10,
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }, children: "Move mouse to tilt scene" })] }));
}
