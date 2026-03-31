import {
  createContext,
  createElement,
  useContext,
  useCallback,
  useEffect,
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
  useEffect(() => engine.on(event, setVal), [engine, event])
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
// Exports
// ---------------------------------------------------------------------------

export {
  PulseContext,
  PulseProvider,
  useEngine,
  usePulse,
  useEmit,
}
