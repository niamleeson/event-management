import {
  createSignal as solidSignal,
  onCleanup,
  createContext,
  useContext,
  type Accessor,
  type JSX,
} from 'solid-js'
import type { Engine, EventType } from '@pulse/core'

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
export function useEngine(): Engine {
  const engine = useContext(PulseContext)
  if (!engine) {
    throw new Error('useEngine must be used within a <PulseProvider>')
  }
  return engine
}

/**
 * Subscribe to a Pulse event and return a Solid Accessor.
 * Leverages SolidJS fine-grained reactivity — no component re-render.
 */
export function usePulse<T>(event: EventType<T>, initial: T): Accessor<T> {
  const engine = useEngine()
  const [val, setVal] = solidSignal<T>(initial)
  const unsub = engine.on(event, (v: T) => setVal(() => v))
  onCleanup(unsub)
  return val
}

/**
 * Returns a stable emit function bound to the engine.
 */
export function useEmit(): <T>(type: EventType<T>, payload: T) => void {
  const engine = useEngine()
  return <T>(type: EventType<T>, payload: T) => {
    engine.emit(type, payload)
  }
}
