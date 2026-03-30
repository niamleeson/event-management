let ruleCounter = 0;
/**
 * Create a Rule node for the DAG.
 */
export function createRule(config) {
    const id = `rule_${ruleCounter++}`;
    const rule = {
        id,
        name: config.name ?? id,
        triggers: config.triggers,
        mode: config.mode,
        guard: config.guard,
        action: config.action,
        outputs: config.outputs,
        priority: config.priority ?? 0,
        _disposed: false,
    };
    return rule;
}
/**
 * Register a rule as a consumer of its trigger event types.
 */
export function registerRuleConsumers(rule) {
    for (const trigger of rule.triggers) {
        trigger._consumers.add(rule);
    }
}
/**
 * Unregister a rule from its trigger event types.
 */
export function unregisterRuleConsumers(rule) {
    for (const trigger of rule.triggers) {
        trigger._consumers.delete(rule);
    }
    rule._disposed = true;
}
/** Reset counter (for testing) */
export function resetRuleCounter() {
    ruleCounter = 0;
}
