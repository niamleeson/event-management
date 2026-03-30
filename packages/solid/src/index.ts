import {
  createSignal as solidSignal,
  onCleanup,
  createContext,
  useContext,
  type Accessor,
  type JSX,
} from 'solid-js'
import type { Engine, EventType, Signal, TweenValue, SpringValue } from '@pulse/core'

// ---- Context ----

const PulseContext = createContext<Engine>()

/**
 * Provider component that supplies the Pulse engine to the component tree.
 */
export function PulseProvider(props: { engine: Engine; children: JSX.Element }): JSX.Element {
  const Provider = PulseContext.Provider
  return Provider({ value: props.engine, get children() { return props.children } }) as unknown as JSX.Element
}

/**
 * Access the Pulse engine from context.
 */
export function usePulse(): Engine {
  const engine = useContext(PulseContext)
  if (!engine) {
    throw new Error('usePulse must be used within a <PulseProvider>')
  }
  return engine
}

/**
 * Subscribe to a Pulse Signal and return a Solid Accessor.
 * Leverages SolidJS fine-grained reactivity — no component re-render.
 */
export function useSignal<T>(signal: Signal<T>): Accessor<T> {
  const [value, setValue] = solidSignal<T>(signal.value)

  const unsub = signal.subscribe((next: T) => {
    setValue(() => next)
  })

  onCleanup(unsub)

  return value
}

/**
 * Subscribe to a Pulse TweenValue and return a Solid Accessor.
 */
export function useTween(tween: TweenValue): Accessor<number> {
  const [value, setValue] = solidSignal<number>(tween.value)

  const unsub = tween.subscribe((next: number) => {
    setValue(next)
  })

  onCleanup(unsub)

  return value
}

/**
 * Subscribe to a Pulse SpringValue and return a Solid Accessor.
 */
export function useSpring(spring: SpringValue): Accessor<number> {
  const [value, setValue] = solidSignal<number>(spring.value)

  const unsub = spring.subscribe((next: number) => {
    setValue(next)
  })

  onCleanup(unsub)

  return value
}

/**
 * Returns a stable emit function bound to the engine.
 */
export function useEmit(): <T>(type: EventType<T>, payload: T) => void {
  const engine = usePulse()
  return <T>(type: EventType<T>, payload: T) => {
    engine.emit(type, payload)
  }
}

/**
 * Subscribe to events of a given type.
 * Automatically cleaned up when the component is unmounted.
 */
export function useEvent<T>(type: EventType<T>, handler: (payload: T) => void): void {
  const engine = usePulse()
  const unsub = engine.on(type, handler)
  onCleanup(unsub)
}
