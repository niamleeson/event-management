import { createEngine } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------
export const Increment = engine.event('Increment');
export const Decrement = engine.event('Decrement');
export const CountChanged = engine.event('CountChanged');
export const BounceStart = engine.event('BounceStart');
export const BounceDone = engine.event('BounceDone');
export const CountAnimStart = engine.event('CountAnimStart');
export const CountAnimDone = engine.event('CountAnimDone');
export const ColorAnimStart = engine.event('ColorAnimStart');
// ---------------------------------------------------------------------------
// Pipes: Increment/Decrement -> CountChanged
// ---------------------------------------------------------------------------
engine.pipe(Increment, [CountChanged, BounceStart], () => {
    const next = count.value + 1;
    return [next, 'inc'];
});
engine.pipe(Decrement, [CountChanged, BounceStart], () => {
    const next = count.value - 1;
    return [next, 'dec'];
});
// Whenever count changes, fire animation start events
engine.pipe(CountChanged, [CountAnimStart, ColorAnimStart], () => [
    undefined,
    undefined,
]);
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
export const count = engine.signal(CountChanged, 0, (_prev, value) => value);
// ---------------------------------------------------------------------------
// Tweens
// ---------------------------------------------------------------------------
// Animated count that smoothly interpolates toward current count value
export const animatedCount = engine.tween({
    start: CountAnimStart,
    done: CountAnimDone,
    from: () => animatedCount.value,
    to: () => count.value,
    duration: 400,
    easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
});
// Background color intensity: interpolates based on count sign
// 0 = neutral, positive = more green, negative = more red
export const colorIntensity = engine.tween({
    start: ColorAnimStart,
    from: () => colorIntensity.value,
    to: () => Math.max(-1, Math.min(1, count.value / 10)),
    duration: 600,
    easing: (t) => t * (2 - t), // easeOutQuad
});
// Bounce animation for button press feedback
export const bounceScale = engine.tween({
    start: BounceStart,
    done: BounceDone,
    from: 1.3,
    to: 1,
    duration: 300,
    easing: (t) => {
        // Elastic ease-out for bouncy effect
        const p = 0.4;
        return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
    },
});
// Start the frame loop so tweens animate
engine.startFrameLoop();
