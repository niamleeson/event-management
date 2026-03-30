let globalSeq = 0;
// ---- Object Pool for Events (hot-path optimization) ----
const POOL_MAX = 512;
let poolHead = null;
let poolSize = 0;
function allocEvent(type, payload, seq) {
    let ev;
    if (poolHead !== null) {
        ev = poolHead;
        poolHead = ev._poolNext;
        poolSize--;
        ev.type = type;
        ev.payload = payload;
        ev.seq = seq;
        ev._pendingConsumers.clear();
        ev._poolNext = null;
    }
    else {
        ev = {
            type,
            payload,
            seq,
            _pendingConsumers: new Set(),
            _poolNext: null,
        };
    }
    return ev;
}
function releaseEvent(ev) {
    if (poolSize < POOL_MAX) {
        ev._poolNext = poolHead;
        ev.payload = undefined;
        ev._pendingConsumers.clear();
        poolHead = ev;
        poolSize++;
    }
}
/**
 * Create a new Event instance with a monotonic sequence number.
 * Consumers are populated from the event type's registered consumers.
 */
export function createEvent(type, payload) {
    const seq = globalSeq++;
    const ev = allocEvent(type, payload, seq);
    // Copy all consumers from the event type
    for (const rule of type._consumers) {
        if (!rule._disposed) {
            ev._pendingConsumers.add(rule);
        }
    }
    return ev;
}
/** Return an event to the pool when all consumers have processed it */
export function recycleEvent(ev) {
    releaseEvent(ev);
}
/** Reset the global sequence (for testing) */
export function resetSequence() {
    globalSeq = 0;
}
/** Get the current sequence value (for devtools) */
export function currentSequence() {
    return globalSeq;
}
