import {
  inject,
  provide,
  ref,
  onUnmounted,
  type Ref,
  type InjectionKey,
} from 'vue'
import type { Engine, EventType } from '@pulse/core'

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
export function useEngine(): Engine {
  const engine = inject(PulseKey)
  if (!engine) {
    throw new Error(
      '[pulse/vue] No Pulse engine found. Did you call providePulse() in a parent component?'
    )
  }
  return engine
}

/**
 * Subscribe to a Pulse event and return a reactive Vue ref
 * that stays in sync with event payloads.
 * Automatically unsubscribes when the component is unmounted.
 */
export function usePulse<T>(event: EventType<T>, initial: T): Ref<T> {
  const engine = useEngine()
  const val = ref(initial) as Ref<T>
  const unsub = engine.on(event, (v: T) => {
    val.value = v
  })
  onUnmounted(unsub)
  return val
}

/**
 * Subscribe to a value with a .subscribe() method (e.g. tween/spring objects)
 * and return a reactive Vue ref. Automatically unsubscribes on unmount.
 */
export function useTween(tweenObj: { value: number; subscribe: (cb: (v: number) => void) => () => void }): Ref<number> {
  const val = ref(tweenObj.value)
  const unsub = tweenObj.subscribe((v: number) => { val.value = v })
  onUnmounted(unsub)
  return val
}

export function useSpring(springObj: { value: number; subscribe: (cb: (v: number) => void) => () => void }): Ref<number> {
  const val = ref(springObj.value)
  const unsub = springObj.subscribe((v: number) => { val.value = v })
  onUnmounted(unsub)
  return val
}

/**
 * Subscribe to a Signal (object with .value and .subscribe()) and return a reactive Vue ref.
 */
export function useSignal<T>(signal: { value: T; subscribe: (cb: (v: T, prev: T) => void) => () => void }): Ref<T> {
  const val = ref(signal.value) as Ref<T>
  const unsub = signal.subscribe((v: T) => { val.value = v })
  onUnmounted(unsub)
  return val
}

/**
 * Return a typed emit function bound to the injected Pulse engine.
 * Usage: const emit = useEmit(); emit(MyEvent, payload);
 */
export function useEmit(): <T>(type: EventType<T>, payload: T) => void {
  const engine = useEngine()
  return <T>(type: EventType<T>, payload: T) => {
    engine.emit(type, payload)
  }
}
