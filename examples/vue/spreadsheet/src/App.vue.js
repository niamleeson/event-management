import { ref as vueRef, watch } from 'vue';
import { providePulse, useSignal, useEmit, useEvent } from '@pulse/vue';
import { engine, cells, selectedCell, CellEdited, CellSelected, FormulaError, colLabel, ROWS, COLS } from './engine';
providePulse(engine);
const emit = useEmit();
const grid = useSignal(cells);
const sel = useSignal(selectedCell);
const formulaInputRef = vueRef(null);
useEvent(FormulaError, (payload) => {
    console.warn(`Formula error at ${colLabel(payload.col)}${payload.row + 1}: ${payload.error}`);
});
watch([() => sel.value.row, () => sel.value.col], () => {
    if (formulaInputRef.value) {
        const cell = grid.value[sel.value.row]?.[sel.value.col];
        formulaInputRef.value.value = cell?.raw ?? '';
    }
});
function onFormulaKeyDown(e) {
    const target = e.target;
    if (e.key === 'Enter') {
        e.preventDefault();
        emit(CellEdited, { row: sel.value.row, col: sel.value.col, value: target.value });
        if (sel.value.row < ROWS - 1)
            emit(CellSelected, { row: sel.value.row + 1, col: sel.value.col });
    }
    else if (e.key === 'Tab') {
        e.preventDefault();
        emit(CellEdited, { row: sel.value.row, col: sel.value.col, value: target.value });
        if (sel.value.col < COLS - 1) {
            emit(CellSelected, { row: sel.value.row, col: sel.value.col + 1 });
        }
        else if (sel.value.row < ROWS - 1) {
            emit(CellSelected, { row: sel.value.row + 1, col: 0 });
        }
    }
    else if (e.key === 'Escape') {
        const cell = grid.value[sel.value.row]?.[sel.value.col];
        target.value = cell?.raw ?? '';
    }
}
function onFormulaBlur(e) {
    const value = e.target.value;
    const cell = grid.value[sel.value.row]?.[sel.value.col];
    if (value !== cell?.raw) {
        emit(CellEdited, { row: sel.value.row, col: sel.value.col, value });
    }
}
function cellStyle(row, col) {
    const isSelected = sel.value.row === row && sel.value.col === col;
    const cell = grid.value[row][col];
    const hasError = !!cell.error;
    return {
        border: isSelected ? '2px solid #217346' : '1px solid #d0d0d0',
        padding: isSelected ? '3px 5px' : '4px 6px',
        fontSize: '13px',
        cursor: 'cell',
        width: '90px',
        minWidth: '90px',
        height: '28px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        background: isSelected ? '#e8f5e9' : hasError ? '#fff5f5' : '#fff',
        color: hasError ? '#d32f2f' : '#222',
        position: 'relative',
        outline: 'none',
    };
}
const filledCount = () => grid.value.flat().filter(c => c.raw !== '').length;
const formulaCount = () => grid.value.flat().filter(c => c.raw.startsWith('=')).length;
const errorCount = () => grid.value.flat().filter(c => !!c.error).length;
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#f5f5f5',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ background: '#217346', color: '#fff', padding: '8px 16px', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', alignItems: 'center', background: '#fff', borderBottom: '1px solid #d0d0d0', padding: '4px 8px', gap: '8px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ fontWeight: 600, fontSize: '13px', color: '#333', minWidth: '40px', textAlign: 'center', padding: '4px 8px', background: '#f0f0f0', border: '1px solid #d0d0d0', borderRadius: '2px' }) },
});
(__VLS_ctx.colLabel(__VLS_ctx.sel.col));
(__VLS_ctx.sel.row + 1);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: ({ color: '#999', fontSize: '13px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onKeydown: (__VLS_ctx.onFormulaKeyDown) },
    ...{ onBlur: (__VLS_ctx.onFormulaBlur) },
    ref: "formulaInputRef",
    ...{ style: ({ flex: 1, padding: '6px 10px', fontSize: '13px', border: '1px solid #d0d0d0', borderRadius: '2px', outline: 'none', fontFamily: 'Consolas, monospace' }) },
    defaultValue: (__VLS_ctx.grid[__VLS_ctx.sel.row]?.[__VLS_ctx.sel.col]?.raw ?? ''),
});
/** @type {typeof __VLS_ctx.formulaInputRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ flex: 1, overflow: 'auto', padding: '16px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ style: ({ borderCollapse: 'collapse', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', userSelect: 'none' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th)({
    ...{ style: ({ background: '#e8e8e8', border: '1px solid #d0d0d0', width: '36px', minWidth: '36px' }) },
});
for (const [c] of __VLS_getVForSourceType((__VLS_ctx.COLS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        key: (c),
        ...{ style: ({ background: '#f0f0f0', border: '1px solid #d0d0d0', padding: '6px 0', textAlign: 'center', fontWeight: 600, fontSize: '12px', color: '#555', width: '90px', minWidth: '90px' }) },
    });
    (__VLS_ctx.colLabel(c - 1));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
for (const [r] of __VLS_getVForSourceType((__VLS_ctx.ROWS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        key: (r),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: ({ background: '#f0f0f0', border: '1px solid #d0d0d0', padding: '4px 10px', textAlign: 'center', fontWeight: 600, fontSize: '12px', color: '#555', width: '36px', minWidth: '36px' }) },
    });
    (r);
    for (const [c] of __VLS_getVForSourceType((__VLS_ctx.COLS))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.emit(__VLS_ctx.CellSelected, { row: r - 1, col: c - 1 });
                } },
            key: (`${r}-${c}`),
            ...{ style: (__VLS_ctx.cellStyle(r - 1, c - 1)) },
            title: (__VLS_ctx.grid[r - 1][c - 1].error || __VLS_ctx.grid[r - 1][c - 1].raw),
        });
        (__VLS_ctx.grid[r - 1][c - 1].computed);
        if (__VLS_ctx.grid[r - 1][c - 1].error && __VLS_ctx.sel.row === r - 1 && __VLS_ctx.sel.col === c - 1) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: ({
                        position: 'absolute', bottom: '100%', left: '0', background: '#d32f2f', color: '#fff',
                        fontSize: '11px', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
                    }) },
            });
            (__VLS_ctx.grid[r - 1][c - 1].error);
        }
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ background: '#217346', color: '#fff', padding: '4px 16px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.filledCount());
(__VLS_ctx.formulaCount());
(__VLS_ctx.errorCount());
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
if (__VLS_ctx.grid[__VLS_ctx.sel.row]?.[__VLS_ctx.sel.col]?.raw.startsWith('=')) {
    (__VLS_ctx.grid[__VLS_ctx.sel.row][__VLS_ctx.sel.col].raw);
    (__VLS_ctx.grid[__VLS_ctx.sel.row][__VLS_ctx.sel.col].computed);
}
else if (__VLS_ctx.grid[__VLS_ctx.sel.row]?.[__VLS_ctx.sel.col]?.computed) {
    (__VLS_ctx.grid[__VLS_ctx.sel.row][__VLS_ctx.sel.col].computed);
}
else {
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            CellSelected: CellSelected,
            colLabel: colLabel,
            ROWS: ROWS,
            COLS: COLS,
            emit: emit,
            grid: grid,
            sel: sel,
            formulaInputRef: formulaInputRef,
            onFormulaKeyDown: onFormulaKeyDown,
            onFormulaBlur: onFormulaBlur,
            cellStyle: cellStyle,
            filledCount: filledCount,
            formulaCount: formulaCount,
            errorCount: errorCount,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
