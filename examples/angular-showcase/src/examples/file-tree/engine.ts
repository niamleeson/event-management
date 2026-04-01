// DAG
// ToggleNode ──→ ExpandedChanged
// SelectNode ──→ SelectedChanged
// KeyboardNav ──→ SelectNode
//             └──→ ToggleNode

import { createEngine } from '@pulse/core'

export const engine = createEngine()

export interface FileNode { id: string; name: string; type: 'file' | 'folder'; children?: FileNode[]; icon: string }

export const FILE_TREE: FileNode[] = [
  { id: 'src', name: 'src', type: 'folder', icon: 'D', children: [
    { id: 'src/components', name: 'components', type: 'folder', icon: 'D', children: [
      { id: 'src/components/Button.tsx', name: 'Button.tsx', type: 'file', icon: 'T' },
      { id: 'src/components/Card.tsx', name: 'Card.tsx', type: 'file', icon: 'T' },
      { id: 'src/components/Modal.tsx', name: 'Modal.tsx', type: 'file', icon: 'T' },
    ]},
    { id: 'src/engine', name: 'engine', type: 'folder', icon: 'D', children: [
      { id: 'src/engine/core.ts', name: 'core.ts', type: 'file', icon: 'T' },
      { id: 'src/engine/types.ts', name: 'types.ts', type: 'file', icon: 'T' },
    ]},
    { id: 'src/index.ts', name: 'index.ts', type: 'file', icon: 'T' },
  ]},
  { id: 'tests', name: 'tests', type: 'folder', icon: 'D', children: [
    { id: 'tests/engine.test.ts', name: 'engine.test.ts', type: 'file', icon: 'T' },
  ]},
  { id: 'package.json', name: 'package.json', type: 'file', icon: 'J' },
  { id: 'README.md', name: 'README.md', type: 'file', icon: 'M' },
]

export const ToggleNode = engine.event<string>('ToggleNode')
export const SelectNode = engine.event<string>('SelectNode')
export const KeyboardNav = engine.event<'up' | 'down' | 'enter' | 'left' | 'right'>('KeyboardNav')
export const ExpandedChanged = engine.event<Set<string>>('ExpandedChanged')
export const SelectedChanged = engine.event<string>('SelectedChanged')

let expanded = new Set(['src', 'src/components'])
let selected = ''

export function flattenVisible(nodes: FileNode[], exp: Set<string>, depth = 0): { node: FileNode; depth: number }[] {
  const result: { node: FileNode; depth: number }[] = []
  for (const node of nodes) {
    result.push({ node, depth })
    if (node.type === 'folder' && node.children && exp.has(node.id)) result.push(...flattenVisible(node.children, exp, depth + 1))
  }
  return result
}

engine.on(ToggleNode, [ExpandedChanged], (id, setExpanded) => {
  expanded = new Set(expanded); if (expanded.has(id)) expanded.delete(id); else expanded.add(id)
  setExpanded(expanded)
})

engine.on(SelectNode, [SelectedChanged], (id, setSelected) => { selected = id; setSelected(id) })

engine.on(KeyboardNav, (key) => {
  const flat = flattenVisible(FILE_TREE, expanded)
  const idx = flat.findIndex((f) => f.node.id === selected)
  switch (key) {
    case 'up': if (idx > 0) engine.emit(SelectNode, flat[idx - 1].node.id); break
    case 'down': if (idx < flat.length - 1) engine.emit(SelectNode, flat[idx + 1].node.id); break
    case 'enter': case 'right': { const c = flat[idx]; if (c?.node.type === 'folder') engine.emit(ToggleNode, c.node.id); break }
    case 'left': { const c = flat[idx]; if (c?.node.type === 'folder' && expanded.has(c.node.id)) engine.emit(ToggleNode, c.node.id); break }
  }
})

export function startLoop() {}
export function stopLoop() {}
