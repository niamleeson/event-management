import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useCallback } from 'react';
import { useEmit, useSignal, useSpring } from '@pulse/react';
import { engine } from './engine';
/* ------------------------------------------------------------------ */
/*  Face data                                                         */
/* ------------------------------------------------------------------ */
const FACES = [
    { icon: '\u2302', label: 'Home', desc: 'Return to dashboard', color: '#6c5ce7' },
    { icon: '\u2699', label: 'Settings', desc: 'Configure preferences', color: '#00b894' },
    { icon: '\u2709', label: 'Messages', desc: 'View your inbox', color: '#e17055' },
    { icon: '\u2605', label: 'Favorites', desc: 'Bookmarked items', color: '#0984e3' },
    { icon: '\u263A', label: 'Profile', desc: 'Your account details', color: '#d63031' },
    { icon: '\u2139', label: 'About', desc: 'App information', color: '#fdcb6e' },
];
/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */
const DragStart = engine.event('DragStart');
const DragMove = engine.event('DragMove');
const DragEnd = engine.event('DragEnd');
const FaceSelected = engine.event('FaceSelected');
const SnapToFace = engine.event('SnapToFace');
const SnapDone = engine.event('SnapDone');
/* ------------------------------------------------------------------ */
/*  Rotation signals + springs                                        */
/* ------------------------------------------------------------------ */
// Target rotation signals (driven by drag + snap)
const rotationXTarget = engine.signal(DragMove, 0, (prev, { dy }) => prev + dy * 0.4);
const rotationYTarget = engine.signal(DragMove, 0, (prev, { dx }) => prev + dx * 0.4);
// Snap overrides: when SnapToFace fires, set targets to nearest 90deg face
engine.signalUpdate(rotationXTarget, SnapToFace, (_prev, face) => {
    const snaps = { 4: -90, 5: 90 }; // top, bottom
    return snaps[face] ?? 0;
});
engine.signalUpdate(rotationYTarget, SnapToFace, (prev, face) => {
    // Canonical angles for each face
    const canonical = { 0: 0, 1: -90, 2: -180, 3: -270 };
    const base = canonical[face] ?? 0;
    // Find the closest equivalent angle to the current rotation
    // Equivalent angles: base + 360*n for any integer n
    const offset = Math.round((prev - base) / 360) * 360;
    return base + offset;
});
// Springs smooth the rotation
const rotXSpring = engine.spring(rotationXTarget, { stiffness: 120, damping: 20 });
const rotYSpring = engine.spring(rotationYTarget, { stiffness: 120, damping: 20 });
// Selected face signal
const selectedFace = engine.signal(FaceSelected, -1, (_prev, idx) => idx);
/* ------------------------------------------------------------------ */
/*  Snap logic: on drag end, snap to nearest 90deg face               */
/* ------------------------------------------------------------------ */
engine.on(DragEnd, () => {
    // Find closest face from current rotation
    const ry = rotYSpring.value;
    const rx = rotXSpring.value;
    // Check if more vertical than horizontal
    if (rx < -45) {
        engine.emit(SnapToFace, 4); // top
        return;
    }
    if (rx > 45) {
        engine.emit(SnapToFace, 5); // bottom
        return;
    }
    // Horizontal snap to nearest 90deg
    const normalized = ((ry % 360) + 360) % 360;
    const faceIndex = Math.round(normalized / 90) % 4;
    engine.emit(SnapToFace, faceIndex);
});
/* ------------------------------------------------------------------ */
/*  Cube face component                                               */
/* ------------------------------------------------------------------ */
function CubeFace({ index, transform, selected, }) {
    const emit = useEmit();
    const face = FACES[index];
    return (_jsxs("div", { onClick: (e) => {
            e.stopPropagation();
            emit(FaceSelected, index);
        }, style: {
            position: 'absolute',
            width: 300,
            height: 300,
            transform,
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: selected
                ? `linear-gradient(145deg, ${face.color}ee, ${face.color}aa)`
                : `linear-gradient(145deg, ${face.color}88, ${face.color}44)`,
            border: selected ? `2px solid ${face.color}` : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            cursor: 'pointer',
            boxShadow: selected
                ? `0 0 30px ${face.color}66, inset 0 0 30px ${face.color}22`
                : '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'background 0.3s, box-shadow 0.3s',
            gap: 12,
        }, children: [_jsx("div", { style: { fontSize: 48 }, children: face.icon }), _jsx("div", { style: { color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 1 }, children: face.label }), _jsx("div", { style: { color: 'rgba(255,255,255,0.7)', fontSize: 13 }, children: face.desc })] }));
}
/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */
export default function App() {
    const emit = useEmit();
    const rotX = useSpring(rotXSpring);
    const rotY = useSpring(rotYSpring);
    const selected = useSignal(selectedFace);
    const dragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const onPointerDown = useCallback((e) => {
        dragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
        emit(DragStart, undefined);
        e.target.setPointerCapture(e.pointerId);
    }, [emit]);
    const onPointerMove = useCallback((e) => {
        if (!dragging.current)
            return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
        emit(DragMove, { dx, dy });
    }, [emit]);
    const onPointerUp = useCallback(() => {
        if (!dragging.current)
            return;
        dragging.current = false;
        emit(DragEnd, undefined);
    }, [emit]);
    // Lighting overlay: subtle gradient that shifts with rotation
    const lightAngle = ((rotY % 360) + 360) % 360;
    const lightX = 50 + Math.sin(lightAngle * Math.PI / 180) * 30;
    const lightY = 50 - Math.sin(rotX * Math.PI / 180) * 30;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, userSelect: 'none' }, children: [_jsx("h1", { style: { color: '#fff', fontSize: 28, fontWeight: 300, letterSpacing: 2 }, children: "3D Cube Menu" }), _jsx("div", { onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, style: {
                    perspective: 800,
                    width: 300,
                    height: 300,
                    cursor: dragging.current ? 'grabbing' : 'grab',
                }, children: _jsxs("div", { style: {
                        width: 300,
                        height: 300,
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                        transform: `rotateX(${-rotX}deg) rotateY(${-rotY}deg)`,
                    }, children: [_jsx("div", { style: {
                                position: 'absolute',
                                inset: -150,
                                borderRadius: '50%',
                                background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,255,255,0.05) 0%, transparent 60%)`,
                                pointerEvents: 'none',
                                transformStyle: 'preserve-3d',
                            } }), _jsx(CubeFace, { index: 0, selected: selected === 0, transform: "translateZ(150px)" }), _jsx(CubeFace, { index: 1, selected: selected === 1, transform: "rotateY(90deg) translateZ(150px)" }), _jsx(CubeFace, { index: 2, selected: selected === 2, transform: "rotateY(180deg) translateZ(150px)" }), _jsx(CubeFace, { index: 3, selected: selected === 3, transform: "rotateY(-90deg) translateZ(150px)" }), _jsx(CubeFace, { index: 4, selected: selected === 4, transform: "rotateX(90deg) translateZ(150px)" }), _jsx(CubeFace, { index: 5, selected: selected === 5, transform: "rotateX(-90deg) translateZ(150px)" })] }) }), _jsxs("p", { style: { color: 'rgba(255,255,255,0.5)', fontSize: 14 }, children: ["Drag to rotate ", '\u00B7', " Click a face to select", selected >= 0 && (_jsxs("span", { style: { color: FACES[selected].color, marginLeft: 12 }, children: ["Selected: ", FACES[selected].label] }))] })] }));
}
