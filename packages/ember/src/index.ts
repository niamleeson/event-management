import { tracked } from '@glimmer/tracking'
import type {
  Engine,
  EventType,
  Signal,
  TweenValue,
  SpringValue,
} from '@pulse/core'

// ---------------------------------------------------------------------------
// TrackedSignal — wraps a Pulse Signal as a @tracked property
// ---------------------------------------------------------------------------

/**
 * Bridges a Pulse Signal<T> into Ember's autotracking system.
 * The `value` property is @tracked, so Ember templates and computed
 * properties that read it will automatically re-render when the
 * underlying Pulse signal changes.
 *
 * Usage in a Glimmer component:
 * ```ts
 * class MyComponent extends Component {
 *   trackedCount = new TrackedSignal(countSignal)
 *
 *   willDestroy() { this.trackedCount.destroy() }
 * }
 * ```
 *
 * In the template: `{{this.trackedCount.value}}`
 */
class TrackedSignal<T> {
  @tracked value: T

  private _unsub: () => void

  constructor(pulseSignal: Signal<T>) {
    this.value = pulseSignal.value
    this._unsub = pulseSignal.subscribe((next: T) => {
      this.value = next
    })
  }

  /** Unsubscribe from the Pulse signal. Call in willDestroy(). */
  destroy(): void {
    this._unsub()
  }
}

// ---------------------------------------------------------------------------
// TrackedTween — wraps a Pulse TweenValue as tracked properties
// ---------------------------------------------------------------------------

/**
 * Bridges a Pulse TweenValue into Ember's autotracking system.
 * Exposes `value`, `active`, and `progress` as @tracked properties.
 *
 * Usage in a Glimmer component:
 * ```ts
 * class MyComponent extends Component {
 *   trackedTween = new TrackedTween(myTween)
 *
 *   willDestroy() { this.trackedTween.destroy() }
 * }
 * ```
 *
 * In the template: `{{this.trackedTween.value}}`
 */
class TrackedTween {
  @tracked value: number
  @tracked active: boolean
  @tracked progress: number

  private _unsub: () => void

  constructor(tween: TweenValue) {
    this.value = tween.value
    this.active = tween.active
    this.progress = tween.progress

    this._unsub = tween.subscribe(() => {
      this.value = tween.value
      this.active = tween.active
      this.progress = tween.progress
    })
  }

  /** Unsubscribe from the Pulse tween. Call in willDestroy(). */
  destroy(): void {
    this._unsub()
  }
}

// ---------------------------------------------------------------------------
// TrackedSpring — wraps a Pulse SpringValue as tracked properties
// ---------------------------------------------------------------------------

/**
 * Bridges a Pulse SpringValue into Ember's autotracking system.
 * Exposes `value`, `velocity`, and `settled` as @tracked properties.
 *
 * Usage in a Glimmer component:
 * ```ts
 * class MyComponent extends Component {
 *   trackedSpring = new TrackedSpring(mySpring)
 *
 *   willDestroy() { this.trackedSpring.destroy() }
 * }
 * ```
 *
 * In the template: `{{this.trackedSpring.value}}`
 */
class TrackedSpring {
  @tracked value: number
  @tracked velocity: number
  @tracked settled: boolean

  private _unsub: () => void

  constructor(spring: SpringValue) {
    this.value = spring.value
    this.velocity = spring.velocity
    this.settled = spring.settled

    this._unsub = spring.subscribe(() => {
      this.value = spring.value
      this.velocity = spring.velocity
      this.settled = spring.settled
    })
  }

  /** Unsubscribe from the Pulse spring. Call in willDestroy(). */
  destroy(): void {
    this._unsub()
  }
}

// ---------------------------------------------------------------------------
// PulseService — Ember service that provides access to the engine
// ---------------------------------------------------------------------------

/**
 * Service-like class that wraps a Pulse Engine for use in Ember.
 *
 * In a real Ember app this would be registered as a Service using
 * `@service` and the Ember DI container. For standalone usage,
 * create it with `createPulseService(engine)` and pass it to
 * components via args or a shared module.
 *
 * Usage:
 * ```ts
 * // engine.ts
 * const engine = createEngine()
 * export const pulse = createPulseService(engine)
 *
 * // component.ts
 * import { pulse } from '../engine'
 * class MyComponent extends Component {
 *   count = pulse.createSignal(countSignal)
 *   willDestroy() { this.count.destroy() }
 * }
 * ```
 */
class PulseService {
  engine: Engine

  private _cleanups: (() => void)[] = []

  constructor(engine: Engine) {
    this.engine = engine
  }

  // ---- Emit ----

  /** Emit a Pulse event with the given payload. */
  emit<T>(type: EventType<T>, payload: T): void {
    this.engine.emit(type, payload)
  }

  // ---- Signal bridging ----

  /**
   * Create a TrackedSignal from a Pulse Signal.
   * The tracked value auto-updates when the signal changes,
   * triggering Ember template re-renders.
   */
  createSignal<T>(pulseSignal: Signal<T>): TrackedSignal<T> {
    const ts = new TrackedSignal(pulseSignal)
    this._cleanups.push(() => ts.destroy())
    return ts
  }

  // ---- Tween bridging ----

  /**
   * Create a TrackedTween from a Pulse TweenValue.
   * The tracked properties auto-update on each animation frame,
   * triggering Ember template re-renders.
   */
  createTween(tween: TweenValue): TrackedTween {
    const tt = new TrackedTween(tween)
    this._cleanups.push(() => tt.destroy())
    return tt
  }

  // ---- Spring bridging ----

  /**
   * Create a TrackedSpring from a Pulse SpringValue.
   * The tracked properties auto-update on each physics step,
   * triggering Ember template re-renders.
   */
  createSpring(spring: SpringValue): TrackedSpring {
    const ts = new TrackedSpring(spring)
    this._cleanups.push(() => ts.destroy())
    return ts
  }

  // ---- Event subscription ----

  /**
   * Subscribe to a Pulse EventType with the given handler.
   * Returns an unsubscribe function. Also tracked internally
   * for bulk cleanup via `destroy()`.
   */
  on<T>(type: EventType<T>, handler: (payload: T) => void): () => void {
    const unsub = this.engine.on(type, handler)
    this._cleanups.push(unsub)
    return unsub
  }

  // ---- Cleanup ----

  /**
   * Dispose of all tracked subscriptions. Call when the owning
   * context (e.g. Ember Service or component) is destroyed.
   */
  destroy(): void {
    for (const cleanup of this._cleanups) {
      cleanup()
    }
    this._cleanups.length = 0
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a PulseService bound to the given engine.
 *
 * ```ts
 * import { createEngine } from '@pulse/core'
 * import { createPulseService } from '@pulse/ember'
 *
 * const engine = createEngine()
 * const pulse = createPulseService(engine)
 * ```
 */
function createPulseService(engine: Engine): PulseService {
  return new PulseService(engine)
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  TrackedSignal,
  TrackedTween,
  TrackedSpring,
  PulseService,
  createPulseService,
}
