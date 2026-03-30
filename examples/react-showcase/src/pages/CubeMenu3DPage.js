import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/3d-cube-menu/src/engine';
import CubeMenu3DApp from '../../../react/3d-cube-menu/src/App';
export default function CubeMenu3DPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(CubeMenu3DApp, {}) }));
}
