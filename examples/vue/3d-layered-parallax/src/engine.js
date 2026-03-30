import { createEngine } from '@pulse/core';
export const engine = createEngine();
engine.startFrameLoop();
/* ------------------------------------------------------------------ */
/*  Layer data                                                        */
/* ------------------------------------------------------------------ */
export const LAYERS = [
    { depth: -200, color: '#1a1a3e', label: 'Stars', opacity: 0.3 },
    { depth: -150, color: '#2d1b69', label: 'Mountains', opacity: 0.5 },
    { depth: -100, color: '#3d2b7a', label: 'Hills', opacity: 0.7 },
    { depth: -50, color: '#4e3d8b', label: 'Trees', opacity: 0.85 },
    { depth: 0, color: '#5f4f9c', label: 'Ground', opacity: 1.0 },
];
/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */
export const MouseMoved = engine.event('MouseMoved');
export const SceneEnter = engine.event('SceneEnter');
export const ToggleDayNight = engine.event('ToggleDayNight');
export const DayNightChanged = engine.event('DayNightChanged');
/* ------------------------------------------------------------------ */
/*  Camera tilt signals + springs (mouse-driven)                      */
/* ------------------------------------------------------------------ */
export const tiltXTarget = engine.signal(MouseMoved, 0, (_prev, { y }) => (y - 0.5) * 15);
export const tiltYTarget = engine.signal(MouseMoved, 0, (_prev, { x }) => (x - 0.5) * 15);
export const tiltXSpring = engine.spring(tiltXTarget, { stiffness: 60, damping: 14 });
export const tiltYSpring = engine.spring(tiltYTarget, { stiffness: 60, damping: 14 });
/* ------------------------------------------------------------------ */
/*  Day/Night toggle                                                  */
/* ------------------------------------------------------------------ */
export const isNight = engine.signal(ToggleDayNight, true, (prev) => !prev);
// Tween for day/night transition (0=day, 1=night)
const DayNightTweenStart = engine.event('DayNightTweenStart');
engine.pipe(ToggleDayNight, DayNightTweenStart, () => undefined);
export const nightAmount = engine.tween({
    start: DayNightTweenStart,
    from: () => nightAmount.value,
    to: () => isNight.value ? 1 : 0,
    duration: 1200,
    easing: (t) => t * t * (3 - 2 * t),
});
/* ------------------------------------------------------------------ */
/*  Entrance stagger tweens                                           */
/* ------------------------------------------------------------------ */
export const layerEntrance = [];
for (let i = 0; i < LAYERS.length; i++) {
    const enterStart = engine.event(`LayerEnter_${i}`);
    const tw = engine.tween({
        start: enterStart,
        from: 0,
        to: 1,
        duration: 800,
        easing: (t) => 1 - Math.pow(1 - t, 3),
    });
    layerEntrance.push(tw);
    // Stagger entrance after SceneEnter
    engine.on(SceneEnter, () => {
        setTimeout(() => engine.emit(enterStart, undefined), i * 200);
    });
}
