/**
 * Create a Signal — a reactive value that can be subscribed to.
 */
export function createSignal(initialValue) {
    const subscribers = new Set();
    const signal = {
        value: initialValue,
        _subscribers: subscribers,
        subscribe(callback) {
            subscribers.add(callback);
            return () => {
                subscribers.delete(callback);
            };
        },
        _set(next) {
            const prev = signal.value;
            if (Object.is(prev, next))
                return;
            signal.value = next;
            for (const cb of subscribers) {
                cb(next, prev);
            }
        },
    };
    return signal;
}
