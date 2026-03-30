import { createEngine } from '@pulse/core';
export const engine = createEngine();
engine.startFrameLoop();
/* ------------------------------------------------------------------ */
/*  Grid config                                                       */
/* ------------------------------------------------------------------ */
export const GRID = 4;
export const CELL_COUNT = GRID * GRID;
export const SHAPES = ['flat', 'sphere', 'wave', 'spiral'];
const COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#d63031', '#fdcb6e', '#a29bfe', '#00cec9',
    '#f368e0', '#ff9f43', '#54a0ff', '#5f27cd', '#01a3a4', '#c44569', '#e77f67', '#cf6a87'];
/* ------------------------------------------------------------------ */
/*  Shape position calculators                                        */
/* ------------------------------------------------------------------ */
function shapePositions(shape, row, col) {
    const cx = col - (GRID - 1) / 2;
    const cy = row - (GRID - 1) / 2;
    const dist = Math.sqrt(cx * cx + cy * cy);
    const angle = Math.atan2(cy, cx);
    switch (shape) {
        case 'flat':
            return { rx: 0, ry: 0, tz: 0 };
        case 'sphere':
            return { rx: cy * 20, ry: -cx * 20, tz: Math.max(0, 80 - dist * 30) };
        case 'wave':
            return { rx: Math.sin(col * 0.8) * 30, ry: 0, tz: Math.sin(row * 0.8 + col * 0.8) * 50 };
        case 'spiral':
            return { rx: angle * 15, ry: angle * 15, tz: dist * 25 };
    }
}
/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */
export const MorphToShape = engine.event('MorphToShape');
export const CycleShape = engine.event('CycleShape');
/* ------------------------------------------------------------------ */
/*  Current shape signal                                              */
/* ------------------------------------------------------------------ */
export const currentShape = engine.signal(MorphToShape, 'flat', (_prev, shape) => shape);
/* ------------------------------------------------------------------ */
/*  Per-cell tweens for rotateX, rotateY, translateZ                  */
/* ------------------------------------------------------------------ */
export const cellRX = [];
export const cellRY = [];
export const cellTZ = [];
for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
        const idx = r * GRID + c;
        const stagger = idx * 50;
        const rxStart = engine.event(`CellRX_${idx}`);
        const ryStart = engine.event(`CellRY_${idx}`);
        const tzStart = engine.event(`CellTZ_${idx}`);
        const rxTween = engine.tween({
            start: rxStart,
            from: () => cellRX[idx]?.value ?? 0,
            to: () => shapePositions(currentShape.value, r, c).rx,
            duration: 800,
            easing: (t) => 1 - Math.pow(1 - t, 3),
        });
        cellRX.push(rxTween);
        const ryTween = engine.tween({
            start: ryStart,
            from: () => cellRY[idx]?.value ?? 0,
            to: () => shapePositions(currentShape.value, r, c).ry,
            duration: 800,
            easing: (t) => 1 - Math.pow(1 - t, 3),
        });
        cellRY.push(ryTween);
        const tzTween = engine.tween({
            start: tzStart,
            from: () => cellTZ[idx]?.value ?? 0,
            to: () => shapePositions(currentShape.value, r, c).tz,
            duration: 800,
            easing: (t) => 1 - Math.pow(1 - t, 3),
        });
        cellTZ.push(tzTween);
        // On MorphToShape, fire per-cell tweens with stagger
        engine.on(MorphToShape, () => {
            setTimeout(() => {
                engine.emit(rxStart, undefined);
                engine.emit(ryStart, undefined);
                engine.emit(tzStart, undefined);
            }, stagger);
        });
    }
}
/* ------------------------------------------------------------------ */
/*  Auto-cycle shapes                                                 */
/* ------------------------------------------------------------------ */
let shapeIndex = 0;
engine.on(CycleShape, () => {
    shapeIndex = (shapeIndex + 1) % SHAPES.length;
    engine.emit(MorphToShape, SHAPES[shapeIndex]);
});
// Auto-cycle every 3 seconds
setInterval(() => {
    engine.emit(CycleShape, undefined);
}, 3000);
// Initial morph
setTimeout(() => engine.emit(MorphToShape, 'sphere'), 500);
export { COLORS };
