# Ember + Pulse: Simple Animation

Demonstrates `TrackedTween` for smooth animated counter display, plus an Ember Modifier for applying tween values to DOM elements.

## Pulse Concepts Used

- **Events**: `IncrementClicked`, `DecrementClicked`, `ResetClicked`, `TweenStart`, `TweenDone`
- **Signal**: `count` (discrete value)
- **Tween**: `displayTween` animates from previous value to current count
- **TrackedTween**: Bridges tween into Ember autotracking (value, active, progress)
- **Frame loop**: `engine.startFrameLoop()` drives tween updates

## Integration Pattern

1. `engine.ts` sets up tween with `from`/`to` getter functions
2. Component creates `TrackedTween` via `pulse.createTween(displayTween)`
3. Template reads `{{this.tweenedDisplay.value}}` — updates every animation frame
4. The `animate-value` modifier shows how to apply tween values directly to DOM styles

## Running with Ember CLI

1. Generate a new Ember app: `npx ember-cli new my-app --embroider`
2. Install deps: `pnpm add @pulse/core @pulse/ember ember-modifier`
3. Copy `src/engine.ts` into your app
4. Register the modifier in `app/modifiers/animate-value.ts`
5. Copy component logic into `app/components/`
