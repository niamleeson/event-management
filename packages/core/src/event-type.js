let eventTypeCounter = 0;
/**
 * Create a named EventType declaration.
 * EventType is a channel — not an instance.
 */
export function createEventType(name) {
    return {
        name: `${name}#${eventTypeCounter++}`,
        _consumers: new Set(),
    };
}
/** Reset the counter (for testing) */
export function resetEventTypeCounter() {
    eventTypeCounter = 0;
}
