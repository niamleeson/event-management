import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/3d-carousel/src/engine';
import Carousel3DApp from '../../../react/3d-carousel/src/App';
export default function Carousel3DPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(Carousel3DApp, {}) }));
}
