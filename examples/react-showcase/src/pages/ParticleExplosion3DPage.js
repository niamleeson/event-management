import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/3d-particle-explosion/src/engine';
import ParticleExplosion3DApp from '../../../react/3d-particle-explosion/src/App';
export default function ParticleExplosion3DPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(ParticleExplosion3DApp, {}) }));
}
