import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/3d-morphing-grid/src/engine';
import MorphingGrid3DApp from '../../../react/3d-morphing-grid/src/App';
export default function MorphingGrid3DPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(MorphingGrid3DApp, {}) }));
}
