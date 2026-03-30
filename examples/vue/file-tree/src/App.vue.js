import { providePulse, useEmit, useSignal } from '@pulse/vue';
import { engine, FILE_TREE, FILE_ICONS, ToggleFolder, SelectFile, SearchChanged, KeyNav, expandedFolders, selectedFile, searchQuery, getBreadcrumbs, } from './engine';
import { defineComponent, h } from 'vue';
// Recursive TreeNode component
const TreeNode = defineComponent({
    name: 'TreeNode',
    props: {
        node: { type: Object, required: true },
        depth: { type: Number, required: true },
    },
    setup(props) {
        const emit = useEmit();
        const expanded = useSignal(expandedFolders);
        const selected = useSignal(selectedFile);
        const query = useSignal(searchQuery);
        function matchesSearch(node) {
            if (!query.value)
                return true;
            const q = query.value.toLowerCase();
            if (node.name.toLowerCase().includes(q))
                return true;
            if (node.children)
                return node.children.some(c => matchesSearch(c));
            return false;
        }
        return () => {
            const node = props.node;
            if (!matchesSearch(node))
                return null;
            const isExpanded = expanded.value.has(node.id);
            const isSelected = selected.value === node.id;
            const icon = node.type === 'folder' ? FILE_ICONS.folder : (FILE_ICONS[node.ext ?? ''] ?? FILE_ICONS['']);
            const isMatch = query.value && node.name.toLowerCase().includes(query.value.toLowerCase());
            const children = [];
            // Node row
            children.push(h('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    paddingLeft: `${props.depth * 16 + 8}px`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(67, 97, 238, 0.2)' : 'transparent',
                    color: isSelected ? '#4361ee' : isMatch ? '#fdcb6e' : '#ccc',
                    fontSize: '13px',
                    userSelect: 'none',
                },
                onClick: () => {
                    emit(SelectFile, node.id);
                    if (node.type === 'folder')
                        emit(ToggleFolder, node.id);
                },
            }, [
                node.type === 'folder'
                    ? h('span', { style: { fontSize: '10px', width: '12px', color: '#888' } }, isExpanded ? '\u25BC' : '\u25B6')
                    : h('span', { style: { width: '12px' } }),
                h('span', { style: { color: icon.color, fontSize: '11px', fontWeight: 700, width: '20px', textAlign: 'center' } }, icon.icon),
                h('span', {}, node.name),
            ]));
            // Children
            if (node.type === 'folder' && isExpanded && node.children) {
                for (const child of node.children) {
                    children.push(h(TreeNode, { node: child, depth: props.depth + 1, key: child.id }));
                }
            }
            return h('div', {}, children);
        };
    },
});
export default await (async () => {
    providePulse(engine);
    const emit = useEmit();
    const expanded = useSignal(expandedFolders);
    const selected = useSignal(selectedFile);
    const query = useSignal(searchQuery);
    function onKeyDown(e) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            emit(KeyNav, 'up');
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            emit(KeyNav, 'down');
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            emit(KeyNav, 'enter');
        }
    }
    function matchesSearch(node) {
        if (!query.value)
            return true;
        const q = query.value.toLowerCase();
        if (node.name.toLowerCase().includes(q))
            return true;
        if (node.children)
            return node.children.some(c => matchesSearch(c));
        return false;
    }
    function highlight(text) {
        if (!query.value)
            return text;
        const idx = text.toLowerCase().indexOf(query.value.toLowerCase());
        if (idx < 0)
            return text;
        return text;
    }
    const breadcrumbs = () => selected.value ? getBreadcrumbs(FILE_TREE, selected.value) : [];
    function renderIcon(node) {
        if (node.type === 'folder')
            return FILE_ICONS.folder;
        return FILE_ICONS[node.ext ?? ''] ?? FILE_ICONS[''];
    }
    debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
    const __VLS_ctx = {};
    const __VLS_componentsOption = { TreeNode };
    let __VLS_components;
    let __VLS_directives;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onKeydown: (__VLS_ctx.onKeyDown) },
        ...{ style: ({ width: '400px' }) },
        tabindex: "0",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ style: ({ color: '#fff', fontSize: '24px', fontWeight: 300, letterSpacing: '2px', marginBottom: '16px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.SearchChanged, $event.target.value);
            } },
        value: (__VLS_ctx.query),
        placeholder: "Search files...",
        ...{ style: ({
                width: '100%', padding: '8px 12px', fontSize: '13px', background: '#2a2a3e',
                border: '1px solid #3a3a4e', borderRadius: '6px', color: '#fff', outline: 'none',
                marginBottom: '12px',
            }) },
    });
    if (__VLS_ctx.breadcrumbs().length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ display: 'flex', gap: '4px', marginBottom: '12px', fontSize: '12px', color: '#888' }) },
        });
        for (const [crumb, i] of __VLS_getVForSourceType((__VLS_ctx.breadcrumbs()))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                key: (i),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ style: ({ color: i === __VLS_ctx.breadcrumbs().length - 1 ? '#fff' : '#888' }) },
            });
            (crumb);
            if (i < __VLS_ctx.breadcrumbs().length - 1) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            }
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ background: '#16162a', borderRadius: '8px', padding: '8px', overflow: 'auto', maxHeight: '600px' }) },
    });
    for (const [node] of __VLS_getVForSourceType(([__VLS_ctx.FILE_TREE]))) {
        const __VLS_0 = {}.TreeNode;
        /** @type {[typeof __VLS_components.TreeNode, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            node: (node),
            depth: (0),
        }));
        const __VLS_2 = __VLS_1({
            node: (node),
            depth: (0),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    }
    var __VLS_dollars;
    const __VLS_self = (await import('vue')).defineComponent({
        setup() {
            return {
                FILE_TREE: FILE_TREE,
                SearchChanged: SearchChanged,
                emit: emit,
                query: query,
                onKeyDown: onKeyDown,
                breadcrumbs: breadcrumbs,
                TreeNode: TreeNode,
            };
        },
        components: { TreeNode }
    });
    return (await import('vue')).defineComponent({
        setup() {
            return {};
        },
        components: { TreeNode }
    });
})(); /* PartiallyEnd: #4569/main.vue */
