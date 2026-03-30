import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useSignal, useEmit } from '@pulse/react';
import { useCallback, useRef, useEffect } from 'react';
import { tree, selectedId, expandedIds, searchFilter, contextMenu, clipboard, ToggleFolder, SelectItem, CreateFile, CreateFolder, DeleteItem, RenameItem, SearchChanged, ContextMenuOpen, ContextMenuClose, ClipboardCopy, ClipboardPaste, flattenTree, getPath, } from './engine';
// ---------------------------------------------------------------------------
// File icons by extension
// ---------------------------------------------------------------------------
function getFileIcon(name) {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const map = {
        ts: { icon: 'TS', color: '#3178c6' },
        tsx: { icon: 'TX', color: '#3178c6' },
        js: { icon: 'JS', color: '#f7df1e' },
        jsx: { icon: 'JX', color: '#f7df1e' },
        json: { icon: '{}', color: '#5b9a4b' },
        css: { icon: '#', color: '#264de4' },
        html: { icon: '<>', color: '#e34c26' },
        md: { icon: 'M', color: '#755838' },
        ico: { icon: '\u25CF', color: '#8b8b8b' },
        env: { icon: '\u26A1', color: '#ecd53f' },
        local: { icon: '\u26A1', color: '#ecd53f' },
        gitignore: { icon: 'G', color: '#f05032' },
        test: { icon: '\u2713', color: '#15c213' },
    };
    // Check compound extensions
    if (name.includes('.test.'))
        return map.test;
    if (name.startsWith('.env'))
        return map.env;
    if (name.startsWith('.git'))
        return map.gitignore;
    return map[ext] || { icon: '\u25A1', color: '#8b8b8b' };
}
// ---------------------------------------------------------------------------
// TreeItem component
// ---------------------------------------------------------------------------
function TreeItem({ node, depth, isSelected, isExpanded, searchTerm, }) {
    const emit = useEmit();
    const isFolder = node.type === 'folder';
    const fileIcon = !isFolder ? getFileIcon(node.name) : null;
    const handleClick = useCallback(() => {
        emit(SelectItem, node.id);
        if (isFolder) {
            emit(ToggleFolder, node.id);
        }
    }, [emit, node.id, isFolder]);
    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        emit(ContextMenuOpen, { x: e.clientX, y: e.clientY, targetId: node.id });
    }, [emit, node.id]);
    // Highlight search match
    function renderName() {
        if (!searchTerm)
            return node.name;
        const idx = node.name.toLowerCase().indexOf(searchTerm.toLowerCase());
        if (idx === -1)
            return node.name;
        return (_jsxs(_Fragment, { children: [node.name.slice(0, idx), _jsx("span", { style: { background: '#fbbf2440', color: '#fbbf24', borderRadius: 2, padding: '0 1px' }, children: node.name.slice(idx, idx + searchTerm.length) }), node.name.slice(idx + searchTerm.length)] }));
    }
    return (_jsxs("div", { onClick: handleClick, onContextMenu: handleContextMenu, style: {
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px',
            paddingLeft: 8 + depth * 18,
            cursor: 'pointer',
            background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
            color: isSelected ? '#e2e8f0' : '#94a3b8',
            fontSize: 13,
            userSelect: 'none',
            transition: 'background 0.15s, padding-left 0.2s',
            borderRadius: 4,
            margin: '1px 4px',
        }, onMouseEnter: (e) => {
            if (!isSelected)
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }, onMouseLeave: (e) => {
            if (!isSelected)
                e.currentTarget.style.background = 'transparent';
        }, children: [isFolder ? (_jsx("span", { style: {
                    display: 'inline-block',
                    width: 16,
                    textAlign: 'center',
                    marginRight: 4,
                    fontSize: 10,
                    color: '#64748b',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                }, children: "\\u25B6" })) : (_jsx("span", { style: { width: 16, marginRight: 4 } })), isFolder ? (_jsx("span", { style: { marginRight: 6, fontSize: 14 }, children: isExpanded ? '\uD83D\uDCC2' : '\uD83D\uDCC1' })) : (_jsx("span", { style: {
                    marginRight: 6,
                    fontSize: 9,
                    fontWeight: 700,
                    color: fileIcon.color,
                    background: `${fileIcon.color}18`,
                    borderRadius: 3,
                    padding: '1px 3px',
                    fontFamily: 'monospace',
                }, children: fileIcon.icon })), _jsx("span", { style: { fontFamily: 'monospace', fontSize: 13 }, children: renderName() })] }));
}
// ---------------------------------------------------------------------------
// ContextMenu
// ---------------------------------------------------------------------------
function ContextMenu({ state }) {
    const emit = useEmit();
    const menuRef = useRef(null);
    useEffect(() => {
        if (!state.visible)
            return;
        const handler = () => emit(ContextMenuClose, undefined);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [state.visible, emit]);
    if (!state.visible || !state.targetId)
        return null;
    const items = [
        { label: 'New File', action: () => {
                const name = prompt('File name:');
                if (name)
                    emit(CreateFile, { parentId: state.targetId, name });
            } },
        { label: 'New Folder', action: () => {
                const name = prompt('Folder name:');
                if (name)
                    emit(CreateFolder, { parentId: state.targetId, name });
            } },
        { label: 'Rename', action: () => {
                const name = prompt('New name:');
                if (name)
                    emit(RenameItem, { id: state.targetId, name });
            } },
        { label: 'Delete', action: () => emit(DeleteItem, state.targetId) },
        { label: 'Copy', action: () => emit(ClipboardCopy, state.targetId) },
        { label: 'Paste', action: () => emit(ClipboardPaste, state.targetId) },
    ];
    return (_jsx("div", { ref: menuRef, style: {
            position: 'fixed',
            left: state.x,
            top: state.y,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: '4px 0',
            minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 9999,
        }, children: items.map((item) => (_jsx("div", { onClick: (e) => {
                e.stopPropagation();
                item.action();
                emit(ContextMenuClose, undefined);
            }, style: {
                padding: '8px 16px',
                fontSize: 13,
                color: '#e2e8f0',
                cursor: 'pointer',
            }, onMouseEnter: (e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
            }, onMouseLeave: (e) => {
                e.currentTarget.style.background = 'transparent';
            }, children: item.label }, item.label))) }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const emit = useEmit();
    const treeData = useSignal(tree);
    const selected = useSignal(selectedId);
    const expanded = useSignal(expandedIds);
    const search = useSignal(searchFilter);
    const ctxMenu = useSignal(contextMenu);
    const clip = useSignal(clipboard);
    const flatItems = flattenTree(treeData, expanded);
    // Filter by search
    const visibleItems = search
        ? flatItems.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
        : flatItems;
    // Compute breadcrumb
    const breadcrumb = selected ? getPath(treeData, selected) : [];
    // Keyboard navigation
    const containerRef = useRef(null);
    const handleKeyDown = useCallback((e) => {
        const currentIndex = visibleItems.findIndex((n) => n.id === selected);
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = Math.min(currentIndex + 1, visibleItems.length - 1);
            emit(SelectItem, visibleItems[next].id);
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = Math.max(currentIndex - 1, 0);
            emit(SelectItem, visibleItems[prev].id);
        }
        else if (e.key === 'ArrowRight' && selected) {
            const node = visibleItems.find((n) => n.id === selected);
            if (node?.type === 'folder' && !expanded.has(node.id)) {
                emit(ToggleFolder, node.id);
            }
        }
        else if (e.key === 'ArrowLeft' && selected) {
            const node = visibleItems.find((n) => n.id === selected);
            if (node?.type === 'folder' && expanded.has(node.id)) {
                emit(ToggleFolder, node.id);
            }
        }
        else if (e.key === 'Enter' && selected) {
            const node = visibleItems.find((n) => n.id === selected);
            if (node?.type === 'folder') {
                emit(ToggleFolder, node.id);
            }
        }
        else if (e.key === 'Delete' && selected) {
            emit(DeleteItem, selected);
        }
    }, [emit, selected, expanded, visibleItems]);
    // Compute depth for each flat item
    function getDepth(node) {
        let d = 0;
        let current = node;
        const treeFlat = flatItems;
        while (current.parentId) {
            d++;
            const parent = treeFlat.find((n) => n.id === current.parentId);
            if (!parent)
                break;
            current = parent;
        }
        return d;
    }
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            display: 'flex',
            flexDirection: 'column',
        }, children: [_jsxs("div", { style: {
                    padding: '20px 24px',
                    borderBottom: '1px solid #1e293b',
                }, children: [_jsx("h1", { style: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0, marginBottom: 12 }, children: "File Explorer" }), _jsx("input", { type: "text", placeholder: "Search files...", value: search, onChange: (e) => emit(SearchChanged, e.target.value), style: {
                            width: '100%',
                            maxWidth: 400,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #334155',
                            background: '#0f172a',
                            color: '#e2e8f0',
                            fontSize: 13,
                            outline: 'none',
                        } })] }), breadcrumb.length > 0 && (_jsx("div", { style: {
                    padding: '8px 24px',
                    fontSize: 12,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    borderBottom: '1px solid #1e293b22',
                }, children: breadcrumb.map((segment, i) => (_jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [i > 0 && _jsx("span", { style: { color: '#475569' }, children: "/" }), _jsx("span", { style: { color: i === breadcrumb.length - 1 ? '#e2e8f0' : '#64748b' }, children: segment })] }, i))) })), _jsxs("div", { ref: containerRef, tabIndex: 0, onKeyDown: handleKeyDown, style: {
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px 0',
                    outline: 'none',
                }, children: [visibleItems.map((node) => (_jsx(TreeItem, { node: node, depth: getDepth(node), isSelected: node.id === selected, isExpanded: expanded.has(node.id), searchTerm: search }, node.id))), visibleItems.length === 0 && (_jsxs("div", { style: { padding: 24, textAlign: 'center', color: '#475569', fontSize: 14 }, children: ["No files match \"", search, "\""] }))] }), _jsxs("div", { style: {
                    padding: '8px 24px',
                    borderTop: '1px solid #1e293b',
                    fontSize: 12,
                    color: '#475569',
                    display: 'flex',
                    justifyContent: 'space-between',
                }, children: [_jsxs("span", { children: [visibleItems.length, " items"] }), _jsxs("span", { children: [clip && 'Clipboard: copied', " | Arrow keys to navigate | Right-click for context menu"] })] }), _jsx(ContextMenu, { state: ctxMenu })] }));
}
