# Ember + Pulse: Todo List

Demonstrates how `TrackedSignal` from `@pulse/ember` drives Ember template re-rendering.

## Pulse Concepts Used

- **Events**: `TodoAdded`, `TodoRemoved`, `TodoToggled`, `TodoTextChanged`, `FilterChanged`, `ValidationResult`
- **Pipe**: Text validation (`TodoTextChanged` -> `ValidationResult`)
- **Signals**: `todoList`, `activeFilter`, `currentText`, `validationState`
- **TrackedSignal**: Wraps each Pulse signal so Ember templates auto-update

## Integration Pattern

1. `engine.ts` defines the Pulse engine, events, pipes, and signals (framework-agnostic)
2. `createPulseService(engine)` creates a shared service instance
3. Components call `pulse.createSignal(...)` to get `TrackedSignal` wrappers
4. Templates read `{{this.trackedSignal.value}}` — Ember's autotracking handles re-renders
5. Actions call `pulse.emit(EventType, payload)` to push data into the event graph

## Running with Ember CLI

1. Generate a new Ember app: `npx ember-cli new my-app --embroider`
2. Install deps: `pnpm add @pulse/core @pulse/ember`
3. Copy `src/engine.ts` to `app/services/pulse-engine.ts`
4. Copy component logic into `app/components/`
5. Register the PulseService in an initializer or use the shared-module pattern shown here
