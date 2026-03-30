import {
  createContext,
  createElement,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import type {
  Engine,
  EventType,
  Signal,
  TweenValue,
  SpringValue,
} from '@pulse/core'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const PulseContext = createContext<Engine>(null!)

function PulseProvider({
  engine,
  children,
}: {
  engine: Engine
  children: ReactNode
}) {
  return createElement(PulseContext.Provider, { value: engine }, children)
}

// ---------------------------------------------------------------------------
// useEngine
// ---------------------------------------------------------------------------

function useEngine(): Engine {
  const engine = useContext(PulseContext)
  if (!engine) {
    throw new Error('useEngine must be used within a <PulseProvider>')
  }
  return engine
}

// ---------------------------------------------------------------------------
// useSignal — subscribes to a Signal<T> and returns its current value
// ---------------------------------------------------------------------------

function useSignal<T>(signal: Signal<T>): T {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return signal.subscribe(() => onStoreChange())
    },
    [signal],
  )

  const getSnapshot = useCallback(() => signal.value, [signal])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

// ---------------------------------------------------------------------------
// useTween — subscribes to a TweenValue and returns current number
// ---------------------------------------------------------------------------

function useTween(tween: TweenValue): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return tween.subscribe(() => onStoreChange())
    },
    [tween],
  )

  const getSnapshot = useCallback(() => tween.value, [tween])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

// ---------------------------------------------------------------------------
// useSpring — subscribes to a SpringValue and returns current number
// ---------------------------------------------------------------------------

function useSpring(spring: SpringValue): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return spring.subscribe(() => onStoreChange())
    },
    [spring],
  )

  const getSnapshot = useCallback(() => spring.value, [spring])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

// ---------------------------------------------------------------------------
// useEmit — returns a stable emit function bound to the engine
// ---------------------------------------------------------------------------

function useEmit(): <T>(type: EventType<T>, payload: T) => void {
  const engine = useEngine()
  const emitRef = useRef(engine.emit.bind(engine))

  // Keep ref in sync if engine changes (shouldn't normally happen)
  useEffect(() => {
    emitRef.current = engine.emit.bind(engine)
  }, [engine])

  return useCallback(
    <T>(type: EventType<T>, payload: T) => {
      emitRef.current(type, payload)
    },
    [],
  )
}

// ---------------------------------------------------------------------------
// useEvent — subscribe to raw events of a given EventType
// ---------------------------------------------------------------------------

function useEvent<T>(
  type: EventType<T>,
  handler: (payload: T) => void,
): void {
  const engine = useEngine()
  const handlerRef = useRef(handler)

  // Always keep handler ref current
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    const dispose = engine.on(type, (payload: T) => {
      handlerRef.current(payload)
    })
    return dispose
  }, [engine, type])
}

// ---------------------------------------------------------------------------
// usePulse — create a signal + subscribe in one shot
// ---------------------------------------------------------------------------

function usePulse<T>(
  eventType: EventType<T>,
  initial: T,
  reducer: (prev: T, event: T) => T,
): T {
  const engine = useEngine()

  // Create the signal once and keep a stable ref
  const signalRef = useRef<Signal<T> | null>(null)
  if (signalRef.current === null) {
    signalRef.current = engine.signal(eventType, initial, reducer)
  }

  return useSignal(signalRef.current)
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  PulseContext,
  PulseProvider,
  useEngine,
  useSignal,
  useTween,
  useSpring,
  useEmit,
  useEvent,
  usePulse,
}
