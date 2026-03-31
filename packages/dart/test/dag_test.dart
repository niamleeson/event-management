import 'package:test/test.dart';
import 'package:pulse/pulse.dart';

void main() {
  late DAG dag;

  setUp(() {
    dag = DAG();
    resetEventTypeCounter();
    resetRuleCounter();
  });

  EventType makeType(String name) => createEventType(name);

  Rule makeRule(String name, List<EventType> triggers, List<EventType> outputs) {
    final rule = createRule(RuleConfig(
      name: name,
      triggers: triggers,
      mode: RuleMode.each,
      action: (_) {},
      outputs: outputs,
    ));
    registerRuleConsumers(rule);
    return rule;
  }

  test('should add and retrieve rules', () {
    final a = makeType('a');
    final b = makeType('b');
    final rule = makeRule('r1', [a], [b]);
    dag.addRule(rule);

    expect(dag.getRules(), contains(rule));
  });

  test('should compute topological order for a linear chain', () {
    final a = makeType('a');
    final b = makeType('b');
    final c = makeType('c');

    final r1 = makeRule('r1', [a], [b]);
    final r2 = makeRule('r2', [b], [c]);

    dag.addRule(r1);
    dag.addRule(r2);

    final order = dag.getTopologicalOrder();
    final idx1 = order.indexOf(r1);
    final idx2 = order.indexOf(r2);
    expect(idx1, lessThan(idx2));
  });

  test('should detect cycles', () {
    final a = makeType('a');
    final b = makeType('b');

    final r1 = makeRule('r1', [a], [b]);
    final r2 = makeRule('r2', [b], [a]);

    dag.addRule(r1);
    expect(() {
      dag.addRule(r2);
      dag.getTopologicalOrder();
    }, throwsA(predicate((e) =>
        e is StateError && e.message.contains('Cycle detected'))));
  });

  test('should handle diamond-shaped DAG without detecting false cycle', () {
    final src = makeType('src');
    final left = makeType('left');
    final right = makeType('right');
    final merged = makeType('merged');

    final r1 = makeRule('src->left', [src], [left]);
    final r2 = makeRule('src->right', [src], [right]);
    final r3 = makeRule('join', [left, right], [merged]);

    dag.addRule(r1);
    dag.addRule(r2);
    dag.addRule(r3);

    final order = dag.getTopologicalOrder();
    final i1 = order.indexOf(r1);
    final i2 = order.indexOf(r2);
    final i3 = order.indexOf(r3);

    expect(i3, greaterThan(i1));
    expect(i3, greaterThan(i2));
  });

  test('should remove rules and update order', () {
    final a = makeType('a');
    final b = makeType('b');
    final c = makeType('c');

    final r1 = makeRule('r1', [a], [b]);
    final r2 = makeRule('r2', [b], [c]);

    dag.addRule(r1);
    dag.addRule(r2);

    dag.removeRule(r2);
    final order = dag.getTopologicalOrder();
    expect(order, contains(r1));
    expect(order, isNot(contains(r2)));
  });

  test('should return edges', () {
    final a = makeType('a');
    final b = makeType('b');

    final r1 = makeRule('r1', [a], [b]);
    final r2 = makeRule('r2', [b], []);

    dag.addRule(r1);
    dag.addRule(r2);

    final edges = dag.getEdges();
    expect(edges.length, equals(1));
    expect(edges[0].$1, equals(r1));
    expect(edges[0].$2, equals(r2));
  });

  test('should return graph for introspection', () {
    final a = makeType('a');
    final b = makeType('b');

    final r1 = makeRule('r1', [a], [b]);
    dag.addRule(r1);

    final graph = dag.getGraph();
    expect(graph.nodes, contains(r1));
    expect(graph.edges, isNotNull);
  });

  test('should handle parallel independent rules', () {
    final a = makeType('a');
    final b = makeType('b');
    final c = makeType('c');
    final d = makeType('d');

    final r1 = makeRule('r1', [a], [b]);
    final r2 = makeRule('r2', [c], [d]);

    dag.addRule(r1);
    dag.addRule(r2);

    final order = dag.getTopologicalOrder();
    expect(order, contains(r1));
    expect(order, contains(r2));
  });

  test('should handle long chain without error', () {
    final types = <EventType>[];
    for (var i = 0; i <= 20; i++) {
      types.add(makeType('t$i'));
    }

    for (var i = 0; i < 20; i++) {
      final rule = makeRule('r$i', [types[i]], [types[i + 1]]);
      dag.addRule(rule);
    }

    final order = dag.getTopologicalOrder();
    expect(order.length, equals(20));
  });
}
