import 'rule.dart';

int _eventTypeCounter = 0;

/// A named event channel declaration. Not an instance.
///
/// [T] is the payload type carried by events on this channel.
class EventType<T> {
  final String name;
  final Set<Rule> consumers = {};

  EventType._(this.name);

  @override
  String toString() => 'EventType($name)';
}

/// Create a named [EventType] declaration.
EventType<T> createEventType<T>(String name) {
  return EventType<T>._('$name#${_eventTypeCounter++}');
}

/// Reset the counter (for testing).
void resetEventTypeCounter() {
  _eventTypeCounter = 0;
}
