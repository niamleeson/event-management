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
    const ev = createEvent(type, payload)
    this.debug.onEventDeposited?.({ type: { name: type.name }, payload, seq: ev.seq })
    if (ev._pendingConsumers.size > 0) {
      this._getMailbox(type).enqueue(ev)
    }
  }

  private _propagate(): void {
    if (this._propagating) return
    this._propagating = true
    propagate(this._dag, this._mailboxes, (type, payload) => this._depositEvent(type, payload), this._maxRounds)
    this._propagating = false
  }

  private _tickFrame(time: number): void {
    const dt = this._firstTick ? 0 : time - this._lastFrameTime
    this._firstTick = false
    this._lastFrameTime = time

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
  }
}

/** Convenience factory */
export function createEngine(options?: EngineOptions): Engine {
  return new Engine(options)
}
