/// Pulse -- Deterministic event engine with DAG-ordered propagation.
library pulse;

// Engine
export 'src/engine.dart' show Engine, CycleError, EngineOptions, createEngine;

// Event types
export 'src/event_type.dart' show EventType, createEventType, resetEventTypeCounter;

// Events
export 'src/event.dart' show PulseEvent, createEvent, recycleEvent, resetSequence, currentSequence;

// Rules
export 'src/rule.dart' show Rule, RuleMode, RuleConfig, createRule, registerRuleConsumers, unregisterRuleConsumers, resetRuleCounter;

// Mailbox
export 'src/mailbox.dart' show Mailbox;

// DAG
export 'src/dag.dart' show DAG, DAGEdge, DAGGraph;

// Propagation
export 'src/propagation.dart' show propagate;

// Skip sentinel
export 'src/skip.dart' show Skip, isSkip;
