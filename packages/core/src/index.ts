// ---- Pulse Core — Public API ----

// Engine
export { Engine, CycleError, createEngine, Skip, RuleBuilder } from './engine.js'
export type { Emitter, RuleHandle } from './engine.js'

// Types
export type {
  EventType,
  PulseEvent,
  Rule,
  RuleMode,
  EngineOptions,
  FrameData,
  CycleInfo,
  DAGEdge,
  DAGGraph,
} from './types.js'

// Event creation (for advanced usage)
export { createEventType, resetEventTypeCounter } from './event-type.js'
export { createEvent, resetSequence, currentSequence } from './event.js'

// Mailbox (for advanced usage / devtools)
export { Mailbox } from './mailbox.js'

// Rule (for advanced usage)
export { createRule, registerRuleConsumers, unregisterRuleConsumers, resetRuleCounter } from './rule.js'

// DAG (for advanced usage / devtools)
export { DAG } from './dag.js'

// Propagation
export { propagate } from './propagation.js'
