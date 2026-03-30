import type {
  EventType,
  Signal,
  TweenValue,
  SpringValue,
  FrameData,
  EngineOptions,
  AsyncConfig,
  TweenConfig,
  SpringConfig,
  Rule,
  EngineSnapshot,
  Middleware,
  RecordedEvent,
} from './types.js'

import { createEventType } from './event-type.js'
import { createEvent } from './event.js'
import { createSignal } from './signal.js'
import { createTween, startTween, advanceTween, cancelTween } from './tween.js'
import { createSpring, advanceSpring } from './spring.js'
import { resolveEasing } from './easing.js'
import { createRule, registerRuleConsumers, unregisterRuleConsumers } from './rule.js'
import { Mailbox } from './mailbox.js'
import { DAG } from './dag.js'
import { propagate } from './propagation.js'
import { setupAsync } from './async-rule.js'

export class CycleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CycleError'
  }
}

export class Engine {
  private _dag = new DAG()
  private _mailboxes = new Map<EventType, Mailbox>()
  private _tweens: TweenValue[] = []
  private _springs: SpringValue[] = []
  private _signals: Signal<any>[] = []
  private _maxRounds: number
  private _frameId: number | null = null
  private _lastFrameTime = 0
  private _firstTick = true
  private _propagating = false
  private _pendingEmits: Array<{ type: EventType; payload: any }> = []
  private _cycleSeq = 0
  private _middlewares: Middleware[] = []
  private _children: Engine[] = []
  private _parent: Engine | null = null
  private _recording = false
  private _recordedEvents: RecordedEvent[] = []
  private _recordingStartTime = 0
  private _cleanups: Array<() => void> = []
  private _destroyed = false
  private _coalescePending = new Map<EventType, any>()
  private _coalesceScheduled = false

  /** Error handler for rule action errors during propagation */
  onError?: (error: Error, rule: Rule, event: any) => void

  /** Built-in frame event type */
  readonly frame: EventType<FrameData>

  /** Debug hooks — assign these to receive propagation telemetry (used by @pulse/devtools) */
  debug: {
    onCycleStart?: (cycle: { seq: number }) => void
    onCycleEnd?: (cycle: { seq: number; rulesEvaluated: number; eventsDeposited: number; duration: number }) => void
    onEventDeposited?: (event: { type: { name: string }; payload: any; seq: number }) => void
    onEventConsumed?: (event: { type: { name: string }; payload: any; seq: number }, rule: { id: string; name: string }) => void
    onRuleFired?: (rule: { id: string; name: string; mode: string }, inputs: any[], outputs: any[]) => void
    onTweenUpdate?: (tween: { value: number; progress: number; active: boolean }) => void
  } = {}

  constructor(options?: EngineOptions) {
    this._maxRounds = options?.maxPropagationRounds ?? 100
    this.frame = createEventType<FrameData>('__frame__')
  }

  /** Create a named event type */
  event<T = void>(name: string): EventType<T> {
    return createEventType<T>(name)
  }

  /** Emit an event */
  emit<T>(type: EventType<T>, payload: T): void {
    if (this._propagating) {
      this._pendingEmits.push({ type, payload })
      return
    }

    const seq = ++this._cycleSeq
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
    let rulesEvaluated = 0
    let eventsDeposited = 0

    this.debug.onCycleStart?.({ seq })

    this._depositEvent(type, payload)
    eventsDeposited++
    this._propagate()

    // Process any emissions that happened during propagation
    let drainRounds = 0
    while (this._pendingEmits.length > 0) {
      drainRounds++
      if (drainRounds > this._maxRounds) {
        this._pendingEmits.length = 0
        throw new Error(`Propagation exceeded ${this._maxRounds} rounds — possible infinite loop`)
      }
      const { type: t, payload: p } = this._pendingEmits.shift()!
      this._depositEvent(t, p)
      eventsDeposited++
      this._propagate()
    }

    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
    this.debug.onCycleEnd?.({ seq, rulesEvaluated, eventsDeposited, duration })
  }

  /** Listen to events of a type */
  on<T>(type: EventType<T>, handler: (payload: T) => void): () => void {
    const rule = createRule({
      name: `on(${type.name})`,
      triggers: [type],
      mode: 'each',
      action: handler,
      outputs: [],
    })
    registerRuleConsumers(rule)
    this._dag.addRule(rule)
    return () => {
      unregisterRuleConsumers(rule)
      this._dag.removeRule(rule)
    }
  }

  /** Pipe: transform events from one type to another */
  pipe<In, Out>(
    input: EventType<In>,
    output: EventType<Out> | EventType<any>[],
    transform: (payload: In) => Out | any[],
  ): () => void {
    const outputs = Array.isArray(output) ? output : [output]
    const rule = createRule({
      name: `pipe(${input.name})`,
      triggers: [input],
      mode: 'each',
      action: transform,
      outputs,
    })
    registerRuleConsumers(rule)
    this._dag.addRule(rule)
    return () => {
      unregisterRuleConsumers(rule)
      this._dag.removeRule(rule)
    }
  }

  /** Join: wait for all input types, then fire output */
  join<Out>(
    inputs: EventType[],
    output: EventType<Out>,
    config: { guard?: (...payloads: any[]) => boolean; do: (...payloads: any[]) => Out },
  ): () => void {
    const rule = createRule({
      name: `join(${inputs.map(i => i.name).join(',')})`,
      triggers: inputs,
      mode: 'join',
      guard: config.guard,
      action: config.do,
      outputs: [output],
    })
    registerRuleConsumers(rule)
    this._dag.addRule(rule)
    return () => {
      unregisterRuleConsumers(rule)
      this._dag.removeRule(rule)
    }
  }

  /** Create a signal (reactive value derived from events) */
  signal<T>(type: EventType<any>, initial: T, reducer: (prev: T, event: any) => T): Signal<T> {
    const sig = createSignal(initial)
    ;(sig as any)._eventType = type
    this._signals.push(sig)
    this.on(type, (payload) => {
      sig._set(reducer(sig.value, payload))
    })
    return sig
  }

  /** Add another event source to update a signal */
  signalUpdate<T>(sig: Signal<T>, type: EventType<any>, reducer: (prev: T, event: any) => T): () => void {
    return this.on(type, (payload) => {
      sig._set(reducer(sig.value, payload))
    })
  }

  /** Create a tween (animated value) */
  tween(config: TweenConfig): TweenValue {
    const easingFn = resolveEasing(config.easing)
    const cancelEvents = config.cancel
      ? Array.isArray(config.cancel) ? config.cancel : [config.cancel]
      : []

    const tw = createTween({
      from: config.from,
      to: config.to,
      duration: config.duration,
      easing: easingFn,
      startEvent: config.start,
      doneEvent: config.done,
      cancelEvents,
    })

    this.on(config.start, () => {
      startTween(tw)
    })

    for (const ce of cancelEvents) {
      this.on(ce, () => {
        cancelTween(tw)
      })
    }

    this._tweens.push(tw)
    return tw
  }

  /** Create a spring (physics-based animated value) */
  spring(target: Signal<number> | TweenValue, config?: SpringConfig): SpringValue {
    const sp = createSpring({
      target: target as any,
      stiffness: config?.stiffness ?? 170,
      damping: config?.damping ?? 26,
      restThreshold: config?.restThreshold ?? 0.01,
      doneEvent: config?.done,
    })

    this._springs.push(sp)
    return sp
  }

  /** Async operation handler */
  async<In, Out>(input: EventType<In>, config: AsyncConfig<In, Out>): () => void {
    return setupAsync(
      (type, handler) => this.on(type, handler),
      (type, payload) => this.emit(type, payload),
      input,
      config,
    )
  }

  /** Conditional pipe — only emits when handler returns non-null/non-undefined */
  pipeIf<In, Out>(
    input: EventType<In>,
    output: EventType<Out>,
    handler: (payload: In) => Out | null | undefined,
  ): () => void {
    const rule = createRule({
      name: `pipeIf(${input.name})`,
      triggers: [input],
      mode: 'each',
      action: handler,
      outputs: [output],
    })
    registerRuleConsumers(rule)
    this._dag.addRule(rule)
    return () => {
      unregisterRuleConsumers(rule)
      this._dag.removeRule(rule)
    }
  }

  /** Debounce: emit latest value after ms of inactivity */
  debounce<T>(input: EventType<T>, ms: number, output: EventType<T>): () => void {
    let timer: ReturnType<typeof setTimeout> | null = null
    let lastPayload: T | undefined
    const unsub = this.on(input, (payload) => {
      lastPayload = payload
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        if (lastPayload !== undefined) {
          this.emit(output, lastPayload!)
        }
      }, ms)
    })
    const cleanup = () => {
      unsub()
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    }
    this._cleanups.push(cleanup)
    return cleanup
  }

  /** Throttle: emit at most once per ms. First goes through, last pending fires on window expiry. */
  throttle<T>(input: EventType<T>, ms: number, output: EventType<T>): () => void {
    let timer: ReturnType<typeof setTimeout> | null = null
    let lastPayload: T | undefined
    let hasTrailing = false

    const unsub = this.on(input, (payload) => {
      if (timer === null) {
        // Window not active — emit immediately and start window
        this.emit(output, payload)
        lastPayload = undefined
        hasTrailing = false
        timer = setTimeout(() => {
          timer = null
          if (hasTrailing && lastPayload !== undefined) {
            this.emit(output, lastPayload!)
            lastPayload = undefined
            hasTrailing = false
            // Start new window for the trailing emit
            timer = setTimeout(() => { timer = null }, ms)
          }
        }, ms)
      } else {
        // Inside window — buffer the latest
        lastPayload = payload
        hasTrailing = true
      }
    })

    const cleanup = () => {
      unsub()
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    }
    this._cleanups.push(cleanup)
    return cleanup
  }

  /** Computed signal: derived from other signals, recomputes when any dependency changes */
  computed<T>(deps: Signal<any>[], compute: (...values: any[]) => T): Signal<T> {
    const initialValues = deps.map(d => d.value)
    const sig = createSignal(compute(...initialValues))
    this._signals.push(sig)

    const recompute = () => {
      const values = deps.map(d => d.value)
      sig._set(compute(...values))
    }

    const unsubs: Array<() => void> = []
    for (const dep of deps) {
      unsubs.push(dep.subscribe(recompute))
    }

    this._cleanups.push(() => {
      for (const u of unsubs) u()
    })

    return sig
  }

  /** Time-windowed join: all inputs must arrive within windowMs of the first */
  joinWithin<Out>(
    inputs: EventType[],
    output: EventType<Out>,
    windowMs: number,
    config: { guard?: (...payloads: any[]) => boolean; do: (...payloads: any[]) => Out },
  ): () => void {
    const accumulated = new Map<EventType, any>()
    let timer: ReturnType<typeof setTimeout> | null = null
    const unsubs: Array<() => void> = []

    for (let i = 0; i < inputs.length; i++) {
      const inputType = inputs[i]
      const unsub = this.on(inputType, (payload) => {
        if (accumulated.size === 0) {
          // First event — start the window
          timer = setTimeout(() => {
            // Window expired — discard accumulated
            accumulated.clear()
            timer = null
          }, windowMs)
        }

        accumulated.set(inputType, payload)

        // Check if all inputs are present
        if (accumulated.size === inputs.length) {
          if (timer !== null) {
            clearTimeout(timer)
            timer = null
          }
          const payloads = inputs.map(t => accumulated.get(t))
          accumulated.clear()

          if (config.guard && !config.guard(...payloads)) return
          const result = config.do(...payloads)
          this.emit(output, result)
        }
      })
      unsubs.push(unsub)
    }

    const cleanup = () => {
      for (const u of unsubs) u()
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      accumulated.clear()
    }
    this._cleanups.push(cleanup)
    return cleanup
  }

  /** Event coalescing: batch events and emit latest on next frame tick */
  coalesce<T>(input: EventType<T>, output: EventType<T>): () => void {
    const unsub = this.on(input, (payload) => {
      this._coalescePending.set(input, { output, payload })
      if (!this._coalesceScheduled) {
        this._coalesceScheduled = true
      }
    })
    const cleanup = () => {
      unsub()
      this._coalescePending.delete(input)
    }
    this._cleanups.push(cleanup)
    return cleanup
  }

  /** Tween sequencing: chain tweens so each starts after the previous completes */
  sequence(
    start: EventType,
    tweenConfigs: TweenConfig[],
    done?: EventType,
  ): TweenValue[] {
    if (tweenConfigs.length === 0) return []

    const tweenValues: TweenValue[] = []
    const intermediateEvents: EventType[] = []

    // Create intermediate done events for chaining
    for (let i = 0; i < tweenConfigs.length - 1; i++) {
      intermediateEvents.push(this.event<void>(`__seq_step_${i}__`))
    }

    for (let i = 0; i < tweenConfigs.length; i++) {
      const cfg = tweenConfigs[i]
      const startEvent = i === 0 ? start : intermediateEvents[i - 1]
      const doneEvent = i === tweenConfigs.length - 1 ? done : intermediateEvents[i]

      const tw = this.tween({
        ...cfg,
        start: startEvent,
        done: doneEvent,
      })
      tweenValues.push(tw)
    }

    return tweenValues
  }

  /** Middleware: run before every event deposit. Can modify or block events. */
  use(middleware: Middleware): () => void {
    this._middlewares.push(middleware)
    return () => {
      const idx = this._middlewares.indexOf(middleware)
      if (idx >= 0) this._middlewares.splice(idx, 1)
    }
  }

  /** Create a child engine. Parent destruction destroys children. Children share parent frame loop. */
  createChild(): Engine {
    const child = new Engine({ maxPropagationRounds: this._maxRounds })
    child._parent = this
    this._children.push(child)
    return child
  }

  /** Destroy: tear down all engine state */
  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true

    // Destroy children first
    for (const child of this._children) {
      child.destroy()
    }
    this._children.length = 0

    // Stop frame loop
    this.stopFrameLoop()

    // Run all cleanup functions (debounce timers, throttle timers, computed subscriptions, etc.)
    for (const cleanup of this._cleanups) {
      cleanup()
    }
    this._cleanups.length = 0

    // Clear all mailboxes
    for (const mb of this._mailboxes.values()) {
      mb.clear()
    }
    this._mailboxes.clear()

    // Remove all rules from DAG
    const rules = this._dag.getRules()
    for (const rule of rules) {
      unregisterRuleConsumers(rule)
      this._dag.removeRule(rule)
    }

    // Clear signals
    for (const sig of this._signals) {
      sig._subscribers.clear()
    }
    this._signals.length = 0

    // Clear tweens
    for (const tw of this._tweens) {
      tw.active = false
      tw._subscribers.clear()
    }
    this._tweens.length = 0

    // Clear springs
    for (const sp of this._springs) {
      sp._subscribers.clear()
    }
    this._springs.length = 0

    // Clear pending emits
    this._pendingEmits.length = 0

    // Clear middlewares
    this._middlewares.length = 0

    // Clear coalesce state
    this._coalescePending.clear()
    this._coalesceScheduled = false

    // Clear recording state
    this._recording = false
    this._recordedEvents.length = 0

    // Remove from parent
    if (this._parent) {
      const idx = this._parent._children.indexOf(this)
      if (idx >= 0) this._parent._children.splice(idx, 1)
      this._parent = null
    }
  }

  /** Snapshot: capture all signal values for serialization */
  snapshot(): EngineSnapshot {
    const snap: EngineSnapshot = new Map()
    for (const sig of this._signals) {
      // Use the eventType name if available, otherwise fall back to index
      const identity = (sig as any)._eventType?.name ?? `signal_${this._signals.indexOf(sig)}`
      snap.set(identity, sig.value)
    }
    return snap
  }

  /** Restore: restore signal values from a snapshot */
  restore(snapshot: EngineSnapshot): void {
    for (const sig of this._signals) {
      const identity = (sig as any)._eventType?.name ?? `signal_${this._signals.indexOf(sig)}`
      if (snapshot.has(identity)) {
        sig._set(snapshot.get(identity))
      }
    }

    // Reset tweens
    for (const tw of this._tweens) {
      tw.active = false
      tw._elapsed = 0
      tw.progress = 0
      tw._started = false
    }

    // Reset springs
    for (const sp of this._springs) {
      sp.velocity = 0
      sp.settled = true
      sp._doneEmitted = false
    }
  }

  /** Start recording events */
  startRecording(): void {
    this._recording = true
    this._recordedEvents = []
    this._recordingStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  /** Stop recording and return the recorded events */
  stopRecording(): RecordedEvent[] {
    this._recording = false
    const events = this._recordedEvents.slice()
    this._recordedEvents = []
    return events
  }

  /** Replay a recording — re-emits events with original timing */
  replay(recording: RecordedEvent[]): void {
    if (recording.length === 0) return

    const baseTimestamp = recording[0].timestamp
    for (let i = 0; i < recording.length; i++) {
      const entry = recording[i]
      const delay = entry.timestamp - baseTimestamp
      if (delay <= 0) {
        this.emit(entry.type, entry.payload)
      } else {
        const cleanup = setTimeout(() => {
          this.emit(entry.type, entry.payload)
        }, delay)
        this._cleanups.push(() => clearTimeout(cleanup))
      }
    }
  }

  /** Emit output when signal matches predicate or value */
  when<T>(sig: Signal<T>, predicateOrValue: T | ((val: T) => boolean), output: EventType<T>): () => void {
    const predicate = typeof predicateOrValue === 'function'
      ? predicateOrValue as (val: T) => boolean
      : (val: T) => val === predicateOrValue

    return sig.subscribe((value) => {
      if (predicate(value)) {
        this.emit(output, value)
      }
    })
  }

  /** Start the frame loop (requestAnimationFrame) */
  startFrameLoop(): void {
    if (this._frameId !== null) return
    this._firstTick = true
    const loop = (time: number) => {
      this._tickFrame(time)
      this._frameId = requestAnimationFrame(loop)
    }
    this._frameId = requestAnimationFrame(loop)
  }

  /** Stop the frame loop */
  stopFrameLoop(): void {
    if (this._frameId !== null) {
      cancelAnimationFrame(this._frameId)
      this._frameId = null
    }
  }

  /** Manual tick for testing */
  tick(time: number): void {
    this._tickFrame(time)
  }

  // -- Introspection --

  getRules(): import('./types.js').Rule[] {
    return this._dag.getRules()
  }

  getMailboxes(): Map<EventType, Mailbox> {
    return this._mailboxes
  }

  getSignals(): Signal<any>[] {
    return this._signals.slice()
  }

  getTweens(): TweenValue[] {
    return this._tweens.slice()
  }

  getSprings(): SpringValue[] {
    return this._springs.slice()
  }

  getDAG(): import('./types.js').DAGGraph {
    return this._dag.getGraph()
  }

  // -- Private --

  private _getMailbox<T>(type: EventType<T>): Mailbox<T> {
    let mb = this._mailboxes.get(type)
    if (!mb) {
      mb = new Mailbox(type)
      this._mailboxes.set(type, mb)
    }
    return mb as Mailbox<T>
  }

  private _depositEvent<T>(type: EventType<T>, payload: T): void {
    // Run middleware
    let eventData: { type: EventType; payload: any } | null = { type, payload }
    for (const mw of this._middlewares) {
      eventData = mw(eventData!)
      if (eventData === null) return // Middleware blocked the event
    }

    // Record if recording
    if (this._recording) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      this._recordedEvents.push({
        type: eventData.type,
        payload: eventData.payload,
        timestamp: now - this._recordingStartTime,
      })
    }

    const ev = createEvent(eventData.type, eventData.payload)
    this.debug.onEventDeposited?.({ type: { name: eventData.type.name }, payload: eventData.payload, seq: ev.seq })
    if (ev._pendingConsumers.size > 0) {
      this._getMailbox(eventData.type).enqueue(ev)
    }
  }

  private _propagate(): void {
    if (this._propagating) return
    this._propagating = true
    propagate(this._dag, this._mailboxes, (type, payload) => this._depositEvent(type, payload), this._maxRounds, this.onError)
    this._propagating = false
  }

  private _tickFrame(time: number): void {
    const dt = this._firstTick ? 0 : time - this._lastFrameTime
    this._firstTick = false
    this._lastFrameTime = time

    // Flush coalesced events
    if (this._coalesceScheduled) {
      this._coalesceScheduled = false
      for (const [, entry] of this._coalescePending) {
        this.emit(entry.output, entry.payload)
      }
      this._coalescePending.clear()
    }

    // Advance tweens
    for (const tw of this._tweens) {
      if (tw.active) {
        const done = advanceTween(tw, dt)
        this.debug.onTweenUpdate?.({ value: tw.value, progress: tw.progress, active: tw.active })
        if (done && tw._doneEvent) {
          this.emit(tw._doneEvent, undefined as any)
        }
      }
    }

    // Advance springs
    for (const sp of this._springs) {
      if (!sp.settled) {
        const justSettled = advanceSpring(sp, dt)
        if (justSettled && sp._doneEvent && !sp._doneEmitted) {
          sp._doneEmitted = true
          this.emit(sp._doneEvent, undefined as any)
        }
      }
    }

    // Emit frame event
    this.emit(this.frame, { time, dt })

    // Tick children
    for (const child of this._children) {
      child._tickFrame(time)
    }
  }
}

/** Convenience factory */
export function createEngine(options?: EngineOptions): Engine {
  return new Engine(options)
}
