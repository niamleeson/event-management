import { createEngine } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const CARD_COUNT = 6;
export const CARDS = [
    { id: 0, title: 'Lightning Fast', description: 'Reactive event-driven architecture for blazing performance', color: '#4361ee', icon: '\u26A1' },
    { id: 1, title: 'Type Safe', description: 'Full TypeScript support with precise type inference', color: '#7209b7', icon: '\uD83D\uDEE1' },
    { id: 2, title: 'Composable', description: 'Build complex flows from simple, reusable primitives', color: '#f72585', icon: '\uD83E\uDDE9' },
    { id: 3, title: 'Animated', description: 'Built-in tweens and springs for fluid animations', color: '#4cc9f0', icon: '\u2728' },
    { id: 4, title: 'Async Ready', description: 'First-class async handling with cancellation and retry', color: '#2a9d8f', icon: '\uD83D\uDD04' },
    { id: 5, title: 'Framework Agnostic', description: 'Works with React, Vue, Solid, and more', color: '#e76f51', icon: '\uD83C\uDF10' },
];
// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------
export const PageLoaded = engine.event('PageLoaded');
export const AllCardsEntered = engine.event('AllCardsEntered');
export const WelcomeFadeStart = engine.event('WelcomeFadeStart');
export const WelcomeFadeDone = engine.event('WelcomeFadeDone');
// Per-card events
export const CardEnter = [];
export const CardEntered = [];
export const HoverCard = [];
export const UnhoverCard = [];
for (let i = 0; i < CARD_COUNT; i++) {
    CardEnter.push(engine.event(`CardEnter_${i}`));
    CardEntered.push(engine.event(`CardEntered_${i}`));
    HoverCard.push(engine.event(`HoverCard_${i}`));
    UnhoverCard.push(engine.event(`UnhoverCard_${i}`));
}
// ---------------------------------------------------------------------------
// Pipe: PageLoaded -> staggered CardEnter events
// Each card fires after a delay, creating a cascade effect
// ---------------------------------------------------------------------------
engine.on(PageLoaded, () => {
    for (let i = 0; i < CARD_COUNT; i++) {
        setTimeout(() => {
            engine.emit(CardEnter[i], i);
        }, i * 150); // 150ms stagger between each card
    }
});
// ---------------------------------------------------------------------------
// Per-card tweens: opacity and translateY for entrance
// ---------------------------------------------------------------------------
export const cardOpacity = [];
export const cardTranslateY = [];
export const cardHoverScale = [];
export const cardHoverShadow = [];
for (let i = 0; i < CARD_COUNT; i++) {
    // Entrance opacity: 0 -> 1
    const opacity = engine.tween({
        start: CardEnter[i],
        done: CardEntered[i],
        from: 0,
        to: 1,
        duration: 500,
        easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
    });
    cardOpacity.push(opacity);
    // Entrance translateY: 40px -> 0px
    const translateY = engine.tween({
        start: CardEnter[i],
        from: 40,
        to: 0,
        duration: 500,
        easing: (t) => 1 - Math.pow(1 - t, 3),
    });
    cardTranslateY.push(translateY);
    // Hover scale: driven by hover/unhover events
    const scale = engine.tween({
        start: HoverCard[i],
        cancel: UnhoverCard[i],
        from: 1,
        to: 1.05,
        duration: 200,
        easing: (t) => t * (2 - t), // easeOutQuad
    });
    cardHoverScale.push(scale);
    // Hover shadow: spring-driven for smooth tracking
    const hoverSignal = engine.signal(HoverCard[i], 0, () => 20);
    engine.signalUpdate(hoverSignal, UnhoverCard[i], () => 0);
    const shadow = engine.spring(hoverSignal, {
        stiffness: 300,
        damping: 20,
        restThreshold: 0.1,
    });
    cardHoverShadow.push(shadow);
}
// ---------------------------------------------------------------------------
// Join: all CardEntered -> AllCardsEntered
// Fires when every card has completed its entrance animation
// ---------------------------------------------------------------------------
engine.join(CardEntered, AllCardsEntered, {
    do: () => undefined,
});
// After all cards enter, trigger welcome fade
engine.pipe(AllCardsEntered, WelcomeFadeStart, () => undefined);
// ---------------------------------------------------------------------------
// Welcome message tween
// ---------------------------------------------------------------------------
export const welcomeOpacity = engine.tween({
    start: WelcomeFadeStart,
    done: WelcomeFadeDone,
    from: 0,
    to: 1,
    duration: 800,
    easing: (t) => t * t * (3 - 2 * t), // smoothstep
});
export const welcomeTranslateY = engine.tween({
    start: WelcomeFadeStart,
    from: 20,
    to: 0,
    duration: 800,
    easing: (t) => 1 - Math.pow(1 - t, 3),
});
// ---------------------------------------------------------------------------
// Signals to track state
// ---------------------------------------------------------------------------
export const allEntered = engine.signal(AllCardsEntered, false, () => true);
// Start the frame loop for animations
engine.startFrameLoop();
