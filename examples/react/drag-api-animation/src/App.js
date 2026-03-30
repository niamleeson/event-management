import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useCallback } from 'react';
import { useSignal, useSpring, useEmit } from '@pulse/react';
import { cards, dragState, cardStatuses, dragSpringX, dragSpringY, DragStart, DragMove, DragEnd, CardMoved, UndoRequested, } from './engine';
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COLUMNS = [
    { id: 'todo', title: 'Todo', color: '#4361ee' },
    { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
    { id: 'done', title: 'Done', color: '#10b981' },
];
const PRIORITY_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
};
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
    container: {
        minHeight: '100vh',
        background: '#0f172a',
        padding: '32px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
        textAlign: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 36,
        fontWeight: 800,
        color: '#f1f5f9',
        margin: 0,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 6,
    },
    board: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
        maxWidth: 1100,
        margin: '0 auto',
    },
    column: (color) => ({
        background: '#1e293b',
        borderRadius: 16,
        padding: 16,
        minHeight: 400,
        borderTop: `3px solid ${color}`,
    }),
    columnHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        padding: '0 4px',
    },
    columnTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: '#e2e8f0',
    },
    columnCount: (color) => ({
        fontSize: 13,
        fontWeight: 600,
        color: color,
        background: `${color}22`,
        padding: '2px 10px',
        borderRadius: 12,
    }),
    card: (status, isDragging) => {
        let borderColor = '#334155';
        let bg = '#0f172a';
        if (status === 'saving') {
            borderColor = '#f59e0b';
        }
        else if (status === 'saved') {
            borderColor = '#10b981';
            bg = '#10b98108';
        }
        else if (status === 'error') {
            borderColor = '#ef4444';
            bg = '#ef444408';
        }
        return {
            background: bg,
            border: `2px solid ${borderColor}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 10,
            cursor: isDragging ? 'grabbing' : 'grab',
            opacity: isDragging ? 0.4 : 1,
            transition: 'border-color 0.3s, background 0.3s, opacity 0.15s',
            userSelect: 'none',
        };
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 600,
        color: '#e2e8f0',
        margin: 0,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 13,
        color: '#94a3b8',
        margin: 0,
        marginBottom: 10,
    },
    cardFooter: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priorityBadge: (priority) => ({
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        color: PRIORITY_COLORS[priority] ?? '#94a3b8',
        background: `${PRIORITY_COLORS[priority] ?? '#94a3b8'}22`,
        padding: '2px 8px',
        borderRadius: 8,
    }),
    statusBadge: (status) => {
        const map = {
            idle: { color: '#64748b', label: '' },
            saving: { color: '#f59e0b', label: 'Saving...' },
            saved: { color: '#10b981', label: 'Saved' },
            error: { color: '#ef4444', label: 'Error - retrying' },
            settled: { color: '#64748b', label: '' },
        };
        const info = map[status];
        if (!info.label)
            return { display: 'none' };
        return {
            fontSize: 11,
            fontWeight: 600,
            color: info.color,
        };
    },
    undoBtn: {
        fontSize: 12,
        color: '#94a3b8',
        background: 'none',
        border: '1px solid #334155',
        borderRadius: 6,
        padding: '2px 8px',
        cursor: 'pointer',
        marginLeft: 8,
    },
    ghostCard: {
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 1000,
        width: 300,
        background: '#1e293b',
        border: '2px solid #4361ee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    },
    dropZone: (isOver) => ({
        minHeight: 60,
        border: `2px dashed ${isOver ? '#4361ee' : 'transparent'}`,
        borderRadius: 8,
        transition: 'border-color 0.2s, background 0.2s',
        background: isOver ? '#4361ee11' : 'transparent',
    }),
    devtoolsHint: {
        textAlign: 'center',
        marginTop: 32,
        padding: 16,
        background: '#1e293b',
        borderRadius: 12,
        maxWidth: 500,
        margin: '32px auto 0',
    },
    devtoolsText: {
        color: '#94a3b8',
        fontSize: 13,
    },
    devtoolsCode: {
        color: '#4361ee',
        fontFamily: 'monospace',
        fontSize: 12,
    },
};
// ---------------------------------------------------------------------------
// CardComponent
// ---------------------------------------------------------------------------
function KanbanCardComponent({ card }) {
    const emit = useEmit();
    const drag = useSignal(dragState);
    const statuses = useSignal(cardStatuses);
    const cardRef = useRef(null);
    const status = statuses[card.id] ?? 'idle';
    const isDragging = drag?.cardId === card.id;
    const statusLabels = {
        idle: '',
        saving: 'Saving...',
        saved: 'Saved',
        error: 'Error - retrying',
        settled: '',
    };
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect)
            return;
        emit(DragStart, {
            cardId: card.id,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
        });
    }, [emit, card.id]);
    return (_jsxs("div", { ref: cardRef, style: {
            ...styles.card(status, isDragging),
            animation: status === 'error'
                ? 'shake 0.5s ease-in-out'
                : status === 'saved'
                    ? 'flashGreen 0.6s ease-out'
                    : undefined,
        }, onMouseDown: handleMouseDown, children: [_jsx("p", { style: styles.cardTitle, children: card.title }), _jsx("p", { style: styles.cardDesc, children: card.description }), _jsxs("div", { style: styles.cardFooter, children: [_jsx("span", { style: styles.priorityBadge(card.priority), children: card.priority }), _jsxs("span", { children: [_jsx("span", { style: styles.statusBadge(status), children: statusLabels[status] }), (status === 'saved' || status === 'error') && (_jsx("button", { style: styles.undoBtn, onClick: (e) => {
                                    e.stopPropagation();
                                    emit(UndoRequested, card.id);
                                }, children: "Undo" }))] })] })] }));
}
// ---------------------------------------------------------------------------
// Ghost card (follows mouse during drag via spring)
// ---------------------------------------------------------------------------
function GhostCard() {
    const drag = useSignal(dragState);
    const allCards = useSignal(cards);
    const springX = useSpring(dragSpringX);
    const springY = useSpring(dragSpringY);
    if (!drag)
        return null;
    const card = allCards.find((c) => c.id === drag.cardId);
    if (!card)
        return null;
    return (_jsxs("div", { style: {
            ...styles.ghostCard,
            left: springX - drag.offsetX,
            top: springY - drag.offsetY,
        }, children: [_jsx("p", { style: styles.cardTitle, children: card.title }), _jsx("p", { style: styles.cardDesc, children: card.description })] }));
}
// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------
function Column({ id, title, color, }) {
    const allCards = useSignal(cards);
    const drag = useSignal(dragState);
    const emit = useEmit();
    const columnRef = useRef(null);
    const columnCards = allCards.filter((c) => c.column === id);
    const isDragging = drag !== null;
    const isOverRef = useRef(false);
    return (_jsxs("div", { style: styles.column(color), ref: columnRef, children: [_jsxs("div", { style: styles.columnHeader, children: [_jsx("span", { style: styles.columnTitle, children: title }), _jsx("span", { style: styles.columnCount(color), children: columnCards.length })] }), columnCards.map((card) => (_jsx(KanbanCardComponent, { card: card }, card.id))), isDragging && (_jsx("div", { style: styles.dropZone(false), onMouseEnter: (e) => {
                    e.currentTarget.style.borderColor = '#4361ee';
                    e.currentTarget.style.background = '#4361ee11';
                }, onMouseLeave: (e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.background = 'transparent';
                }, onMouseUp: () => {
                    if (drag) {
                        const card = allCards.find((c) => c.id === drag.cardId);
                        if (card && card.column !== id) {
                            emit(CardMoved, {
                                cardId: drag.cardId,
                                fromColumn: card.column,
                                toColumn: id,
                            });
                        }
                        emit(DragEnd, undefined);
                    }
                }, children: _jsx("div", { style: {
                        padding: 20,
                        textAlign: 'center',
                        color: '#475569',
                        fontSize: 13,
                    }, children: "Drop here" }) }))] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const emit = useEmit();
    const drag = useSignal(dragState);
    // Global mouse move/up handlers for drag
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (drag) {
                emit(DragMove, { x: e.clientX, y: e.clientY });
            }
        };
        const handleMouseUp = () => {
            if (drag) {
                emit(DragEnd, undefined);
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [drag, emit]);
    return (_jsxs("div", { style: styles.container, children: [_jsx("style", { children: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes flashGreen {
          0% { background: #10b98122; }
          100% { background: #0f172a; }
        }
      ` }), _jsxs("div", { style: styles.header, children: [_jsx("h1", { style: styles.title, children: "Pulse Kanban" }), _jsx("p", { style: styles.subtitle, children: "Drag cards between columns. Spring physics follow your mouse. Saves auto-retry on failure." })] }), _jsx("div", { style: styles.board, children: COLUMNS.map((col) => (_jsx(Column, { id: col.id, title: col.title, color: col.color }, col.id))) }), _jsx(GhostCard, {}), _jsxs("div", { style: styles.devtoolsHint, children: [_jsxs("p", { style: styles.devtoolsText, children: ["This example integrates with", ' ', _jsx("code", { style: styles.devtoolsCode, children: "@pulse/devtools" }), ". Import and connect to visualize event flow, signals, and the DAG in real-time."] }), _jsx("p", { style: { ...styles.devtoolsText, marginTop: 8 }, children: _jsx("code", { style: styles.devtoolsCode, children: `import { connectDevtools } from '@pulse/devtools'` }) })] })] }));
}
