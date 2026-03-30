import { createEngine } from '@pulse/core';
export const engine = createEngine();
/* ------------------------------------------------------------------ */
/*  Available filters                                                 */
/* ------------------------------------------------------------------ */
export const FILTER_DEFS = [
    { name: 'Brightness', prop: 'brightness', unit: '%', min: 0, max: 200, default: 100 },
    { name: 'Contrast', prop: 'contrast', unit: '%', min: 0, max: 200, default: 100 },
    { name: 'Saturate', prop: 'saturate', unit: '%', min: 0, max: 200, default: 100 },
    { name: 'Blur', prop: 'blur', unit: 'px', min: 0, max: 20, default: 0 },
    { name: 'Hue Rotate', prop: 'hue-rotate', unit: 'deg', min: 0, max: 360, default: 0 },
    { name: 'Grayscale', prop: 'grayscale', unit: '%', min: 0, max: 100, default: 0 },
    { name: 'Sepia', prop: 'sepia', unit: '%', min: 0, max: 100, default: 0 },
    { name: 'Invert', prop: 'invert', unit: '%', min: 0, max: 100, default: 0 },
];
/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */
export const FilterValueChanged = engine.event('FilterValueChanged');
export const FilterReordered = engine.event('FilterReordered');
export const Undo = engine.event('Undo');
export const Redo = engine.event('Redo');
export const ResetAll = engine.event('ResetAll');
export const SplitChanged = engine.event('SplitChanged');
/* ------------------------------------------------------------------ */
/*  Initial state                                                     */
/* ------------------------------------------------------------------ */
let filterId = 0;
function makeDefaultFilters() {
    return FILTER_DEFS.map(d => ({
        id: `filter_${filterId++}`,
        name: d.name,
        prop: d.prop,
        unit: d.unit,
        value: d.default,
        default: d.default,
        min: d.min,
        max: d.max,
    }));
}
/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */
export const filters = engine.signal(FilterValueChanged, makeDefaultFilters(), (prev, { id, value }) => prev.map(f => f.id === id ? { ...f, value } : f));
engine.signalUpdate(filters, FilterReordered, (prev, { fromIdx, toIdx }) => {
    const next = [...prev];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    return next;
});
engine.signalUpdate(filters, ResetAll, () => makeDefaultFilters());
export const splitPosition = engine.signal(SplitChanged, 50, (_prev, val) => val);
/* ------------------------------------------------------------------ */
/*  Undo/Redo stack                                                   */
/* ------------------------------------------------------------------ */
const undoStack = [];
const redoStack = [];
export const canUndo = engine.signal(FilterValueChanged, false, () => undoStack.length > 0);
export const canRedo = engine.signal(FilterValueChanged, false, () => redoStack.length > 0);
// Record history on each change
engine.on(FilterValueChanged, ({ id }) => {
    const filterName = filters.value.find(f => f.id === id)?.name ?? 'unknown';
    undoStack.push({ filters: filters.value.map(f => ({ ...f })), label: `Changed ${filterName}` });
    redoStack.length = 0;
});
engine.on(Undo, () => {
    if (undoStack.length === 0)
        return;
    const entry = undoStack.pop();
    redoStack.push({ filters: filters.value.map(f => ({ ...f })), label: 'Undo' });
    // Restore filters by emitting reset then re-applying
    engine.emit(ResetAll, undefined);
    for (const f of entry.filters) {
        engine.emit(FilterValueChanged, { id: f.id, value: f.value });
    }
});
engine.on(Redo, () => {
    if (redoStack.length === 0)
        return;
    const entry = redoStack.pop();
    undoStack.push({ filters: filters.value.map(f => ({ ...f })), label: 'Redo' });
    engine.emit(ResetAll, undefined);
    for (const f of entry.filters) {
        engine.emit(FilterValueChanged, { id: f.id, value: f.value });
    }
});
