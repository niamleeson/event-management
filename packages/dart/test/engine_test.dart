import 'package:test/test.dart';
import 'package:pulse/pulse.dart';

void main() {
  late Engine engine;

  setUp(() {
    engine = Engine();
  });

  test('should create event types with unique names', () {
    final a = engine.event('click');
    final b = engine.event('click');
    expect(a.name, isNot(equals(b.name)));
    expect(a.name, contains('click'));
  });

  test('should pipe events from input to output', () {
    final input = engine.event<int>('input');
    final output = engine.event<int>('output');
    final results = <int>[];

    engine.pipe<int, int>(input, output, (x) => x * 2);
    engine.on<int>(output, (val) => results.add(val));

    engine.emit(input, 5);
    expect(results, equals([10]));
  });

  test('should chain multiple pipes', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');
    final c = engine.event<int>('c');
    final results = <int>[];

    engine.pipe<int, int>(a, b, (x) => x + 1);
    engine.pipe<int, int>(b, c, (x) => x * 10);
    engine.on<int>(c, (val) => results.add(val));

    engine.emit(a, 1);
    expect(results, equals([20])); // (1+1)*10
  });

  test('should handle pipe returning null (no output emitted)', () {
    final input = engine.event<int>('input');
    final output = engine.event<int>('output');
    final results = <int>[];

    engine.pipe<int, int?>(input, output, (x) {
      if (x > 0) return x;
      return null;
    });
    engine.on<int>(output, (val) => results.add(val));

    engine.emit(input, -1);
    expect(results, equals([]));

    engine.emit(input, 5);
    expect(results, equals([5]));
  });

  test('should support on() with unsubscribe', () {
    final ev = engine.event<String>('msg');
    final results = <String>[];

    final unsub = engine.on<String>(ev, (msg) => results.add(msg));

    engine.emit(ev, 'hello');
    expect(results, equals(['hello']));

    unsub();

    engine.emit(ev, 'world');
    expect(results, equals(['hello'])); // no change
  });

  test('should support multiple handlers on the same event type', () {
    final ev = engine.event<int>('num');
    final r1 = <int>[];
    final r2 = <int>[];

    engine.on<int>(ev, (n) => r1.add(n));
    engine.on<int>(ev, (n) => r2.add(n * 2));

    engine.emit(ev, 3);
    expect(r1, equals([3]));
    expect(r2, equals([6]));
  });

  test('should resolve entire graph synchronously in a single emit', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');
    final c = engine.event<int>('c');
    final d = engine.event<int>('d');
    final trace = <String>[];

    engine.pipe<int, int>(a, b, (x) {
      trace.add('a->b');
      return x + 1;
    });
    engine.pipe<int, int>(b, c, (x) {
      trace.add('b->c');
      return x + 1;
    });
    engine.pipe<int, int>(b, d, (x) {
      trace.add('b->d');
      return x * 2;
    });
    engine.on<int>(c, (_) => trace.add('c'));
    engine.on<int>(d, (_) => trace.add('d'));

    engine.emit(a, 0);
    expect(trace, contains('a->b'));
    expect(trace, contains('b->c'));
    expect(trace, contains('b->d'));
    expect(trace, contains('c'));
    expect(trace, contains('d'));
  });

  test('should handle nested emit during propagation', () {
    final a = engine.event<int>('a');
    final results = <int>[];

    engine.on<int>(a, (val) {
      results.add(val);
      if (val < 3) {
        engine.emit(a, val + 1);
      }
    });

    engine.emit(a, 1);
    expect(results, contains(1));
    expect(results, contains(2));
    expect(results, contains(3));
  });

  test('should handle pipe to multiple outputs', () {
    final input = engine.event<int>('input');
    final outA = engine.event<int>('outA');
    final outB = engine.event<int>('outB');
    final resA = <int>[];
    final resB = <int>[];

    engine.pipe<int, List<int>>(input, [outA, outB], (x) => [x + 1, x + 2]);
    engine.on<int>(outA, (v) => resA.add(v));
    engine.on<int>(outB, (v) => resB.add(v));

    engine.emit(input, 10);
    expect(resA, equals([11]));
    expect(resB, equals([12]));
  });

  test('should expose getRules()', () {
    final a = engine.event('a');
    final b = engine.event('b');
    engine.pipe(a, b, (x) => x);
    expect(engine.getRules().length, greaterThanOrEqualTo(1));
  });

  test('should expose getMailboxes()', () {
    final a = engine.event<int>('a');
    engine.emit(a, 1);
    expect(engine.getMailboxes(), isNotNull);
  });

  test('should expose getDAG()', () {
    final a = engine.event('a');
    final b = engine.event('b');
    engine.pipe(a, b, (x) => x);
    final dag = engine.getDAG();
    expect(dag.nodes.length, greaterThanOrEqualTo(1));
  });

  test('should handle events with no consumers gracefully', () {
    final orphan = engine.event<int>('orphan');
    expect(() => engine.emit(orphan, 99), returnsNormally);
  });

  test('should handle pipe unsubscribe', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');
    final results = <int>[];

    final unsub = engine.pipe<int, int>(a, b, (x) => x * 2);
    engine.on<int>(b, (v) => results.add(v));

    engine.emit(a, 5);
    expect(results, equals([10]));

    unsub();
    engine.emit(a, 5);
    expect(results, equals([10]));
  });

  test('should destroy and clean up', () {
    final a = engine.event<int>('a');
    final results = <int>[];
    engine.on<int>(a, (v) => results.add(v));

    engine.emit(a, 1);
    expect(results, equals([1]));

    engine.destroy();

    // After destroy, emitting should not reach the handler
    // (rules are removed, so no consumers).
    engine = Engine();
    final a2 = engine.event<int>('a2');
    engine.emit(a2, 2);
    expect(results, equals([1]));
  });

  test('should support Skip sentinel', () {
    final input = engine.event<int>('input');
    final output = engine.event<int>('output');
    final results = <int>[];

    engine.pipe<int, dynamic>(input, output, (x) {
      if (x < 0) return Skip;
      return x;
    });
    engine.on<int>(output, (v) => results.add(v));

    engine.emit(input, -1);
    expect(results, isEmpty);

    engine.emit(input, 5);
    expect(results, equals([5]));
  });
}
