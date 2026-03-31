import 'package:test/test.dart';
import 'package:pulse/pulse.dart';

void main() {
  late Engine engine;

  setUp(() {
    engine = Engine();
  });

  test('should fire join only when all inputs are ready', () {
    final a = engine.event<int>('a');
    final b = engine.event<String>('b');
    final out = engine.event<String>('out');
    final results = <String>[];

    engine.join<String>(
      inputs: [a, b],
      output: out,
      action: (payloads) => '${payloads[0]}-${payloads[1]}',
    );
    engine.on<String>(out, (v) => results.add(v));

    // Only emit a -- join should not fire.
    engine.emit(a, 42);
    expect(results, equals([]));

    // Now emit b -- join should fire.
    engine.emit(b, 'hello');
    expect(results, equals(['42-hello']));
  });

  test('should consume one event from each input type per join', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');
    final out = engine.event<int>('out');
    final results = <int>[];

    engine.join<int>(
      inputs: [a, b],
      output: out,
      action: (payloads) => (payloads[0] as int) + (payloads[1] as int),
    );
    engine.on<int>(out, (v) => results.add(v));

    engine.emit(a, 1);
    engine.emit(a, 2);
    engine.emit(b, 10);
    // Should use first a (1) + b (10).
    expect(results, contains(11));
  });

  test('should support guard on join -- passing guard', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');
    final out = engine.event<int>('out');
    final results = <int>[];

    engine.join<int>(
      inputs: [a, b],
      output: out,
      guard: (payloads) => (payloads[0] as int) + (payloads[1] as int) > 10,
      action: (payloads) => (payloads[0] as int) + (payloads[1] as int),
    );
    engine.on<int>(out, (v) => results.add(v));

    engine.emit(a, 8);
    engine.emit(b, 5);
    expect(results, equals([13]));
  });

  test('should support guard on join -- failing guard blocks join', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');
    final out = engine.event<int>('out');
    final results = <int>[];

    engine.join<int>(
      inputs: [a, b],
      output: out,
      guard: (payloads) => (payloads[0] as int) + (payloads[1] as int) > 100,
      action: (payloads) => (payloads[0] as int) + (payloads[1] as int),
    );
    engine.on<int>(out, (v) => results.add(v));

    engine.emit(a, 2);
    engine.emit(b, 3);
    // Guard fails: 2+3=5, not > 100.
    expect(results, equals([]));
  });

  test('should handle join in a diamond DAG', () {
    final src = engine.event<int>('src');
    final left = engine.event<int>('left');
    final right = engine.event<int>('right');
    final merged = engine.event<int>('merged');
    final results = <int>[];

    engine.pipe<int, int>(src, left, (x) => x * 2);
    engine.pipe<int, int>(src, right, (x) => x * 3);
    engine.join<int>(
      inputs: [left, right],
      output: merged,
      action: (payloads) => (payloads[0] as int) + (payloads[1] as int),
    );
    engine.on<int>(merged, (v) => results.add(v));

    engine.emit(src, 10);
    expect(results, equals([50])); // 10*2 + 10*3
  });

  test('should handle join with cascading output', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');
    final joined = engine.event<int>('joined');
    final finalEv = engine.event<String>('final');
    final results = <String>[];

    engine.join<int>(
      inputs: [a, b],
      output: joined,
      action: (payloads) => (payloads[0] as int) + (payloads[1] as int),
    );
    engine.pipe<int, String>(joined, finalEv, (v) => 'result:$v');
    engine.on<String>(finalEv, (v) => results.add(v));

    engine.emit(a, 3);
    engine.emit(b, 7);
    expect(results, equals(['result:10']));
  });

  test('should not fire join when only some inputs are available', () {
    final a = engine.event<int>('a');
    final b = engine.event<int>('b');
    final c = engine.event<int>('c');
    final out = engine.event<int>('out');
    final results = <int>[];

    engine.join<int>(
      inputs: [a, b, c],
      output: out,
      action: (payloads) =>
          (payloads[0] as int) + (payloads[1] as int) + (payloads[2] as int),
    );
    engine.on<int>(out, (v) => results.add(v));

    engine.emit(a, 1);
    engine.emit(b, 2);
    expect(results, equals([]));

    engine.emit(c, 3);
    expect(results, equals([6]));
  });

  test('should work with onAll for side-effect-only joins', () {
    final a = engine.event<int>('a');
    final b = engine.event<String>('b');
    final results = <String>[];

    engine.onAll([a, b], (payloads) {
      results.add('${payloads[0]}-${payloads[1]}');
    });

    engine.emit(a, 42);
    expect(results, isEmpty);

    engine.emit(b, 'hello');
    expect(results, equals(['42-hello']));
  });
}
