# Ember + Pulse: Complex Animation

Demonstrates staggered card entrance with multiple `TrackedTween` instances and the `join` pattern to detect when all cards have entered.

## Pulse Concepts Used

- **Events**: `EntranceTriggered`, per-card `CardStart_N`, per-card `CardDone_N`, `AllCardsEntered`
- **Join**: `engine.join(cardDoneEvents, AllCardsEntered)` fires when every card finishes
- **Tweens**: Each card has 3 tweens (opacity, translateY, scale) with staggered start
- **Signals**: `allEntered`, `isAnimating`
- **TrackedTween**: Each tween property drives Ember template updates per frame

## Integration Pattern

1. `engine.ts` creates per-card events and tweens, wires stagger delays via `setTimeout`
2. Component wraps each card's 3 tweens into `TrackedCard` objects
3. Template reads `{{tc.style}}` which computes CSS from tween values
4. The join pattern fires `AllCardsEntered` only when all 6 cards complete

## Running with Ember CLI

1. Generate a new Ember app: `npx ember-cli new my-app --embroider`
2. Install deps: `pnpm add @pulse/core @pulse/ember`
3. Copy `src/engine.ts` and component files into your app
