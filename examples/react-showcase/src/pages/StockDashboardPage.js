import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/stock-dashboard/src/engine';
import StockDashboardApp from '../../../react/stock-dashboard/src/App';
export default function StockDashboardPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(StockDashboardApp, {}) }));
}
