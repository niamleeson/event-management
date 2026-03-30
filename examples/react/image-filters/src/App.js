import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from 'react';
import { useSignal, useEmit } from '@pulse/react';
import { filters, undoStack, redoStack, FilterAdded, FilterRemoved, FilterReordered, FilterParamChanged, UndoRequested, RedoRequested, ResetAll, filterConfigs, computeFilterString, SAMPLE_IMAGE, } from './engine';
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
    container: {
        display: 'flex',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#1a1a2e',
        color: '#fff',
    },
    sidebar: {
        width: 320,
        background: '#16213e',
        borderRight: '1px solid #0f3460',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    sidebarHeader: {
        padding: '16px',
        borderBottom: '1px solid #0f3460',
    },
    sidebarTitle: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 12,
    },
    toolbar: {
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
    },
    filterBtn: {
        padding: '6px 12px',
        fontSize: 12,
        fontWeight: 600,
        border: '1px solid #0f3460',
        borderRadius: 6,
        background: '#1a1a2e',
        color: '#e0e0e0',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    actionBar: {
        display: 'flex',
        gap: 8,
        padding: '10px 16px',
        borderBottom: '1px solid #0f3460',
    },
    actionBtn: (disabled) => ({
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 600,
        border: '1px solid #0f3460',
        borderRadius: 6,
        background: disabled ? '#111' : '#0f3460',
        color: disabled ? '#555' : '#fff',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
    }),
    filterList: {
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0',
    },
    filterItem: (isDragging) => ({
        padding: '12px 16px',
        borderBottom: '1px solid #0f346033',
        background: isDragging ? '#0f3460' : 'transparent',
        transition: 'background 0.2s',
    }),
    filterItemHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    filterItemName: {
        fontSize: 13,
        fontWeight: 600,
    },
    filterItemControls: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    toggleBtn: (enabled) => ({
        width: 36,
        height: 20,
        borderRadius: 10,
        border: 'none',
        background: enabled ? '#4361ee' : '#333',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
    }),
    toggleKnob: (enabled) => ({
        position: 'absolute',
        top: 2,
        left: enabled ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
    }),
    removeBtn: {
        background: 'none',
        border: 'none',
        color: '#e63946',
        fontSize: 16,
        cursor: 'pointer',
        padding: '0 4px',
    },
    moveBtn: {
        background: 'none',
        border: 'none',
        color: '#888',
        fontSize: 14,
        cursor: 'pointer',
        padding: '0 2px',
    },
    slider: {
        width: '100%',
        height: 4,
        appearance: 'none',
        WebkitAppearance: 'none',
        background: '#333',
        borderRadius: 2,
        outline: 'none',
        cursor: 'pointer',
    },
    sliderValue: {
        fontSize: 11,
        color: '#aaa',
        textAlign: 'right',
        marginTop: 4,
    },
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    previewArea: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    imageContainer: {
        position: 'relative',
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    image: (filterStr) => ({
        display: 'block',
        maxWidth: '100%',
        maxHeight: 'calc(100vh - 100px)',
        filter: filterStr || 'none',
        transition: 'filter 0.3s ease-out',
    }),
    splitView: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
    },
    splitDivider: (pos) => ({
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: `${pos}%`,
        width: 3,
        background: '#fff',
        cursor: 'col-resize',
        zIndex: 10,
        pointerEvents: 'auto',
        boxShadow: '0 0 8px rgba(0,0,0,0.5)',
    }),
    splitLabel: (side) => ({
        position: 'absolute',
        top: 8,
        [side === 'left' ? 'left' : 'right']: 8,
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 4,
    }),
    bottomBar: {
        background: '#16213e',
        borderTop: '1px solid #0f3460',
        padding: '8px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: '#888',
    },
    cssOutput: {
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#4361ee',
        maxWidth: 400,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};
const globalStyle = `
body { margin: 0; overflow: hidden; }
input[type="range"] {
  -webkit-appearance: none;
  height: 4px;
  background: #333;
  border-radius: 2px;
  outline: none;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4361ee;
  cursor: pointer;
}
`;
// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function FilterToolbar() {
    const emit = useEmit();
    const allFilterNames = [
        'brightness', 'contrast', 'saturate', 'blur',
        'grayscale', 'sepia', 'hue-rotate', 'invert',
    ];
    const addFilter = (name) => {
        const cfg = filterConfigs[name];
        emit(FilterAdded, {
            id: crypto.randomUUID(),
            name,
            value: cfg.default,
            enabled: true,
        });
    };
    return (_jsxs("div", { style: styles.sidebarHeader, children: [_jsx("div", { style: styles.sidebarTitle, children: "Add Filter" }), _jsx("div", { style: styles.toolbar, children: allFilterNames.map(name => (_jsxs("button", { style: styles.filterBtn, onClick: () => addFilter(name), children: ["+ ", filterConfigs[name].label] }, name))) })] }));
}
function ActionBar() {
    const emit = useEmit();
    const undo = useSignal(undoStack);
    const redo = useSignal(redoStack);
    const currentFilters = useSignal(filters);
    return (_jsxs("div", { style: styles.actionBar, children: [_jsxs("button", { style: styles.actionBtn(undo.length === 0), onClick: () => emit(UndoRequested, undefined), disabled: undo.length === 0, children: ["Undo (", undo.length, ")"] }), _jsxs("button", { style: styles.actionBtn(redo.length === 0), onClick: () => emit(RedoRequested, undefined), disabled: redo.length === 0, children: ["Redo (", redo.length, ")"] }), _jsx("button", { style: styles.actionBtn(currentFilters.length === 0), onClick: () => emit(ResetAll, undefined), disabled: currentFilters.length === 0, children: "Reset All" })] }));
}
function FilterItem({ filter, index }) {
    const emit = useEmit();
    const totalFilters = useSignal(filters).length;
    const cfg = filterConfigs[filter.name];
    return (_jsxs("div", { style: styles.filterItem(false), children: [_jsxs("div", { style: styles.filterItemHeader, children: [_jsx("span", { style: styles.filterItemName, children: cfg.label }), _jsxs("div", { style: styles.filterItemControls, children: [_jsx("button", { style: styles.moveBtn, onClick: () => {
                                    if (index > 0)
                                        emit(FilterReordered, { from: index, to: index - 1 });
                                }, disabled: index === 0, title: "Move up", children: '▲' }), _jsx("button", { style: styles.moveBtn, onClick: () => {
                                    if (index < totalFilters - 1)
                                        emit(FilterReordered, { from: index, to: index + 1 });
                                }, disabled: index === totalFilters - 1, title: "Move down", children: '▼' }), _jsx("button", { style: styles.toggleBtn(filter.enabled), onClick: () => emit(FilterParamChanged, { index, param: 'enabled', value: !filter.enabled }), children: _jsx("div", { style: styles.toggleKnob(filter.enabled) }) }), _jsx("button", { style: styles.removeBtn, onClick: () => emit(FilterRemoved, index), title: "Remove", children: '×' })] })] }), _jsx("input", { type: "range", style: { ...styles.slider, width: '100%' }, min: cfg.min, max: cfg.max, step: cfg.step, value: filter.value, onChange: (e) => emit(FilterParamChanged, { index, param: 'value', value: parseFloat(e.target.value) }), disabled: !filter.enabled }), _jsxs("div", { style: styles.sliderValue, children: [filter.value, cfg.unit] })] }));
}
function FilterList() {
    const currentFilters = useSignal(filters);
    if (currentFilters.length === 0) {
        return (_jsx("div", { style: { padding: 20, color: '#666', fontSize: 13, textAlign: 'center' }, children: "No filters applied. Click a filter button above to add one." }));
    }
    return (_jsx("div", { style: styles.filterList, children: currentFilters.map((f, i) => (_jsx(FilterItem, { filter: f, index: i }, f.id))) }));
}
function ImagePreview() {
    const currentFilters = useSignal(filters);
    const splitRef = useRef(50);
    const containerRef = useRef(null);
    const dragging = useRef(false);
    const filterStr = computeFilterString(currentFilters);
    const handleMouseDown = () => { dragging.current = true; };
    const handleMouseUp = () => { dragging.current = false; };
    const handleMouseMove = (e) => {
        if (!dragging.current || !containerRef.current)
            return;
        const rect = containerRef.current.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        splitRef.current = Math.max(5, Math.min(95, pct));
        // Force re-render via DOM
        const divider = containerRef.current.querySelector('[data-divider]');
        const clipEl = containerRef.current.querySelector('[data-before]');
        if (divider)
            divider.style.left = `${splitRef.current}%`;
        if (clipEl)
            clipEl.style.clipPath = `inset(0 ${100 - splitRef.current}% 0 0)`;
    };
    return (_jsx("div", { style: styles.previewArea, children: _jsxs("div", { ref: containerRef, style: styles.imageContainer, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onMouseLeave: handleMouseUp, children: [_jsx("img", { src: SAMPLE_IMAGE, alt: "Preview", style: styles.image(filterStr), crossOrigin: "anonymous" }), currentFilters.length > 0 && (_jsx("img", { "data-before": true, src: SAMPLE_IMAGE, alt: "Before", style: {
                        ...styles.image(''),
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        clipPath: `inset(0 50% 0 0)`,
                    }, crossOrigin: "anonymous" })), currentFilters.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { "data-divider": true, style: styles.splitDivider(50), onMouseDown: handleMouseDown }), _jsx("div", { style: { ...styles.splitLabel('left'), position: 'absolute', top: 8, left: 8 }, children: "Before" }), _jsx("div", { style: { ...styles.splitLabel('right'), position: 'absolute', top: 8, right: 8 }, children: "After" })] }))] }) }));
}
function BottomBar() {
    const currentFilters = useSignal(filters);
    const filterStr = computeFilterString(currentFilters);
    return (_jsxs("div", { style: styles.bottomBar, children: [_jsxs("span", { children: [currentFilters.length, " filter(s) applied"] }), _jsx("div", { style: styles.cssOutput, children: filterStr ? `filter: ${filterStr};` : 'No filters' })] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: globalStyle }), _jsxs("div", { style: styles.container, children: [_jsxs("div", { style: styles.sidebar, children: [_jsx(FilterToolbar, {}), _jsx(ActionBar, {}), _jsx(FilterList, {})] }), _jsxs("div", { style: styles.main, children: [_jsx(ImagePreview, {}), _jsx(BottomBar, {})] })] })] }));
}
