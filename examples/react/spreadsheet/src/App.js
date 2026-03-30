import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { useSignal, useEmit, useEvent } from '@pulse/react';
import { cells, selectedCell, CellEdited, CellSelected, FormulaError, colLabel, ROWS, COLS, } from './engine';
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
    container: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f5f5f5',
    },
    header: {
        background: '#217346',
        color: '#fff',
        padding: '8px 16px',
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 0.5,
    },
    formulaBar: {
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        borderBottom: '1px solid #d0d0d0',
        padding: '4px 8px',
        gap: 8,
    },
    cellLabel: {
        fontWeight: 600,
        fontSize: 13,
        color: '#333',
        minWidth: 40,
        textAlign: 'center',
        padding: '4px 8px',
        background: '#f0f0f0',
        border: '1px solid #d0d0d0',
        borderRadius: 2,
    },
    formulaInput: {
        flex: 1,
        padding: '6px 10px',
        fontSize: 13,
        border: '1px solid #d0d0d0',
        borderRadius: 2,
        outline: 'none',
        fontFamily: 'Consolas, monospace',
    },
    gridContainer: {
        flex: 1,
        overflow: 'auto',
        padding: 16,
    },
    table: {
        borderCollapse: 'collapse',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        userSelect: 'none',
    },
    colHeader: {
        background: '#f0f0f0',
        border: '1px solid #d0d0d0',
        padding: '6px 0',
        textAlign: 'center',
        fontWeight: 600,
        fontSize: 12,
        color: '#555',
        width: 90,
        minWidth: 90,
    },
    rowHeader: {
        background: '#f0f0f0',
        border: '1px solid #d0d0d0',
        padding: '4px 10px',
        textAlign: 'center',
        fontWeight: 600,
        fontSize: 12,
        color: '#555',
        width: 36,
        minWidth: 36,
    },
    cell: (isSelected, hasError) => ({
        border: isSelected ? '2px solid #217346' : '1px solid #d0d0d0',
        padding: isSelected ? '3px 5px' : '4px 6px',
        fontSize: 13,
        cursor: 'cell',
        width: 90,
        minWidth: 90,
        height: 28,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        background: isSelected ? '#e8f5e9' : hasError ? '#fff5f5' : '#fff',
        color: hasError ? '#d32f2f' : '#222',
        position: 'relative',
        outline: 'none',
    }),
    cornerCell: {
        background: '#e8e8e8',
        border: '1px solid #d0d0d0',
        width: 36,
        minWidth: 36,
    },
    errorTooltip: {
        position: 'absolute',
        bottom: '100%',
        left: 0,
        background: '#d32f2f',
        color: '#fff',
        fontSize: 11,
        padding: '2px 6px',
        borderRadius: 3,
        whiteSpace: 'nowrap',
        zIndex: 10,
        pointerEvents: 'none',
    },
    statusBar: {
        background: '#217346',
        color: '#fff',
        padding: '4px 16px',
        fontSize: 12,
        display: 'flex',
        justifyContent: 'space-between',
    },
};
// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function FormulaBar() {
    const emit = useEmit();
    const grid = useSignal(cells);
    const sel = useSignal(selectedCell);
    const inputRef = useRef(null);
    const currentCell = grid[sel.row]?.[sel.col];
    const label = `${colLabel(sel.col)}${sel.row + 1}`;
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = e.target.value;
            emit(CellEdited, { row: sel.row, col: sel.col, value });
            // Move to next row
            if (sel.row < ROWS - 1) {
                emit(CellSelected, { row: sel.row + 1, col: sel.col });
            }
        }
        else if (e.key === 'Tab') {
            e.preventDefault();
            const value = e.target.value;
            emit(CellEdited, { row: sel.row, col: sel.col, value });
            // Move to next col
            if (sel.col < COLS - 1) {
                emit(CellSelected, { row: sel.row, col: sel.col + 1 });
            }
            else if (sel.row < ROWS - 1) {
                emit(CellSelected, { row: sel.row + 1, col: 0 });
            }
        }
        else if (e.key === 'Escape') {
            if (inputRef.current) {
                inputRef.current.value = currentCell?.raw ?? '';
            }
        }
    };
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.value = currentCell?.raw ?? '';
        }
    }, [sel.row, sel.col, currentCell?.raw]);
    return (_jsxs("div", { style: styles.formulaBar, children: [_jsx("div", { style: styles.cellLabel, children: label }), _jsx("span", { style: { color: '#999', fontSize: 13 }, children: "fx" }), _jsx("input", { ref: inputRef, style: styles.formulaInput, defaultValue: currentCell?.raw ?? '', onKeyDown: handleKeyDown, onBlur: (e) => {
                    const value = e.target.value;
                    if (value !== currentCell?.raw) {
                        emit(CellEdited, { row: sel.row, col: sel.col, value });
                    }
                } })] }));
}
function Cell({ row, col }) {
    const emit = useEmit();
    const grid = useSignal(cells);
    const sel = useSignal(selectedCell);
    const isSelected = sel.row === row && sel.col === col;
    const cell = grid[row][col];
    const hasError = !!cell.error;
    const handleClick = () => {
        emit(CellSelected, { row, col });
    };
    const handleDoubleClick = () => {
        emit(CellSelected, { row, col });
    };
    return (_jsxs("td", { style: styles.cell(isSelected, hasError), onClick: handleClick, onDoubleClick: handleDoubleClick, title: cell.error || cell.raw, children: [cell.computed, hasError && isSelected && (_jsx("div", { style: styles.errorTooltip, children: cell.error }))] }));
}
function SpreadsheetGrid() {
    return (_jsx("div", { style: styles.gridContainer, children: _jsxs("table", { style: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: styles.cornerCell }), Array.from({ length: COLS }, (_, c) => (_jsx("th", { style: styles.colHeader, children: colLabel(c) }, c)))] }) }), _jsx("tbody", { children: Array.from({ length: ROWS }, (_, r) => (_jsxs("tr", { children: [_jsx("td", { style: styles.rowHeader, children: r + 1 }), Array.from({ length: COLS }, (_, c) => (_jsx(Cell, { row: r, col: c }, `${r}-${c}`)))] }, r))) })] }) }));
}
function ErrorNotifier() {
    useEvent(FormulaError, (payload) => {
        // Errors are shown inline in cells, this is for potential future toast notifications
        console.warn(`Formula error at ${colLabel(payload.col)}${payload.row + 1}: ${payload.error}`);
    });
    return null;
}
function StatusBar() {
    const grid = useSignal(cells);
    const sel = useSignal(selectedCell);
    const filledCount = grid.flat().filter(c => c.raw !== '').length;
    const formulaCount = grid.flat().filter(c => c.raw.startsWith('=')).length;
    const errorCount = grid.flat().filter(c => !!c.error).length;
    const currentCell = grid[sel.row]?.[sel.col];
    return (_jsxs("div", { style: styles.statusBar, children: [_jsxs("span", { children: [filledCount, " cells filled | ", formulaCount, " formulas | ", errorCount, " errors"] }), _jsx("span", { children: currentCell?.raw.startsWith('=')
                    ? `Formula: ${currentCell.raw} = ${currentCell.computed}`
                    : currentCell?.computed
                        ? `Value: ${currentCell.computed}`
                        : 'Empty cell' })] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    return (_jsxs("div", { style: styles.container, children: [_jsx("div", { style: styles.header, children: "Pulse Spreadsheet" }), _jsx(FormulaBar, {}), _jsx(SpreadsheetGrid, {}), _jsx(StatusBar, {}), _jsx(ErrorNotifier, {})] }));
}
