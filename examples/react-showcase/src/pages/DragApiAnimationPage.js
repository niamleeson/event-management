import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/drag-api-animation/src/engine';
import DragApiAnimationApp from '../../../react/drag-api-animation/src/App';
export default function DragApiAnimationPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(DragApiAnimationApp, {}) }));
}
