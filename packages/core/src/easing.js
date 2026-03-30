/**
 * Standard easing functions for Pulse tweens.
 */
export function linear(t) {
    return t;
}
export function easeIn(t) {
    return t * t * t;
}
export function easeOut(t) {
    const p = 1 - t;
    return 1 - p * p * p;
}
export function easeInOut(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
export function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
export function easeOutElastic(t) {
    if (t === 0)
        return 0;
    if (t === 1)
        return 1;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}
export function easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
        return n1 * t * t;
    }
    else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
    }
    else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
    }
    else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
}
export function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
/**
 * Create a cubic bezier easing function.
 * Uses Newton-Raphson iteration for t lookup.
 */
export function cubicBezier(x1, y1, x2, y2) {
    // Compute polynomial coefficients
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    function sampleCurveX(t) {
        return ((ax * t + bx) * t + cx) * t;
    }
    function sampleCurveY(t) {
        return ((ay * t + by) * t + cy) * t;
    }
    function sampleCurveDerivativeX(t) {
        return (3 * ax * t + 2 * bx) * t + cx;
    }
    function solveCurveX(x) {
        // Newton-Raphson
        let t = x;
        for (let i = 0; i < 8; i++) {
            const currentX = sampleCurveX(t) - x;
            if (Math.abs(currentX) < 1e-7)
                return t;
            const derivative = sampleCurveDerivativeX(t);
            if (Math.abs(derivative) < 1e-7)
                break;
            t -= currentX / derivative;
        }
        // Bisection fallback
        let lo = 0;
        let hi = 1;
        t = x;
        while (lo < hi) {
            const midX = sampleCurveX(t);
            if (Math.abs(midX - x) < 1e-7)
                return t;
            if (x > midX) {
                lo = t;
            }
            else {
                hi = t;
            }
            t = (lo + hi) / 2;
            if (hi - lo < 1e-7)
                break;
        }
        return t;
    }
    return function bezierEasing(t) {
        if (t <= 0)
            return 0;
        if (t >= 1)
            return 1;
        return sampleCurveY(solveCurveX(t));
    };
}
/** Map from easing name to function */
const EASING_MAP = {
    linear,
    easeIn,
    easeOut,
    easeInOut,
    easeOutBack,
    easeOutElastic,
    easeOutBounce,
    easeOutExpo,
};
/**
 * Resolve an easing config to a function.
 * Accepts a string name, a function, or undefined (defaults to linear).
 */
export function resolveEasing(easing) {
    if (typeof easing === 'function')
        return easing;
    if (typeof easing === 'string') {
        const fn = EASING_MAP[easing];
        if (!fn)
            throw new Error(`Unknown easing function: ${easing}`);
        return fn;
    }
    return linear;
}
