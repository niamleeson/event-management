import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useCallback } from 'react';
import { useSignal, useEmit } from '@pulse/react';
import { document as docSignal, cursors, activeUsers, editHistory, hasConflict, LocalEdit, CursorMoved, cursorSpringTargets, allUsers, } from './engine';
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
    container: {
        display: 'flex',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#f5f5f5',
    },
    mainPanel: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        background: '#1a1a2e',
        color: '#fff',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 700,
    },
    presenceRow: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
    },
    avatar: (color, isOnline) => ({
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        position: 'relative',
        border: `2px solid ${isOnline ? '#4caf50' : '#666'}`,
        opacity: isOnline ? 1 : 0.5,
    }),
    onlineDot: {
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: '#4caf50',
        border: '2px solid #1a1a2e',
    },
    conflictBanner: {
        background: '#ff9800',
        color: '#fff',
        padding: '6px 20px',
        fontSize: 13,
        fontWeight: 600,
        textAlign: 'center',
        animation: 'conflictPulse 1s ease-in-out',
    },
    editorArea: {
        flex: 1,
        position: 'relative',
        overflow: 'auto',
        padding: 20,
    },
    textarea: {
        width: '100%',
        height: '100%',
        padding: 16,
        fontSize: 15,
        lineHeight: 1.6,
        fontFamily: '"SF Mono", "Fira Code", Consolas, monospace',
        border: '1px solid #ddd',
        borderRadius: 8,
        resize: 'none',
        outline: 'none',
        background: '#fff',
        boxSizing: 'border-box',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
    cursorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
    },
    remoteCursor: (color, top, left) => ({
        position: 'absolute',
        top,
        left,
        width: 2,
        height: 20,
        background: color,
        transition: 'top 0.3s ease-out, left 0.3s ease-out',
        zIndex: 10,
    }),
    cursorLabel: (color) => ({
        position: 'absolute',
        top: -18,
        left: -2,
        background: color,
        color: '#fff',
        fontSize: 10,
        fontWeight: 600,
        padding: '1px 6px',
        borderRadius: '3px 3px 3px 0',
        whiteSpace: 'nowrap',
    }),
    sidebar: {
        width: 280,
        background: '#fff',
        borderLeft: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    sidebarHeader: {
        padding: '14px 16px',
        fontSize: 13,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#888',
        borderBottom: '1px solid #eee',
    },
    historyList: {
        flex: 1,
        overflowY: 'auto',
        padding: 0,
    },
    historyItem: {
        padding: '10px 16px',
        borderBottom: '1px solid #f0f0f0',
        fontSize: 13,
    },
    historyUser: (color) => ({
        fontWeight: 600,
        color,
        marginRight: 4,
    }),
    historyAction: {
        color: '#666',
    },
    historyText: {
        fontFamily: 'monospace',
        background: '#f5f5f5',
        padding: '1px 4px',
        borderRadius: 3,
        fontSize: 12,
        color: '#333',
    },
    historyTime: {
        fontSize: 11,
        color: '#bbb',
        marginTop: 2,
    },
    docStats: {
        padding: '8px 16px',
        borderTop: '1px solid #eee',
        fontSize: 12,
        color: '#999',
        background: '#fafafa',
    },
};
const globalStyle = `
body { margin: 0; }
@keyframes conflictPulse {
  0% { opacity: 0; transform: translateY(-100%); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
`;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getUserColor(userId) {
    return allUsers.find(u => u.id === userId)?.color ?? '#999';
}
function timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5)
        return 'just now';
    if (diff < 60)
        return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
}
// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function PresenceIndicators() {
    const users = useSignal(activeUsers);
    return (_jsx("div", { style: styles.presenceRow, children: users.map(user => (_jsxs("div", { style: styles.avatar(user.color, true), title: user.name, children: [user.avatar, _jsx("div", { style: styles.onlineDot })] }, user.id))) }));
}
function ConflictBanner() {
    const conflict = useSignal(hasConflict);
    if (!conflict)
        return null;
    return (_jsx("div", { style: styles.conflictBanner, children: "Edit conflict detected near your cursor -- auto-resolving..." }));
}
function Editor() {
    const emit = useEmit();
    const doc = useSignal(docSignal);
    const cursorMap = useSignal(cursors);
    const textareaRef = useRef(null);
    const handleInput = useCallback((e) => {
        const textarea = e.currentTarget;
        const newValue = textarea.value;
        const cursorPos = textarea.selectionStart;
        const oldValue = doc;
        if (newValue.length > oldValue.length) {
            // Insert
            const insertedLen = newValue.length - oldValue.length;
            const insertPos = cursorPos - insertedLen;
            const insertedText = newValue.slice(insertPos, cursorPos);
            emit(LocalEdit, { pos: insertPos, text: insertedText, type: 'insert' });
        }
        else if (newValue.length < oldValue.length) {
            // Delete
            const deletedLen = oldValue.length - newValue.length;
            const deletePos = cursorPos + deletedLen;
            const deletedText = oldValue.slice(cursorPos, deletePos);
            emit(LocalEdit, { pos: deletePos, text: deletedText, type: 'delete' });
        }
    }, [doc, emit]);
    const handleSelect = useCallback(() => {
        if (textareaRef.current) {
            const pos = textareaRef.current.selectionStart;
            emit(CursorMoved, { user: 'local', pos });
            const target = cursorSpringTargets.get('local');
            if (target)
                target._set(pos);
        }
    }, [emit]);
    // Calculate approximate cursor positions for remote users
    const remoteCursors = allUsers
        .filter(u => u.id !== 'local')
        .map(user => {
        const pos = cursorMap.get(user.id) ?? 0;
        // Approximate position: ~8px per char, ~20px per line
        const textBefore = doc.slice(0, pos);
        const lines = textBefore.split('\n');
        const lineNum = lines.length - 1;
        const colNum = lines[lines.length - 1]?.length ?? 0;
        const top = 20 + lineNum * 24 + 16;
        const left = 20 + colNum * 8.4 + 16;
        return { user, top, left };
    });
    return (_jsxs("div", { style: styles.editorArea, children: [_jsx("textarea", { ref: textareaRef, style: styles.textarea, value: doc, onChange: handleInput, onSelect: handleSelect, spellCheck: false }), _jsx("div", { style: styles.cursorOverlay, children: remoteCursors.map(({ user, top, left }) => (_jsx("div", { style: styles.remoteCursor(user.color, top, left), children: _jsx("div", { style: styles.cursorLabel(user.color), children: user.name }) }, user.id))) })] }));
}
function HistoryPanel() {
    const history = useSignal(editHistory);
    const doc = useSignal(docSignal);
    return (_jsxs("div", { style: styles.sidebar, children: [_jsx("div", { style: styles.sidebarHeader, children: "Edit History" }), _jsx("div", { style: styles.historyList, children: history.length === 0 ? (_jsx("div", { style: { padding: 16, color: '#bbb', fontSize: 13 }, children: "No edits yet. Start typing!" })) : (history.map((entry) => (_jsxs("div", { style: styles.historyItem, children: [_jsxs("div", { children: [_jsx("span", { style: styles.historyUser(getUserColor(allUsers.find(u => u.name === entry.user)?.id ?? 'local')), children: entry.user }), _jsx("span", { style: styles.historyAction, children: entry.type === 'insert' ? ' inserted ' : ' deleted ' }), _jsx("span", { style: styles.historyText, children: entry.text.replace(/\n/g, '\\n') })] }), _jsxs("div", { style: styles.historyTime, children: ["at position ", entry.pos, " - ", timeAgo(entry.timestamp)] })] }, entry.id)))) }), _jsxs("div", { style: styles.docStats, children: [doc.length, " characters | ", doc.split('\n').length, " lines"] })] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: globalStyle }), _jsxs("div", { style: styles.container, children: [_jsxs("div", { style: styles.mainPanel, children: [_jsxs("div", { style: styles.header, children: [_jsx("div", { style: styles.headerTitle, children: "Pulse Collaborative Editor" }), _jsx(PresenceIndicators, {})] }), _jsx(ConflictBanner, {}), _jsx(Editor, {})] }), _jsx(HistoryPanel, {})] })] }));
}
