// ---- Core Types for Pulse Engine ----

/** A named event channel declaration. Not an instance. */
export interface EventType<T = any> {
  name: string
  _consumers: Set<Rule>
  /** Cached single consumer for ultra-fast single-handler dispatch */
  _solo: Rule | null
  _phantom?: T
}

/** An immutable event instance in a mailbox. */
export interface PulseEvent<T = any> {
  type: EventType<T>
  payload: T
  seq: number
  _pendingConsumers: Set<Rule>
  /** Pool linkage – when recycled, points to next free event */
  _poolNext: PulseEvent | null
}

/** Rule mode: 'each' fires per-event, 'join' fires when all input types ready */
export type RuleMode = 'each' | 'join'

/** A node in the DAG */
/** Sentinel for empty join slot */
export const JOIN_EMPTY: unique symbol = Symbol.for('pulse.join_empty') as any

export interface Rule {
  id: string
  name: string
  triggers: EventType[]
  mode: RuleMode
  guard?: (...payloads: any[]) => boolean
  action: (...payloads: any[]) => any
  outputs: EventType[]
  priority: number
  _disposed: boolean
  /** Fast join state: pending payloads per trigger (null for 'each' rules) */
  _joinPending: any[] | null
  /** Fast join state: count of ready triggers */
  _joinReady: number
}

/** Engine configuration */
export interface EngineOptions {
  maxPropagationRounds?: number
}

/** Frame data payload (convenience type for user-land frame loops) */
export interface FrameData {
  time: number
  dt: number
}

/** DAG edge */
export type DAGEdge = [Rule, Rule]

/** DAG representation for introspection */
export interface DAGGraph {
  nodes: Rule[]
  edges: DAGEdge[]
}

/** Cycle information for devtools */
export interface CycleInfo {
  seq: number
  rulesEvaluated?: number
  eventsDeposited?: number
  duration?: number
}
