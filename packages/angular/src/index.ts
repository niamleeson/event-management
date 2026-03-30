import {
  Injectable,
  signal as ngSignal,
  inject,
  DestroyRef,
  InjectionToken,
  type WritableSignal,
} from '@angular/core'
import type {
  Engine,
  EventType,
  Signal,
  TweenValue,
  SpringValue,
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
 * bootstrapApplication(AppComponent, {
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
 * Service that bridges Pulse primitives into the Angular reactivity system.
 *
 * Inject this into standalone components to:
 *  - emit events
 *  - bridge Pulse Signals / Tweens / Springs to Angular WritableSignals
 *  - subscribe to raw events with automatic cleanup
 */
@Injectable()
export class PulseService {
  private engine = inject(PULSE_ENGINE)
  private destroyRef = inject(DestroyRef)

  // Track all subscriptions so they can be cleaned up
  private cleanups: (() => void)[] = []

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const cleanup of this.cleanups) {
        cleanup()
      }
      this.cleanups.length = 0
    })
  }

  // ---- Engine access ----

  /** Get the underlying Pulse engine instance. */
  getEngine(): Engine {
    return this.engine
  }

  // ---- Emit ----

  /** Emit a Pulse event with the given payload. */
  emit<T>(type: EventType<T>, payload: T): void {
    this.engine.emit(type, payload)
  }

  // ---- Signal bridging ----

  /**
   * Bridge a Pulse Signal into an Angular WritableSignal.
   * The Angular signal is updated whenever the Pulse signal changes.
   * Cleanup is automatic when the injecting component is destroyed.
   */
  signal<T>(pulseSignal: Signal<T>): WritableSignal<T> {
    const ng = ngSignal<T>(pulseSignal.value)

    const unsub = pulseSignal.subscribe((next: T) => {
      ng.set(next)
    })
    this.cleanups.push(unsub)

    return ng
  }

  // ---- Tween bridging ----

  /**
   * Bridge a Pulse TweenValue into an Angular WritableSignal<number>.
   * Updates every time the tween emits a new value.
   */
  tween(tween: TweenValue): WritableSignal<number> {
    const ng = ngSignal<number>(tween.value)

    const unsub = tween.subscribe((next: number) => {
      ng.set(next)
    })
    this.cleanups.push(unsub)

    return ng
  }

  // ---- Spring bridging ----

  /**
   * Bridge a Pulse SpringValue into an Angular WritableSignal<number>.
   * Updates every time the spring emits a new value.
   */
  spring(spring: SpringValue): WritableSignal<number> {
    const ng = ngSignal<number>(spring.value)

    const unsub = spring.subscribe((next: number) => {
      ng.set(next)
    })
    this.cleanups.push(unsub)

    return ng
  }

  // ---- Event subscription ----

  /**
   * Subscribe to a Pulse EventType with the given handler.
   * The subscription is automatically cleaned up when the component
   * is destroyed.
   */
  on<T>(type: EventType<T>, handler: (payload: T) => void): void {
    const unsub = this.engine.on(type, handler)
    this.cleanups.push(unsub)
  }
}
