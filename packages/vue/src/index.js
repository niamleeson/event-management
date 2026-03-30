import { inject, provide, ref, onUnmounted, } from 'vue';
/** Injection key for providing the Pulse engine to the component tree */
export const PulseKey = Symbol('pulse');
/**
 * Provide a Pulse engine to descendant components.
 * Call in a parent component's setup().
 */
export function providePulse(engine) {
    provide(PulseKey, engine);
}
/**
 * Retrieve the Pulse engine from the injection context.
 * Must be called inside setup() of a component that is a descendant
 * of a component that called providePulse().
 */
export function usePulse() {
    const engine = inject(PulseKey);
    if (!engine) {
        throw new Error('[pulse/vue] No Pulse engine found. Did you call providePulse() in a parent component?');
    }
    return engine;
}
/**
 * Subscribe to a Pulse Signal and return a reactive Vue ref
 * that stays in sync with the signal's value.
 * Automatically unsubscribes when the component is unmounted.
 */
export function useSignal(signal) {
    const value = ref(signal.value);
    const unsub = signal.subscribe((next) => {
        value.value = next;
    });
    onUnmounted(unsub);
    return value;
}
/**
 * Subscribe to a Pulse TweenValue and return a reactive Vue ref
 * that tracks the tween's current numeric value.
 * Automatically unsubscribes when the component is unmounted.
 */
export function useTween(tween) {
    const value = ref(tween.value);
    const unsub = tween.subscribe((next) => {
        value.value = next;
    });
    onUnmounted(unsub);
    return value;
}
/**
 * Subscribe to a Pulse SpringValue and return a reactive Vue ref
 * that tracks the spring's current numeric value.
 * Automatically unsubscribes when the component is unmounted.
 */
export function useSpring(spring) {
    const value = ref(spring.value);
    const unsub = spring.subscribe((next) => {
        value.value = next;
    });
    onUnmounted(unsub);
    return value;
}
/**
 * Return a typed emit function bound to the injected Pulse engine.
 * Usage: const emit = useEmit(); emit(MyEvent, payload);
 */
export function useEmit() {
    const engine = usePulse();
    return (type, payload) => {
        engine.emit(type, payload);
    };
}
/**
 * Subscribe to a Pulse EventType and invoke handler on each event.
 * Automatically unsubscribes when the component is unmounted.
 */
export function useEvent(type, handler) {
    const engine = usePulse();
    const unsub = engine.on(type, handler);
    onUnmounted(unsub);
}
