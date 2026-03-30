import { createEngine } from '@pulse/core';
export const engine = createEngine();
engine.startFrameLoop();
/* ------------------------------------------------------------------ */
/*  File tree data                                                    */
/* ------------------------------------------------------------------ */
export const FILE_TREE = {
    id: 'root', name: 'project', type: 'folder', children: [
        { id: 'src', name: 'src', type: 'folder', children: [
                { id: 'comp', name: 'components', type: 'folder', children: [
                        { id: 'app', name: 'App.vue', type: 'file', ext: 'vue' },
                        { id: 'header', name: 'Header.vue', type: 'file', ext: 'vue' },
                        { id: 'sidebar', name: 'Sidebar.vue', type: 'file', ext: 'vue' },
                        { id: 'footer', name: 'Footer.vue', type: 'file', ext: 'vue' },
                    ] },
                { id: 'utils', name: 'utils', type: 'folder', children: [
                        { id: 'helpers', name: 'helpers.ts', type: 'file', ext: 'ts' },
                        { id: 'api', name: 'api.ts', type: 'file', ext: 'ts' },
                        { id: 'constants', name: 'constants.ts', type: 'file', ext: 'ts' },
                    ] },
                { id: 'styles', name: 'styles', type: 'folder', children: [
                        { id: 'main-css', name: 'main.css', type: 'file', ext: 'css' },
                        { id: 'vars', name: 'variables.css', type: 'file', ext: 'css' },
                    ] },
                { id: 'main', name: 'main.ts', type: 'file', ext: 'ts' },
                { id: 'engine', name: 'engine.ts', type: 'file', ext: 'ts' },
            ] },
        { id: 'pub', name: 'public', type: 'folder', children: [
                { id: 'index', name: 'index.html', type: 'file', ext: 'html' },
                { id: 'favicon', name: 'favicon.ico', type: 'file', ext: 'ico' },
            ] },
        { id: 'pkg', name: 'package.json', type: 'file', ext: 'json' },
        { id: 'tsconfig', name: 'tsconfig.json', type: 'file', ext: 'json' },
        { id: 'readme', name: 'README.md', type: 'file', ext: 'md' },
        { id: 'gitignore', name: '.gitignore', type: 'file', ext: '' },
    ],
};
/* ------------------------------------------------------------------ */
/*  File type icons                                                   */
/* ------------------------------------------------------------------ */
export const FILE_ICONS = {
    ts: { icon: 'TS', color: '#3178c6' },
    vue: { icon: 'V', color: '#42b883' },
    css: { icon: '#', color: '#264de4' },
    html: { icon: '<>', color: '#e34c26' },
    json: { icon: '{}', color: '#f5a623' },
    md: { icon: 'M', color: '#888' },
    ico: { icon: '*', color: '#888' },
    '': { icon: '.', color: '#888' },
    folder: { icon: '\u{1F4C1}', color: '#fdcb6e' },
};
/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */
export const ToggleFolder = engine.event('ToggleFolder');
export const SelectFile = engine.event('SelectFile');
export const SearchChanged = engine.event('SearchChanged');
export const KeyNav = engine.event('KeyNav');
/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */
export const expandedFolders = engine.signal(ToggleFolder, new Set(['root', 'src']), (prev, id) => {
    const next = new Set(prev);
    if (next.has(id))
        next.delete(id);
    else
        next.add(id);
    return next;
});
export const selectedFile = engine.signal(SelectFile, '', (_prev, id) => id);
export const searchQuery = engine.signal(SearchChanged, '', (_prev, q) => q);
/* ------------------------------------------------------------------ */
/*  Expand/collapse tweens (pool)                                     */
/* ------------------------------------------------------------------ */
export const expandTweens = new Map();
const expandStarts = new Map();
function getAllFolderIds(node) {
    const ids = [];
    if (node.type === 'folder') {
        ids.push(node.id);
        node.children?.forEach(c => ids.push(...getAllFolderIds(c)));
    }
    return ids;
}
for (const folderId of getAllFolderIds(FILE_TREE)) {
    const start = engine.event(`Expand_${folderId}`);
    expandStarts.set(folderId, start);
    expandTweens.set(folderId, engine.tween({
        start,
        from: 0,
        to: 1,
        duration: 200,
        easing: (t) => 1 - Math.pow(1 - t, 3),
    }));
}
engine.on(ToggleFolder, (id) => {
    const start = expandStarts.get(id);
    if (start)
        engine.emit(start, undefined);
});
/* ------------------------------------------------------------------ */
/*  Keyboard navigation                                               */
/* ------------------------------------------------------------------ */
function flattenTree(node, expanded) {
    const result = [node.id];
    if (node.type === 'folder' && expanded.has(node.id) && node.children) {
        for (const child of node.children) {
            result.push(...flattenTree(child, expanded));
        }
    }
    return result;
}
engine.on(KeyNav, (dir) => {
    const flat = flattenTree(FILE_TREE, expandedFolders.value);
    const currentIdx = flat.indexOf(selectedFile.value);
    if (dir === 'up' && currentIdx > 0) {
        engine.emit(SelectFile, flat[currentIdx - 1]);
    }
    else if (dir === 'down' && currentIdx < flat.length - 1) {
        engine.emit(SelectFile, flat[currentIdx + 1]);
    }
    else if (dir === 'enter') {
        const node = findNode(FILE_TREE, selectedFile.value);
        if (node?.type === 'folder') {
            engine.emit(ToggleFolder, node.id);
        }
    }
});
export function findNode(root, id) {
    if (root.id === id)
        return root;
    if (root.children) {
        for (const child of root.children) {
            const found = findNode(child, id);
            if (found)
                return found;
        }
    }
    return null;
}
export function getBreadcrumbs(root, id) {
    const path = [];
    function walk(node) {
        path.push(node.name);
        if (node.id === id)
            return true;
        if (node.children) {
            for (const child of node.children) {
                if (walk(child))
                    return true;
            }
        }
        path.pop();
        return false;
    }
    walk(root);
    return path;
}
