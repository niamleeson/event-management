import { createEngine } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Filter configs
// ---------------------------------------------------------------------------
export const filterConfigs = {
    'brightness': { label: 'Brightness', unit: '%', min: 0, max: 200, default: 100, step: 1 },
    'contrast': { label: 'Contrast', unit: '%', min: 0, max: 200, default: 100, step: 1 },
    'saturate': { label: 'Saturate', unit: '%', min: 0, max: 200, default: 100, step: 1 },
    'blur': { label: 'Blur', unit: 'px', min: 0, max: 20, default: 0, step: 0.5 },
    'grayscale': { label: 'Grayscale', unit: '%', min: 0, max: 100, default: 0, step: 1 },
    'sepia': { label: 'Sepia', unit: '%', min: 0, max: 100, default: 0, step: 1 },
    'hue-rotate': { label: 'Hue Rotate', unit: 'deg', min: 0, max: 360, default: 0, step: 1 },
    'invert': { label: 'Invert', unit: '%', min: 0, max: 100, default: 0, step: 1 },
};
// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------
export const FilterAdded = engine.event('FilterAdded');
export const FilterRemoved = engine.event('FilterRemoved');
export const FilterReordered = engine.event('FilterReordered');
export const FilterParamChanged = engine.event('FilterParamChanged');
export const UndoRequested = engine.event('UndoRequested');
export const RedoRequested = engine.event('RedoRequested');
export const ResetAll = engine.event('ResetAll');
export const ImageLoaded = engine.event('ImageLoaded');
export const FiltersChanged = engine.event('FiltersChanged');
export const SnapshotPushed = engine.event('SnapshotPushed');
export const TransitionStart = engine.event('TransitionStart');
export const TransitionDone = engine.event('TransitionDone');
// ---------------------------------------------------------------------------
// Tween: smooth filter transitions
// ---------------------------------------------------------------------------
export const filterTransition = engine.tween({
    start: TransitionStart,
    done: TransitionDone,
    from: 0,
    to: 1,
    duration: 300,
    easing: 'easeOut',
});
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
export const filters = engine.signal(FiltersChanged, [], (_prev, next) => next);
export const undoStack = engine.signal(SnapshotPushed, [], (prev, snapshot) => [...prev, snapshot]);
export const redoStack = engine.signal(
// Reset redo stack when new changes happen
SnapshotPushed, [], () => []);
const RedoStackPush = engine.event('RedoStackPush');
engine.signalUpdate(redoStack, RedoStackPush, (prev, snapshot) => [...prev, snapshot]);
const UndoStackPop = engine.event('UndoStackPop');
engine.signalUpdate(undoStack, UndoStackPop, (prev) => prev.slice(0, -1));
const RedoStackPop = engine.event('RedoStackPop');
engine.signalUpdate(redoStack, RedoStackPop, (prev) => prev.slice(0, -1));
// ---------------------------------------------------------------------------
// Compute CSS filter string
// ---------------------------------------------------------------------------
export function computeFilterString(filterList) {
    return filterList
        .filter(f => f.enabled)
        .map(f => {
        const cfg = filterConfigs[f.name];
        if (f.name === 'blur')
            return `blur(${f.value}${cfg.unit})`;
        if (f.name === 'hue-rotate')
            return `hue-rotate(${f.value}${cfg.unit})`;
        return `${f.name}(${f.value}${cfg.unit})`;
    })
        .join(' ');
}
// ---------------------------------------------------------------------------
// Pipes: filter changes -> recompute + push to undo
// ---------------------------------------------------------------------------
function pushChange(newFilters) {
    const current = filters.value;
    engine.emit(SnapshotPushed, [...current]);
    engine.emit(FiltersChanged, newFilters);
    engine.emit(TransitionStart, undefined);
}
engine.on(FilterAdded, (filter) => {
    pushChange([...filters.value, filter]);
});
engine.on(FilterRemoved, (index) => {
    const next = [...filters.value];
    next.splice(index, 1);
    pushChange(next);
});
engine.on(FilterReordered, (payload) => {
    const next = [...filters.value];
    const [moved] = next.splice(payload.from, 1);
    next.splice(payload.to, 0, moved);
    pushChange(next);
});
engine.on(FilterParamChanged, (payload) => {
    const next = filters.value.map((f, i) => {
        if (i !== payload.index)
            return f;
        if (payload.param === 'enabled') {
            return { ...f, enabled: payload.value };
        }
        return { ...f, value: payload.value };
    });
    pushChange(next);
});
engine.on(ResetAll, () => {
    pushChange([]);
});
engine.on(UndoRequested, () => {
    const stack = undoStack.value;
    if (stack.length === 0)
        return;
    const prev = stack[stack.length - 1];
    engine.emit(RedoStackPush, [...filters.value]);
    engine.emit(UndoStackPop, undefined);
    engine.emit(FiltersChanged, prev);
    engine.emit(TransitionStart, undefined);
});
engine.on(RedoRequested, () => {
    const stack = redoStack.value;
    if (stack.length === 0)
        return;
    const next = stack[stack.length - 1];
    // Push current to undo without clearing redo
    const currentUndo = [...undoStack.value, [...filters.value]];
    engine.signalUpdate(undoStack, FiltersChanged, () => currentUndo);
    engine.emit(RedoStackPop, undefined);
    engine.emit(FiltersChanged, next);
    engine.emit(TransitionStart, undefined);
});
// Start frame loop for tweens
engine.startFrameLoop();
// ---------------------------------------------------------------------------
// Sample image URL (placeholder)
// ---------------------------------------------------------------------------
export const SAMPLE_IMAGE = 'https://picsum.photos/800/600?random=42';
