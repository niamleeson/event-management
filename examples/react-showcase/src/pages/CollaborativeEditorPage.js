import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PulseProvider } from '@pulse/react';
import { engine } from '../../../react/collaborative-editor/src/engine';
import CollaborativeEditorApp from '../../../react/collaborative-editor/src/App';
export default function CollaborativeEditorPage() {
    useEffect(() => {
        ;
        window.__pulseEngine = engine;
        return () => { ; window.__pulseEngine = null; };
    }, []);
    return (_jsx(PulseProvider, { engine: engine, children: _jsx(CollaborativeEditorApp, {}) }));
}
