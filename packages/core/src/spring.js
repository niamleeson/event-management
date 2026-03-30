/**
 * Create a SpringValue — a physics-driven animated value.
 */
export function createSpring(config) {
    const subscribers = new Set();
    const initialValue = config.target.value;
    const spring = {
        value: initialValue,
        velocity: 0,
        settled: true,
        _subscribers: subscribers,
        _target: config.target,
        _stiffness: config.stiffness,
        _damping: config.damping,
        _restThreshold: config.restThreshold,
        _doneEvent: config.doneEvent,
        _doneEmitted: false,
        subscribe(callback) {
            subscribers.add(callback);
            return () => {
                subscribers.delete(callback);
            };
        },
    };
    // Unsettle when target changes
    config.target.subscribe(() => {
        spring.settled = false;
        spring._doneEmitted = false;
    });
    return spring;
}
/**
 * Advance a spring by dt milliseconds.
 * Returns true if the spring just settled this frame.
 */
export function advanceSpring(spring, dt) {
    if (spring.settled)
        return false;
    const dtSec = dt / 1000;
    const target = spring._target.value;
    const displacement = spring.value - target;
    const springForce = -spring._stiffness * displacement;
    const dampingForce = -spring._damping * spring.velocity;
    const acceleration = springForce + dampingForce;
    spring.velocity += acceleration * dtSec;
    spring.value += spring.velocity * dtSec;
    // Notify subscribers
    for (const cb of spring._subscribers) {
        cb(spring.value);
    }
    // Check if settled
    if (Math.abs(spring.velocity) < spring._restThreshold &&
        Math.abs(spring.value - target) < spring._restThreshold) {
        spring.value = target;
        spring.velocity = 0;
        spring.settled = true;
        for (const cb of spring._subscribers) {
            cb(spring.value);
        }
        return true;
    }
    return false;
}
