/**
 * DAG — Directed Acyclic Graph for rule ordering.
 *
 * Edges go from producer rules to consumer rules:
 *   ruleA (outputs EventType X) → ruleB (triggers on EventType X)
 *
 * Maintains topological order using Kahn's algorithm.
 * Detects cycles via DFS.
 */
export class DAG {
    _rules = new Set();
    /** adjacency list: rule → set of downstream rules */
    _adj = new Map();
    /** reverse adjacency: rule → set of upstream rules */
    _radj = new Map();
    /** cached topological order */
    _topoOrder = [];
    _dirty = true;
    /** index from event type to rules that output it */
    _producerIndex = new Map();
    addRule(rule) {
        this._rules.add(rule);
        if (!this._adj.has(rule))
            this._adj.set(rule, new Set());
        if (!this._radj.has(rule))
            this._radj.set(rule, new Set());
        // Index this rule's outputs
        for (const output of rule.outputs) {
            let producers = this._producerIndex.get(output);
            if (!producers) {
                producers = new Set();
                this._producerIndex.set(output, producers);
            }
            producers.add(rule);
        }
        // Build edges: upstream producers → this rule (if this rule's triggers are produced by other rules)
        for (const trigger of rule.triggers) {
            const producers = this._producerIndex.get(trigger);
            if (producers) {
                for (const producer of producers) {
                    if (producer !== rule) {
                        this._addEdge(producer, rule);
                    }
                }
            }
        }
        // Build edges: this rule → downstream consumers (if this rule's outputs are consumed by other rules)
        for (const output of rule.outputs) {
            for (const consumer of output._consumers) {
                if (consumer !== rule && this._rules.has(consumer)) {
                    this._addEdge(rule, consumer);
                }
            }
        }
        this._dirty = true;
    }
    removeRule(rule) {
        // Remove from producer index
        for (const output of rule.outputs) {
            const producers = this._producerIndex.get(output);
            if (producers) {
                producers.delete(rule);
            }
        }
        // Remove edges
        const downstream = this._adj.get(rule);
        if (downstream) {
            for (const d of downstream) {
                this._radj.get(d)?.delete(rule);
            }
        }
        const upstream = this._radj.get(rule);
        if (upstream) {
            for (const u of upstream) {
                this._adj.get(u)?.delete(rule);
            }
        }
        this._adj.delete(rule);
        this._radj.delete(rule);
        this._rules.delete(rule);
        this._dirty = true;
    }
    _addEdge(from, to) {
        this._adj.get(from).add(to);
        this._radj.get(to).add(from);
    }
    /**
     * Check for cycles using DFS. Throws if a cycle is detected.
     */
    checkCycles() {
        const WHITE = 0, GRAY = 1, BLACK = 2;
        const color = new Map();
        for (const r of this._rules)
            color.set(r, WHITE);
        const path = [];
        const dfs = (u) => {
            color.set(u, GRAY);
            path.push(u);
            const neighbors = this._adj.get(u);
            if (neighbors) {
                for (const v of neighbors) {
                    const c = color.get(v);
                    if (c === GRAY) {
                        // Found cycle — build cycle path for error message
                        const cycleStart = path.indexOf(v);
                        const cyclePath = path.slice(cycleStart).map(r => r.name).join(' → ');
                        throw new Error(`Cycle detected in rule DAG: ${cyclePath} → ${v.name}`);
                    }
                    if (c === WHITE) {
                        dfs(v);
                    }
                }
            }
            path.pop();
            color.set(u, BLACK);
        };
        for (const r of this._rules) {
            if (color.get(r) === WHITE) {
                dfs(r);
            }
        }
    }
    /**
     * Compute topological order using Kahn's algorithm.
     * Returns rules sorted such that upstream rules come before downstream.
     */
    getTopologicalOrder() {
        if (!this._dirty)
            return this._topoOrder;
        this.checkCycles();
        // Kahn's algorithm
        const inDegree = new Map();
        for (const r of this._rules) {
            inDegree.set(r, this._radj.get(r)?.size ?? 0);
        }
        // Queue of rules with no incoming edges
        const queue = [];
        for (const r of this._rules) {
            if (inDegree.get(r) === 0) {
                queue.push(r);
            }
        }
        // Sort queue by priority (higher first) for deterministic ordering among peers
        queue.sort((a, b) => b.priority - a.priority);
        const order = [];
        while (queue.length > 0) {
            const u = queue.shift();
            order.push(u);
            const neighbors = this._adj.get(u);
            if (neighbors) {
                const nextBatch = [];
                for (const v of neighbors) {
                    const deg = inDegree.get(v) - 1;
                    inDegree.set(v, deg);
                    if (deg === 0) {
                        nextBatch.push(v);
                    }
                }
                // Sort next batch by priority
                nextBatch.sort((a, b) => b.priority - a.priority);
                for (const n of nextBatch) {
                    queue.push(n);
                }
            }
        }
        this._topoOrder = order;
        this._dirty = false;
        return order;
    }
    /** Get all edges as [from, to] pairs */
    getEdges() {
        const edges = [];
        for (const [from, tos] of this._adj) {
            for (const to of tos) {
                edges.push([from, to]);
            }
        }
        return edges;
    }
    /** Get the full DAG graph for introspection */
    getGraph() {
        return {
            nodes: Array.from(this._rules),
            edges: this.getEdges(),
        };
    }
    /** Mark topology as dirty (e.g., after rule mutation) */
    markDirty() {
        this._dirty = true;
    }
    /** Get all registered rules */
    getRules() {
        return Array.from(this._rules);
    }
}
