import {
  createContext,
  createElement,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Engine, EventType } from '@pulse/core'

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
// usePulse — subscribes to an event, returns reactive state
// ---------------------------------------------------------------------------

function usePulse<T>(event: EventType<T>, initial: T): T {
  const engine = useEngine()
  const [val, setVal] = useState(initial)
  useEffect(() => {
    const handle = engine.on(event, setVal as (payload: T) => void)
    return () => handle()
  }, [engine, event])
  return val
}

// ---------------------------------------------------------------------------
// useEmit — returns a stable emit function bound to the engine
// ---------------------------------------------------------------------------

function useEmit(): <T>(type: EventType<T>, payload: T) => void {
  const engine = useEngine()
  return useCallback(
    <T,>(type: EventType<T>, payload: T) => {
      engine.emit(type, payload)
    },
    [engine],
  )
}

// ---------------------------------------------------------------------------
// usePulseEffect — emit an event whenever deps change
// Bridges framework state → engine. The engine processes it and emits outputs
// that usePulse subscribers pick up.
// ---------------------------------------------------------------------------

function usePulseEffect<T>(event: EventType<T>, payload: T): void {
  const engine = useEngine()
  const prev = useRef<string>('')
  useEffect(() => {
    const key = JSON.stringify(payload)
    if (key === prev.current) return
    prev.current = key
    engine.emit(event, payload)
  })
}

// ---------------------------------------------------------------------------
// useOn — subscribe to an engine event, call handler when it fires
// ---------------------------------------------------------------------------

function useOn<T>(event: EventType<T>, handler: (value: T) => void): void {
  const engine = useEngine()
  useEffect(() => {
    const handle = engine.on(event, handler as (payload: T) => void)
    return () => handle()
  }, [engine, event])
}

// ---------------------------------------------------------------------------
// useSync — bidirectional bridge between component state and engine context
//
// Plain value:  syncs to ctx (one-way, engine reads it)
// Tuple [value, setter, Event]:  syncs to ctx AND subscribes event → setter
//
// Usage:
//   useSync(ctx, {
//     text,                                  // engine reads ctx.text
//     todos: [todos, setTodos, Todos],       // engine reads ctx.todos + Todos event → setTodos
//     filter: [filter, setFilter, ActiveFilter],
//   })
// ---------------------------------------------------------------------------

type SyncBinding<T> = T | [T, (v: T) => void, EventType<T>]

function useSync<T extends Record<string, any>>(
  ctx: T,
  bindings: { [K in keyof T]?: SyncBinding<T[K]> },
): void {
  const engine = useEngine()

  // Sync values to ctx (runs every render)
  for (const key of Object.keys(bindings) as (keyof T)[]) {
    const binding = bindings[key]
    if (Array.isArray(binding)) {
      ctx[key] = binding[0]
    } else {
      ctx[key] = binding as T[keyof T]
    }
  }

  // Subscribe events → setters (once)
  useEffect(() => {
    const disposers: (() => void)[] = []
    for (const binding of Object.values(bindings)) {
      if (Array.isArray(binding)) {
        const [, setter, event] = binding as [any, (v: any) => void, EventType<any>]
        const handle = engine.on(event, setter)
        disposers.push(() => handle())
      }
    }
    return () => disposers.forEach(d => d())
  }, [engine])
}

// ---------------------------------------------------------------------------
// useBind — bind engine events to component state setters
// Subscribe to multiple events and route each to its setter.
// ---------------------------------------------------------------------------

function useBind(bindings: Array<[EventType<any>, (value: any) => void]>): void {
  const engine = useEngine()
  useEffect(() => {
    const disposers = bindings.map(([event, setter]) => engine.on(event, setter))
    return () => disposers.forEach(d => d())
  }, [engine])
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  PulseContext,
  PulseProvider,
  useEngine,
  usePulse,
  useEmit,
  useOn,
  useSync,
  usePulseEffect,
  useBind,
}
