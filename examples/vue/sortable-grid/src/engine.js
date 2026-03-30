import { createEngine } from '@pulse/core';
export const engine = createEngine();
engine.startFrameLoop();
/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const COLS = 4;
const CELL_SIZE = 120;
const GAP = 12;
let nextItemId = 1;
const COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#d63031', '#fdcb6e', '#a29bfe', '#00cec9',
    '#f368e0', '#ff9f43', '#54a0ff', '#5f27cd'];
function makeItem() {
    const id = nextItemId++;
    return { id, label: `Item ${id}`, color: COLORS[(id - 1) % COLORS.length] };
}
/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */
export const DragStart = engine.event('DragStart');
export const DragMove = engine.event('DragMove');
export const DragEnd = engine.event('DragEnd');
export const ShuffleItems = engine.event('ShuffleItems');
export const AddItem = engine.event('AddItem');
export const RemoveItem = engine.event('RemoveItem');
export const ItemsChanged = engine.event('ItemsChanged');
export const PositionsUpdated = engine.event('PositionsUpdated');
/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */
const initialItems = Array.from({ length: 8 }, () => makeItem());
export const items = engine.signal(ItemsChanged, initialItems, (_prev, next) => next);
export const draggingId = engine.signal(DragStart, -1, (_prev, { id }) => id);
engine.signalUpdate(draggingId, DragEnd, () => -1);
export const ghostPos = engine.signal(DragMove, { x: 0, y: 0 }, (_prev, pos) => pos);
engine.signalUpdate(ghostPos, DragStart, (_prev, { x, y }) => ({ x, y }));
/* ------------------------------------------------------------------ */
/*  Position springs (pool of 20)                                     */
/* ------------------------------------------------------------------ */
export const posXTargets = [];
export const posYTargets = [];
export const posXSprings = [];
export const posYSprings = [];
for (let i = 0; i < 20; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const xt = engine.signal(PositionsUpdated, col * (CELL_SIZE + GAP), () => {
        const idx = i < items.value.length ? i : 0;
        return (idx % COLS) * (CELL_SIZE + GAP);
    });
    const yt = engine.signal(PositionsUpdated, row * (CELL_SIZE + GAP), () => {
        const idx = i < items.value.length ? i : 0;
        return Math.floor(idx / COLS) * (CELL_SIZE + GAP);
    });
    posXTargets.push(xt);
    posYTargets.push(yt);
    posXSprings.push(engine.spring(xt, { stiffness: 200, damping: 22 }));
    posYSprings.push(engine.spring(yt, { stiffness: 200, damping: 22 }));
}
/* ------------------------------------------------------------------ */
/*  Drag reorder logic                                                */
/* ------------------------------------------------------------------ */
engine.on(DragMove, ({ x, y }) => {
    if (draggingId.value < 0)
        return;
    const col = Math.min(COLS - 1, Math.max(0, Math.round(x / (CELL_SIZE + GAP))));
    const row = Math.max(0, Math.round(y / (CELL_SIZE + GAP)));
    const targetIdx = Math.min(items.value.length - 1, row * COLS + col);
    const currentIdx = items.value.findIndex(it => it.id === draggingId.value);
    if (currentIdx >= 0 && currentIdx !== targetIdx) {
        const next = [...items.value];
        const [moved] = next.splice(currentIdx, 1);
        next.splice(targetIdx, 0, moved);
        engine.emit(ItemsChanged, next);
        engine.emit(PositionsUpdated, undefined);
    }
});
/* ------------------------------------------------------------------ */
/*  Shuffle                                                           */
/* ------------------------------------------------------------------ */
engine.on(ShuffleItems, () => {
    const shuffled = [...items.value];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    engine.emit(ItemsChanged, shuffled);
    engine.emit(PositionsUpdated, undefined);
});
/* ------------------------------------------------------------------ */
/*  Add / Remove                                                      */
/* ------------------------------------------------------------------ */
engine.on(AddItem, () => {
    if (items.value.length >= 20)
        return;
    engine.emit(ItemsChanged, [...items.value, makeItem()]);
    engine.emit(PositionsUpdated, undefined);
});
engine.on(RemoveItem, (id) => {
    engine.emit(ItemsChanged, items.value.filter(it => it.id !== id));
    engine.emit(PositionsUpdated, undefined);
});
export { COLS, CELL_SIZE, GAP };
