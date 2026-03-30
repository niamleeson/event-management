import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/realtime-dashboard/src/engine';
import RealtimeDashboardApp from '../../../react/realtime-dashboard/src/App';
export default function RealtimeDashboardPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(RealtimeDashboardApp, {}) }));
}
