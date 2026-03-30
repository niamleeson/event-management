import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/canvas-paint/src/engine';
import CanvasPaintApp from '../../../react/canvas-paint/src/App';
export default function CanvasPaintPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(CanvasPaintApp, {}) }));
}
