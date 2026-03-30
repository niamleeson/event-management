import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { useEmit, useSignal, useTween } from '@pulse/react';
import { engine } from './engine';
/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const GRID = 4;
const CELL_COUNT = GRID * GRID;
const SHAPES = ['flat', 'sphere', 'wave', 'spiral'];
/* ------------------------------------------------------------------ */
/*  Shape target calculators                                          */
/* ------------------------------------------------------------------ */
function getShapeTargets(shape, row, col) {
    const cx = (GRID - 1) / 2;
    const cy = (GRID - 1) / 2;
    const dx = col - cx;
    const dy = row - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const maxDist = Math.sqrt(cx * cx + cy * cy);
    const normDist = dist / maxDist;
    switch (shape) {
        case 'flat':
            return { rotX: 0, rotY: 0, tz: 0, scale: 1, radius: 8 };
        case 'sphere': {
            const curve = Math.cos(normDist * Math.PI * 0.5);
            return {
                rotX: dy * 15,
                rotY: -dx * 15,
                tz: curve * 120,
                scale: 0.9 + curve * 0.2,
                radius: 50,
            };
        }
        case 'wave': {
            const wave = Math.sin((col / GRID) * Math.PI * 2 + (row / GRID) * Math.PI);
            return {
                rotX: wave * 20,
                rotY: 0,
                tz: wave * 80,
                scale: 0.85 + Math.abs(wave) * 0.3,
                radius: 8,
            };
        }
        case 'spiral': {
            const spiralAngle = angle + normDist * Math.PI * 2;
            return {
                rotX: Math.sin(spiralAngle) * 30,
                rotY: Math.cos(spiralAngle) * 30,
                tz: normDist * 100,
                scale: 1 - normDist * 0.3,
                radius: 50 * normDist,
            };
        }
    }
}
/* ------------------------------------------------------------------ */
/*  Cell distance from center (for stagger delay)                     */
/* ------------------------------------------------------------------ */
function cellDistFromCenter(index) {
    const row = Math.floor(index / GRID);
    const col = index % GRID;
    const cx = (GRID - 1) / 2;
    const cy = (GRID - 1) / 2;
    return Math.sqrt((col - cx) ** 2 + (row - cy) ** 2);
}
const maxCellDist = cellDistFromCenter(0); // corner cell
/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */
const MorphTrigger = engine.event('MorphTrigger');
const AllMorphed = engine.event('AllMorphed');
const AutoCycleToggle = engine.event('AutoCycleToggle');
// Per-cell events
const cellMorphStarts = [];
const cellMorphDones = [];
for (let i = 0; i < CELL_COUNT; i++) {
    cellMorphStarts.push(engine.event(`CellMorphStart_${i}`));
    cellMorphDones.push(engine.event(`CellMorphDone_${i}`));
}
/* ------------------------------------------------------------------ */
/*  Per-cell tweens (5 properties each)                               */
/* ------------------------------------------------------------------ */
// Current targets (mutated on morph)
const cellTargets = [];
const cellFroms = [];
// Tween arrays: each cell has 5 tweens
const rotXTweens = [];
const rotYTweens = [];
const tzTweens = [];
const scaleTweens = [];
const radiusTweens = [];
for (let i = 0; i < CELL_COUNT; i++) {
    cellTargets.push({ rotX: 0, rotY: 0, tz: 0, scale: 1, radius: 8 });
    cellFroms.push({ rotX: 0, rotY: 0, tz: 0, scale: 1, radius: 8 });
    const start = cellMorphStarts[i];
    const done = cellMorphDones[i];
    rotXTweens.push(engine.tween({ start, from: () => cellFroms[i].rotX, to: () => cellTargets[i].rotX, duration: 800, easing: 'easeOutBack' }));
    rotYTweens.push(engine.tween({ start, from: () => cellFroms[i].rotY, to: () => cellTargets[i].rotY, duration: 800, easing: 'easeOutBack' }));
    tzTweens.push(engine.tween({ start, from: () => cellFroms[i].tz, to: () => cellTargets[i].tz, duration: 800, easing: 'easeOutBack' }));
    scaleTweens.push(engine.tween({ start, from: () => cellFroms[i].scale, to: () => cellTargets[i].scale, duration: 800, easing: 'easeOutBack' }));
    radiusTweens.push(engine.tween({ start, done, from: () => cellFroms[i].radius, to: () => cellTargets[i].radius, duration: 800, easing: 'easeOutBack' }));
}
/* ------------------------------------------------------------------ */
/*  Join: all CellMorphDone -> AllMorphed                             */
/* ------------------------------------------------------------------ */
engine.join(cellMorphDones, AllMorphed, {
    do: () => undefined,
});
/* ------------------------------------------------------------------ */
/*  MorphTrigger handler: set targets + stagger cell starts           */
/* ------------------------------------------------------------------ */
engine.on(MorphTrigger, (shape) => {
    for (let i = 0; i < CELL_COUNT; i++) {
        const row = Math.floor(i / GRID);
        const col = i % GRID;
        const targets = getShapeTargets(shape, row, col);
        // Save current values as "from"
        cellFroms[i] = {
            rotX: rotXTweens[i].value,
            rotY: rotYTweens[i].value,
            tz: tzTweens[i].value,
            scale: scaleTweens[i].value,
            radius: radiusTweens[i].value,
        };
        cellTargets[i] = targets;
    }
    // Stagger: emit cell starts based on distance from center
    for (let i = 0; i < CELL_COUNT; i++) {
        const dist = cellDistFromCenter(i);
        const delay = (dist / maxCellDist) * 300;
        setTimeout(() => {
            engine.emit(cellMorphStarts[i], undefined);
        }, delay);
    }
});
/* ------------------------------------------------------------------ */
/*  Current shape signal                                              */
/* ------------------------------------------------------------------ */
const currentShape = engine.signal(MorphTrigger, 'flat', (_prev, shape) => shape);
/* ------------------------------------------------------------------ */
/*  Auto-cycle mode                                                   */
/* ------------------------------------------------------------------ */
const autoCycling = engine.signal(AutoCycleToggle, false, (prev) => !prev);
let autoCycleTimer = null;
engine.on(AutoCycleToggle, () => {
    // Use setTimeout to read the updated signal
    setTimeout(() => {
        if (autoCycling.value) {
            advanceAutoCycle();
        }
        else if (autoCycleTimer) {
            clearTimeout(autoCycleTimer);
            autoCycleTimer = null;
        }
    }, 0);
});
engine.on(AllMorphed, () => {
    if (autoCycling.value) {
        autoCycleTimer = setTimeout(advanceAutoCycle, 3000);
    }
});
function advanceAutoCycle() {
    const current = currentShape.value;
    const idx = SHAPES.indexOf(current);
    const next = SHAPES[(idx + 1) % SHAPES.length];
    engine.emit(MorphTrigger, next);
}
/* ------------------------------------------------------------------ */
/*  Cell component                                                    */
/* ------------------------------------------------------------------ */
function Cell({ index }) {
    const row = Math.floor(index / GRID);
    const col = index % GRID;
    const rotX = useTween(rotXTweens[index]);
    const rotY = useTween(rotYTweens[index]);
    const tz = useTween(tzTweens[index]);
    const scale = useTween(scaleTweens[index]);
    const radius = useTween(radiusTweens[index]);
    // Gradient based on grid position
    const hue1 = (row / GRID) * 120 + (col / GRID) * 60 + 200;
    const hue2 = hue1 + 40;
    return (_jsx("div", { style: {
            width: 80,
            height: 80,
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${tz}px) scale(${scale})`,
            borderRadius: `${radius}%`,
            background: `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 80%, 40%))`,
            boxShadow: `0 ${4 + tz * 0.1}px ${16 + Math.abs(tz) * 0.2}px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)`,
            border: '1px solid rgba(255,255,255,0.1)',
        } }));
}
/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */
export default function App() {
    const emit = useEmit();
    const shape = useSignal(currentShape);
    const isAuto = useSignal(autoCycling);
    const triggerShape = useCallback((s) => {
        emit(MorphTrigger, s);
    }, [emit]);
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }, children: [_jsx("h1", { style: { color: '#fff', fontSize: 28, fontWeight: 300, letterSpacing: 2 }, children: "3D Morphing Grid" }), _jsx("div", { style: {
                    perspective: 1500,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }, children: _jsx("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: `repeat(${GRID}, 80px)`,
                        gap: 16,
                        transformStyle: 'preserve-3d',
                        transform: 'rotateX(15deg) rotateY(-10deg)',
                    }, children: Array.from({ length: CELL_COUNT }, (_, i) => (_jsx(Cell, { index: i }, i))) }) }), _jsxs("div", { style: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }, children: [SHAPES.map((s) => (_jsx("button", { onClick: () => triggerShape(s), style: {
                            background: shape === s ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                            border: shape === s ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
                            color: '#fff',
                            padding: '10px 24px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                            letterSpacing: 1,
                            textTransform: 'capitalize',
                            transition: 'all 0.2s',
                        }, children: s }, s))), _jsx("button", { onClick: () => emit(AutoCycleToggle, undefined), style: {
                            background: isAuto ? 'rgba(100,200,255,0.2)' : 'rgba(255,255,255,0.05)',
                            border: isAuto ? '1px solid rgba(100,200,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
                            color: '#fff',
                            padding: '10px 24px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                            letterSpacing: 1,
                        }, children: isAuto ? '\u23F8 Stop Auto' : '\u25B6 Auto Cycle' })] }), _jsxs("p", { style: { color: 'rgba(255,255,255,0.4)', fontSize: 13 }, children: ["Current: ", _jsx("span", { style: { color: 'rgba(255,255,255,0.7)' }, children: shape })] })] }));
}
