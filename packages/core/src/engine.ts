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

/** Skip sentinel — return from on() handler to signal "no action" */
export const Skip: unique symbol = Symbol.for('pulse.skip') as any

export class CycleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CycleError'
  }
}

export class Engine {
  private _dag = new DAG()
  private _mailboxes = new Map<EventType, Mailbox>()
  private _maxRounds: number
  private _propagating = false
  private _pendingEmits: Array<{ type: EventType; payload: any }> = []
  private _cycleSeq = 0
  private _destroyed = false

  /** Currently executing rule — used for runtime DAG tracing */
  private _currentRule: Rule | null = null

  /** Error handler for rule action errors during propagation */
  onError?: (error: Error, rule: Rule, event: any) => void

  /** Debug hooks — assign these to receive propagation telemetry (used by @pulse/devtools) */
  debug: {
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

  /** Emit an event */
  emit<T>(type: EventType<T>, payload: T): void {
    // Runtime DAG tracing: if we're inside a handler, record the edge
    if (this._currentRule) {
      if (!this._currentRule.outputs.includes(type)) {
        this._currentRule.outputs.push(type)
        this._dag.addEdgesForOutput(this._currentRule, type)
        this._dag.markDirty()
      }
    }

    if (this._propagating) {
      this._pendingEmits.push({ type, payload })
      return
    }

    const seq = ++this._cycleSeq
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
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
    this.debug.onCycleEnd?.({ seq, rulesEvaluated: 0, eventsDeposited, duration })
  }

  /** React to event(s) */
  on<T>(type: EventType<T>, handler: (payload: T) => any): () => void
  on(type: EventType[], handler: (...payloads: any[]) => any): () => void
  on(type: EventType | EventType[], handler: (...payloads: any[]) => any): () => void {
    if (Array.isArray(type)) {
      // Join mode: fire when ALL inputs have at least one unconsumed event
      const triggers = type
      const rule = createRule({
        name: `on(${triggers.map(t => t.name).join(',')})`,
        triggers,
        mode: 'join',
        action: (...payloads: any[]) => {
          const prev = this._currentRule
          this._currentRule = rule
          try {
            handler(...payloads)
          } finally {
            this._currentRule = prev
          }
        },
        outputs: [],
      })
      registerRuleConsumers(rule)
      this._dag.addRule(rule)
      return () => {
        unregisterRuleConsumers(rule)
        this._dag.removeRule(rule)
      }
    } else {
      // Single event mode
      const rule = createRule({
        name: `on(${type.name})`,
        triggers: [type],
        mode: 'each',
        action: (payload: any) => {
          const prev = this._currentRule
          this._currentRule = rule
          try {
            handler(payload)
          } finally {
            this._currentRule = prev
          }
        },
        outputs: [],
      })
      registerRuleConsumers(rule)
      this._dag.addRule(rule)
      return () => {
        unregisterRuleConsumers(rule)
        this._dag.removeRule(rule)
      }
    }
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
    this._pendingEmits.length = 0
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
