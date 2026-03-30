import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/gantt-chart/src/engine';
import GanttChartApp from '../../../react/gantt-chart/src/App';
export default function GanttChartPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(GanttChartApp, {}) }));
}
