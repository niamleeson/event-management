// ---- Core Types for Pulse Engine ----

/** A named event channel declaration. Not an instance. */
export interface EventType<T = any> {
  name: string
  _consumers: Set<Rule>
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
