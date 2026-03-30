// ---- Pulse Core — Public API ----

// Engine
export { Engine, CycleError, createEngine } from './engine.js'

// Types
export type {
  EventType,
  PulseEvent,
  Rule,
  RuleMode,
  Signal,
  TweenValue,
  SpringValue,
  EngineOptions,
  FrameData,
  TweenConfig,
  SpringConfig,
  AsyncConfig,
  AsyncContext,
  AsyncStrategy,
  CycleInfo,
  DAGEdge,
  DAGGraph,
  EngineSnapshot,
  Middleware,
  RecordedEvent,
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

// Signal
export { createSignal } from './signal.js'

// Tween
export { createTween, startTween, advanceTween, cancelTween } from './tween.js'

// Spring
export { createSpring, advanceSpring } from './spring.js'

// Easing
export {
  linear,
  easeIn,
  easeOut,
  easeInOut,
  easeOutBack,
  easeOutElastic,
  easeOutBounce,
  easeOutExpo,
  cubicBezier,
  resolveEasing,
} from './easing.js'

// Propagation
export { propagate } from './propagation.js'

// Async
export { setupAsync } from './async-rule.js'
