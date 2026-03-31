import 'package:test/test.dart';
import 'package:pulse/pulse.dart';

void main() {
  late EventType<int> eventType;
  late Rule rule1;
  late Rule rule2;

  setUp(() {
    resetSequence();
    resetEventTypeCounter();
    resetRuleCounter();

    eventType = createEventType<int>('test');
    rule1 = createRule(RuleConfig(
      name: 'r1',
      triggers: [eventType],
      mode: RuleMode.each,
      action: (_) {},
      outputs: [],
    ));
    rule2 = createRule(RuleConfig(
      name: 'r2',
      triggers: [eventType],
      mode: RuleMode.each,
      action: (_) {},
      outputs: [],
    ));
    eventType.consumers.add(rule1);
    eventType.consumers.add(rule2);
  });

  test('should enqueue and retrieve events', () {
    final mb = Mailbox(eventType);
    final ev = createEvent(eventType, 42);
    mb.enqueue(ev);

    expect(mb.size, equals(1));
    expect(mb.hasReadyEvent(rule1), isTrue);
    expect(mb.hasReadyEvent(rule2), isTrue);
  });

  test('should peek without consuming', () {
    final mb = Mailbox(eventType);
    final ev = createEvent(eventType, 42);
    mb.enqueue(ev);

    final peeked = mb.peek(rule1);
    expect(peeked, same(ev));
    expect(mb.hasReadyEvent(rule1), isTrue); // still ready
  });

  test('should consume an event for a specific rule', () {
    final mb = Mailbox(eventType);
    final ev = createEvent(eventType, 42);
    mb.enqueue(ev);

    final consumed = mb.consume(rule1);
    expect(consumed.payload, equals(42));
    expect(mb.hasReadyEvent(rule1), isFalse);
    // rule2 should still be able to see it.
    expect(mb.hasReadyEvent(rule2), isTrue);
  });

  test('should remove event from queue when all consumers have consumed', () {
    final mb = Mailbox(eventType);
    final ev = createEvent(eventType, 42);
    mb.enqueue(ev);

    mb.consume(rule1);
    expect(mb.size, equals(1)); // still in queue for rule2

    mb.consume(rule2);
    expect(mb.size, equals(0)); // fully consumed, removed
  });

  test('should count ready events for a rule', () {
    final mb = Mailbox(eventType);
    mb.enqueue(createEvent(eventType, 1));
    mb.enqueue(createEvent(eventType, 2));
    mb.enqueue(createEvent(eventType, 3));

    expect(mb.countReadyEvents(rule1), equals(3));
    mb.consume(rule1);
    expect(mb.countReadyEvents(rule1), equals(2));
  });

  test('should unconsume events on guard failure', () {
    final mb = Mailbox(eventType);
    final ev = createEvent(eventType, 42);
    mb.enqueue(ev);

    final consumed = mb.consume(rule1);
    expect(mb.hasReadyEvent(rule1), isFalse);

    mb.unconsumeAll(rule1, [consumed]);
    expect(mb.hasReadyEvent(rule1), isTrue);
  });

  test('should handle unconsume of fully-consumed event', () {
    final mb = Mailbox(eventType);
    final ev = createEvent(eventType, 42);
    mb.enqueue(ev);

    // Both consume it.
    mb.consume(rule1);
    final consumed2 = mb.consume(rule2); // this removes from queue
    expect(mb.size, equals(0));

    // Unconsume for rule2 -- should re-add to queue.
    mb.unconsumeAll(rule2, [consumed2]);
    expect(mb.size, equals(1));
    expect(mb.hasReadyEvent(rule2), isTrue);
  });

  test('should throw when consuming from empty mailbox', () {
    final mb = Mailbox(eventType);
    expect(() => mb.consume(rule1), throwsA(isA<StateError>()));
  });

  test('should clear all events', () {
    final mb = Mailbox(eventType);
    mb.enqueue(createEvent(eventType, 1));
    mb.enqueue(createEvent(eventType, 2));
    expect(mb.size, equals(2));

    mb.clear();
    expect(mb.size, equals(0));
  });

  test('should handle single-consumer ref counting', () {
    final singleType = createEventType<int>('single');
    singleType.consumers.add(rule1);

    final mb = Mailbox(singleType);
    final ev = createEvent(singleType, 99);
    mb.enqueue(ev);

    mb.consume(rule1);
    // Should be removed since it was the only consumer.
    expect(mb.size, equals(0));
  });
}
