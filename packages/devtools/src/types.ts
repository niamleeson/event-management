// ---- Type definitions for the Pulse Engine interface consumed by devtools ----
// These mirror the hooks and introspection methods the engine exposes.

/**
 * Debug hooks that the engine fires during propagation.
 * The devtools subscribes to these to build the timeline and animate the graph.
 */
export interface EngineDebugHooks {
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
    rule: { id: string; name: string },
  ) => void
  onRuleFired?: (
    rule: { id: string; name: string; mode: string },
    inputs: any[],
    outputs: any[],
  ) => void
  onTweenUpdate?: (tween: {
    value: number
    progress: number
    active: boolean
  }) => void
}

/**
 * The engine interface that devtools depends on.
 * This is a structural type — any engine that satisfies this shape will work.
 */
export interface PulseEngine {
  /** Subscribe to debug hooks */
  debug?: EngineDebugHooks

  /** Emit an event into the engine */
  emit(eventType: any, payload?: any): void

  /** Get all registered rules */
  getRules(): Array<{
    id: string
    name: string
    mode: string
    triggers: Array<{ name: string }>
    outputs: Array<{ name: string }>
  }>

  /** Get all mailboxes with their queued events */
  getMailboxes(): Map<
    any,
    { queue: Array<{ payload: any; seq: number }> }
  >

  /** Get all signals */
  getSignals(): Array<{ _eventType: { name: string }; value: any }>

  /** Get all tween values */
  getTweens(): Array<{ value: number; active: boolean; progress: number }>

  /** Get all spring values */
  getSprings(): Array<{
    value: number
    velocity: number
    settled: boolean
  }>

  /** Get the DAG representation */
  getDAG(): {
    nodes: Array<{ id: string; name: string }>
    edges: Array<[{ id: string }, { id: string }]>
  }
}

/**
 * Configuration for the devtools panel.
 */
export interface DevToolsOptions {
  /** DOM element to render into. If omitted, creates a floating panel. */
  container?: HTMLElement | null
  /** Panel position mode */
  position?: 'bottom' | 'right' | 'floating'
  /** Start collapsed */
  collapsed?: boolean
  /** Color theme */
  theme?: 'dark' | 'light'
}
