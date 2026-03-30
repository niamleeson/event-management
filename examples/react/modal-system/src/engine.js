import { createEngine, createSignal } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export const OpenModal = engine.event('OpenModal');
export const CloseModal = engine.event('CloseModal');
export const CloseAll = engine.event('CloseAll');
export const ModalOpened = engine.event('ModalOpened');
export const ModalClosed = engine.event('ModalClosed');
export const ConfirmAction = engine.event('ConfirmAction');
export const CancelAction = engine.event('CancelAction');
// Internal animation events
const ModalEnterDone = engine.event('ModalEnterDone');
const ModalExitDone = engine.event('ModalExitDone');
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
export const modalStack = createSignal([]);
engine['_signals'].push(modalStack);
export const activeModalId = createSignal(null);
engine['_signals'].push(activeModalId);
// ---------------------------------------------------------------------------
// Open modal: add to stack in "entering" state
// ---------------------------------------------------------------------------
engine.on(OpenModal, ({ id, title, content, size }) => {
    const current = modalStack.value;
    // Prevent duplicate ids
    if (current.find((m) => m.id === id))
        return;
    const modal = { id, title, content, size, state: 'entering' };
    modalStack._set([...current, modal]);
    activeModalId._set(id);
    // After entrance animation, mark as open and fire ModalOpened
    setTimeout(() => {
        engine.emit(ModalEnterDone, id);
    }, 50);
});
// Join: ModalEnterDone waits for entrance animation to complete
engine.on(ModalEnterDone, (id) => {
    const current = modalStack.value;
    modalStack._set(current.map((m) => (m.id === id ? { ...m, state: 'open' } : m)));
    engine.emit(ModalOpened, id);
});
// ---------------------------------------------------------------------------
// Close modal: trigger exit animation
// ---------------------------------------------------------------------------
engine.on(CloseModal, (id) => {
    const current = modalStack.value;
    const modal = current.find((m) => m.id === id);
    if (!modal || modal.state === 'exiting')
        return;
    modalStack._set(current.map((m) => (m.id === id ? { ...m, state: 'exiting' } : m)));
    // After exit animation, remove from stack
    setTimeout(() => {
        engine.emit(ModalExitDone, id);
    }, 300);
});
engine.on(ModalExitDone, (id) => {
    const current = modalStack.value;
    const newStack = current.filter((m) => m.id !== id);
    modalStack._set(newStack);
    // Update active modal
    if (newStack.length > 0) {
        activeModalId._set(newStack[newStack.length - 1].id);
    }
    else {
        activeModalId._set(null);
    }
    engine.emit(ModalClosed, id);
});
// ---------------------------------------------------------------------------
// Close all: close each modal in reverse order
// ---------------------------------------------------------------------------
engine.on(CloseAll, () => {
    const current = modalStack.value;
    // Close from top to bottom with staggered timing
    const toClose = [...current].reverse().filter((m) => m.state !== 'exiting');
    toClose.forEach((m, i) => {
        setTimeout(() => engine.emit(CloseModal, m.id), i * 100);
    });
});
// ---------------------------------------------------------------------------
// Confirm/Cancel -> close
// ---------------------------------------------------------------------------
engine.pipe(ConfirmAction, CloseModal, (id) => id);
engine.pipe(CancelAction, CloseModal, (id) => id);
// ---------------------------------------------------------------------------
// Start frame loop
// ---------------------------------------------------------------------------
engine.startFrameLoop();
