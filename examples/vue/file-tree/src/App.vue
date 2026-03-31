<script setup lang="ts">
import { providePulse, useEmit, usePulse } from '@pulse/vue'
import {
  engine,
  FILE_TREE,
  FILE_ICONS,
  ToggleFolder,
  SelectFile,
  SearchChanged,
  KeyNav,
  ExpandedFoldersChanged,
  SelectedFileChanged,
  SearchQueryChanged,
  getBreadcrumbs,
  getExpandedFolders,
  getSelectedFile,
  getSearchQuery,
} from './engine'
import type { FileNode } from './engine'

providePulse(engine)

const emit = useEmit()
const expanded = usePulse(ExpandedFoldersChanged, getExpandedFolders())
const selected = usePulse(SelectedFileChanged, getSelectedFile())
const query = usePulse(SearchQueryChanged, getSearchQuery())

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowUp') { e.preventDefault(); emit(KeyNav, 'up') }
  if (e.key === 'ArrowDown') { e.preventDefault(); emit(KeyNav, 'down') }
  if (e.key === 'Enter') { e.preventDefault(); emit(KeyNav, 'enter') }
}

function matchesSearch(node: FileNode): boolean {
  if (!query.value) return true
  const q = query.value.toLowerCase()
  if (node.name.toLowerCase().includes(q)) return true
  if (node.children) return node.children.some(c => matchesSearch(c))
  return false
}

function highlight(text: string): string {
  if (!query.value) return text
  const idx = text.toLowerCase().indexOf(query.value.toLowerCase())
  if (idx < 0) return text
  return text
}

const breadcrumbs = () => selected.value ? getBreadcrumbs(FILE_TREE, selected.value) : []

function renderIcon(node: FileNode) {
  if (node.type === 'folder') return FILE_ICONS.folder
  return FILE_ICONS[node.ext ?? ''] ?? FILE_ICONS['']
}
</script>

<template>
  <div :style="{ width: '400px' }" @keydown="onKeyDown" tabindex="0">
    <h1 :style="{ color: '#fff', fontSize: '24px', fontWeight: 300, letterSpacing: '2px', marginBottom: '16px' }">File Tree</h1>

    <!-- Search -->
    <input
      :value="query"
      @input="emit(SearchChanged, ($event.target as HTMLInputElement).value)"
      placeholder="Search files..."
      :style="{
        width: '100%', padding: '8px 12px', fontSize: '13px', background: '#2a2a3e',
        border: '1px solid #3a3a4e', borderRadius: '6px', color: '#fff', outline: 'none',
        marginBottom: '12px',
      }"
    />

    <!-- Breadcrumbs -->
    <div v-if="breadcrumbs().length > 0" :style="{ display: 'flex', gap: '4px', marginBottom: '12px', fontSize: '12px', color: '#888' }">
      <span v-for="(crumb, i) in breadcrumbs()" :key="i">
        <span :style="{ color: i === breadcrumbs().length - 1 ? '#fff' : '#888' }">{{ crumb }}</span>
        <span v-if="i < breadcrumbs().length - 1"> / </span>
      </span>
    </div>

    <!-- Tree -->
    <div :style="{ background: '#16162a', borderRadius: '8px', padding: '8px', overflow: 'auto', maxHeight: '600px' }">
      <template v-for="node in [FILE_TREE]" :key="node.id">
        <TreeNode :node="node" :depth="0" />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, h } from 'vue'

// Recursive TreeNode component
const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    node: { type: Object as () => FileNode, required: true },
    depth: { type: Number, required: true },
  },
  setup(props) {
    const emit = useEmit()
    const expanded = usePulse(ExpandedFoldersChanged, getExpandedFolders())
    const selected = usePulse(SelectedFileChanged, getSelectedFile())
    const query = usePulse(SearchQueryChanged, getSearchQuery())

    function matchesSearch(node: FileNode): boolean {
      if (!query.value) return true
      const q = query.value.toLowerCase()
      if (node.name.toLowerCase().includes(q)) return true
      if (node.children) return node.children.some(c => matchesSearch(c))
      return false
    }

    return () => {
      const node = props.node
      if (!matchesSearch(node)) return null

      const isExpanded = expanded.value.has(node.id)
      const isSelected = selected.value === node.id
      const icon = node.type === 'folder' ? FILE_ICONS.folder : (FILE_ICONS[node.ext ?? ''] ?? FILE_ICONS[''])
      const isMatch = query.value && node.name.toLowerCase().includes(query.value.toLowerCase())

      const children: any[] = []

      // Node row
      children.push(
        h('div', {
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
            emit(SelectFile, node.id)
            if (node.type === 'folder') emit(ToggleFolder, node.id)
          },
        }, [
          node.type === 'folder'
            ? h('span', { style: { fontSize: '10px', width: '12px', color: '#888' } }, isExpanded ? '\u25BC' : '\u25B6')
            : h('span', { style: { width: '12px' } }),
          h('span', { style: { color: icon.color, fontSize: '11px', fontWeight: 700, width: '20px', textAlign: 'center' } }, icon.icon),
          h('span', {}, node.name),
        ])
      )

      // Children
      if (node.type === 'folder' && isExpanded && node.children) {
        for (const child of node.children) {
          children.push(h(TreeNode, { node: child, depth: props.depth + 1, key: child.id }))
        }
      }

      return h('div', {}, children)
    }
  },
})

export default { components: { TreeNode } }
</script>
