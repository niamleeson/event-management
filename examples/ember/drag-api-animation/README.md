# Ember + Pulse: Drag API Animation

Demonstrates a Kanban board with spring-based drag physics, async save to server, error shake animation, and undo support.

## Pulse Concepts Used

- **Events**: `CardMoved`, `DragStarted`, `DragUpdated`, `DragEnded`, `SavePending`, `SaveDone`, `SaveError`, `UndoRequested`, `ShakeStart`
- **Async**: Simulated server save with `strategy: 'latest'` and ~15% failure rate
- **Spring**: `dragSpringX` follows pointer position with physics (stiffness/damping)
- **Tween**: `shakeTween` drives error shake animation
- **Pipe**: `SaveError` -> `ShakeStart` triggers shake on save failure
- **Signals**: `boardCards`, `dragState`, `isSaving`, `saveError`, `canUndo`
- **TrackedSpring**: Bridges spring physics into Ember autotracking
- **TrackedTween**: Bridges shake animation into Ember autotracking

## Integration Pattern

1. `engine.ts` wires the full event graph: drag, move, async save, error handling, undo
2. Component uses `TrackedSpring` for physics-based drag following
3. `TrackedTween` drives the error shake as an oscillating CSS transform
4. Move history is maintained for undo support

## Running with Ember CLI

1. Generate a new Ember app: `npx ember-cli new my-app --embroider`
2. Install deps: `pnpm add @pulse/core @pulse/ember`
3. Copy `src/engine.ts` and component files into your app
