import 'event_type.dart';
import 'rule.dart';

/// Edge in the DAG: [from, to].
typedef DAGEdge = (Rule, Rule);

/// DAG graph for introspection.
class DAGGraph {
  final List<Rule> nodes;
  final List<DAGEdge> edges;

  const DAGGraph({required this.nodes, required this.edges});
}

/// DAG -- Directed Acyclic Graph for rule ordering.
///
/// Edges go from producer rules to consumer rules:
///   ruleA (outputs EventType X) -> ruleB (triggers on EventType X)
///
/// Maintains topological order using Kahn's algorithm.
/// Detects cycles via DFS.
class DAG {
  final Set<Rule> _rules = {};

  /// Adjacency list: rule -> set of downstream rules.
  final Map<Rule, Set<Rule>> _adj = {};

  /// Reverse adjacency: rule -> set of upstream rules.
  final Map<Rule, Set<Rule>> _radj = {};

  /// Cached topological order.
  List<Rule> _topoOrder = [];
  bool _dirty = true;

  /// Index from event type to rules that output it.
  final Map<EventType, Set<Rule>> _producerIndex = {};

  void addRule(Rule rule) {
    _rules.add(rule);
    _adj.putIfAbsent(rule, () => {});
    _radj.putIfAbsent(rule, () => {});

    // Index this rule's outputs.
    for (final output in rule.outputs) {
      _producerIndex.putIfAbsent(output, () => {}).add(rule);
    }

    // Build edges: upstream producers -> this rule.
    for (final trigger in rule.triggers) {
      final producers = _producerIndex[trigger];
      if (producers != null) {
        for (final producer in producers) {
          if (producer != rule) {
            _addEdge(producer, rule);
          }
        }
      }
    }

    // Build edges: this rule -> downstream consumers.
    for (final output in rule.outputs) {
      for (final consumer in output.consumers) {
        if (consumer != rule && _rules.contains(consumer)) {
          _addEdge(rule, consumer);
        }
      }
    }

    _dirty = true;
  }

  void removeRule(Rule rule) {
    // Remove from producer index.
    for (final output in rule.outputs) {
      _producerIndex[output]?.remove(rule);
    }

    // Remove edges.
    final downstream = _adj[rule];
    if (downstream != null) {
      for (final d in downstream) {
        _radj[d]?.remove(rule);
      }
    }
    final upstream = _radj[rule];
    if (upstream != null) {
      for (final u in upstream) {
        _adj[u]?.remove(rule);
      }
    }

    _adj.remove(rule);
    _radj.remove(rule);
    _rules.remove(rule);
    _dirty = true;
  }

  void _addEdge(Rule from, Rule to) {
    _adj[from]!.add(to);
    _radj[to]!.add(from);
  }

  /// Check for cycles using DFS. Throws if a cycle is detected.
  void checkCycles() {
    const white = 0, gray = 1, black = 2;
    final color = <Rule, int>{};
    for (final r in _rules) {
      color[r] = white;
    }

    final path = <Rule>[];

    void dfs(Rule u) {
      color[u] = gray;
      path.add(u);
      final neighbors = _adj[u];
      if (neighbors != null) {
        for (final v in neighbors) {
          final c = color[v];
          if (c == gray) {
            final cycleStart = path.indexOf(v);
            final cyclePath =
                path.sublist(cycleStart).map((r) => r.name).join(' \u2192 ');
            throw StateError(
                'Cycle detected in rule DAG: $cyclePath \u2192 ${v.name}');
          }
          if (c == white) {
            dfs(v);
          }
        }
      }
      path.removeLast();
      color[u] = black;
    }

    for (final r in _rules) {
      if (color[r] == white) {
        dfs(r);
      }
    }
  }

  /// Compute topological order using Kahn's algorithm.
  /// Returns rules sorted such that upstream rules come before downstream.
  List<Rule> getTopologicalOrder() {
    if (!_dirty) return _topoOrder;

    checkCycles();

    // Kahn's algorithm.
    final inDegree = <Rule, int>{};
    for (final r in _rules) {
      inDegree[r] = _radj[r]?.length ?? 0;
    }

    // Queue of rules with no incoming edges.
    final queue = <Rule>[];
    for (final r in _rules) {
      if (inDegree[r] == 0) {
        queue.add(r);
      }
    }

    // Sort queue by priority (higher first) for deterministic ordering among peers.
    queue.sort((a, b) => b.priority.compareTo(a.priority));

    final order = <Rule>[];
    while (queue.isNotEmpty) {
      final u = queue.removeAt(0);
      order.add(u);
      final neighbors = _adj[u];
      if (neighbors != null) {
        final nextBatch = <Rule>[];
        for (final v in neighbors) {
          final deg = inDegree[v]! - 1;
          inDegree[v] = deg;
          if (deg == 0) {
            nextBatch.add(v);
          }
        }
        nextBatch.sort((a, b) => b.priority.compareTo(a.priority));
        queue.addAll(nextBatch);
      }
    }

    _topoOrder = order;
    _dirty = false;
    return order;
  }

  /// Get all edges as (from, to) pairs.
  List<DAGEdge> getEdges() {
    final edges = <DAGEdge>[];
    for (final entry in _adj.entries) {
      for (final to in entry.value) {
        edges.add((entry.key, to));
      }
    }
    return edges;
  }

  /// Get the full DAG graph for introspection.
  DAGGraph getGraph() {
    return DAGGraph(
      nodes: _rules.toList(),
      edges: getEdges(),
    );
  }

  /// Mark topology as dirty (e.g., after rule mutation).
  void markDirty() {
    _dirty = true;
  }

  /// Get all registered rules.
  List<Rule> getRules() => _rules.toList();
}
