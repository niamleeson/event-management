import type {
  EventType,
  Rule,
  EngineOptions,
} from './types.js'

import { createEventType } from './event-type.js'
import { createEvent, recycleEvent } from './event.js'
import { createRule, registerRuleConsumers, unregisterRuleConsumers } from './rule.js'
import { Mailbox } from './mailbox.js'
import { DAG } from './dag.js'
import { propagate } from './propagation.js'

/** Skip sentinel — return from on() handler to signal "no output" */
export const Skip: unique symbol = Symbol.for('pulse.skip') as any

/** Bound emitter — fires a specific event type */
export type Emitter<T = any> = (payload: T) => void

/**
 * RuleHandle — returned by on() with a handler.
 * Callable as a dispose function.
 */
export interface RuleHandle {
  /** Dispose the rule (unsubscribe) */
  (): void
  /** Dispose the rule (unsubscribe) */
  dispose(): void
}

export class CycleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CycleError'
  }
}

/**
 * RuleBuilder — returned by on() when no handler is provided.
 * Allows declarative chaining: engine.on(A).emit(B, transform?)
 * Also acts as a dispose function.
 */
export class RuleBuilder {
  private _engine: Engine
  private _triggers: EventType[]
  private _mode: 'each' | 'join'
  private _emitEntries: Array<{ output: EventType; transform?: (payload: any) => any }> = []
  private _rule: Rule | null = null
  private _disposed = false

  constructor(engine: Engine, triggers: EventType[], mode: 'each' | 'join') {
    this._engine = engine
    this._triggers = triggers
    this._mode = mode
  }

  /** Chain an output event with optional transform. Returns this for further chaining. */
  emit<Out>(output: EventType<Out>, transform?: (payload: any) => Out): RuleBuilder {
    this._emitEntries.push({ output, transform })
    this._materialize()
    return this
  }

  /** Dispose the rule (unsubscribe) */
  dispose(): void {
    if (this._disposed) return
    this._disposed = true
    if (this._rule) {
      (this._engine as any)._disposeRule(this._rule)
      this._rule = null
    }
  }

  /** Materialize or update the underlying rule from current emit entries */
  private _materialize(): void {
    // Remove old rule if exists
    if (this._rule) {
      (this._engine as any)._disposeRule(this._rule)
      this._rule = null
    }

    const entries = this._emitEntries
    const engineRef = this._engine
    let action: (...payloads: any[]) => void

    const isJoin = this._mode === 'join'

    if (entries.length === 1) {
      // Specialized fast path for single-output chains
      const { output, transform } = entries[0]
      if (transform) {
        if (isJoin) {
          action = (...payloads: any[]) => {
            const result = transform(payloads)
            if (result !== Skip) engineRef.emit(output, result)
          }
        } else {
          action = (payload: any) => {
            const result = transform(payload)
            if (result !== Skip) engineRef.emit(output, result)
          }
        }
      } else {
        if (isJoin) {
          action = (...payloads: any[]) => { engineRef.emit(output, payloads) }
        } else {
          action = (payload: any) => { engineRef.emit(output, payload) }
        }
      }
    } else {
      // Multi-output chain
      if (isJoin) {
        action = (...payloads: any[]) => {
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]
            const result = entry.transform ? entry.transform(payloads) : payloads
            if (result !== Skip) engineRef.emit(entry.output, result)
          }
        }
      } else {
        action = (payload: any) => {
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]
            const result = entry.transform ? entry.transform(payload) : payload
            if (result !== Skip) engineRef.emit(entry.output, result)
          }
        }
      }
    }

    const outputs = entries.map(e => e.output)
    this._rule = (this._engine as any)._createAndRegisterRule(
      `on(${this._triggers.map(t => t.name).join(',')})`,
      this._triggers,
      this._mode,
      action,
      outputs,
    )
  }
}

export class Engine {
  private _dag = new DAG()
  private _mailboxes = new Map<EventType, Mailbox>()
  private _maxRounds: number
  private _propagating = false
  private _pendingQ: any[] = []  // flat: [type, payload, type, payload, ...]
  private _depth = 0             // recursion depth for cycle detection
  private _destroyed = false
  private _contexts: Array<{ obj: any; defaults: any }> = []

  /** Error handler for rule action errors during propagation */
  onError?: (error: Error, rule: Rule, event: any) => void

  /** Debug hooks — assign these to receive propagation telemetry (used by @pulse/devtools) */
  debug: {
    /** Fires on EVERY emit (including fast path). Lightweight — only checked when set. */
    onEmit?: (typeName: string, payload: any) => void
    onCycleStart?: (cycle: { seq: number }) => void
    onCycleEnd?: (cycle: { seq: number; rulesEvaluated: number; eventsDeposited: number; duration: number }) => void
    onEventDeposited?: (event: { type: { name: string }; payload: any; seq: number }) => void
    onRuleFired?: (rule: { id: string; name: string }, inputs: any[], outputs: any[]) => void
  } = {}

  constructor(options?: EngineOptions) {
    this._maxRounds = options?.maxPropagationRounds ?? 100
  }

  /** Create a named event type */
  event<T = void>(name: string): EventType<T> {
    return createEventType<T>(name)
  }

  /**
   * Create a context object — shared state that handlers read/write.
   * Context is NOT an event source. Changing context doesn't trigger events.
   * Events trigger events. Context is just state for handlers to consult.
   * Automatically reset to defaults on engine.reset().
   */
  context<T extends Record<string, any>>(defaults: T): T {
    const obj = { ...defaults }
    this._contexts.push({ obj, defaults })
    return obj
  }

  /** Reset all contexts to their default values */
  reset(): void {
    for (const { obj, defaults } of this._contexts) {
      for (const key of Object.keys(defaults)) {
        obj[key] = typeof defaults[key] === 'object' && defaults[key] !== null
          ? Array.isArray(defaults[key])
            ? [...defaults[key]]
            : { ...defaults[key] }
          : defaults[key]
      }
    }
  }

  /**
   * Emit an event.
   *
   * Fast path: for non-join events, dispatches directly to handlers
   * without creating Event objects, mailboxes, or running propagation.
   *
   * Slow path: for events with join consumers, uses full mailbox+propagation.
   */
  emit<T>(type: EventType<T>, payload: T): void {
    this.debug.onEmit?.(type.name, payload)

    // Re-entrant emit: inline solo fast path, queue everything else
    if (this._propagating) {
      const solo = type._solo
      if (solo !== null && !solo._disposed) {
        if (solo.mode !== 'join') {
          // Inline chain dispatch (no queue overhead)
          if (++this._depth > this._maxRounds) {
            this._depth = 0
            throw new Error(`Propagation exceeded ${this._maxRounds} rounds — possible infinite loop`)
          }
          solo.action(payload)
          this._depth--
          return
        }
        // Inline join slot for re-entrant solo join
        const queues = solo._joinPending as any[][]
        const triggers = solo.triggers
        const idx = triggers[0] === type ? 0 : triggers.indexOf(type)
        if (queues[idx].length === 0) solo._joinReady++
        queues[idx].push(payload)
        if (solo._joinReady === triggers.length) {
          if (triggers.length === 2) {
            const a = queues[0][0]; queues[0].length = 0
            const b = queues[1][0]; queues[1].length = 0
            solo._joinReady = 0
            solo.action(a, b)
          } else {
            const args = new Array(queues.length)
            for (let j = 0; j < queues.length; j++) {
              args[j] = queues[j].shift()
              if (queues[j].length === 0) solo._joinReady--
            }
            solo.action(...args)
          }
        }
        return
      }
      this._pendingQ.push(type as EventType, payload)
      return
    }

    this._propagating = true

    // Inline solo dispatch — covers ~95% of emits
    const solo = type._solo
    if (solo !== null && !solo._disposed) {
      if (solo.mode !== 'join') {
        solo.action(payload)
      } else {
        // Inline join slot
        const queues = solo._joinPending as any[][]
        const triggers = solo.triggers
        const idx = triggers[0] === type ? 0 : triggers.indexOf(type)
        if (queues[idx].length === 0) solo._joinReady++
        queues[idx].push(payload)
        if (solo._joinReady === triggers.length) {
          if (triggers.length === 2) {
            const a = queues[0][0]; queues[0].length = 0
            const b = queues[1][0]; queues[1].length = 0
            solo._joinReady = 0
            solo.action(a, b)
          } else {
            const args = new Array(queues.length)
            for (let j = 0; j < queues.length; j++) {
              args[j] = queues[j].shift()
              if (queues[j].length === 0) solo._joinReady--
            }
            solo.action(...args)
          }
        }
      }
    } else {
      this._fire(type, payload)
    }

    // Drain queued emits (only non-empty when multi-consumer or slow path used)
    const q = this._pendingQ
    if (q.length > 0) {
      this._depth = 0
      let rounds = 0
      for (let i = 0; i < q.length; i += 2) {
        if (++rounds > this._maxRounds) {
          q.length = 0
          this._propagating = false
          throw new Error(`Propagation exceeded ${this._maxRounds} rounds — possible infinite loop`)
        }
        this._fire(q[i] as EventType, q[i + 1])
      }
      q.length = 0
    }

    this._propagating = false
  }

  /** @internal Dispatch a single event to its consumers */
  private _fire(type: EventType, payload: any): void {
    // Solo consumer: skip Set iteration
    const solo = type._solo
    if (solo !== null) {
      if (!solo._disposed) {
        if (solo.mode !== 'join') {
          solo.action(payload)
        } else {
          // Inline join for solo consumer
          const queues = solo._joinPending as any[][]
          const triggers = solo.triggers
          const idx = triggers[0] === type ? 0 : triggers.indexOf(type)
          if (queues[idx].length === 0) solo._joinReady++
          queues[idx].push(payload)
          if (solo._joinReady === triggers.length) {
            // Specialize for 2-trigger joins (most common)
            if (triggers.length === 2) {
              const a = queues[0][0]; queues[0].length = 0
              const b = queues[1][0]; queues[1].length = 0
              solo._joinReady = 0
              solo.action(a, b)
            } else {
              const args = new Array(queues.length)
              for (let i = 0; i < queues.length; i++) {
                args[i] = queues[i].shift()
                if (queues[i].length === 0) solo._joinReady--
              }
              solo.action(...args)
            }
          }
        }
      }
      return
    }

    const consumers = type._consumers
    if (consumers.size === 0) return

    // Dispatch to all consumers
    for (const rule of consumers) {
      if (rule._disposed) continue
      if (rule.mode !== 'join') {
        rule.action(payload)
      } else {
        const queues = rule._joinPending as any[][]
        const triggers = rule.triggers
        const idx = triggers[0] === type ? 0 : triggers.indexOf(type)
        if (queues[idx].length === 0) rule._joinReady++
        queues[idx].push(payload)
        if (rule._joinReady === triggers.length) {
          if (triggers.length === 2) {
            const a = queues[0][0]; queues[0].length = 0
            const b = queues[1][0]; queues[1].length = 0
            rule._joinReady = 0
            rule.action(a, b)
          } else {
            const args = new Array(queues.length)
            for (let i = 0; i < queues.length; i++) {
              args[i] = queues[i].shift()
              if (queues[i].length === 0) rule._joinReady--
            }
            rule.action(...args)
          }
        }
      }
    }
  }

  /**
   * React to event(s). DAG is purely static — no runtime tracing.
   *
   * **Chaining** (no handler) → RuleBuilder, DAG edges from .emit():
   *   engine.on(A).emit(B, transform)
   *
   * **Terminal handler** (no outputs) → RuleHandle:
   *   engine.on(A, (payload) => console.log(payload))
   *
   * **Array outputs** → bound emitters as positional args:
   *   engine.on(A, [B, C], (payload, b, c) => { b(val); c(val) })
   *
   * **Object outputs** → bound emitters as object properties:
   *   engine.on(A, { B, C }, (payload, { B, C }) => { B(val); C(val) })
   */
  on<T>(type: EventType<T>): RuleBuilder
  on<T>(type: EventType<T>, handler: (payload: T) => any): RuleHandle
  on<T>(type: EventType<T>, outputs: EventType[], handler: (payload: T, ...emitters: Emitter[]) => any): RuleHandle
  on<T>(type: EventType<T>, outputs: Record<string, EventType>, handler: (payload: T, out: Record<string, Emitter>) => any): RuleHandle
  on(type: EventType[]): RuleBuilder
  on(type: EventType[], handler: (...payloads: any[]) => any): RuleHandle
  on(type: EventType[], outputs: EventType[], handler: (...args: any[]) => any): RuleHandle
  on(type: EventType[], outputs: Record<string, EventType>, handler: (...args: any[]) => any): RuleHandle
  on(
    type: EventType | EventType[],
    handlerOrOutputs?: ((...args: any[]) => any) | EventType[] | Record<string, EventType>,
    maybeHandler?: (...args: any[]) => any,
  ): RuleHandle | RuleBuilder {
    const triggers = Array.isArray(type) ? type : [type]
    const mode = Array.isArray(type) ? 'join' : 'each'

    // No second arg → RuleBuilder for .emit() chaining
    if (!handlerOrOutputs) {
      return new RuleBuilder(this, triggers, mode)
    }

    // Second arg is function → terminal handler (no outputs)
    if (typeof handlerOrOutputs === 'function') {
      const handler = handlerOrOutputs
      // For 'each' mode: use handler directly as action (no wrapper, no rest args)
      const action = mode === 'each'
        ? handler
        : (...payloads: any[]) => handler(...payloads)
      const rule = this._createAndRegisterRule(
        `on(${triggers.map(t => t.name).join(',')})`,
        triggers, mode, action, [],
      )
      return this._createRuleHandle(rule)
    }

    // Second arg is array → output EventTypes, bound emitters as positional args
    if (Array.isArray(handlerOrOutputs)) {
      const outputTypes = handlerOrOutputs as EventType[]
      const handler = maybeHandler!
      const emitters = outputTypes.map(t => (payload: any) => this.emit(t, payload))
      let action: (...args: any[]) => void

      if (mode === 'each') {
        // Specialize by emitter count to avoid spread
        if (emitters.length === 1) {
          const e0 = emitters[0]
          action = (payload: any) => handler(payload, e0)
        } else if (emitters.length === 2) {
          const e0 = emitters[0], e1 = emitters[1]
          action = (payload: any) => handler(payload, e0, e1)
        } else if (emitters.length === 3) {
          const e0 = emitters[0], e1 = emitters[1], e2 = emitters[2]
          action = (payload: any) => handler(payload, e0, e1, e2)
        } else {
          action = (payload: any) => handler(payload, ...emitters)
        }
      } else {
        action = (...payloads: any[]) => handler(...payloads, ...emitters)
      }

      const rule = this._createAndRegisterRule(
        `on(${triggers.map(t => t.name).join(',')})`,
        triggers, mode, action, [...outputTypes],
      )
      return this._createRuleHandle(rule)
    }

    // Second arg is object → output EventTypes, bound emitters as object
    const outputsObj = handlerOrOutputs as Record<string, EventType>
    const handler = maybeHandler!
    const outputTypes = Object.values(outputsObj)
    const emitterObj: Record<string, Emitter> = {}
    for (const [key, eventType] of Object.entries(outputsObj)) {
      emitterObj[key] = (payload: any) => this.emit(eventType, payload)
    }

    const action = mode === 'each'
      ? (payload: any) => handler(payload, emitterObj)
      : (...payloads: any[]) => handler(...payloads, emitterObj)

    const rule = this._createAndRegisterRule(
      `on(${triggers.map(t => t.name).join(',')})`,
      triggers, mode, action, [...outputTypes],
    )
    return this._createRuleHandle(rule)
  }

  /** Destroy: tear down all engine state */
  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true

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

    // Clear pending emits
    this._pendingQ.length = 0
  }

  // -- Introspection --

  getRules(): Rule[] {
    return this._dag.getRules()
  }

  getMailboxes(): Map<EventType, Mailbox> {
    return this._mailboxes
  }

  getDAG(): import('./types.js').DAGGraph {
    return this._dag.getGraph()
  }

  // -- Internal (used by RuleBuilder) --

  /** @internal Create and register a rule in the DAG */
  _createAndRegisterRule(
    name: string,
    triggers: EventType[],
    mode: 'each' | 'join',
    action: (...payloads: any[]) => any,
    outputs: EventType[],
  ): Rule {
    const rule = createRule({ name, triggers, mode, action, outputs })
    registerRuleConsumers(rule)
    this._dag.addRule(rule)
    return rule
  }

  /** @internal Dispose a rule */
  _disposeRule(rule: Rule): void {
    unregisterRuleConsumers(rule)
    this._dag.removeRule(rule)
  }

  /** @internal Create a RuleHandle (callable dispose) */
  _createRuleHandle(rule: Rule): RuleHandle {
    const engine = this
    const dispose = () => engine._disposeRule(rule)
    const handle = function () { dispose() } as RuleHandle
    handle.dispose = dispose
    return handle
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
    } else {
      recycleEvent(ev)
    }
  }

  private _propagate(): void {
    if (this._propagating) return
    this._propagating = true
    try {
      propagate(this._dag, this._mailboxes, this._maxRounds, this.onError)
    } finally {
      this._propagating = false
    }
  }
}

/** Convenience factory */
export function createEngine(options?: EngineOptions): Engine {
  return new Engine(options)
}
