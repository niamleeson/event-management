import type { EventType, Rule, RuleMode } from './types.js'

let ruleCounter = 0

export interface RuleConfig {
  name?: string
  triggers: EventType[]
  mode: RuleMode
  guard?: (...payloads: any[]) => boolean
  action: (...payloads: any[]) => any
  outputs: EventType[]
  priority?: number
}

/**
 * Create a Rule node for the DAG.
 */
export function createRule(config: RuleConfig): Rule {
  const id = `rule_${ruleCounter++}`
  const isJoin = config.mode === 'join'
  const rule: Rule = {
    id,
    name: config.name ?? id,
    triggers: config.triggers,
    mode: config.mode,
    guard: config.guard,
    action: config.action,
    outputs: config.outputs,
    priority: config.priority ?? 0,
    _disposed: false,
    _joinPending: isJoin ? config.triggers.map(() => []) : null,
    _joinReady: 0,
  }
  return rule
}

/**
 * Register a rule as a consumer of its trigger event types.
 */
export function registerRuleConsumers(rule: Rule): void {
  for (const trigger of rule.triggers) {
    trigger._consumers.add(rule)
    // Cache solo consumer for fast-path dispatch
    trigger._solo = trigger._consumers.size === 1 ? rule : null
  }
}

/**
 * Unregister a rule from its trigger event types.
 */
export function unregisterRuleConsumers(rule: Rule): void {
  for (const trigger of rule.triggers) {
    trigger._consumers.delete(rule)
    if (trigger._consumers.size === 1) {
      trigger._solo = trigger._consumers.values().next().value ?? null
    } else {
      trigger._solo = null
    }
  }
  rule._disposed = true
}

/** Reset counter (for testing) */
export function resetRuleCounter(): void {
  ruleCounter = 0
}
