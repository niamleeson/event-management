import { createEngine, createSignal } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export const ToggleFolder = engine.event('ToggleFolder');
export const SelectItem = engine.event('SelectItem');
export const CreateFile = engine.event('CreateFile');
export const CreateFolder = engine.event('CreateFolder');
export const DeleteItem = engine.event('DeleteItem');
export const RenameItem = engine.event('RenameItem');
export const DragItem = engine.event('DragItem');
export const SearchChanged = engine.event('SearchChanged');
export const ContextMenuOpen = engine.event('ContextMenuOpen');
export const ContextMenuClose = engine.event('ContextMenuClose');
export const ClipboardCopy = engine.event('ClipboardCopy');
export const ClipboardPaste = engine.event('ClipboardPaste');
export const KeyNav = engine.event('KeyNav');
// ---------------------------------------------------------------------------
// Initial tree
// ---------------------------------------------------------------------------
const INITIAL_TREE = [
    {
        id: 'root',
        name: 'my-project',
        type: 'folder',
        parentId: null,
        children: [
            {
                id: 'src',
                name: 'src',
                type: 'folder',
                parentId: 'root',
                children: [
                    {
                        id: 'src-components',
                        name: 'components',
                        type: 'folder',
                        parentId: 'src',
                        children: [
                            { id: 'header-tsx', name: 'Header.tsx', type: 'file', parentId: 'src-components' },
                            { id: 'footer-tsx', name: 'Footer.tsx', type: 'file', parentId: 'src-components' },
                            { id: 'sidebar-tsx', name: 'Sidebar.tsx', type: 'file', parentId: 'src-components' },
                            { id: 'button-tsx', name: 'Button.tsx', type: 'file', parentId: 'src-components' },
                        ],
                    },
                    {
                        id: 'src-hooks',
                        name: 'hooks',
                        type: 'folder',
                        parentId: 'src',
                        children: [
                            { id: 'use-auth-ts', name: 'useAuth.ts', type: 'file', parentId: 'src-hooks' },
                            { id: 'use-theme-ts', name: 'useTheme.ts', type: 'file', parentId: 'src-hooks' },
                        ],
                    },
                    {
                        id: 'src-utils',
                        name: 'utils',
                        type: 'folder',
                        parentId: 'src',
                        children: [
                            { id: 'helpers-ts', name: 'helpers.ts', type: 'file', parentId: 'src-utils' },
                            { id: 'api-ts', name: 'api.ts', type: 'file', parentId: 'src-utils' },
                        ],
                    },
                    { id: 'app-tsx', name: 'App.tsx', type: 'file', parentId: 'src' },
                    { id: 'main-tsx', name: 'main.tsx', type: 'file', parentId: 'src' },
                    { id: 'styles-css', name: 'styles.css', type: 'file', parentId: 'src' },
                ],
            },
            {
                id: 'public',
                name: 'public',
                type: 'folder',
                parentId: 'root',
                children: [
                    { id: 'index-html', name: 'index.html', type: 'file', parentId: 'public' },
                    { id: 'favicon-ico', name: 'favicon.ico', type: 'file', parentId: 'public' },
                ],
            },
            {
                id: 'tests',
                name: 'tests',
                type: 'folder',
                parentId: 'root',
                children: [
                    { id: 'app-test-tsx', name: 'App.test.tsx', type: 'file', parentId: 'tests' },
                    { id: 'utils-test-ts', name: 'utils.test.ts', type: 'file', parentId: 'tests' },
                ],
            },
            { id: 'pkg-json', name: 'package.json', type: 'file', parentId: 'root' },
            { id: 'tsconfig-json', name: 'tsconfig.json', type: 'file', parentId: 'root' },
            { id: 'readme-md', name: 'README.md', type: 'file', parentId: 'root' },
            { id: 'gitignore', name: '.gitignore', type: 'file', parentId: 'root' },
            { id: 'env-local', name: '.env.local', type: 'file', parentId: 'root' },
        ],
    },
];
// ---------------------------------------------------------------------------
// Tree helpers
// ---------------------------------------------------------------------------
let nodeCounter = 100;
function deepCloneTree(nodes) {
    return nodes.map((n) => ({
        ...n,
        children: n.children ? deepCloneTree(n.children) : undefined,
    }));
}
function findNode(nodes, id) {
    for (const n of nodes) {
        if (n.id === id)
            return n;
        if (n.children) {
            const found = findNode(n.children, id);
            if (found)
                return found;
        }
    }
    return null;
}
function findParentOf(nodes, id) {
    for (const n of nodes) {
        if (n.children) {
            for (const child of n.children) {
                if (child.id === id)
                    return n;
            }
            const found = findParentOf(n.children, id);
            if (found)
                return found;
        }
    }
    return null;
}
function removeNode(nodes, id) {
    return nodes
        .filter((n) => n.id !== id)
        .map((n) => ({
        ...n,
        children: n.children ? removeNode(n.children, id) : undefined,
    }));
}
function addChild(nodes, parentId, child) {
    return nodes.map((n) => {
        if (n.id === parentId && n.type === 'folder') {
            return { ...n, children: [...(n.children || []), child] };
        }
        if (n.children) {
            return { ...n, children: addChild(n.children, parentId, child) };
        }
        return n;
    });
}
function renameNode(nodes, id, name) {
    return nodes.map((n) => {
        if (n.id === id)
            return { ...n, name };
        if (n.children)
            return { ...n, children: renameNode(n.children, id, name) };
        return n;
    });
}
function flattenTree(nodes, expanded) {
    const result = [];
    function walk(items) {
        for (const item of items) {
            result.push(item);
            if (item.type === 'folder' && item.children && expanded.has(item.id)) {
                walk(item.children);
            }
        }
    }
    walk(nodes);
    return result;
}
function getPath(nodes, id) {
    function walk(items, path) {
        for (const item of items) {
            const currentPath = [...path, item.name];
            if (item.id === id)
                return currentPath;
            if (item.children) {
                const found = walk(item.children, currentPath);
                if (found)
                    return found;
            }
        }
        return null;
    }
    return walk(nodes, []) || [];
}
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
export const tree = createSignal(INITIAL_TREE);
engine['_signals'].push(tree);
export const selectedId = engine.signal(SelectItem, null, (_prev, id) => id);
export const expandedIds = createSignal(new Set(['root', 'src']));
engine['_signals'].push(expandedIds);
export const searchFilter = engine.signal(SearchChanged, '', (_prev, value) => value);
export const clipboard = createSignal(null);
engine['_signals'].push(clipboard);
export const contextMenu = createSignal({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
});
engine['_signals'].push(contextMenu);
// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------
engine.on(ToggleFolder, (id) => {
    const current = new Set(expandedIds.value);
    if (current.has(id)) {
        current.delete(id);
    }
    else {
        current.add(id);
    }
    expandedIds._set(current);
});
engine.on(CreateFile, ({ parentId, name }) => {
    const id = `file-${++nodeCounter}`;
    const newNode = { id, name, type: 'file', parentId };
    tree._set(addChild(deepCloneTree(tree.value), parentId, newNode));
    // Auto-expand parent
    const exp = new Set(expandedIds.value);
    exp.add(parentId);
    expandedIds._set(exp);
});
engine.on(CreateFolder, ({ parentId, name }) => {
    const id = `folder-${++nodeCounter}`;
    const newNode = { id, name, type: 'folder', parentId, children: [] };
    tree._set(addChild(deepCloneTree(tree.value), parentId, newNode));
    const exp = new Set(expandedIds.value);
    exp.add(parentId);
    expandedIds._set(exp);
});
engine.on(DeleteItem, (id) => {
    if (id === 'root')
        return;
    tree._set(removeNode(deepCloneTree(tree.value), id));
    if (selectedId.value === id) {
        engine.emit(SelectItem, '');
    }
});
engine.on(RenameItem, ({ id, name }) => {
    tree._set(renameNode(deepCloneTree(tree.value), id, name));
});
engine.on(DragItem, ({ id, targetId }) => {
    if (id === targetId)
        return;
    const current = deepCloneTree(tree.value);
    const node = findNode(current, id);
    if (!node)
        return;
    const target = findNode(current, targetId);
    if (!target || target.type !== 'folder')
        return;
    const without = removeNode(current, id);
    tree._set(addChild(without, targetId, { ...node, parentId: targetId }));
});
engine.on(ContextMenuOpen, ({ x, y, targetId }) => {
    contextMenu._set({ visible: true, x, y, targetId });
});
engine.on(ContextMenuClose, () => {
    contextMenu._set({ visible: false, x: 0, y: 0, targetId: null });
});
engine.on(ClipboardCopy, (id) => {
    clipboard._set(id);
});
engine.on(ClipboardPaste, (parentId) => {
    const copyId = clipboard.value;
    if (!copyId)
        return;
    const current = deepCloneTree(tree.value);
    const node = findNode(current, copyId);
    if (!node)
        return;
    const newId = `copy-${++nodeCounter}`;
    const copy = { ...node, id: newId, parentId, name: `${node.name} (copy)` };
    tree._set(addChild(current, parentId, copy));
});
// Export helpers for components
export { flattenTree, getPath };
engine.startFrameLoop();
