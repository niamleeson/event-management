import 'event_type.dart';

/// Rule mode: 'each' fires per-event, 'join' fires when all input types ready.
enum RuleMode { each, join }

int _ruleCounter = 0;

/// A node in the DAG representing a reactive rule.
class Rule {
  final String id;
  final String name;
  final List<EventType> triggers;
  final RuleMode mode;
  final bool Function(List<dynamic>)? guard;
  final dynamic Function(List<dynamic>) action;
  final List<EventType> outputs;
  final int priority;
  bool disposed = false;

  Rule._({
    required this.id,
    required this.name,
    required this.triggers,
    required this.mode,
    this.guard,
    required this.action,
    required this.outputs,
    required this.priority,
  });

  @override
  String toString() => 'Rule($name)';
}

/// Configuration for creating a [Rule].
class RuleConfig {
  final String? name;
  final List<EventType> triggers;
  final RuleMode mode;
  final bool Function(List<dynamic>)? guard;
  final dynamic Function(List<dynamic>) action;
  final List<EventType> outputs;
  final int priority;

  const RuleConfig({
    this.name,
    required this.triggers,
    required this.mode,
    this.guard,
    required this.action,
    required this.outputs,
    this.priority = 0,
  });
}

/// Create a [Rule] node for the DAG.
Rule createRule(RuleConfig config) {
  final id = 'rule_${_ruleCounter++}';
  return Rule._(
    id: id,
    name: config.name ?? id,
    triggers: config.triggers,
    mode: config.mode,
    guard: config.guard,
    action: config.action,
    outputs: config.outputs,
    priority: config.priority,
  );
}

/// Register a rule as a consumer of its trigger event types.
void registerRuleConsumers(Rule rule) {
  for (final trigger in rule.triggers) {
    trigger.consumers.add(rule);
  }
}

/// Unregister a rule from its trigger event types.
void unregisterRuleConsumers(Rule rule) {
  for (final trigger in rule.triggers) {
    trigger.consumers.remove(rule);
  }
  rule.disposed = true;
}

/// Reset counter (for testing).
void resetRuleCounter() {
  _ruleCounter = 0;
}
