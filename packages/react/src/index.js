import { createContext, createElement, useContext, useCallback, useEffect, useRef, useSyncExternalStore, } from 'react';
// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const PulseContext = createContext(null);
function PulseProvider({ engine, children, }) {
    return createElement(PulseContext.Provider, { value: engine }, children);
}
// ---------------------------------------------------------------------------
// useEngine
// ---------------------------------------------------------------------------
function useEngine() {
    const engine = useContext(PulseContext);
    if (!engine) {
        throw new Error('useEngine must be used within a <PulseProvider>');
    }
    return engine;
}
// ---------------------------------------------------------------------------
// useSignal — subscribes to a Signal<T> and returns its current value
// ---------------------------------------------------------------------------
function useSignal(signal) {
    const subscribe = useCallback((onStoreChange) => {
        return signal.subscribe(() => onStoreChange());
    }, [signal]);
    const getSnapshot = useCallback(() => signal.value, [signal]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
// ---------------------------------------------------------------------------
// useTween — subscribes to a TweenValue and returns current number
// ---------------------------------------------------------------------------
function useTween(tween) {
    const subscribe = useCallback((onStoreChange) => {
        return tween.subscribe(() => onStoreChange());
    }, [tween]);
    const getSnapshot = useCallback(() => tween.value, [tween]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
// ---------------------------------------------------------------------------
// useSpring — subscribes to a SpringValue and returns current number
// ---------------------------------------------------------------------------
function useSpring(spring) {
    const subscribe = useCallback((onStoreChange) => {
        return spring.subscribe(() => onStoreChange());
    }, [spring]);
    const getSnapshot = useCallback(() => spring.value, [spring]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
// ---------------------------------------------------------------------------
// useEmit — returns a stable emit function bound to the engine
// ---------------------------------------------------------------------------
function useEmit() {
    const engine = useEngine();
    const emitRef = useRef(engine.emit.bind(engine));
    // Keep ref in sync if engine changes (shouldn't normally happen)
    useEffect(() => {
        emitRef.current = engine.emit.bind(engine);
    }, [engine]);
    return useCallback((type, payload) => {
        emitRef.current(type, payload);
    }, []);
}
// ---------------------------------------------------------------------------
// useEvent — subscribe to raw events of a given EventType
// ---------------------------------------------------------------------------
function useEvent(type, handler) {
    const engine = useEngine();
    const handlerRef = useRef(handler);
    // Always keep handler ref current
    useEffect(() => {
        handlerRef.current = handler;
    });
    useEffect(() => {
        const dispose = engine.on(type, (payload) => {
            handlerRef.current(payload);
        });
        return dispose;
    }, [engine, type]);
}
// ---------------------------------------------------------------------------
// usePulse — create a signal + subscribe in one shot
// ---------------------------------------------------------------------------
function usePulse(eventType, initial, reducer) {
    const engine = useEngine();
    // Create the signal once and keep a stable ref
    const signalRef = useRef(null);
    if (signalRef.current === null) {
        signalRef.current = engine.signal(eventType, initial, reducer);
    }
    return useSignal(signalRef.current);
}
// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { PulseContext, PulseProvider, useEngine, useSignal, useTween, useSpring, useEmit, useEvent, usePulse, };
