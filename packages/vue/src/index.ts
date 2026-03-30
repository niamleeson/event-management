import {
  inject,
  provide,
  ref,
  onUnmounted,
  type Ref,
  type InjectionKey,
} from 'vue'
import type { Engine, EventType, Signal, TweenValue, SpringValue } from '@pulse/core'

/** Injection key for providing the Pulse engine to the component tree */
export const PulseKey: InjectionKey<Engine> = Symbol('pulse')

/**
 * Provide a Pulse engine to descendant components.
 * Call in a parent component's setup().
 */
export function providePulse(engine: Engine): void {
  provide(PulseKey, engine)
}

/**
 * Retrieve the Pulse engine from the injection context.
 * Must be called inside setup() of a component that is a descendant
 * of a component that called providePulse().
 */
export function usePulse(): Engine {
  const engine = inject(PulseKey)
  if (!engine) {
    throw new Error(
      '[pulse/vue] No Pulse engine found. Did you call providePulse() in a parent component?'
    )
  }
  return engine
}

/**
 * Subscribe to a Pulse Signal and return a reactive Vue ref
 * that stays in sync with the signal's value.
 * Automatically unsubscribes when the component is unmounted.
 */
export function useSignal<T>(signal: Signal<T>): Ref<T> {
  const value = ref(signal.value) as Ref<T>
  const unsub = signal.subscribe((next: T) => {
    value.value = next
  })
  onUnmounted(unsub)
  return value
}

/**
 * Subscribe to a Pulse TweenValue and return a reactive Vue ref
 * that tracks the tween's current numeric value.
 * Automatically unsubscribes when the component is unmounted.
 */
export function useTween(tween: TweenValue): Ref<number> {
  const value = ref(tween.value)
  const unsub = tween.subscribe((next: number) => {
    value.value = next
  })
  onUnmounted(unsub)
  return value
}

/**
 * Subscribe to a Pulse SpringValue and return a reactive Vue ref
 * that tracks the spring's current numeric value.
 * Automatically unsubscribes when the component is unmounted.
 */
export function useSpring(spring: SpringValue): Ref<number> {
  const value = ref(spring.value)
  const unsub = spring.subscribe((next: number) => {
    value.value = next
  })
  onUnmounted(unsub)
  return value
}

/**
 * Return a typed emit function bound to the injected Pulse engine.
 * Usage: const emit = useEmit(); emit(MyEvent, payload);
 */
export function useEmit(): <T>(type: EventType<T>, payload: T) => void {
  const engine = usePulse()
  return <T>(type: EventType<T>, payload: T) => {
    engine.emit(type, payload)
  }
}

/**
 * Subscribe to a Pulse EventType and invoke handler on each event.
 * Automatically unsubscribes when the component is unmounted.
 */
export function useEvent<T>(type: EventType<T>, handler: (payload: T) => void): void {
  const engine = usePulse()
  const unsub = engine.on(type, handler)
  onUnmounted(unsub)
}
