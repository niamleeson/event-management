import 'event_type.dart';
import 'event.dart';
import 'mailbox.dart';
import 'rule.dart';
import 'dag.dart';
import 'skip.dart';

/// Core propagation loop.
/// Drains mailboxes in topological (DAG) order, fires rules, deposits resulting events.
/// Repeats until quiescent or max rounds exceeded.
void propagate({
  required DAG dag,
  required Map<EventType, Mailbox> mailboxes,
  required void Function(EventType type, dynamic payload) emitFn,
  required int maxRounds,
  void Function(Object error, Rule rule, dynamic event)? onError,
}) {
  var rounds = 0;
  var work = true;

  while (work) {
    if (rounds >= maxRounds) {
      throw StateError(
          'Propagation exceeded $maxRounds rounds \u2014 probable cycle in rule graph');
    }
    work = false;
    rounds++;

    final order = dag.getTopologicalOrder();
    for (final rule in order) {
      if (rule.disposed) continue;

      if (rule.mode == RuleMode.each) {
        final trigger = rule.triggers[0];
        final mb = _getMailbox(mailboxes, trigger);
        while (mb.hasReadyEvent(rule)) {
          final ev = mb.consume(rule);
          if (rule.guard != null && !rule.guard!([ev.payload])) continue;
          try {
            final result = rule.action([ev.payload]);
            if (result != null && !isSkip(result) && rule.outputs.isNotEmpty) {
              if (rule.outputs.length > 1 && result is List) {
                for (var i = 0; i < rule.outputs.length; i++) {
                  _depositEvent(mailboxes, rule.outputs[i], result[i]);
                }
              } else {
                _depositEvent(mailboxes, rule.outputs[0], result);
              }
              work = true;
            }
          } catch (err) {
            if (onError != null) {
              onError(err, rule, ev.payload);
            } else {
              rethrow;
            }
          }
        }
      } else if (rule.mode == RuleMode.join) {
        var allReady = true;
        for (final t in rule.triggers) {
          if (!_getMailbox(mailboxes, t).hasReadyEvent(rule)) {
            allReady = false;
            break;
          }
        }
        if (allReady) {
          final consumed = <PulseEvent>[];
          final payloads = <dynamic>[];
          for (final t in rule.triggers) {
            final ev = _getMailbox(mailboxes, t).consume(rule);
            consumed.add(ev);
            payloads.add(ev.payload);
          }
          if (rule.guard != null && !rule.guard!(payloads)) {
            for (var i = 0; i < consumed.length; i++) {
              _getMailbox(mailboxes, rule.triggers[i])
                  .unconsumeAll(rule, [consumed[i]]);
            }
            continue;
          }
          try {
            final result = rule.action(payloads);
            if (result != null && !isSkip(result) && rule.outputs.isNotEmpty) {
              _depositEvent(mailboxes, rule.outputs[0], result);
              work = true;
            }
          } catch (err) {
            if (onError != null) {
              onError(err, rule, payloads);
            } else {
              rethrow;
            }
          }
        }
      }
    }
  }
}

Mailbox _getMailbox(Map<EventType, Mailbox> mailboxes, EventType type) {
  return mailboxes.putIfAbsent(type, () => Mailbox(type));
}

void _depositEvent(
    Map<EventType, Mailbox> mailboxes, EventType type, dynamic payload) {
  final ev = createEvent(type, payload);
  if (ev.pendingConsumers.isNotEmpty) {
    _getMailbox(mailboxes, type).enqueue(ev);
  }
}
