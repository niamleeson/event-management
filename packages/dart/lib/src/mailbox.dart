import 'event_type.dart';
import 'event.dart';
import 'rule.dart';

/// Mailbox -- holds pending events for a given [EventType].
/// Events remain in the mailbox until all registered consumers have processed them.
class Mailbox<T> {
  final EventType<T> type;
  final List<PulseEvent<T>> queue = [];

  Mailbox(this.type);

  /// Add an event to this mailbox.
  void enqueue(PulseEvent<T> event) {
    queue.add(event);
  }

  /// Check if there is at least one event ready for the given rule.
  bool hasReadyEvent(Rule rule) {
    for (var i = 0; i < queue.length; i++) {
      if (queue[i].pendingConsumers.contains(rule)) {
        return true;
      }
    }
    return false;
  }

  /// Count how many events are ready for the given rule.
  int countReadyEvents(Rule rule) {
    var count = 0;
    for (var i = 0; i < queue.length; i++) {
      if (queue[i].pendingConsumers.contains(rule)) {
        count++;
      }
    }
    return count;
  }

  /// Peek at the first event ready for the given rule (without consuming).
  PulseEvent<T>? peek(Rule rule) {
    for (var i = 0; i < queue.length; i++) {
      if (queue[i].pendingConsumers.contains(rule)) {
        return queue[i];
      }
    }
    return null;
  }

  /// Consume the first event ready for the given rule.
  /// Marks the event as consumed by this rule.
  /// If all consumers have processed the event, it is removed and recycled.
  PulseEvent<T> consume(Rule rule) {
    for (var i = 0; i < queue.length; i++) {
      final ev = queue[i];
      if (ev.pendingConsumers.contains(rule)) {
        ev.pendingConsumers.remove(rule);
        // GC: if no more pending consumers, remove from queue.
        if (ev.pendingConsumers.isEmpty) {
          queue.removeAt(i);
        }
        return ev;
      }
    }
    throw StateError('Mailbox(${type.name}): no ready event for rule ${rule.id}');
  }

  /// Reverse a consumption -- put events back as pending for this rule.
  /// Used when a guard fails after consumption.
  void unconsumeAll(Rule rule, List<PulseEvent> events) {
    for (final ev in events) {
      ev.pendingConsumers.add(rule);
      if (!queue.contains(ev)) {
        queue.add(ev as PulseEvent<T>);
      }
    }
  }

  /// Get the number of events in the queue.
  int get size => queue.length;

  /// Clear all events.
  void clear() {
    for (final ev in queue) {
      recycleEvent(ev);
    }
    queue.clear();
  }
}
