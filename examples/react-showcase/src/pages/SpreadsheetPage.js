import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/spreadsheet/src/engine';
import SpreadsheetApp from '../../../react/spreadsheet/src/App';
export default function SpreadsheetPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(SpreadsheetApp, {}) }));
}
