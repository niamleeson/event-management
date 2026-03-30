import { createEngine } from '@pulse/core';
export const engine = createEngine();
engine.startFrameLoop();
/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */
export const ToolChanged = engine.event('ToolChanged');
export const ColorChanged = engine.event('ColorChanged');
export const SizeChanged = engine.event('SizeChanged');
export const StrokeStart = engine.event('StrokeStart');
export const StrokeMove = engine.event('StrokeMove');
export const StrokeEnd = engine.event('StrokeEnd');
export const UndoStroke = engine.event('UndoStroke');
export const RedoStroke = engine.event('RedoStroke');
export const LayerSelected = engine.event('LayerSelected');
export const LayerToggled = engine.event('LayerToggled');
export const LayerAdded = engine.event('LayerAdded');
export const StrokesChanged = engine.event('StrokesChanged');
/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */
export const currentTool = engine.signal(ToolChanged, 'brush', (_prev, tool) => tool);
export const currentColor = engine.signal(ColorChanged, '#ff6b6b', (_prev, color) => color);
export const brushSize = engine.signal(SizeChanged, 4, (_prev, size) => size);
let nextLayerId = 2;
export const layers = engine.signal(LayerAdded, [
    { id: 0, name: 'Background', visible: true, strokes: [] },
    { id: 1, name: 'Layer 1', visible: true, strokes: [] },
], (prev) => [...prev, { id: nextLayerId++, name: `Layer ${nextLayerId - 1}`, visible: true, strokes: [] }]);
engine.signalUpdate(layers, LayerToggled, (prev, id) => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
export const activeLayer = engine.signal(LayerSelected, 1, (_prev, id) => id);
/* ------------------------------------------------------------------ */
/*  Drawing state                                                     */
/* ------------------------------------------------------------------ */
export const isDrawing = engine.signal(StrokeStart, false, () => true);
engine.signalUpdate(isDrawing, StrokeEnd, () => false);
let currentStroke = null;
const undoStack = [];
const redoStack = [];
engine.on(StrokeStart, (point) => {
    currentStroke = {
        tool: currentTool.value,
        color: currentTool.value === 'eraser' ? '#ffffff' : currentColor.value,
        size: brushSize.value,
        points: [point],
        layer: activeLayer.value,
    };
});
engine.on(StrokeMove, (point) => {
    if (!currentStroke)
        return;
    currentStroke.points.push(point);
    engine.emit(StrokesChanged, undefined);
});
engine.on(StrokeEnd, () => {
    if (!currentStroke || currentStroke.points.length < 2) {
        currentStroke = null;
        return;
    }
    // Add stroke to active layer
    const layerList = layers.value;
    const layerIdx = layerList.findIndex(l => l.id === activeLayer.value);
    if (layerIdx >= 0) {
        const updated = layerList.map((l, i) => {
            if (i === layerIdx)
                return { ...l, strokes: [...l.strokes, currentStroke] };
            return l;
        });
        // We don't update layers signal directly; strokes are in the layer
        // Just push to undo stack
        undoStack.push(currentStroke);
        redoStack.length = 0;
    }
    currentStroke = null;
    engine.emit(StrokesChanged, undefined);
});
engine.on(UndoStroke, () => {
    if (undoStack.length === 0)
        return;
    const stroke = undoStack.pop();
    redoStack.push(stroke);
    engine.emit(StrokesChanged, undefined);
});
engine.on(RedoStroke, () => {
    if (redoStack.length === 0)
        return;
    const stroke = redoStack.pop();
    undoStack.push(stroke);
    engine.emit(StrokesChanged, undefined);
});
/* ------------------------------------------------------------------ */
/*  Export for canvas rendering                                       */
/* ------------------------------------------------------------------ */
export function getCurrentStroke() {
    return currentStroke;
}
export function getUndoStack() {
    return undoStack;
}
export function getRedoStack() {
    return redoStack;
}
/* ------------------------------------------------------------------ */
/*  Color palette                                                     */
/* ------------------------------------------------------------------ */
export const PALETTE = [
    '#ff6b6b', '#ee5a24', '#feca57', '#48dbfb', '#ff9ff3',
    '#54a0ff', '#5f27cd', '#01a3a4', '#2d3436', '#ffffff',
    '#00b894', '#d63031', '#fdcb6e', '#6c5ce7', '#e17055',
];
export const TOOLS = [
    { tool: 'brush', icon: '\u270E', label: 'Brush' },
    { tool: 'eraser', icon: '\u2B1C', label: 'Eraser' },
    { tool: 'rect', icon: '\u25A1', label: 'Rectangle' },
    { tool: 'circle', icon: '\u25CB', label: 'Circle' },
    { tool: 'line', icon: '\u2571', label: 'Line' },
];
