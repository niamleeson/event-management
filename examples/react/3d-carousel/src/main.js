import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import { PulseProvider } from '@pulse/react';
import { engine } from './engine';
import App from './App';
createRoot(document.getElementById('root')).render(_jsx(PulseProvider, { engine: engine, children: _jsx(App, {}) }));
