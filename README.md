# Pulse: 3-Method Event Engine

**Declarative event-driven state and animation for any JS framework.**

State management libraries are either too simple (just events) or too complex (Redux/MobX/RxJS/XState). Pulse is the sweet spot: events that flow through a DAG, deterministic propagation, works for UI state AND 60fps animation AND async. The entire API is 3 methods: `event`, `emit`, `on`. Everything else is a pattern.

---

## Table of Contents

- [Key Concepts](#key-concepts)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [engine.event(name)](#engineeventname)
  - [engine.emit(type, payload)](#engineemittype-payload)
  - [engine.on(type, handler)](#engineontype-handler)
  - [engine.destroy()](#enginedestroy)
  - [Skip](#skip)
- [Patterns](#patterns)
  - [State Management](#1-state-management)
  - [Animation](#2-animation)
  - [Async](#3-async)
  - [Debounce](#4-debounce)
  - [Computed / Derived](#5-computed--derived)
  - [Conditional](#6-conditional)
- [Framework Adapters](#framework-adapters)
  - [React](#react)
  - [Vue](#vue)
  - [Solid](#solid)
  - [Angular](#angular)
  - [Ember](#ember)
- [Dart / Flutter](#dart--flutter)
- [DevTools](#devtools)
- [Examples](#examples)
- [Architecture](#architecture)

---

## Key Concepts

### Events are persistent and ref-counted

Events in Pulse are not fire-and-forget callbacks. When you emit an event, it is deposited into a **mailbox** and remains there until every registered handler has processed it. Each event tracks its pending consumers via a ref-count. Only after all consumers have processed the event is it removed and recycled to an object pool.

### Synchronous DAG propagation (glitch-free)

Handlers form a directed acyclic graph based on which events they consume and which events they emit inside their bodies. When an event is emitted, Pulse computes a topological ordering and drains mailboxes in that order. Downstream handlers always see events from upstream handlers in the same propagation cycle -- no glitches, no stale reads, fully deterministic execution.

### DAG is discovered at runtime

You never declare edges manually. The engine traces which handlers emit which events and builds the DAG automatically. Add a handler, and the graph updates.

### Join patterns with on([...])

Pass an array of event types to `on()` and the handler fires only when all of them have pending events. This is barrier synchronization built into the language of the API.

---

## Quick Start

### Install

```bash
npm install @pulse/core
```

### The entire API

```typescript
import { createEngine, Skip } from '@pulse/core'

const engine = createEngine()

// Declare events
const Click = engine.event<{ x: number; y: number }>('Click')
const Highlight = engine.event<string>('Highlight')

// React to clicks by emitting highlights
engine.on(Click, (payload) => {
  engine.emit(Highlight, `Clicked at (${payload.x}, ${payload.y})`)
})

// Side effect: log highlights
engine.on(Highlight, (message) => {
  console.log(message)
})

// Fire
engine.emit(Click, { x: 100, y: 200 })
// logs: "Clicked at (100, 200)"

// Cleanup
engine.destroy()
```

---

## API Reference

### `engine.event<T>(name)`

Declare a named event type. The type parameter `T` defines the payload shape. Event types are channels -- declarations, not instances.

```typescript
event<T = void>(name: string): EventType<T>
```

```typescript
// Void payload (no data)
const Reset = engine.event('Reset')

// Typed payload
const UserLogin = engine.event<{ userId: string; timestamp: number }>('UserLogin')

// Generic payload
const Message = engine.event<string>('Message')
```

The engine appends a unique counter to the name (e.g., `'Click'` becomes `'Click#0'`), so two calls to `engine.event('Click')` produce distinct types.

---

### `engine.emit(type, payload)`

Emit an event. This deposits the event into the mailbox, triggers synchronous DAG propagation, and drains any pending emissions that occur during propagation.

```typescript
emit<T>(type: EventType<T>, payload: T): void
```

```typescript
const Increment = engine.event<number>('Increment')

engine.emit(Increment, 1)
engine.emit(Increment, 5)
```

If `emit` is called while propagation is already in progress (e.g., from inside a handler), the emission is queued and processed after the current propagation cycle completes.

---

### `engine.on(type, handler)`

Subscribe to events. The handler runs as a side effect and can call `engine.emit()` inside to chain events through the DAG. Returns an unsubscribe function.

```typescript
on<T>(type: EventType<T>, handler: (payload: T) => void): () => void
on(types: EventType[], handler: (...payloads: any[]) => void): () => void
```

#### Side effect

```typescript
const Notification = engine.event<string>('Notification')

const unsub = engine.on(Notification, (message) => {
  console.log('Notification:', message)
})

engine.emit(Notification, 'Hello!')
// logs: "Notification: Hello!"

unsub() // stop listening
```

#### Chaining (emit inside a handler)

```typescript
const RawTemp = engine.event<number>('RawTemp')
const Celsius = engine.event<number>('Celsius')

engine.on(RawTemp, (kelvin) => {
  engine.emit(Celsius, kelvin - 273.15)
})
```

#### Conditional (return early)

```typescript
const Keypress = engine.event<string>('Keypress')
const EnterPressed = engine.event<string>('EnterPressed')

engine.on(Keypress, (key) => {
  if (key !== 'Enter') return
  engine.emit(EnterPressed, key)
})
```

#### Async (await then emit)

```typescript
const SearchQuery = engine.event<string>('SearchQuery')
const SearchLoading = engine.event('SearchLoading')
const SearchDone = engine.event<string[]>('SearchDone')
const SearchError = engine.event<Error>('SearchError')

engine.on(SearchQuery, async (query) => {
  engine.emit(SearchLoading, undefined)
  try {
    const res = await fetch(`/api/search?q=${query}`)
    const results = await res.json()
    engine.emit(SearchDone, results)
  } catch (err) {
    engine.emit(SearchError, err as Error)
  }
})
```

#### Join (fires when all input types have events)

```typescript
const Username = engine.event<string>('Username')
const Password = engine.event<string>('Password')
const LoginAttempt = engine.event<{ user: string; pass: string }>('LoginAttempt')

engine.on([Username, Password], (user, pass) => {
  engine.emit(LoginAttempt, { user, pass })
})

engine.emit(Username, 'alice')
// LoginAttempt does NOT fire yet -- waiting for Password
engine.emit(Password, 's3cret')
// LoginAttempt fires with { user: 'alice', pass: 's3cret' }
```

---

### `engine.destroy()`

Full teardown. Removes all handlers, clears all mailboxes, stops all timers, and releases all resources.

```typescript
engine.destroy()
// Engine is now inert. All subscriptions are cleaned up.
```

---

### `Skip`

A sentinel symbol exported from `@pulse/core`. Return it from a handler to indicate that no downstream emission should occur. Useful for conditional logic in patterns where you want to explicitly signal "nothing happened."

```typescript
import { createEngine, Skip } from '@pulse/core'

const engine = createEngine()

const Input = engine.event<number>('Input')
const PositiveOnly = engine.event<number>('PositiveOnly')

engine.on(Input, (value) => {
  if (value <= 0) return Skip
  engine.emit(PositiveOnly, value)
})
```

---

## Patterns

The API is 3 methods. Everything you used to need dedicated operators for is now a pattern inside `on()`.

### 1. State management

Events + `on()` + emit a Changed event.

```typescript
const Increment = engine.event<number>('Increment')
const Decrement = engine.event<number>('Decrement')
const CountChanged = engine.event<number>('CountChanged')

let count = 0

engine.on(Increment, (n) => {
  count += n
  engine.emit(CountChanged, count)
})

engine.on(Decrement, (n) => {
  count -= n
  engine.emit(CountChanged, count)
})

engine.on(CountChanged, (value) => {
  document.getElementById('counter')!.textContent = String(value)
})
```

### 2. Animation

Frame event + `requestAnimationFrame` + spring/tween math inside `on()`.

```typescript
const Frame = engine.event<{ time: number; dt: number }>('Frame')
const PositionChanged = engine.event<number>('PositionChanged')

let position = 0
let velocity = 0
const target = 300
const stiffness = 170
const damping = 26

engine.on(Frame, ({ dt }) => {
  const dtSec = dt / 1000
  const displacement = position - target
  const springForce = -stiffness * displacement
  const dampingForce = -damping * velocity
  velocity += (springForce + dampingForce) * dtSec
  position += velocity * dtSec
  engine.emit(PositionChanged, position)
})

engine.on(PositionChanged, (pos) => {
  element.style.transform = `translateX(${pos}px)`
})

// Drive the frame loop
let lastTime = 0
function loop(time: number) {
  const dt = lastTime ? time - lastTime : 0
  lastTime = time
  engine.emit(Frame, { time, dt })
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
```

### 3. Async

`on()` with an async handler, emit Loading/Done/Error events.

```typescript
const FetchUser = engine.event<string>('FetchUser')
const UserLoading = engine.event('UserLoading')
const UserDone = engine.event<User>('UserDone')
const UserError = engine.event<Error>('UserError')

engine.on(FetchUser, async (userId) => {
  engine.emit(UserLoading, undefined)
  try {
    const res = await fetch(`/api/users/${userId}`)
    engine.emit(UserDone, await res.json())
  } catch (err) {
    engine.emit(UserError, err as Error)
  }
})
```

### 4. Debounce

`setTimeout` inside a handler.

```typescript
const RawInput = engine.event<string>('RawInput')
const DebouncedInput = engine.event<string>('DebouncedInput')

let timer: ReturnType<typeof setTimeout>

engine.on(RawInput, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    engine.emit(DebouncedInput, value)
  }, 300)
})
```

### 5. Computed / Derived

`on(SourceChanged)` -> compute -> `emit(DerivedChanged)`.

```typescript
const FirstNameChanged = engine.event<string>('FirstNameChanged')
const LastNameChanged = engine.event<string>('LastNameChanged')
const FullNameChanged = engine.event<string>('FullNameChanged')

let firstName = ''
let lastName = ''

engine.on(FirstNameChanged, (name) => {
  firstName = name
  engine.emit(FullNameChanged, `${firstName} ${lastName}`.trim())
})

engine.on(LastNameChanged, (name) => {
  lastName = name
  engine.emit(FullNameChanged, `${firstName} ${lastName}`.trim())
})
```

### 6. Conditional

Return early or use `Skip`.

```typescript
const Input = engine.event<number>('Input')
const EvenOnly = engine.event<number>('EvenOnly')
const OddOnly = engine.event<number>('OddOnly')

engine.on(Input, (n) => {
  if (n % 2 === 0) {
    engine.emit(EvenOnly, n)
  } else {
    engine.emit(OddOnly, n)
  }
})
```

---

## Framework Adapters

Each framework adapter provides a single hook (or binding) that subscribes to a Pulse event and returns a reactive value.

### React

```bash
npm install @pulse/react
```

**`usePulse<T>(event: EventType<T>, initial: T): T`** -- Subscribe to a Pulse event. Returns the latest payload as React state.

```tsx
import { usePulse } from '@pulse/react'

function Counter({ CountChanged }: { CountChanged: EventType<number> }) {
  const count = usePulse(CountChanged, 0)
  return <div>{count}</div>
}
```

---

### Vue

```bash
npm install @pulse/vue
```

**`usePulse<T>(event: EventType<T>, initial: T): Ref<T>`** -- Subscribe to a Pulse event. Returns a reactive Vue `Ref`.

```vue
<script setup lang="ts">
import { usePulse } from '@pulse/vue'

const count = usePulse(CountChanged, 0)
</script>

<template>
  <div>{{ count }}</div>
</template>
```

---

### Solid

```bash
npm install @pulse/solid
```

**`usePulse<T>(event: EventType<T>, initial: T): Accessor<T>`** -- Subscribe to a Pulse event. Returns a SolidJS `Accessor`.

```tsx
import { usePulse } from '@pulse/solid'

function Counter(props: { CountChanged: EventType<number> }) {
  const count = usePulse(props.CountChanged, 0)
  return <div>{count()}</div>
}
```

---

### Angular

```bash
npm install @pulse/angular
```

**`pulse.use<T>(event: EventType<T>, initial: T): WritableSignal<T>`** -- Subscribe to a Pulse event. Returns an Angular `WritableSignal`.

```typescript
import { Component, inject } from '@angular/core'
import { PulseService } from '@pulse/angular'

@Component({
  template: `<div>{{ count() }}</div>`,
})
export class CounterComponent {
  private pulse = inject(PulseService)
  count = this.pulse.use(CountChanged, 0)
}
```

---

### Ember

```bash
npm install @pulse/ember
```

**`new PulseBinding(engine, event, initial)`** -- Subscribe to a Pulse event. Exposes a `@tracked value` property.

```typescript
import { PulseBinding } from '@pulse/ember'

class CounterComponent extends Component {
  count = new PulseBinding(engine, CountChanged, 0)

  willDestroy() {
    this.count.destroy()
  }
}
```

```hbs
{{this.count.value}}
```

---

## Dart / Flutter

The same 3-method API is available in Dart.

```dart
import 'package:pulse/pulse.dart';

final engine = createEngine();

// Declare
final click = engine.event<Offset>('Click');
final highlight = engine.event<String>('Highlight');

// React
engine.on(click, (offset) {
  engine.emit(highlight, 'Clicked at (${offset.dx}, ${offset.dy})');
});

// Fire
engine.emit(click, Offset(100, 200));

// Cleanup
engine.destroy();
```

### PulseBuilder widget for Flutter

```dart
PulseBuilder<int>(
  event: CountChanged,
  initial: 0,
  builder: (context, value) => Text('$value'),
)
```

---

## DevTools

### Install

```bash
npm install @pulse/devtools
```

### Usage

```typescript
import { createEngine } from '@pulse/core'
import { createDevTools } from '@pulse/devtools'

const engine = createEngine()
const devtools = createDevTools(engine)
```

### Features

| Feature | Description |
|---|---|
| **DAG Visualization** | Interactive graph showing handlers and event types. Edges are discovered at runtime as handlers emit events. Edges animate when events flow. |
| **Event Timeline** | Chronological log of propagation cycles, events deposited, events consumed, and handler firings. |
| **Manual Event Firing** | Select an event type, provide a JSON payload, and emit it into the engine. |
| **Pause / Step** | Pause propagation, inspect state, and step through events one at a time. |

### API

```typescript
devtools.pause()    // Pause engine propagation
devtools.resume()   // Resume and flush queued events
devtools.step()     // Process one queued event while paused
devtools.destroy()  // Remove devtools and restore engine
```

---

## Examples

The repository includes 27 example applications, each implemented across multiple framework adapters.

### Running Examples

```bash
# Interactive picker
./run.sh

# Run all frameworks simultaneously (master showcase on localhost:3000)
./run.sh all

# Run a specific example
./run.sh react todo-list
./run.sh vue drag-api-animation

# Run all examples for a framework (showcase with sidebar routing)
./run.sh showcase react

# List all available examples
./run.sh list

# Build all packages
./run.sh build

# Run core tests
./run.sh test
```

### Example Catalog

| Example | Description | Pattern |
|---|---|---|
| `todo-list` | Classic todo app with add, toggle, delete, filter | State management (on + emit) |
| `api-call` | Fetch data from an API with loading/error states | Async (on + await + emit) |
| `simple-animation` | Basic animation with easing | Animation (Frame + on) |
| `complex-animation` | Multi-step orchestrated animations | Animation chaining (on + emit sequence) |
| `drag-api-animation` | Drag gesture triggers API call with animated result | Async + animation + join |
| `realtime-dashboard` | Live-updating metrics dashboard | Derived state (on + emit) |
| `form-wizard` | Multi-step form with validation | Join + conditional |
| `3d-card-flip` | 3D card flip animation on hover | Animation (on + spring math) |
| `3d-cube-menu` | Rotating 3D cube navigation menu | Animation sequence |
| `3d-particle-explosion` | Particle system with explosion effect | Frame loop + on |
| `3d-carousel` | 3D carousel with perspective transforms | Animation + derived |
| `3d-layered-parallax` | Multi-layer parallax depth effect | Frame loop + on |
| `3d-morphing-grid` | Grid with morphing 3D transforms | Animation + on |
| `spreadsheet` | Reactive spreadsheet with formula cells | Derived state (on + emit) |
| `chat-app` | Real-time chat with message history | Async + state |
| `music-player` | Audio player with playback controls | State + animation |
| `virtual-scroll` | Virtualized list rendering for large datasets | Derived + debounce |
| `collaborative-editor` | Multi-cursor collaborative text editor | Async + join + debounce |
| `image-filters` | Image processing with adjustable filters | Derived + debounce |
| `gantt-chart` | Project timeline Gantt chart | Derived + animation |
| `notification-system` | Toast notifications with auto-dismiss | State + debounce |
| `file-tree` | Hierarchical file explorer | State + conditional |
| `stock-dashboard` | Real-time stock price ticker | Async + derived + debounce |
| `sortable-grid` | Drag-and-drop sortable grid | Animation (spring) + state |
| `modal-system` | Stacked modal dialogs with animations | State + animation |
| `canvas-paint` | Drawing canvas with brush tools | Frame loop + state |
| `data-table` | Sortable, filterable data table | Derived + debounce |

### Framework Coverage

| Framework | Examples | Showcase |
|---|---|---|
| React | All 27 | `./run.sh showcase react` |
| Vue | All 27 | `./run.sh showcase vue` |
| Solid | All 27 | `./run.sh showcase solid` |
| Angular | 7 (core subset) | `./run.sh showcase angular` |
| Ember | 7 (core subset) | `./run.sh showcase ember` |

---

## Architecture

### Propagation Algorithm

When `engine.emit(type, payload)` is called:

1. **Deposit**: The event is created (from an object pool for zero-allocation hot paths), stamped with a monotonic sequence number, and its `_pendingConsumers` set is populated from all handlers registered on that event type. The event is enqueued in the type's mailbox.

2. **Propagate**: The propagation loop runs:
   - Compute the **topological order** of all handlers (cached, recomputed only when the DAG changes).
   - For each handler in order:
     - **Single-event handler**: While the handler's input mailbox has a ready event, consume it and execute the handler. Any `emit()` calls inside the handler deposit new events into their respective mailboxes.
     - **Join handler** (`on([...])`) : Check if all input mailboxes have a ready event. If so, consume one from each and execute the handler.
   - Repeat until no mailbox produces new work (quiescent) or the round limit is exceeded.

3. **Drain pending**: If `emit` was called during propagation (e.g., from inside a handler), those emissions were queued. They are now drained one at a time, each triggering a new propagation pass.

### DAG Tracing

The DAG is built automatically. When a handler calls `engine.emit(SomeEvent, payload)`, the engine records an edge from that handler's input event type to `SomeEvent`. This means the graph is discovered at runtime, not declared up front. Adding or removing handlers updates the DAG and invalidates the cached topological sort.

### Mailboxes

Each event type has a `Mailbox` -- a queue of events. Each event tracks which handlers still need to consume it (`_pendingConsumers` set). When a handler consumes an event, it removes itself from that set. When the set is empty, the event is removed from the queue and recycled to the object pool (max 512 pooled objects). This ref-counting ensures that events are available to all downstream handlers in the same propagation cycle.
