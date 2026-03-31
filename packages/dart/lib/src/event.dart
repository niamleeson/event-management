import 'event_type.dart';
import 'rule.dart';

int _globalSeq = 0;

// ---- Object Pool for Events (hot-path optimization) ----
const int _poolMax = 512;
PulseEvent? _poolHead;
int _poolSize = 0;

/// An immutable event instance in a mailbox.
class PulseEvent<T> {
  EventType<T> type;
  T payload;
  int seq;
  final Set<Rule> pendingConsumers = {};

  /// Pool linkage -- when recycled, points to next free event.
  PulseEvent? poolNext;

  PulseEvent._({
    required this.type,
    required this.payload,
    required this.seq,
  });

  @override
  String toString() => 'PulseEvent(${type.name}, seq=$seq)';
}

PulseEvent<T> _allocEvent<T>(EventType<T> type, T payload, int seq) {
  if (_poolHead != null) {
    final ev = _poolHead! as PulseEvent<T>;
    _poolHead = ev.poolNext;
    _poolSize--;
    ev.type = type;
    ev.payload = payload;
    ev.seq = seq;
    ev.pendingConsumers.clear();
    ev.poolNext = null;
    return ev;
  }
  return PulseEvent<T>._(type: type, payload: payload, seq: seq);
}

void _releaseEvent(PulseEvent ev) {
  if (_poolSize < _poolMax) {
    ev.poolNext = _poolHead;
    ev.pendingConsumers.clear();
    _poolHead = ev;
    _poolSize++;
  }
}

/// Create a new [PulseEvent] instance with a monotonic sequence number.
/// Consumers are populated from the event type's registered consumers.
PulseEvent<T> createEvent<T>(EventType<T> type, T payload) {
  final seq = _globalSeq++;
  final ev = _allocEvent(type, payload, seq);
  for (final rule in type.consumers) {
    if (!rule.disposed) {
      ev.pendingConsumers.add(rule);
    }
  }
  return ev;
}

/// Return an event to the pool when all consumers have processed it.
void recycleEvent(PulseEvent ev) {
  _releaseEvent(ev);
}

/// Reset the global sequence (for testing).
void resetSequence() {
  _globalSeq = 0;
}

/// Get the current sequence value (for devtools).
int currentSequence() => _globalSeq;
