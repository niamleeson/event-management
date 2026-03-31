import 'package:test/test.dart';
import 'package:pulse/pulse.dart';

void main() {
  late Engine engine;

  setUp(() {
    engine = Engine(EngineOptions(maxPropagationRounds: 50));
  });

  test('should propagate through a linear chain', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');
    final c = engine.event<int>('c');
    final results = <int>[];

    engine.pipe<int, int>(a, b, (x) => x * 2);
    engine.pipe<int, int>(b, c, (x) => x + 1);
    engine.on<int>(c, (v) => results.add(v));

    engine.emit(a, 3);
    expect(results, equals([7])); // 3*2+1
  });

  test('should handle fan-out (one event, multiple consumers)', () {
    final src = engine.event<int>('src');
    final out1 = engine.event<int>('out1');
    final out2 = engine.event<int>('out2');
    final r1 = <int>[];
    final r2 = <int>[];

    engine.pipe<int, int>(src, out1, (x) => x + 10);
    engine.pipe<int, int>(src, out2, (x) => x + 20);
    engine.on<int>(out1, (v) => r1.add(v));
    engine.on<int>(out2, (v) => r2.add(v));

    engine.emit(src, 1);
    expect(r1, equals([11]));
    expect(r2, equals([21]));
  });

  test('should handle diamond-shaped DAG', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');
    final c = engine.event<int>('c');
    final d = engine.event<int>('d');
    final results = <int>[];

    engine.pipe<int, int>(a, b, (x) => x + 1);
    engine.pipe<int, int>(a, c, (x) => x + 2);
    engine.join<int>(
      inputs: [b, c],
      output: d,
      action: (payloads) => (payloads[0] as int) + (payloads[1] as int),
    );
    engine.on<int>(d, (v) => results.add(v));

    engine.emit(a, 10);
    expect(results, equals([23])); // (10+1)+(10+2)
  });

  test('should detect cycle in DAG when rules form a cycle', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');

    engine.pipe<int, int>(a, b, (x) => x + 1);
    expect(() {
      engine.pipe<int, int>(b, a, (x) => x + 1);
      engine.emit(a, 0);
    }, throwsA(predicate((e) =>
        e is StateError && e.message.contains('Cycle detected'))));
  });

  test('should throw on excessive propagation rounds from nested emits', () {
    final smallEngine = Engine(EngineOptions(maxPropagationRounds: 5));
    final a = smallEngine.event<int>('a');

    smallEngine.on<int>(a, (val) {
      smallEngine.emit(a, val + 1);
    });

    expect(
        () => smallEngine.emit(a, 0),
        throwsA(predicate(
            (e) => e is StateError && e.message.contains('Propagation exceeded'))));
  });

  test('should process events deposited during action execution', () {
    final trigger = engine.event<int>('trigger');
    final sideEffect = engine.event<String>('sideEffect');
    final results = <String>[];

    engine.on<int>(trigger, (val) {
      engine.emit(sideEffect, 'from-trigger-$val');
    });
    engine.on<String>(sideEffect, (msg) => results.add(msg));

    engine.emit(trigger, 42);
    expect(results, equals(['from-trigger-42']));
  });

  test('should handle events with no consumers gracefully', () {
    final orphan = engine.event<int>('orphan');
    expect(() => engine.emit(orphan, 99), returnsNormally);
  });

  test('should maintain topological order across fan-in', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');
    final c = engine.event<int>('c');
    final d = engine.event<int>('d');
    final trace = <String>[];

    engine.pipe<int, int>(a, b, (x) {
      trace.add('a->b');
      return x;
    });
    engine.pipe<int, int>(a, c, (x) {
      trace.add('a->c');
      return x;
    });
    engine.join<int>(
      inputs: [b, c],
      output: d,
      action: (payloads) {
        trace.add('join->d');
        return (payloads[0] as int) + (payloads[1] as int);
      },
    );

    engine.emit(a, 1);
    final joinIdx = trace.indexOf('join->d');
    final abIdx = trace.indexOf('a->b');
    final acIdx = trace.indexOf('a->c');
    expect(joinIdx, greaterThan(abIdx));
    expect(joinIdx, greaterThan(acIdx));
  });

  test('should handle multiple sequential emits independently', () {
    final ev = engine.event<int>('ev');
    final results = <int>[];

    engine.on<int>(ev, (v) => results.add(v));

    engine.emit(ev, 1);
    engine.emit(ev, 2);
    engine.emit(ev, 3);

    expect(results, equals([1, 2, 3]));
  });
}
