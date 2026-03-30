import { createEventType } from './event-type.js';
import { createEvent } from './event.js';
import { createSignal } from './signal.js';
import { createTween, startTween, advanceTween, cancelTween } from './tween.js';
import { createSpring, advanceSpring } from './spring.js';
import { resolveEasing } from './easing.js';
import { createRule, registerRuleConsumers, unregisterRuleConsumers } from './rule.js';
import { Mailbox } from './mailbox.js';
import { DAG } from './dag.js';
import { propagate } from './propagation.js';
import { setupAsync } from './async-rule.js';
export class CycleError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CycleError';
    }
}
export class Engine {
    _dag = new DAG();
    _mailboxes = new Map();
    _tweens = [];
    _springs = [];
    _signals = [];
    _maxRounds;
    _frameId = null;
    _lastFrameTime = 0;
    _firstTick = true;
    _propagating = false;
    _pendingEmits = [];
    _cycleSeq = 0;
    /** Built-in frame event type */
    frame;
    /** Debug hooks — assign these to receive propagation telemetry (used by @pulse/devtools) */
    debug = {};
    constructor(options) {
        this._maxRounds = options?.maxPropagationRounds ?? 100;
        this.frame = createEventType('__frame__');
    }
    /** Create a named event type */
    event(name) {
        return createEventType(name);
    }
    /** Emit an event */
    emit(type, payload) {
        if (this._propagating) {
            this._pendingEmits.push({ type, payload });
            return;
        }
        const seq = ++this._cycleSeq;
        const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
        let rulesEvaluated = 0;
        let eventsDeposited = 0;
        this.debug.onCycleStart?.({ seq });
        this._depositEvent(type, payload);
        eventsDeposited++;
        this._propagate();
        // Process any emissions that happened during propagation
        let drainRounds = 0;
        while (this._pendingEmits.length > 0) {
            drainRounds++;
            if (drainRounds > this._maxRounds) {
                this._pendingEmits.length = 0;
                throw new Error(`Propagation exceeded ${this._maxRounds} rounds — possible infinite loop`);
            }
            const { type: t, payload: p } = this._pendingEmits.shift();
            this._depositEvent(t, p);
            eventsDeposited++;
            this._propagate();
        }
        const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start;
        this.debug.onCycleEnd?.({ seq, rulesEvaluated, eventsDeposited, duration });
    }
    /** Listen to events of a type */
    on(type, handler) {
        const rule = createRule({
            name: `on(${type.name})`,
            triggers: [type],
            mode: 'each',
            action: handler,
            outputs: [],
        });
        registerRuleConsumers(rule);
        this._dag.addRule(rule);
        return () => {
            unregisterRuleConsumers(rule);
            this._dag.removeRule(rule);
        };
    }
    /** Pipe: transform events from one type to another */
    pipe(input, output, transform) {
        const outputs = Array.isArray(output) ? output : [output];
        const rule = createRule({
            name: `pipe(${input.name})`,
            triggers: [input],
            mode: 'each',
            action: transform,
            outputs,
        });
        registerRuleConsumers(rule);
        this._dag.addRule(rule);
        return () => {
            unregisterRuleConsumers(rule);
            this._dag.removeRule(rule);
        };
    }
    /** Join: wait for all input types, then fire output */
    join(inputs, output, config) {
        const rule = createRule({
            name: `join(${inputs.map(i => i.name).join(',')})`,
            triggers: inputs,
            mode: 'join',
            guard: config.guard,
            action: config.do,
            outputs: [output],
        });
        registerRuleConsumers(rule);
        this._dag.addRule(rule);
        return () => {
            unregisterRuleConsumers(rule);
            this._dag.removeRule(rule);
        };
    }
    /** Create a signal (reactive value derived from events) */
    signal(type, initial, reducer) {
        const sig = createSignal(initial);
        sig._eventType = type;
        this._signals.push(sig);
        this.on(type, (payload) => {
            sig._set(reducer(sig.value, payload));
        });
        return sig;
    }
    /** Add another event source to update a signal */
    signalUpdate(sig, type, reducer) {
        return this.on(type, (payload) => {
            sig._set(reducer(sig.value, payload));
        });
    }
    /** Create a tween (animated value) */
    tween(config) {
        const easingFn = resolveEasing(config.easing);
        const cancelEvents = config.cancel
            ? Array.isArray(config.cancel) ? config.cancel : [config.cancel]
            : [];
        const tw = createTween({
            from: config.from,
            to: config.to,
            duration: config.duration,
            easing: easingFn,
            startEvent: config.start,
            doneEvent: config.done,
            cancelEvents,
        });
        this.on(config.start, () => {
            startTween(tw);
        });
        for (const ce of cancelEvents) {
            this.on(ce, () => {
                cancelTween(tw);
            });
        }
        this._tweens.push(tw);
        return tw;
    }
    /** Create a spring (physics-based animated value) */
    spring(target, config) {
        const sp = createSpring({
            target: target,
            stiffness: config?.stiffness ?? 170,
            damping: config?.damping ?? 26,
            restThreshold: config?.restThreshold ?? 0.01,
            doneEvent: config?.done,
        });
        this._springs.push(sp);
        return sp;
    }
    /** Async operation handler */
    async(input, config) {
        return setupAsync((type, handler) => this.on(type, handler), (type, payload) => this.emit(type, payload), input, config);
    }
    /** Emit output when signal matches predicate or value */
    when(sig, predicateOrValue, output) {
        const predicate = typeof predicateOrValue === 'function'
            ? predicateOrValue
            : (val) => val === predicateOrValue;
        return sig.subscribe((value) => {
            if (predicate(value)) {
                this.emit(output, value);
            }
        });
    }
    /** Start the frame loop (requestAnimationFrame) */
    startFrameLoop() {
        if (this._frameId !== null)
            return;
        this._firstTick = true;
        const loop = (time) => {
            this._tickFrame(time);
            this._frameId = requestAnimationFrame(loop);
        };
        this._frameId = requestAnimationFrame(loop);
    }
    /** Stop the frame loop */
    stopFrameLoop() {
        if (this._frameId !== null) {
            cancelAnimationFrame(this._frameId);
            this._frameId = null;
        }
    }
    /** Manual tick for testing */
    tick(time) {
        this._tickFrame(time);
    }
    // -- Introspection --
    getRules() {
        return this._dag.getRules();
    }
    getMailboxes() {
        return this._mailboxes;
    }
    getSignals() {
        return this._signals.slice();
    }
    getTweens() {
        return this._tweens.slice();
    }
    getSprings() {
        return this._springs.slice();
    }
    getDAG() {
        return this._dag.getGraph();
    }
    // -- Private --
    _getMailbox(type) {
        let mb = this._mailboxes.get(type);
        if (!mb) {
            mb = new Mailbox(type);
            this._mailboxes.set(type, mb);
        }
        return mb;
    }
    _depositEvent(type, payload) {
        const ev = createEvent(type, payload);
        this.debug.onEventDeposited?.({ type: { name: type.name }, payload, seq: ev.seq });
        if (ev._pendingConsumers.size > 0) {
            this._getMailbox(type).enqueue(ev);
        }
    }
    _propagate() {
        if (this._propagating)
            return;
        this._propagating = true;
        propagate(this._dag, this._mailboxes, (type, payload) => this._depositEvent(type, payload), this._maxRounds);
        this._propagating = false;
    }
    _tickFrame(time) {
        const dt = this._firstTick ? 0 : time - this._lastFrameTime;
        this._firstTick = false;
        this._lastFrameTime = time;
        // Advance tweens
        for (const tw of this._tweens) {
            if (tw.active) {
                const done = advanceTween(tw, dt);
                this.debug.onTweenUpdate?.({ value: tw.value, progress: tw.progress, active: tw.active });
                if (done && tw._doneEvent) {
                    this.emit(tw._doneEvent, undefined);
                }
            }
        }
        // Advance springs
        for (const sp of this._springs) {
            if (!sp.settled) {
                const justSettled = advanceSpring(sp, dt);
                if (justSettled && sp._doneEvent && !sp._doneEmitted) {
                    sp._doneEmitted = true;
                    this.emit(sp._doneEvent, undefined);
                }
            }
        }
        // Emit frame event
        this.emit(this.frame, { time, dt });
    }
}
/** Convenience factory */
export function createEngine(options) {
    return new Engine(options);
}
