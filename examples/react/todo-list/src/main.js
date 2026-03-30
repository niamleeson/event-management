import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PulseProvider } from '@pulse/react';
import { engine } from './engine';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(PulseProvider, { engine: engine, children: _jsx(App, {}) }) }));
