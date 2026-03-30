import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSignal, useTween, useEmit } from '@pulse/react';
import { count, animatedCount, colorIntensity, bounceScale, Increment, Decrement, } from './engine';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function lerpColor(r1, g1, b1, r2, g2, b2, t) {
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r}, ${g}, ${b})`;
}
function getBackgroundColor(intensity) {
    // intensity: -1 (full red) to 0 (neutral) to 1 (full green)
    if (intensity <= 0) {
        // Neutral to red
        const t = Math.abs(intensity);
        return lerpColor(248, 249, 250, 255, 200, 200, t);
    }
    else {
        // Neutral to green
        return lerpColor(248, 249, 250, 200, 255, 210, intensity);
    }
}
function getTextColor(intensity) {
    if (intensity <= -0.3)
        return '#c0392b';
    if (intensity >= 0.3)
        return '#27ae60';
    return '#1a1a2e';
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const emit = useEmit();
    const currentCount = useSignal(count);
    const animCount = useTween(animatedCount);
    const colorT = useTween(colorIntensity);
    const bounce = useTween(bounceScale);
    const bgColor = getBackgroundColor(colorT);
    const textColor = getTextColor(colorT);
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            background: bgColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transition: 'background 0.1s',
        }, children: [_jsx("h1", { style: {
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#1a1a2e',
                    marginBottom: 8,
                }, children: "Animated Counter" }), _jsx("p", { style: {
                    color: '#6c757d',
                    fontSize: 14,
                    marginBottom: 48,
                }, children: "Tweens smoothly animate the count and background color" }), _jsxs("div", { style: {
                    transform: `scale(${bounce})`,
                    marginBottom: 48,
                }, children: [_jsx("div", { style: {
                            fontSize: 120,
                            fontWeight: 800,
                            color: textColor,
                            lineHeight: 1,
                            textAlign: 'center',
                            fontVariantNumeric: 'tabular-nums',
                            transition: 'color 0.3s',
                            userSelect: 'none',
                        }, children: Math.round(animCount) }), _jsxs("div", { style: {
                            textAlign: 'center',
                            fontSize: 14,
                            color: '#aaa',
                            marginTop: 8,
                        }, children: ["actual: ", currentCount, " | animated: ", animCount.toFixed(1)] })] }), _jsxs("div", { style: { display: 'flex', gap: 16 }, children: [_jsx("button", { onClick: () => emit(Decrement, undefined), style: {
                            width: 80,
                            height: 80,
                            borderRadius: 20,
                            border: 'none',
                            background: '#e63946',
                            color: '#fff',
                            fontSize: 36,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(230, 57, 70, 0.3)',
                            transition: 'transform 0.1s, box-shadow 0.1s',
                        }, onMouseDown: (e) => {
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }, onMouseUp: (e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }, children: "-" }), _jsx("button", { onClick: () => emit(Increment, undefined), style: {
                            width: 80,
                            height: 80,
                            borderRadius: 20,
                            border: 'none',
                            background: '#4361ee',
                            color: '#fff',
                            fontSize: 36,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
                            transition: 'transform 0.1s, box-shadow 0.1s',
                        }, onMouseDown: (e) => {
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }, onMouseUp: (e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }, children: "+" })] }), _jsx("p", { style: {
                    marginTop: 48,
                    color: '#bbb',
                    fontSize: 13,
                }, children: "Color shifts green for positive, red for negative (saturates at +/-10)" })] }));
}
