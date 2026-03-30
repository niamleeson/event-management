import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useSignal, useEmit } from '@pulse/react';
import { useCallback, useRef } from 'react';
import { sortState, filters, currentPage, pageSize, selectedRows, expandedRows, searchQuery, columnWidths, isLoading, SortChanged, FilterChanged, PageChanged, RowSelected, RowExpanded, BulkAction, SearchChanged, ColumnResized, SelectAll, DeselectAll, getProcessedData, } from './engine';
// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }) {
    const colors = {
        Active: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80' },
        Inactive: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
        Pending: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
    };
    const c = colors[status] || { bg: '#334155', text: '#94a3b8' };
    return (_jsx("span", { style: {
            padding: '2px 8px',
            borderRadius: 10,
            background: c.bg,
            color: c.text,
            fontSize: 11,
            fontWeight: 600,
        }, children: status }));
}
// ---------------------------------------------------------------------------
// Highlight matching text
// ---------------------------------------------------------------------------
function HighlightText({ text, query }) {
    if (!query)
        return _jsx(_Fragment, { children: text });
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1)
        return _jsx(_Fragment, { children: text });
    return (_jsxs(_Fragment, { children: [text.slice(0, idx), _jsx("span", { style: { background: '#fbbf2440', color: '#fbbf24', borderRadius: 2, padding: '0 1px' }, children: text.slice(idx, idx + query.length) }), text.slice(idx + query.length)] }));
}
// ---------------------------------------------------------------------------
// Column header with sort
// ---------------------------------------------------------------------------
function SortHeader({ label, column, width, }) {
    const emit = useEmit();
    const sort = useSignal(sortState);
    const widths = useSignal(columnWidths);
    const resizing = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(0);
    const isActive = sort.column === column;
    const direction = isActive ? sort.direction : null;
    const handleSort = useCallback(() => {
        let newDir;
        if (!isActive) {
            newDir = 'asc';
        }
        else if (direction === 'asc') {
            newDir = 'desc';
        }
        else {
            newDir = null;
        }
        emit(SortChanged, { column, direction: newDir });
    }, [emit, column, isActive, direction]);
    const handleResizeStart = useCallback((e) => {
        e.stopPropagation();
        resizing.current = true;
        startX.current = e.clientX;
        startWidth.current = widths[column] || width;
        const handleMove = (me) => {
            if (!resizing.current)
                return;
            const diff = me.clientX - startX.current;
            emit(ColumnResized, { column, width: startWidth.current + diff });
        };
        const handleUp = () => {
            resizing.current = false;
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    }, [emit, column, width, widths]);
    return (_jsxs("th", { style: {
            width: widths[column] || width,
            minWidth: 50,
            padding: '10px 12px',
            textAlign: 'left',
            fontSize: 11,
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            cursor: 'pointer',
            userSelect: 'none',
            position: 'relative',
            borderBottom: '1px solid #1e293b',
            whiteSpace: 'nowrap',
        }, onClick: handleSort, children: [label, ' ', _jsx("span", { style: { color: isActive ? '#3b82f6' : '#334155', fontSize: 10 }, children: direction === 'asc' ? '\u25B2' : direction === 'desc' ? '\u25BC' : '\u25B2' }), _jsx("div", { onMouseDown: handleResizeStart, onClick: (e) => e.stopPropagation(), style: {
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    cursor: 'col-resize',
                    background: 'transparent',
                }, onMouseEnter: (e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                }, onMouseLeave: (e) => {
                    e.currentTarget.style.background = 'transparent';
                } })] }));
}
// ---------------------------------------------------------------------------
// Expanded row detail
// ---------------------------------------------------------------------------
function ExpandedDetail({ row }) {
    return (_jsx("tr", { children: _jsx("td", { colSpan: 9, style: {
                padding: '16px 24px',
                background: '#111827',
                borderBottom: '1px solid #1e293b',
            }, children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }, children: [_jsxs("div", { children: [_jsx("div", { style: { color: '#64748b', marginBottom: 4 }, children: "Full Details" }), _jsxs("div", { style: { color: '#e2e8f0' }, children: [_jsx("strong", { children: "Name:" }), " ", row.name, _jsx("br", {}), _jsx("strong", { children: "Email:" }), " ", row.email, _jsx("br", {}), _jsx("strong", { children: "Role:" }), " ", row.role, _jsx("br", {}), _jsx("strong", { children: "Status:" }), " ", row.status] })] }), _jsxs("div", { children: [_jsx("div", { style: { color: '#64748b', marginBottom: 4 }, children: "Activity" }), _jsxs("div", { style: { color: '#e2e8f0' }, children: [_jsx("strong", { children: "Created:" }), " ", row.created, _jsx("br", {}), _jsx("strong", { children: "Revenue:" }), " $", row.revenue.toLocaleString(), _jsx("br", {}), _jsx("strong", { children: "ID:" }), " ", row.id] })] })] }) }) }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const emit = useEmit();
    const sort = useSignal(sortState);
    const filterState = useSignal(filters);
    const page = useSignal(currentPage);
    const selected = useSignal(selectedRows);
    const expanded = useSignal(expandedRows);
    const search = useSignal(searchQuery);
    const widths = useSignal(columnWidths);
    const loading = useSignal(isLoading);
    const { rows, totalRows, totalPages } = getProcessedData();
    const allVisibleSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            background: '#0a0e17',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#e2e8f0',
            padding: 24,
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontSize: 24, fontWeight: 700, margin: 0 }, children: "Data Table" }), _jsxs("p", { style: { color: '#64748b', fontSize: 13, marginTop: 4 }, children: [totalRows.toLocaleString(), " records | Page ", page, " of ", totalPages] })] }), _jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center' }, children: [_jsx("input", { type: "text", placeholder: "Search...", value: search, onChange: (e) => emit(SearchChanged, e.target.value), style: {
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    border: '1px solid #334155',
                                    background: '#0f172a',
                                    color: '#e2e8f0',
                                    fontSize: 13,
                                    width: 220,
                                    outline: 'none',
                                } }), selected.size > 0 && (_jsxs("div", { style: { display: 'flex', gap: 6, alignItems: 'center' }, children: [_jsxs("span", { style: { fontSize: 12, color: '#3b82f6' }, children: [selected.size, " selected"] }), _jsxs("select", { onChange: (e) => {
                                            if (e.target.value) {
                                                emit(BulkAction, {
                                                    action: e.target.value,
                                                    ids: Array.from(selected),
                                                });
                                                e.target.value = '';
                                            }
                                        }, style: {
                                            padding: '6px 10px',
                                            borderRadius: 6,
                                            border: '1px solid #334155',
                                            background: '#0f172a',
                                            color: '#94a3b8',
                                            fontSize: 12,
                                        }, children: [_jsx("option", { value: "", children: "Bulk Actions..." }), _jsx("option", { value: "delete", children: "Delete" }), _jsx("option", { value: "activate", children: "Activate" }), _jsx("option", { value: "deactivate", children: "Deactivate" }), _jsx("option", { value: "export", children: "Export" })] }), _jsx("button", { onClick: () => emit(DeselectAll, undefined), style: {
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                            border: '1px solid #334155',
                                            background: 'transparent',
                                            color: '#64748b',
                                            fontSize: 11,
                                            cursor: 'pointer',
                                        }, children: "Clear" })] }))] })] }), loading && (_jsx("div", { style: {
                    height: 2,
                    background: '#3b82f6',
                    borderRadius: 1,
                    marginBottom: 2,
                    animation: 'loading-bar 0.8s ease infinite',
                } })), _jsxs("div", { style: {
                    background: '#111827',
                    borderRadius: 12,
                    border: '1px solid #1e293b',
                    overflow: 'auto',
                }, children: [_jsxs("table", { style: {
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: 13,
                        }, children: [_jsxs("thead", { style: {
                                    position: 'sticky',
                                    top: 0,
                                    background: '#111827',
                                    zIndex: 10,
                                }, children: [_jsxs("tr", { children: [_jsx("th", { style: {
                                                    width: 40,
                                                    padding: '10px 12px',
                                                    borderBottom: '1px solid #1e293b',
                                                }, children: _jsx("input", { type: "checkbox", checked: allVisibleSelected, onChange: () => emit(SelectAll, undefined), style: { accentColor: '#3b82f6', cursor: 'pointer' } }) }), _jsx(SortHeader, { label: "ID", column: "id", width: 60 }), _jsx(SortHeader, { label: "Name", column: "name", width: 160 }), _jsx(SortHeader, { label: "Email", column: "email", width: 200 }), _jsx(SortHeader, { label: "Role", column: "role", width: 100 }), _jsx(SortHeader, { label: "Status", column: "status", width: 90 }), _jsx(SortHeader, { label: "Created", column: "created", width: 110 }), _jsx(SortHeader, { label: "Revenue", column: "revenue", width: 110 }), _jsx("th", { style: {
                                                    width: 80,
                                                    padding: '10px 12px',
                                                    textAlign: 'left',
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: '#64748b',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 0.5,
                                                    borderBottom: '1px solid #1e293b',
                                                }, children: "Actions" })] }), _jsxs("tr", { children: [_jsx("td", { style: { padding: '6px 12px', borderBottom: '1px solid #1e293b' } }), _jsx("td", { style: { padding: '6px 12px', borderBottom: '1px solid #1e293b' } }), ['name', 'email', 'role', 'status', 'created'].map((col) => (_jsx("td", { style: { padding: '6px 8px', borderBottom: '1px solid #1e293b' }, children: _jsx("input", { type: "text", placeholder: `Filter...`, value: filterState[col] || '', onChange: (e) => emit(FilterChanged, { column: col, value: e.target.value }), style: {
                                                        width: '100%',
                                                        padding: '4px 6px',
                                                        borderRadius: 4,
                                                        border: '1px solid #1e293b',
                                                        background: '#0a0e17',
                                                        color: '#94a3b8',
                                                        fontSize: 11,
                                                        outline: 'none',
                                                    } }) }, col))), _jsx("td", { style: { padding: '6px 12px', borderBottom: '1px solid #1e293b' } }), _jsx("td", { style: { padding: '6px 12px', borderBottom: '1px solid #1e293b' } })] })] }), _jsx("tbody", { children: rows.map((row, i) => {
                                    const isSelected = selected.has(row.id);
                                    const isExpanded = expanded.has(row.id);
                                    const isEven = i % 2 === 0;
                                    return (_jsx(RowGroup, { row: row, isSelected: isSelected, isExpanded: isExpanded, isEven: isEven, search: search }, row.id));
                                }) })] }), rows.length === 0 && (_jsx("div", { style: {
                            padding: 40,
                            textAlign: 'center',
                            color: '#475569',
                            fontSize: 14,
                        }, children: "No results found" }))] }), _jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 16,
                    fontSize: 13,
                    color: '#64748b',
                }, children: [_jsxs("span", { children: ["Showing ", (page - 1) * pageSize + 1, "-", Math.min(page * pageSize, totalRows), " of ", totalRows] }), _jsxs("div", { style: { display: 'flex', gap: 4 }, children: [_jsx(PageButton, { label: "\\u00AB", disabled: page <= 1, onClick: () => emit(PageChanged, 1) }), _jsx(PageButton, { label: "\\u2039", disabled: page <= 1, onClick: () => emit(PageChanged, page - 1) }), getPageNumbers(page, totalPages).map((p, i) => p === -1 ? (_jsx("span", { style: { padding: '6px 4px', color: '#475569' }, children: "..." }, `ellipsis-${i}`)) : (_jsx(PageButton, { label: String(p), active: p === page, disabled: false, onClick: () => emit(PageChanged, p) }, p))), _jsx(PageButton, { label: "\\u203A", disabled: page >= totalPages, onClick: () => emit(PageChanged, page + 1) }), _jsx(PageButton, { label: "\\u00BB", disabled: page >= totalPages, onClick: () => emit(PageChanged, totalPages) })] })] }), _jsx("style", { children: `
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      ` })] }));
}
// ---------------------------------------------------------------------------
// Row group (row + optional expansion)
// ---------------------------------------------------------------------------
function RowGroup({ row, isSelected, isExpanded, isEven, search, }) {
    const emit = useEmit();
    return (_jsxs(_Fragment, { children: [_jsxs("tr", { style: {
                    background: isSelected
                        ? 'rgba(59, 130, 246, 0.08)'
                        : isEven
                            ? '#0d1424'
                            : 'transparent',
                    transition: 'background 0.15s',
                }, onMouseEnter: (e) => {
                    if (!isSelected)
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }, onMouseLeave: (e) => {
                    if (!isSelected) {
                        e.currentTarget.style.background = isEven ? '#0d1424' : 'transparent';
                    }
                }, children: [_jsx("td", { style: { padding: '10px 12px', borderBottom: '1px solid #1e293b11' }, children: _jsx("input", { type: "checkbox", checked: isSelected, onChange: () => emit(RowSelected, row.id), style: { accentColor: '#3b82f6', cursor: 'pointer' } }) }), _jsx("td", { style: {
                            padding: '10px 12px',
                            borderBottom: '1px solid #1e293b11',
                            color: '#475569',
                            fontFamily: 'monospace',
                            fontSize: 11,
                        }, children: row.id.split('-')[1] }), _jsx("td", { style: {
                            padding: '10px 12px',
                            borderBottom: '1px solid #1e293b11',
                            fontWeight: 500,
                        }, children: _jsx(HighlightText, { text: row.name, query: search }) }), _jsx("td", { style: {
                            padding: '10px 12px',
                            borderBottom: '1px solid #1e293b11',
                            color: '#94a3b8',
                        }, children: _jsx(HighlightText, { text: row.email, query: search }) }), _jsx("td", { style: { padding: '10px 12px', borderBottom: '1px solid #1e293b11' }, children: _jsx(HighlightText, { text: row.role, query: search }) }), _jsx("td", { style: { padding: '10px 12px', borderBottom: '1px solid #1e293b11' }, children: _jsx(StatusBadge, { status: row.status }) }), _jsx("td", { style: {
                            padding: '10px 12px',
                            borderBottom: '1px solid #1e293b11',
                            fontFamily: 'monospace',
                            fontSize: 12,
                            color: '#94a3b8',
                        }, children: row.created }), _jsxs("td", { style: {
                            padding: '10px 12px',
                            borderBottom: '1px solid #1e293b11',
                            fontFamily: 'monospace',
                            fontSize: 12,
                            color: row.revenue > 500 ? '#4ade80' : '#94a3b8',
                            fontWeight: row.revenue > 500 ? 600 : 400,
                        }, children: ["$", row.revenue.toLocaleString()] }), _jsx("td", { style: { padding: '10px 12px', borderBottom: '1px solid #1e293b11' }, children: _jsx("button", { onClick: () => emit(RowExpanded, row.id), style: {
                                padding: '4px 8px',
                                borderRadius: 4,
                                border: '1px solid #334155',
                                background: isExpanded ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: isExpanded ? '#60a5fa' : '#64748b',
                                fontSize: 11,
                                cursor: 'pointer',
                            }, children: isExpanded ? 'Close' : 'View' }) })] }), isExpanded && _jsx(ExpandedDetail, { row: row })] }));
}
// ---------------------------------------------------------------------------
// Page button
// ---------------------------------------------------------------------------
function PageButton({ label, active, disabled, onClick, }) {
    return (_jsx("button", { onClick: onClick, disabled: disabled, style: {
            padding: '6px 10px',
            borderRadius: 6,
            border: active ? '1px solid #3b82f6' : '1px solid #1e293b',
            background: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            color: disabled ? '#334155' : active ? '#3b82f6' : '#94a3b8',
            fontSize: 12,
            fontWeight: active ? 700 : 400,
            cursor: disabled ? 'default' : 'pointer',
            minWidth: 32,
        }, children: label }));
}
// ---------------------------------------------------------------------------
// Page number calculation
// ---------------------------------------------------------------------------
function getPageNumbers(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = [1];
    if (current > 3)
        pages.push(-1); // ellipsis
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++)
        pages.push(i);
    if (current < total - 2)
        pages.push(-1); // ellipsis
    pages.push(total);
    return pages;
}
