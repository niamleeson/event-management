import 'event_type.dart';
import 'event.dart';
import 'rule.dart';
import 'mailbox.dart';
import 'dag.dart';
import 'propagation.dart' as prop;

/// Error thrown when a cycle is detected in the rule DAG.
class CycleError extends StateError {
  CycleError(super.message);
}

/// Configuration options for the engine.
class EngineOptions {
  final int maxPropagationRounds;

  const EngineOptions({this.maxPropagationRounds = 100});
}

/// The core Pulse event engine.
///
/// Provides deterministic, synchronous event propagation with DAG-ordered rule evaluation.
class Engine {
  final DAG _dag = DAG();
  final Map<EventType, Mailbox> _mailboxes = {};
  final int _maxRounds;
  bool _propagating = false;
  final List<_PendingEmit> _pendingEmits = [];
  final List<void Function()> _cleanups = [];
  bool _destroyed = false;

  /// Error handler for rule action errors during propagation.
  void Function(Object error, Rule rule, dynamic event)? onError;

  Engine([EngineOptions? options])
      : _maxRounds = options?.maxPropagationRounds ?? 100;

  /// Create a named event type.
  EventType<T> event<T>(String name) {
    return createEventType<T>(name);
  }

  /// Emit an event, triggering synchronous propagation.
  void emit<T>(EventType<T> type, T payload) {
    if (_propagating) {
      _pendingEmits.add(_PendingEmit(type, payload));
      return;
    }

    _depositEvent(type, payload);
    _propagate();

    // Process any emissions that happened during propagation.
    var drainRounds = 0;
    while (_pendingEmits.isNotEmpty) {
      drainRounds++;
      if (drainRounds > _maxRounds) {
        _pendingEmits.clear();
        throw StateError(
            'Propagation exceeded $_maxRounds rounds \u2014 possible infinite loop');
      }
      final pending = _pendingEmits.removeAt(0);
      _depositEvent(pending.type, pending.payload);
      _propagate();
    }
  }

  /// Listen to events of a type. Returns an unsubscribe function.
  void Function() on<T>(EventType<T> type, void Function(T payload) handler) {
    final rule = createRule(RuleConfig(
      name: 'on(${type.name})',
      triggers: [type],
      mode: RuleMode.each,
      action: (payloads) {
        handler(payloads[0] as T);
        return null;
      },
      outputs: [],
    ));
    registerRuleConsumers(rule);
    _dag.addRule(rule);
    return () {
      unregisterRuleConsumers(rule);
      _dag.removeRule(rule);
    };
  }

  /// Listen to events and react. Alias for [on] that also lets handler emit.
  ///
  /// The handler receives the payload and can call [emit] internally.
  void Function() onAll(
    List<EventType> types,
    void Function(List<dynamic> payloads) handler,
  ) {
    final rule = createRule(RuleConfig(
      name: 'onAll(${types.map((t) => t.name).join(',')})',
      triggers: types,
      mode: RuleMode.join,
      action: (payloads) {
        handler(payloads);
        return null;
      },
      outputs: [],
    ));
    registerRuleConsumers(rule);
    _dag.addRule(rule);
    return () {
      unregisterRuleConsumers(rule);
      _dag.removeRule(rule);
    };
  }

  /// Pipe: transform events from one type to another.
  void Function() pipe<In, Out>(
    EventType<In> input,
    dynamic /* EventType<Out> | List<EventType> */ output,
    dynamic Function(In payload) transform,
  ) {
    final outputs =
        output is List<EventType> ? output : [output as EventType<Out>];
    final rule = createRule(RuleConfig(
      name: 'pipe(${input.name})',
      triggers: [input],
      mode: RuleMode.each,
      action: (payloads) => transform(payloads[0] as In),
      outputs: outputs,
    ));
    registerRuleConsumers(rule);
    _dag.addRule(rule);
    return () {
      unregisterRuleConsumers(rule);
      _dag.removeRule(rule);
    };
  }

  /// Join: wait for all input types, then fire output.
  void Function() join<Out>({
    required List<EventType> inputs,
    required EventType<Out> output,
    bool Function(List<dynamic> payloads)? guard,
    required Out Function(List<dynamic> payloads) action,
  }) {
    final rule = createRule(RuleConfig(
      name: 'join(${inputs.map((i) => i.name).join(',')})',
      triggers: inputs,
      mode: RuleMode.join,
      guard: guard,
      action: (payloads) => action(payloads),
      outputs: [output],
    ));
    registerRuleConsumers(rule);
    _dag.addRule(rule);
    return () {
      unregisterRuleConsumers(rule);
      _dag.removeRule(rule);
    };
  }

  /// Destroy: tear down all engine state.
  void destroy() {
    if (_destroyed) return;
    _destroyed = true;

    // Run all cleanup functions.
    for (final cleanup in _cleanups) {
      cleanup();
    }
    _cleanups.clear();

    // Clear all mailboxes.
    for (final mb in _mailboxes.values) {
      mb.clear();
    }
    _mailboxes.clear();

    // Remove all rules from DAG.
    final rules = _dag.getRules();
    for (final rule in rules) {
      unregisterRuleConsumers(rule);
      _dag.removeRule(rule);
    }

    // Clear pending emits.
    _pendingEmits.clear();
  }

  // -- Introspection --

  /// Get all registered rules.
  List<Rule> getRules() => _dag.getRules();

  /// Get all mailboxes.
  Map<EventType, Mailbox> getMailboxes() => _mailboxes;

  /// Get the DAG graph for introspection.
  DAGGraph getDAG() => _dag.getGraph();

  // -- Private --

  Mailbox _getMailbox(EventType type) {
    return _mailboxes.putIfAbsent(type, () => Mailbox(type));
  }

  void _depositEvent(EventType type, dynamic payload) {
    final ev = createEvent(type, payload);
    if (ev.pendingConsumers.isNotEmpty) {
      _getMailbox(type).enqueue(ev);
    }
  }

  void _propagate() {
    if (_propagating) return;
    _propagating = true;
    prop.propagate(
      dag: _dag,
      mailboxes: _mailboxes,
      emitFn: (type, payload) => _depositEvent(type, payload),
      maxRounds: _maxRounds,
      onError: onError,
    );
    _propagating = false;
  }
}

class _PendingEmit {
  final EventType type;
  final dynamic payload;
  _PendingEmit(this.type, this.payload);
}

/// Convenience factory.
Engine createEngine([EngineOptions? options]) => Engine(options);
