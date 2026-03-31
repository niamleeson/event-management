import { tracked } from '@glimmer/tracking'
import type { Engine, EventType } from '@pulse/core'

// ---------------------------------------------------------------------------
// PulseBinding — wraps an engine event subscription as a @tracked property
// ---------------------------------------------------------------------------

/**
 * Bridges a Pulse event into Ember's autotracking system.
 * The `value` property is @tracked, so Ember templates and computed
 * properties that read it will automatically re-render when the
 * underlying Pulse event fires with a new payload.
 *
 * Usage in a Glimmer component:
 * ```ts
 * class MyComponent extends Component {
 *   binding = new PulseBinding(engine, CountChanged, 0)
 *   willDestroy() { this.binding.destroy() }
 * }
 * ```
 *
 * In the template: `{{this.binding.value}}`
 */
export class PulseBinding<T> {
  @tracked value: T

  private _unsub: () => void

  constructor(engine: Engine, event: EventType<T>, initial: T) {
    this.value = initial
    this._unsub = engine.on(event, (v: T) => {
      this.value = v
    })
  }

  /** Unsubscribe from the Pulse event. Call in willDestroy(). */
  destroy(): void {
    this._unsub()
  }
}

// ---------------------------------------------------------------------------
// createPulseService — lightweight service wrapper around an engine
// ---------------------------------------------------------------------------

/**
 * Service-like object that wraps a Pulse Engine for use in Ember.
 *
 * In a real Ember Octane app this would be registered as a Service via
 * the DI container. For standalone usage, create it with
 * `createPulseService(engine)` and pass it to components via args or
 * a shared module.
 *
 * Usage:
 * ```ts
 * import { createEngine } from '@pulse/core'
 * import { createPulseService } from '@pulse/ember'
 *
 * const engine = createEngine()
 * const pulse = createPulseService(engine)
 *
 * // In a component:
 * const count = pulse.bind(CountChanged, 0)
 * // count.value auto-updates when CountChanged fires
 *
 * pulse.emit(Increment, undefined)
 * ```
 */
export function createPulseService(engine: Engine) {
  return {
    engine,
    emit: <T>(type: EventType<T>, payload: T) => engine.emit(type, payload),
    bind: <T>(event: EventType<T>, initial: T) => new PulseBinding(engine, event, initial),
    destroy: () => engine.destroy(),
  }
}
