import { createEngine, createSignal } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export const NotifyInfo = engine.event('NotifyInfo');
export const NotifySuccess = engine.event('NotifySuccess');
export const NotifyWarning = engine.event('NotifyWarning');
export const NotifyError = engine.event('NotifyError');
export const DismissNotification = engine.event('DismissNotification');
export const DismissAll = engine.event('DismissAll');
export const NotificationExpired = engine.event('NotificationExpired');
// Internal events for animation orchestration
export const NotificationAdded = engine.event('NotificationAdded');
export const NotificationEnterDone = engine.event('NotificationEnterDone');
export const NotificationExitStart = engine.event('NotificationExitStart');
export const NotificationRemoved = engine.event('NotificationRemoved');
export const ReflowTrigger = engine.event('ReflowTrigger');
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let nextId = 0;
function genId() {
    return `notif-${++nextId}`;
}
const PRIORITY = {
    error: 0,
    warning: 1,
    success: 2,
    info: 3,
};
function sortByPriority(items) {
    return [...items].sort((a, b) => {
        const pd = PRIORITY[a.type] - PRIORITY[b.type];
        if (pd !== 0)
            return pd;
        return a.timestamp - b.timestamp;
    });
}
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
export const notifications = createSignal([]);
engine['_signals'].push(notifications);
export const notificationCount = engine.signal(NotificationAdded, 0, () => notifications.value.length);
// Keep notificationCount in sync on removal too
engine.on(NotificationRemoved, () => {
    notificationCount._set(notifications.value.length);
});
// ---------------------------------------------------------------------------
// Pipes: Notify* -> NotificationAdded
// ---------------------------------------------------------------------------
function makeNotification(type, data) {
    return {
        id: genId(),
        type,
        title: data.title,
        message: data.message,
        timestamp: Date.now(),
        entering: true,
        exiting: false,
    };
}
engine.pipe(NotifyInfo, NotificationAdded, (data) => makeNotification('info', data));
engine.pipe(NotifySuccess, NotificationAdded, (data) => makeNotification('success', data));
engine.pipe(NotifyWarning, NotificationAdded, (data) => makeNotification('warning', data));
engine.pipe(NotifyError, NotificationAdded, (data) => makeNotification('error', data));
// ---------------------------------------------------------------------------
// On NotificationAdded: add to list, schedule auto-dismiss
// ---------------------------------------------------------------------------
engine.on(NotificationAdded, (notif) => {
    const current = notifications.value;
    const updated = sortByPriority([...current, notif]);
    notifications._set(updated);
    // Mark enter done after a frame cycle
    setTimeout(() => engine.emit(NotificationEnterDone, notif.id), 50);
    // Auto-dismiss timers
    const delays = {
        info: 5000,
        success: 5000,
        warning: 10000,
        error: null,
    };
    const delay = delays[notif.type];
    if (delay !== null) {
        setTimeout(() => engine.emit(NotificationExpired, notif.id), delay);
    }
});
// ---------------------------------------------------------------------------
// Enter done: mark entering = false
// ---------------------------------------------------------------------------
engine.on(NotificationEnterDone, (id) => {
    const current = notifications.value;
    notifications._set(current.map((n) => (n.id === id ? { ...n, entering: false } : n)));
});
// ---------------------------------------------------------------------------
// Expired -> start exit
// ---------------------------------------------------------------------------
engine.pipe(NotificationExpired, NotificationExitStart, (id) => id);
// ---------------------------------------------------------------------------
// Dismiss -> start exit
// ---------------------------------------------------------------------------
engine.pipe(DismissNotification, NotificationExitStart, (id) => id);
// ---------------------------------------------------------------------------
// DismissAll -> start exit for each
// ---------------------------------------------------------------------------
engine.on(DismissAll, () => {
    const current = notifications.value;
    for (const n of current) {
        if (!n.exiting) {
            engine.emit(NotificationExitStart, n.id);
        }
    }
});
// ---------------------------------------------------------------------------
// Exit start: mark exiting, then remove after animation
// ---------------------------------------------------------------------------
engine.on(NotificationExitStart, (id) => {
    const current = notifications.value;
    if (!current.find((n) => n.id === id))
        return;
    notifications._set(current.map((n) => (n.id === id ? { ...n, exiting: true } : n)));
    // Remove after exit animation completes
    setTimeout(() => engine.emit(NotificationRemoved, id), 400);
});
// ---------------------------------------------------------------------------
// Remove: actually remove from array, trigger reflow
// ---------------------------------------------------------------------------
engine.on(NotificationRemoved, (id) => {
    const current = notifications.value;
    notifications._set(current.filter((n) => n.id !== id));
    engine.emit(ReflowTrigger, undefined);
});
// ---------------------------------------------------------------------------
// Start frame loop for spring-driven reflow animations
// ---------------------------------------------------------------------------
engine.startFrameLoop();
