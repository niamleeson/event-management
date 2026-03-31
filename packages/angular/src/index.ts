import {
  Injectable,
  signal as ngSignal,
  inject,
  DestroyRef,
  InjectionToken,
} from '@angular/core'
import type {
  Engine,
  EventType,
} from '@pulse/core'

// ---------------------------------------------------------------------------
// InjectionToken for providing the Pulse engine
// ---------------------------------------------------------------------------

export const PULSE_ENGINE = new InjectionToken<Engine>('PulseEngine')

// ---------------------------------------------------------------------------
// Provider factory — call in your app config's `providers` array
// ---------------------------------------------------------------------------

/**
 * Create an Angular provider that supplies the given Pulse engine
 * via dependency injection.
 *
 * Usage:
 * ```ts
 * @Component({
 *   providers: [providePulse(engine), PulseService],
 * })
 * ```
 */
export function providePulse(engine: Engine) {
  return { provide: PULSE_ENGINE, useValue: engine }
}

// ---------------------------------------------------------------------------
// PulseService — injectable service for Angular components
// ---------------------------------------------------------------------------

/**
 * Service that bridges Pulse events into the Angular reactivity system.
 *
 * Inject this into standalone components to:
 *  - emit events
 *  - subscribe to events and get Angular WritableSignals via use()
 */
@Injectable()
export class PulseService {
  private engine = inject(PULSE_ENGINE)
  private destroyRef = inject(DestroyRef)

  /** Emit a Pulse event with the given payload. */
  emit<T>(type: EventType<T>, payload: T): void {
    this.engine.emit(type, payload)
  }

  /**
   * Subscribe to a Pulse event and return an Angular WritableSignal.
   * The signal starts with `initial` and is updated whenever the event fires.
   * The subscription is automatically cleaned up when the component is destroyed.
   */
  use<T>(event: EventType<T>, initial: T) {
    const sig = ngSignal(initial)
    const unsub = this.engine.on(event, (v: T) => sig.set(v))
    this.destroyRef.onDestroy(unsub)
    return sig
  }

  /** Get the underlying Pulse engine instance. */
  getEngine(): Engine {
    return this.engine
  }
}
