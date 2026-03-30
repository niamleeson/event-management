# Pulse

**A deterministic, synchronous event engine with DAG-ordered propagation, reactive signals, and built-in animation primitives.**

Pulse is a state and event management library that treats events as persistent, ref-counted objects flowing through a directed acyclic graph (DAG) of rules. Unlike Redux (which is a single-reducer state container), MobX (which uses transparent reactivity via proxies), RxJS (which chains asynchronous observable streams), or XState (which models explicit finite state machines), Pulse models your application as a graph of event transformations that propagate synchronously in topological order -- guaranteeing deterministic, glitch-free execution with no stale intermediate states.

---

## Table of Contents

- [Key Concepts](#key-concepts)
- [Quick Start](#quick-start)
- [Core API Reference](#core-api-reference)
  - [Engine Creation](#engine-creation)
  - [Event Types](#event-types)
  - [Event Emission](#event-emission)
  - [Rules](#rules)
  - [Signals](#signals)
  - [Animation](#animation)
  - [Async](#async)
  - [Rate Limiting](#rate-limiting)
  - [Middleware](#middleware)
  - [Error Handling](#error-handling)
  - [Lifecycle](#lifecycle)
  - [Serialization](#serialization)
  - [Recording and Replay](#recording-and-replay)
  - [Debug Hooks](#debug-hooks)
  - [Introspection](#introspection)
- [Framework Adapters](#framework-adapters)
  - [React](#react)
  - [Vue](#vue)
  - [Solid](#solid)
  - [Angular](#angular)
  - [Ember](#ember)
- [DevTools](#devtools)
- [Examples](#examples)
- [Architecture](#architecture)

---

## Key Concepts

### Events are persistent and ref-counted

Events in Pulse are not fire-and-forget callbacks. When you emit an event, it is deposited into a **mailbox** and remains there until every registered consumer (rule) has processed it. Each event tracks its pending consumers via a ref-count. Only after all consumers have consumed the event is it removed and recycled back to an object pool.

### Synchronous DAG propagation

Rules form a directed acyclic graph based on their input and output event types. When an event is emitted, Pulse computes a topological ordering of the rule graph (using Kahn's algorithm) and drains mailboxes in that order. This means downstream rules always see events from upstream rules in the same propagation cycle -- no glitches, no stale reads, fully deterministic execution.

### Join patterns (barrier synchronization)

A **join** rule waits until one event from each of its input types is available in the mailboxes before firing. This is barrier synchronization: the join will not fire until all required inputs are present. An optional guard function can reject a match and return the consumed events to the mailboxes.

### Signals (derived reactive state)

Signals are reactive values that accumulate state from events via a reducer function. They support subscriptions, imperative sets, and can be composed into derived (computed) signals. Signals bridge the event world into the continuous-value world.

### Tweens and Springs (animation primitives)

Tweens interpolate a numeric value over time using an easing function. Springs simulate physics-based motion toward a target. Both integrate with the engine's frame loop and emit events when they complete, letting you chain animations into the event graph.

### Async boundaries

The `async` API bridges the external asynchronous world (fetch calls, timers, WebSocket messages) into the synchronous engine. You configure strategy (`latest`, `first`, `all`, `queue`), and the engine manages cancellation, pending/done/error event emission, and progress reporting.

---

## Quick Start

### Install

```bash
npm install @pulse/core
```

### Create an engine, declare events, wire rules, emit, and observe

```typescript
import { createEngine } from '@pulse/core'

// 1. Create an engine
const engine = createEngine()

// 2. Declare event types
const click = engine.event<{ x: number; y: number }>('click')
const highlight = engine.event<string>('highlight')

// 3. Wire a rule: transform click events into highlight events
engine.pipe(click, highlight, (payload) => {
  return `Clicked at (${payload.x}, ${payload.y})`
})

// 4. Observe the output
engine.on(highlight, (message) => {
  console.log(message)
})

// 5. Emit an event
engine.emit(click, { x: 100, y: 200 })
// logs: "Clicked at (100, 200)"
```

---

## Core API Reference

### Engine Creation

#### `createEngine(options?)`

Factory function that creates a new `Engine` instance.

```typescript
function createEngine(options?: EngineOptions): Engine
```

| Option | Type | Default | Description |
|---|---|---|---|
| `maxPropagationRounds` | `number` | `100` | Maximum propagation rounds before throwing (cycle protection) |

```typescript
import { createEngine } from '@pulse/core'

const engine = createEngine()

// With custom propagation limit
const engine = createEngine({ maxPropagationRounds: 200 })
```

---

### Event Types

#### `engine.event<T>(name)`

Create a named event type. The type parameter `T` defines the payload shape. Event types are channels -- they are declarations, not instances.

```typescript
event<T = void>(name: string): EventType<T>
```

```typescript
// Void payload (no data)
const reset = engine.event('reset')

// Typed payload
const userLogin = engine.event<{ userId: string; timestamp: number }>('user-login')

// Generic payload
const message = engine.event<string>('message')
```

The `EventType<T>` interface:

```typescript
interface EventType<T = any> {
  name: string
  _consumers: Set<Rule>
}
```

Note: the engine appends a unique counter to the name (e.g., `'click'` becomes `'click#0'`), so two calls to `engine.event('click')` produce distinct types.

---

### Event Emission

#### `engine.emit(type, payload)`

Emit an event. This deposits the event into the mailbox, triggers synchronous DAG propagation, and drains any pending emissions that occur during propagation.

```typescript
emit<T>(type: EventType<T>, payload: T): void
```

```typescript
const increment = engine.event<number>('increment')

engine.emit(increment, 1)
engine.emit(increment, 5)
```

If `emit` is called while propagation is already in progress (e.g., from inside a rule action), the emission is queued and processed after the current propagation cycle completes.

---

### Rules

#### `engine.pipe(input, output, transform)`

Transform events from one type to another. For fan-out, pass an array of output types and return an array of payloads.

```typescript
pipe<In, Out>(
  input: EventType<In>,
  output: EventType<Out> | EventType<any>[],
  transform: (payload: In) => Out | any[],
): () => void
```

Returns an unsubscribe function.

```typescript
const rawTemp = engine.event<number>('raw-temp')
const celsius = engine.event<number>('celsius')
const fahrenheit = engine.event<number>('fahrenheit')

// Single output
engine.pipe(rawTemp, celsius, (kelvin) => kelvin - 273.15)

// Fan-out: one input, multiple outputs
engine.pipe(rawTemp, [celsius, fahrenheit], (kelvin) => {
  return [kelvin - 273.15, (kelvin - 273.15) * 9 / 5 + 32]
})
```

#### `engine.pipeIf(input, output, handler)`

Conditional pipe. The output event is only emitted when the handler returns a non-null, non-undefined value.

```typescript
pipeIf<In, Out>(
  input: EventType<In>,
  output: EventType<Out>,
  handler: (payload: In) => Out | null | undefined,
): () => void
```

```typescript
const keypress = engine.event<string>('keypress')
const enterPressed = engine.event<string>('enter-pressed')

engine.pipeIf(keypress, enterPressed, (key) => {
  return key === 'Enter' ? key : null
})
```

#### `engine.join(inputs, output, config)`

Barrier join: waits for one event from each input type to be available, then fires the action with all payloads. An optional `guard` can reject the match.

```typescript
join<Out>(
  inputs: EventType[],
  output: EventType<Out>,
  config: {
    guard?: (...payloads: any[]) => boolean
    do: (...payloads: any[]) => Out
  },
): () => void
```

```typescript
const username = engine.event<string>('username')
const password = engine.event<string>('password')
const loginAttempt = engine.event<{ user: string; pass: string }>('login-attempt')

engine.join([username, password], loginAttempt, {
  guard: (user, pass) => user.length > 0 && pass.length > 0,
  do: (user, pass) => ({ user, pass }),
})

engine.emit(username, 'alice')
// loginAttempt does NOT fire yet -- waiting for password
engine.emit(password, 's3cret')
// loginAttempt fires with { user: 'alice', pass: 's3cret' }
```

#### `engine.joinWithin(inputs, output, windowMs, config)`

Time-windowed join. All input events must arrive within `windowMs` milliseconds of the first input. If the window expires before all inputs arrive, accumulated events are discarded.

```typescript
joinWithin<Out>(
  inputs: EventType[],
  output: EventType<Out>,
  windowMs: number,
  config: {
    guard?: (...payloads: any[]) => boolean
    do: (...payloads: any[]) => Out
  },
): () => void
```

```typescript
const mouseDown = engine.event<{ x: number; y: number }>('mouse-down')
const mouseUp = engine.event<{ x: number; y: number }>('mouse-up')
const quickClick = engine.event<{ start: any; end: any }>('quick-click')

engine.joinWithin([mouseDown, mouseUp], quickClick, 300, {
  do: (down, up) => ({ start: down, end: up }),
})
```

#### `engine.on(type, handler)`

Terminal side-effect listener. Subscribes to events of a given type without producing output events. Returns an unsubscribe function.

```typescript
on<T>(type: EventType<T>, handler: (payload: T) => void): () => void
```

```typescript
const notification = engine.event<string>('notification')

const unsub = engine.on(notification, (message) => {
  console.log('Notification:', message)
})

engine.emit(notification, 'Hello!')
// logs: "Notification: Hello!"

unsub() // stop listening
```

---

### Signals

#### `engine.signal(type, initial, reducer)`

Create a signal -- a reactive value that accumulates state from events using a reducer.

```typescript
signal<T>(type: EventType<any>, initial: T, reducer: (prev: T, event: any) => T): Signal<T>
```

```typescript
const increment = engine.event<number>('increment')
const count = engine.signal(increment, 0, (prev, amount) => prev + amount)

engine.emit(increment, 1)
console.log(count.value) // 1

engine.emit(increment, 5)
console.log(count.value) // 6
```

#### `engine.signalUpdate(signal, type, reducer)`

Add an additional event source to an existing signal. Returns an unsubscribe function.

```typescript
signalUpdate<T>(sig: Signal<T>, type: EventType<any>, reducer: (prev: T, event: any) => T): () => void
```

```typescript
const increment = engine.event<number>('increment')
const decrement = engine.event<number>('decrement')
const count = engine.signal(increment, 0, (prev, n) => prev + n)

engine.signalUpdate(count, decrement, (prev, n) => prev - n)

engine.emit(increment, 10) // count.value === 10
engine.emit(decrement, 3)  // count.value === 7
```

#### `engine.computed(deps, compute)`

Create a derived signal that recomputes whenever any dependency signal changes.

```typescript
computed<T>(deps: Signal<any>[], compute: (...values: any[]) => T): Signal<T>
```

```typescript
const firstName = engine.signal(firstNameChanged, '', (_, name) => name)
const lastName = engine.signal(lastNameChanged, '', (_, name) => name)

const fullName = engine.computed(
  [firstName, lastName],
  (first, last) => `${first} ${last}`.trim(),
)

// fullName.value auto-updates when either firstName or lastName changes
```

#### `signal.value`

Read the current value of a signal.

```typescript
console.log(count.value) // 6
```

#### `signal.set(value)`

Imperatively set the signal's value. Notifies all subscribers if the value changed (uses `Object.is` for equality).

```typescript
count.set(42)
console.log(count.value) // 42
```

#### `signal.subscribe(callback)`

Subscribe to value changes. The callback receives the new and previous values. Returns an unsubscribe function.

```typescript
subscribe(callback: (value: T, prev: T) => void): () => void
```

```typescript
const unsub = count.subscribe((value, prev) => {
  console.log(`count changed from ${prev} to ${value}`)
})

engine.emit(increment, 1) // logs: "count changed from 6 to 7"
unsub()
```

#### `engine.when(signal, predicate, output)`

Bridge a signal to the event system. Emits the output event whenever the signal's value matches the predicate (a function) or equals the given value.

```typescript
when<T>(sig: Signal<T>, predicateOrValue: T | ((val: T) => boolean), output: EventType<T>): () => void
```

```typescript
const limitReached = engine.event<number>('limit-reached')

// Fire when count reaches 100
engine.when(count, 100, limitReached)

// Or with a predicate function
engine.when(count, (val) => val >= 100, limitReached)
```

The `Signal<T>` interface:

```typescript
interface Signal<T = any> {
  value: T
  subscribe(callback: (value: T, prev: T) => void): () => void
  set(next: T): void
}
```

---

### Animation

#### `engine.tween(config)`

Create a time-based animated value. The tween starts when `start` is emitted and emits `done` when complete. Values are interpolated each frame using the easing function.

```typescript
tween(config: TweenConfig): TweenValue
```

```typescript
interface TweenConfig {
  start: EventType          // Event that starts the tween
  done?: EventType          // Event emitted when tween completes
  cancel?: EventType | EventType[]  // Event(s) that cancel the tween
  from: number | (() => number)     // Start value (or getter)
  to: number | (() => number)       // End value (or getter)
  duration: number                  // Duration in milliseconds
  easing?: string | ((t: number) => number)  // Easing function
}
```

```typescript
const fadeIn = engine.event('fade-in')
const fadeInDone = engine.event('fade-in-done')

const opacity = engine.tween({
  start: fadeIn,
  done: fadeInDone,
  from: 0,
  to: 1,
  duration: 300,
  easing: 'easeOut',
})

engine.on(fadeInDone, () => console.log('Fade complete'))
engine.emit(fadeIn, undefined)

// opacity.value animates from 0 to 1 over 300ms
opacity.subscribe((value) => {
  element.style.opacity = String(value)
})
```

The `TweenValue` interface:

```typescript
interface TweenValue {
  value: number        // Current interpolated value
  active: boolean      // Whether the tween is currently running
  progress: number     // Raw progress 0..1 (before easing)
  subscribe(callback: (value: number) => void): () => void
}
```

#### `engine.spring(target, config?)`

Create a physics-based animated value that chases a target (a Signal or TweenValue). The spring unsettles whenever the target changes and simulates spring dynamics each frame.

```typescript
spring(target: Signal<number> | TweenValue, config?: SpringConfig): SpringValue
```

```typescript
interface SpringConfig {
  stiffness?: number      // Default: 170
  damping?: number        // Default: 26
  restThreshold?: number  // Default: 0.01
  done?: EventType        // Event emitted when spring settles
}
```

```typescript
const position = engine.signal(posChanged, 0, (_, pos) => pos)
const springPos = engine.spring(position, {
  stiffness: 200,
  damping: 20,
})

// springPos.value smoothly follows position.value with spring physics
springPos.subscribe((value) => {
  element.style.transform = `translateX(${value}px)`
})
```

The `SpringValue` interface:

```typescript
interface SpringValue {
  value: number        // Current value
  velocity: number     // Current velocity
  settled: boolean     // Whether the spring has come to rest
  subscribe(callback: (value: number) => void): () => void
}
```

#### `engine.sequence(start, tweenConfigs, done?)`

Chain tweens so each starts after the previous one completes. Returns all created `TweenValue` objects.

```typescript
sequence(
  start: EventType,
  tweenConfigs: TweenConfig[],
  done?: EventType,
): TweenValue[]
```

```typescript
const animStart = engine.event('anim-start')
const animDone = engine.event('anim-done')

const [fadeIn, slideUp] = engine.sequence(animStart, [
  { start: animStart, from: 0, to: 1, duration: 200, easing: 'easeOut' },
  { start: animStart, from: 100, to: 0, duration: 300, easing: 'easeOutBack' },
], animDone)

// fadeIn runs first (0->1 over 200ms)
// slideUp runs after fadeIn completes (100->0 over 300ms)
// animDone emits after slideUp completes
```

Note: The `start` fields in individual tween configs are overridden by the sequence logic. The first tween uses the `start` argument; subsequent tweens start when the previous one's `done` event fires.

#### `engine.startFrameLoop()` / `engine.stopFrameLoop()`

Start or stop the `requestAnimationFrame` loop that drives tweens, springs, coalesced event flushing, and emits the built-in `engine.frame` event each tick.

```typescript
startFrameLoop(): void
stopFrameLoop(): void
```

```typescript
engine.startFrameLoop()

// Listen to frame events
engine.on(engine.frame, ({ time, dt }) => {
  // time: timestamp from requestAnimationFrame
  // dt: delta time in ms since last frame (0 on first tick)
})

// Later...
engine.stopFrameLoop()
```

The `FrameData` interface:

```typescript
interface FrameData {
  time: number  // requestAnimationFrame timestamp
  dt: number    // milliseconds since previous frame
}
```

#### `engine.tick(time)`

Manually advance the frame loop by one tick. Useful for testing without `requestAnimationFrame`.

```typescript
tick(time: number): void
```

```typescript
engine.tick(0)    // first tick, dt = 0
engine.tick(16)   // dt = 16ms
engine.tick(32)   // dt = 16ms
```

#### Built-in Easing Functions

Pass these as strings to the `easing` field of `TweenConfig`, or provide a custom `(t: number) => number` function.

| Name | Description |
|---|---|
| `'linear'` | No easing (default) |
| `'easeIn'` | Cubic ease-in (`t^3`) |
| `'easeOut'` | Cubic ease-out |
| `'easeInOut'` | Cubic ease-in-out |
| `'easeOutBack'` | Overshoot and settle |
| `'easeOutElastic'` | Elastic bounce |
| `'easeOutBounce'` | Bouncing settle |
| `'easeOutExpo'` | Exponential ease-out |

Custom cubic bezier easing is also available via the `cubicBezier` function:

```typescript
import { cubicBezier } from '@pulse/core'

const customEasing = cubicBezier(0.25, 0.1, 0.25, 1.0)

const tw = engine.tween({
  start: go,
  from: 0,
  to: 100,
  duration: 500,
  easing: customEasing,
})
```

---

### Async

#### `engine.async(input, config)`

Create an async boundary that bridges promises into the synchronous event engine. Manages cancellation, strategies, pending/done/error events, and progress reporting.

```typescript
async<In, Out>(input: EventType<In>, config: AsyncConfig<In, Out>): () => void
```

```typescript
interface AsyncConfig<In, Out> {
  pending?: EventType | null       // Emitted when async work starts
  done?: EventType<Out>            // Emitted when the promise resolves
  error?: EventType<any>           // Emitted when the promise rejects
  cancel?: EventType               // Emitting this cancels the in-flight operation
  cancelled?: EventType            // Emitted when an operation is cancelled
  progress?: EventType             // Emitted when ctx.progress() is called
  strategy?: AsyncStrategy         // 'latest' | 'first' | 'all' | 'queue'
  do: (payload: In, ctx: AsyncContext) => Promise<Out>
}

interface AsyncContext {
  signal: AbortSignal              // Abort signal for cancellation
  progress: (data: any) => void    // Report progress
}

type AsyncStrategy = 'latest' | 'first' | 'all' | 'queue'
```

Strategies:
- **`latest`** (default) -- Cancels any in-flight operation when a new input arrives. Only the latest result is delivered.
- **`first`** -- Ignores new inputs while an operation is already in-flight.
- **`all`** -- All operations run concurrently. Every result is delivered.
- **`queue`** -- Operations run sequentially, one at a time.

```typescript
const searchQuery = engine.event<string>('search-query')
const searchPending = engine.event('search-pending')
const searchResults = engine.event<string[]>('search-results')
const searchError = engine.event<Error>('search-error')

engine.async(searchQuery, {
  strategy: 'latest',
  pending: searchPending,
  done: searchResults,
  error: searchError,
  do: async (query, ctx) => {
    const res = await fetch(`/api/search?q=${query}`, { signal: ctx.signal })
    return res.json()
  },
})

engine.emit(searchQuery, 'hello')
// searchPending fires immediately
// searchResults fires when fetch resolves (or searchError if it rejects)
// If a new query arrives before the first resolves, the first is aborted
```

---

### Rate Limiting

#### `engine.debounce(input, ms, output)`

Emit the latest payload after `ms` milliseconds of inactivity on the input event.

```typescript
debounce<T>(input: EventType<T>, ms: number, output: EventType<T>): () => void
```

```typescript
const rawInput = engine.event<string>('raw-input')
const debouncedInput = engine.event<string>('debounced-input')

engine.debounce(rawInput, 300, debouncedInput)

// Rapid emissions of rawInput only produce one debouncedInput
// 300ms after the last rawInput
```

#### `engine.throttle(input, ms, output)`

Emit at most once per `ms` milliseconds. The first event goes through immediately; subsequent events during the window are buffered. The last buffered event fires when the window expires.

```typescript
throttle<T>(input: EventType<T>, ms: number, output: EventType<T>): () => void
```

```typescript
const mouseMove = engine.event<{ x: number; y: number }>('mouse-move')
const throttledMove = engine.event<{ x: number; y: number }>('throttled-move')

engine.throttle(mouseMove, 16, throttledMove)
```

#### `engine.coalesce(input, output)`

Batch events: buffer the latest payload and flush it on the next frame tick (when `startFrameLoop` is active or `tick` is called manually).

```typescript
coalesce<T>(input: EventType<T>, output: EventType<T>): () => void
```

```typescript
const rawUpdate = engine.event<number>('raw-update')
const batchedUpdate = engine.event<number>('batched-update')

engine.coalesce(rawUpdate, batchedUpdate)

engine.emit(rawUpdate, 1)
engine.emit(rawUpdate, 2)
engine.emit(rawUpdate, 3)

engine.tick(0)
// batchedUpdate fires once with payload 3 (the latest)
```

---

### Middleware

#### `engine.use(middleware)`

Register middleware that intercepts every event before it is deposited into a mailbox. Middleware can modify events (return a new `{ type, payload }`) or block them (return `null`). Returns an unsubscribe function.

```typescript
use(middleware: Middleware): () => void
```

```typescript
type Middleware = (
  event: { type: EventType; payload: any }
) => { type: EventType; payload: any } | null
```

```typescript
// Logging middleware
engine.use((event) => {
  console.log(`[${event.type.name}]`, event.payload)
  return event
})

// Blocking middleware
engine.use((event) => {
  if (event.type.name.startsWith('__internal')) {
    return null // block internal events
  }
  return event
})

// Transforming middleware
const unsub = engine.use((event) => {
  return {
    type: event.type,
    payload: { ...event.payload, timestamp: Date.now() },
  }
})

unsub() // remove middleware
```

---

### Error Handling

#### `engine.onError`

Assign an error handler that is called when a rule action throws during propagation. If no handler is set, errors propagate normally (thrown from `emit`).

```typescript
onError?: (error: Error, rule: Rule, event: any) => void
```

```typescript
engine.onError = (error, rule, event) => {
  console.error(`Rule "${rule.name}" failed:`, error)
  // event is the payload that caused the error (or array of payloads for join rules)
}
```

---

### Lifecycle

#### `engine.destroy()`

Full teardown. Destroys all child engines, stops the frame loop, clears all timers (debounce/throttle), unsubscribes all computed signal listeners, clears mailboxes, removes all rules from the DAG, clears all signals/tweens/springs, and detaches from parent engine.

```typescript
destroy(): void
```

```typescript
engine.destroy()
// Engine is now inert. All subscriptions and timers are cleaned up.
```

#### `engine.createChild()`

Create a child engine. Child engines share the parent's frame loop (the parent ticks children automatically). Destroying the parent destroys all children.

```typescript
createChild(): Engine
```

```typescript
const parent = createEngine()
const child = parent.createChild()

// child gets frame ticks from parent
parent.startFrameLoop()

parent.destroy() // also destroys child
```

---

### Serialization

#### `engine.snapshot()`

Capture all signal values as a `Map<string, any>`. Signal identity is based on the event type name used to create the signal.

```typescript
snapshot(): EngineSnapshot  // Map<string, any>
```

```typescript
const snap = engine.snapshot()
// snap is a Map: { 'increment#0' => 6, 'firstName#1' => 'Alice', ... }
```

#### `engine.restore(snapshot)`

Restore signal values from a snapshot. Also resets all tweens (inactive, zero progress) and springs (zero velocity, settled).

```typescript
restore(snapshot: EngineSnapshot): void
```

```typescript
const snap = engine.snapshot()

// ... time passes, state changes ...

engine.restore(snap) // signals restored to snapshotted values
```

---

### Recording and Replay

#### `engine.startRecording()` / `engine.stopRecording()`

Record all events that pass through the engine (after middleware). `startRecording` resets the recording buffer. `stopRecording` returns the recorded events and clears the buffer.

```typescript
startRecording(): void
stopRecording(): RecordedEvent[]
```

```typescript
interface RecordedEvent {
  type: EventType
  payload: any
  timestamp: number  // milliseconds relative to recording start
}
```

```typescript
engine.startRecording()

engine.emit(click, { x: 10, y: 20 })
// ... user interactions ...
engine.emit(click, { x: 50, y: 60 })

const recording = engine.stopRecording()
// recording is an array of { type, payload, timestamp }
```

#### `engine.replay(recording)`

Replay a recording. Events are re-emitted with the original relative timing using `setTimeout`. The first event replays immediately; subsequent events fire after their original delay.

```typescript
replay(recording: RecordedEvent[]): void
```

```typescript
engine.replay(recording)
// Events are re-emitted with their original timing
```

---

### Debug Hooks

Assign callbacks to `engine.debug` to receive telemetry during propagation. These are used internally by `@pulse/devtools`.

```typescript
engine.debug: {
  onCycleStart?: (cycle: { seq: number }) => void
  onCycleEnd?: (cycle: {
    seq: number
    rulesEvaluated: number
    eventsDeposited: number
    duration: number
  }) => void
  onEventDeposited?: (event: {
    type: { name: string }
    payload: any
    seq: number
  }) => void
  onEventConsumed?: (
    event: { type: { name: string }; payload: any; seq: number },
    rule: { id: string; name: string }
  ) => void
  onRuleFired?: (
    rule: { id: string; name: string; mode: string },
    inputs: any[],
    outputs: any[]
  ) => void
  onTweenUpdate?: (tween: {
    value: number
    progress: number
    active: boolean
  }) => void
}
```

```typescript
engine.debug.onCycleStart = ({ seq }) => {
  console.log(`Propagation cycle #${seq} started`)
}

engine.debug.onCycleEnd = ({ seq, rulesEvaluated, eventsDeposited, duration }) => {
  console.log(`Cycle #${seq}: ${eventsDeposited} events, ${duration.toFixed(2)}ms`)
}

engine.debug.onRuleFired = (rule, inputs, outputs) => {
  console.log(`Rule "${rule.name}" fired`)
}
```

---

### Introspection

These methods return current engine state for debugging and tooling.

#### `engine.getRules()`

Returns all registered rules.

```typescript
getRules(): Rule[]
```

```typescript
interface Rule {
  id: string
  name: string
  triggers: EventType[]
  mode: 'each' | 'join'
  guard?: (...payloads: any[]) => boolean
  action: (...payloads: any[]) => any
  outputs: EventType[]
  priority: number
}
```

#### `engine.getMailboxes()`

Returns all mailboxes (event queues) keyed by event type.

```typescript
getMailboxes(): Map<EventType, Mailbox>
```

#### `engine.getSignals()`

Returns a copy of all signals registered with the engine.

```typescript
getSignals(): Signal<any>[]
```

#### `engine.getTweens()`

Returns a copy of all tween values.

```typescript
getTweens(): TweenValue[]
```

#### `engine.getSprings()`

Returns a copy of all spring values.

```typescript
getSprings(): SpringValue[]
```

#### `engine.getDAG()`

Returns the rule DAG as a graph of nodes and edges for visualization.

```typescript
getDAG(): DAGGraph
```

```typescript
interface DAGGraph {
  nodes: Rule[]
  edges: [Rule, Rule][]  // [from, to] pairs
}
```

```typescript
const graph = engine.getDAG()
console.log(`${graph.nodes.length} rules, ${graph.edges.length} edges`)
```

---

### Built-in Event: `engine.frame`

Every engine has a built-in `frame` event of type `EventType<FrameData>`. It is emitted automatically on every frame tick (via `startFrameLoop` or manual `tick` calls).

```typescript
engine.on(engine.frame, ({ time, dt }) => {
  // runs every frame
})
```

---

## Framework Adapters

### React

#### Install

```bash
npm install @pulse/react
```

#### Provider Setup

Wrap your app with `PulseProvider` to make the engine available to all hooks via React context.

```tsx
import { createEngine } from '@pulse/core'
import { PulseProvider } from '@pulse/react'

const engine = createEngine()

function App() {
  return (
    <PulseProvider engine={engine}>
      <MyComponent />
    </PulseProvider>
  )
}
```

#### Hooks

**`useEngine(): Engine`** -- Access the engine instance from context.

```tsx
import { useEngine } from '@pulse/react'

function MyComponent() {
  const engine = useEngine()
  // ...
}
```

**`useSignal<T>(signal: Signal<T>): T`** -- Subscribe to a Pulse signal. Returns the current value and re-renders the component on change. Uses `useSyncExternalStore` internally.

```tsx
import { useSignal } from '@pulse/react'

function Counter({ countSignal }: { countSignal: Signal<number> }) {
  const count = useSignal(countSignal)
  return <div>{count}</div>
}
```

**`useTween(tween: TweenValue): number`** -- Subscribe to a tween's current numeric value.

```tsx
import { useTween } from '@pulse/react'

function FadeBox({ opacity }: { opacity: TweenValue }) {
  const value = useTween(opacity)
  return <div style={{ opacity: value }} />
}
```

**`useSpring(spring: SpringValue): number`** -- Subscribe to a spring's current numeric value.

```tsx
import { useSpring } from '@pulse/react'

function SpringBox({ springX }: { springX: SpringValue }) {
  const x = useSpring(springX)
  return <div style={{ transform: `translateX(${x}px)` }} />
}
```

**`useEmit(): <T>(type: EventType<T>, payload: T) => void`** -- Returns a stable emit function bound to the engine.

```tsx
import { useEmit } from '@pulse/react'

function Button({ clickEvent }: { clickEvent: EventType<void> }) {
  const emit = useEmit()
  return <button onClick={() => emit(clickEvent, undefined)}>Click</button>
}
```

**`useEvent<T>(type: EventType<T>, handler: (payload: T) => void): void`** -- Subscribe to raw events. The handler ref is kept current; the subscription is cleaned up on unmount.

```tsx
import { useEvent } from '@pulse/react'

function Logger({ errorEvent }: { errorEvent: EventType<string> }) {
  useEvent(errorEvent, (message) => {
    console.error('Error:', message)
  })
  return null
}
```

**`usePulse<T>(eventType: EventType<T>, initial: T, reducer: (prev: T, event: T) => T): T`** -- Convenience hook that creates a signal and subscribes to it in one call. The signal is created once and persists across re-renders.

```tsx
import { usePulse } from '@pulse/react'

function Counter({ incrementEvent }: { incrementEvent: EventType<number> }) {
  const count = usePulse(incrementEvent, 0, (prev, n) => prev + n)
  return <div>{count}</div>
}
```

---

### Vue

#### Install

```bash
npm install @pulse/vue
```

#### Provider Setup

Call `providePulse(engine)` in a parent component's `setup()` to inject the engine into the component tree.

```vue
<script setup lang="ts">
import { createEngine } from '@pulse/core'
import { providePulse } from '@pulse/vue'

const engine = createEngine()
providePulse(engine)
</script>

<template>
  <MyComponent />
</template>
```

#### Composables

**`usePulse(): Engine`** -- Retrieve the engine from injection context.

```vue
<script setup lang="ts">
import { usePulse } from '@pulse/vue'

const engine = usePulse()
</script>
```

**`useSignal<T>(signal: Signal<T>): Ref<T>`** -- Bridge a Pulse signal to a reactive Vue `Ref`. Automatically unsubscribes on component unmount.

```vue
<script setup lang="ts">
import { useSignal } from '@pulse/vue'

const count = useSignal(countSignal)
</script>

<template>
  <div>{{ count }}</div>
</template>
```

**`useTween(tween: TweenValue): Ref<number>`** -- Bridge a tween to a reactive Vue `Ref`.

```vue
<script setup lang="ts">
import { useTween } from '@pulse/vue'

const opacity = useTween(opacityTween)
</script>

<template>
  <div :style="{ opacity }">Fading</div>
</template>
```

**`useSpring(spring: SpringValue): Ref<number>`** -- Bridge a spring to a reactive Vue `Ref`.

```vue
<script setup lang="ts">
import { useSpring } from '@pulse/vue'

const x = useSpring(springX)
</script>

<template>
  <div :style="{ transform: `translateX(${x}px)` }">Bouncing</div>
</template>
```

**`useEmit(): <T>(type: EventType<T>, payload: T) => void`** -- Returns an emit function bound to the injected engine.

```vue
<script setup lang="ts">
import { useEmit } from '@pulse/vue'

const emit = useEmit()
const handleClick = () => emit(clickEvent, undefined)
</script>
```

**`useEvent<T>(type: EventType<T>, handler: (payload: T) => void): void`** -- Subscribe to events with automatic cleanup on unmount.

```vue
<script setup lang="ts">
import { useEvent } from '@pulse/vue'

useEvent(errorEvent, (message) => {
  console.error('Error:', message)
})
</script>
```

**Injection key:** `PulseKey` (`InjectionKey<Engine>`) is exported for advanced use cases.

---

### Solid

#### Install

```bash
npm install @pulse/solid
```

#### Provider Setup

```tsx
import { createEngine } from '@pulse/core'
import { PulseProvider } from '@pulse/solid'

const engine = createEngine()

function App() {
  return (
    <PulseProvider engine={engine}>
      <MyComponent />
    </PulseProvider>
  )
}
```

#### Accessors

**`usePulse(): Engine`** -- Access the engine from context.

```tsx
import { usePulse } from '@pulse/solid'

function MyComponent() {
  const engine = usePulse()
}
```

**`useSignal<T>(signal: Signal<T>): Accessor<T>`** -- Bridge a Pulse signal to a SolidJS `Accessor`. Leverages Solid's fine-grained reactivity -- only the reading site re-renders, not the component.

```tsx
import { useSignal } from '@pulse/solid'

function Counter(props: { countSignal: Signal<number> }) {
  const count = useSignal(props.countSignal)
  return <div>{count()}</div>
}
```

**`useTween(tween: TweenValue): Accessor<number>`** -- Bridge a tween to a Solid `Accessor`.

```tsx
import { useTween } from '@pulse/solid'

function FadeBox(props: { opacity: TweenValue }) {
  const value = useTween(props.opacity)
  return <div style={{ opacity: value() }} />
}
```

**`useSpring(spring: SpringValue): Accessor<number>`** -- Bridge a spring to a Solid `Accessor`.

```tsx
import { useSpring } from '@pulse/solid'

function SpringBox(props: { springX: SpringValue }) {
  const x = useSpring(props.springX)
  return <div style={{ transform: `translateX(${x()}px)` }} />
}
```

**`useEmit(): <T>(type: EventType<T>, payload: T) => void`** -- Returns an emit function.

```tsx
import { useEmit } from '@pulse/solid'

function Button(props: { clickEvent: EventType<void> }) {
  const emit = useEmit()
  return <button onClick={() => emit(props.clickEvent, undefined)}>Click</button>
}
```

**`useEvent<T>(type: EventType<T>, handler: (payload: T) => void): void`** -- Subscribe with automatic cleanup via `onCleanup`.

```tsx
import { useEvent } from '@pulse/solid'

function Logger(props: { errorEvent: EventType<string> }) {
  useEvent(props.errorEvent, (msg) => console.error(msg))
  return null
}
```

---

### Angular

#### Install

```bash
npm install @pulse/angular
```

#### Provider Setup

Provide the engine using `providePulse()` in your application bootstrap or module providers.

```typescript
import { bootstrapApplication } from '@angular/platform-browser'
import { createEngine } from '@pulse/core'
import { providePulse, PulseService } from '@pulse/angular'

const engine = createEngine()

bootstrapApplication(AppComponent, {
  providers: [providePulse(engine), PulseService],
})
```

#### PulseService

Inject `PulseService` into components. All subscriptions are automatically cleaned up when the component is destroyed (via Angular's `DestroyRef`).

**`getEngine(): Engine`** -- Get the underlying engine instance.

```typescript
import { Component, inject } from '@angular/core'
import { PulseService } from '@pulse/angular'

@Component({ /* ... */ })
export class MyComponent {
  private pulse = inject(PulseService)
  private engine = this.pulse.getEngine()
}
```

**`emit<T>(type: EventType<T>, payload: T): void`** -- Emit a Pulse event.

```typescript
this.pulse.emit(clickEvent, { x: 10, y: 20 })
```

**`signal<T>(pulseSignal: Signal<T>): WritableSignal<T>`** -- Bridge a Pulse signal to an Angular `WritableSignal`.

```typescript
@Component({
  template: `<div>{{ count() }}</div>`,
})
export class CounterComponent {
  private pulse = inject(PulseService)
  count = this.pulse.signal(countSignal)  // Angular WritableSignal
}
```

**`tween(tween: TweenValue): WritableSignal<number>`** -- Bridge a tween to an Angular signal.

```typescript
opacity = this.pulse.tween(opacityTween)
// Use in template: [style.opacity]="opacity()"
```

**`spring(spring: SpringValue): WritableSignal<number>`** -- Bridge a spring to an Angular signal.

```typescript
x = this.pulse.spring(springX)
// Use in template: [style.transform]="'translateX(' + x() + 'px)'"
```

**`on<T>(type: EventType<T>, handler: (payload: T) => void): void`** -- Subscribe to events with automatic cleanup.

```typescript
ngOnInit() {
  this.pulse.on(errorEvent, (msg) => console.error(msg))
}
```

**Injection token:** `PULSE_ENGINE` (`InjectionToken<Engine>`) is exported for direct injection.

---

### Ember

#### Install

```bash
npm install @pulse/ember
```

#### Service Setup

Create a `PulseService` instance bound to your engine and share it with components.

```typescript
import { createEngine } from '@pulse/core'
import { createPulseService } from '@pulse/ember'

const engine = createEngine()
export const pulse = createPulseService(engine)
```

#### Tracked Wrappers

The Ember adapter bridges Pulse primitives into Ember's `@tracked` autotracking system.

**`TrackedSignal<T>`** -- Wraps a Pulse signal. The `value` property is `@tracked`, so templates auto-re-render.

```typescript
import { TrackedSignal } from '@pulse/ember'

class MyComponent extends Component {
  trackedCount = new TrackedSignal(countSignal)

  willDestroy() {
    this.trackedCount.destroy()
  }
}
```

```hbs
{{this.trackedCount.value}}
```

**`TrackedTween`** -- Wraps a Pulse TweenValue. Exposes `@tracked` properties: `value`, `active`, `progress`.

```typescript
import { TrackedTween } from '@pulse/ember'

class MyComponent extends Component {
  trackedOpacity = new TrackedTween(opacityTween)

  willDestroy() {
    this.trackedOpacity.destroy()
  }
}
```

```hbs
<div style="opacity: {{this.trackedOpacity.value}}">Fading</div>
```

**`TrackedSpring`** -- Wraps a Pulse SpringValue. Exposes `@tracked` properties: `value`, `velocity`, `settled`.

```typescript
import { TrackedSpring } from '@pulse/ember'

class MyComponent extends Component {
  trackedX = new TrackedSpring(springX)

  willDestroy() {
    this.trackedX.destroy()
  }
}
```

#### PulseService Methods

**`pulse.emit(type, payload)`** -- Emit events.

**`pulse.createSignal(pulseSignal)`** -- Create a `TrackedSignal` with automatic cleanup tracking.

**`pulse.createTween(tween)`** -- Create a `TrackedTween` with automatic cleanup tracking.

**`pulse.createSpring(spring)`** -- Create a `TrackedSpring` with automatic cleanup tracking.

**`pulse.on(type, handler)`** -- Subscribe to events. Returns an unsubscribe function.

**`pulse.destroy()`** -- Dispose of all tracked subscriptions. Call when the owning service or context is destroyed.

```typescript
import { pulse } from '../engine'

class MyComponent extends Component {
  count = pulse.createSignal(countSignal)
  opacity = pulse.createTween(opacityTween)
  springX = pulse.createSpring(springXValue)

  willDestroy() {
    this.count.destroy()
    this.opacity.destroy()
    this.springX.destroy()
  }
}
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

// Mount as a floating panel (default)
const devtools = createDevTools(engine)

// Mount into a specific DOM element
const devtools = createDevTools(engine, {
  container: document.getElementById('devtools'),
  position: 'bottom',   // 'bottom' | 'right' | 'floating'
  theme: 'dark',         // 'dark' | 'light'
  collapsed: false,
})
```

### Configuration

```typescript
interface DevToolsOptions {
  container?: HTMLElement | null   // Target element (null creates a floating panel)
  position?: 'bottom' | 'right' | 'floating'
  collapsed?: boolean              // Start collapsed
  theme?: 'dark' | 'light'
}
```

### API

```typescript
devtools.pause()    // Pause engine propagation (intercepts emit)
devtools.resume()   // Resume and flush queued events
devtools.step()     // Process one queued event while paused
devtools.destroy()  // Remove devtools and restore engine
```

### Features

| Tab | Description |
|---|---|
| **Graph** | Interactive DAG visualization showing rules, event types, and edges. Edges animate when events flow through them. |
| **Timeline** | Chronological log of propagation cycles, events deposited, events consumed, and rule firings. |
| **Inspector** | Live view of all signals (with current values), tweens (value/active/progress), springs (value/velocity/settled), and mailbox contents. Includes pause/step controls. |
| **Fire Event** | Manually emit events into the engine by selecting an event type and providing a JSON payload. |

The floating panel is draggable and collapsible. The titlebar shows a `RUNNING` or `PAUSED` status badge.

---

## Examples

The repository includes 27 example applications, each implemented across multiple framework adapters. All examples for a given framework are also bundled into a routed **showcase** app.

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

| Example | Description | Key Features Used |
|---|---|---|
| `todo-list` | Classic todo app with add, toggle, delete, filter | Signals, pipe, on |
| `api-call` | Fetch data from an API with loading/error states | Async (latest), pending/done/error events |
| `simple-animation` | Basic tween animation | Tween, easing, frame loop |
| `complex-animation` | Multi-step orchestrated animations | Tween sequence, springs, multiple easings |
| `drag-api-animation` | Drag gesture triggers API call with animated result | Async, tween, signals, join |
| `realtime-dashboard` | Live-updating metrics dashboard | Signals, computed, throttle, frame loop |
| `form-wizard` | Multi-step form with validation | Join, pipeIf, signals, middleware |
| `3d-card-flip` | 3D card flip animation on hover | Tween, spring, easing |
| `3d-cube-menu` | Rotating 3D cube navigation menu | Tween sequence, signals |
| `3d-particle-explosion` | Particle system with explosion effect | Frame loop, springs, signals |
| `3d-carousel` | 3D carousel with perspective transforms | Tween, signals, computed |
| `3d-layered-parallax` | Multi-layer parallax depth effect | Frame loop, signals, springs |
| `3d-morphing-grid` | Grid with morphing 3D transforms | Tween, springs, frame loop |
| `spreadsheet` | Reactive spreadsheet with formula cells | Signals, computed, pipe |
| `chat-app` | Real-time chat with message history | Async, signals, on |
| `music-player` | Audio player with playback controls | Signals, tween, frame loop |
| `virtual-scroll` | Virtualized list rendering for large datasets | Signals, computed, throttle |
| `collaborative-editor` | Multi-cursor collaborative text editor | Async, signals, join, debounce |
| `image-filters` | Image processing with adjustable filters | Signals, computed, debounce |
| `gantt-chart` | Project timeline Gantt chart | Signals, computed, tween |
| `notification-system` | Toast notifications with auto-dismiss | Tween, signals, debounce |
| `file-tree` | Hierarchical file explorer | Signals, pipe, pipeIf |
| `stock-dashboard` | Real-time stock price ticker | Async, signals, throttle, computed |
| `sortable-grid` | Drag-and-drop sortable grid | Springs, signals, frame loop |
| `modal-system` | Stacked modal dialogs with animations | Tween, signals, sequence |
| `canvas-paint` | Drawing canvas with brush tools | Frame loop, signals, throttle |
| `data-table` | Sortable, filterable data table | Signals, computed, debounce |

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

1. **Deposit**: The event is created (from an object pool for zero-allocation hot paths), stamped with a monotonic sequence number, and its `_pendingConsumers` set is populated from all rules registered on that event type. The event is enqueued in the type's mailbox.

2. **Middleware**: Before deposit, each registered middleware function runs in order. Middleware can transform the event or return `null` to block it entirely.

3. **Propagate**: The propagation loop runs:
   - Compute the **topological order** of all rules (cached, recomputed only when the DAG changes).
   - For each rule in order:
     - **`each` mode**: While the rule's input mailbox has a ready event (one where this rule is still in `_pendingConsumers`), consume it, run the guard (if any), execute the action, and deposit any output events.
     - **`join` mode**: Check if all input mailboxes have a ready event. If so, consume one from each, run the guard, execute the action, and deposit the output. If the guard rejects, events are returned to their mailboxes via `unconsume`.
   - Repeat until no mailbox produces new work (quiescent) or the round limit is exceeded.

4. **Drain pending**: If `emit` was called during propagation (e.g., from an `on` handler or async callback), those emissions were queued. They are now drained one at a time, each triggering a new propagation pass.

### DAG Construction

Rules are nodes. Edges connect producer rules to consumer rules: if rule A outputs event type X, and rule B triggers on event type X, there is an edge from A to B. The DAG maintains both forward (`_adj`) and reverse (`_radj`) adjacency lists. Cycle detection uses DFS with three-color marking. Topological sort uses Kahn's algorithm with priority-based tie-breaking for deterministic ordering among peers.

### Mailboxes and Ref-Counted Consumption

Each event type has a `Mailbox` -- a queue of `PulseEvent` objects. Each event tracks which rules still need to consume it (`_pendingConsumers` set). When a rule consumes an event, it removes itself from that set. When the set is empty, the event is removed from the queue and recycled to the object pool (max 512 pooled objects). This ref-counting ensures that events are available to all downstream rules in the same propagation cycle.

### Frame Loop Integration

Tweens and springs are advanced each frame. The frame tick sequence is:

1. Flush coalesced events (batched from `coalesce`)
2. Advance all active tweens by `dt`, emit `done` events for completed tweens
3. Advance all unsettled springs by `dt`, emit `done` events for newly settled springs
4. Emit the built-in `engine.frame` event with `{ time, dt }`
5. Recursively tick all child engines
