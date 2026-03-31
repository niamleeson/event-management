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
  asyncDelivery?: 'immediate' | 'next-frame'
}

/** Signal: a reactive value derived from events. Call to read: `signal()` */
export interface Signal<T = any> {
  /** Call to read current value */
  (): T
  /** Current value (also accessible as property) */
  value: T
  subscribe(callback: (value: T, prev: T) => void): () => void
  /** Imperative setter */
  set(next: T): void
  /** internal */
  _subscribers: Set<(value: T, prev: T) => void>
  _set(next: T): void
}

/** TweenValue: animated numeric value */
export interface TweenValue {
  value: number
  active: boolean
  progress: number
  subscribe(callback: (value: number) => void): () => void
  /** internal */
  _subscribers: Set<(value: number) => void>
  _from: number | (() => number)
  _to: number | (() => number)
  _duration: number
  _elapsed: number
  _easing: (t: number) => number
  _startEvent: EventType
  _doneEvent?: EventType
  _cancelEvents: EventType[]
  _started: boolean
  _cancelRule?: () => void
}

/** SpringValue: physics-driven animated value */
export interface SpringValue {
  value: number
  velocity: number
  settled: boolean
  subscribe(callback: (value: number) => void): () => void
  /** internal */
  _subscribers: Set<(value: number) => void>
  _target: Signal<number> | TweenValue
  _stiffness: number
  _damping: number
  _restThreshold: number
  _doneEvent?: EventType
  _doneEmitted: boolean
}

/** Frame data payload */
export interface FrameData {
  time: number
  dt: number
}

/** Async strategy */
export type AsyncStrategy = 'latest' | 'first' | 'all' | 'queue'

/** Async context passed to handler */
export interface AsyncContext {
  signal: AbortSignal
  progress: (data: any) => void
}

/** Async config */
export interface AsyncConfig<In, Out> {
  pending?: EventType | null
  done?: EventType<Out>
  error?: EventType<any>
  cancel?: EventType
  cancelled?: EventType
  progress?: EventType
  strategy?: AsyncStrategy
  do: (payload: In, ctx: AsyncContext) => Promise<Out>
}

/** Tween configuration */
export interface TweenConfig {
  start: EventType
  done?: EventType
  cancel?: EventType | EventType[]
  from: number | (() => number)
  to: number | (() => number)
  duration: number
  easing?: string | ((t: number) => number)
}

/** Spring configuration */
export interface SpringConfig {
  stiffness?: number
  damping?: number
  restThreshold?: number
  done?: EventType
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

/** Snapshot of engine signal state for serialization */
export type EngineSnapshot = Map<string, any>

/** Middleware function type */
export type Middleware = (event: { type: EventType; payload: any }) => { type: EventType; payload: any } | null

/** Recorded event for replay */
export interface RecordedEvent {
  type: EventType
  payload: any
  timestamp: number
}
