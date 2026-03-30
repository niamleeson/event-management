import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/3d-layered-parallax/src/engine';
import LayeredParallax3DApp from '../../../react/3d-layered-parallax/src/App';
export default function LayeredParallax3DPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(LayeredParallax3DApp, {}) }));
}
