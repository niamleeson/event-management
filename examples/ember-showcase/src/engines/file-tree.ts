import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  icon: string
  size?: string
}

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  nodeId: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FILE_ICONS: Record<string, string> = {
  ts: '\u{1F4D8}',
  js: '\u{1F4D9}',
  json: '\u{1F4CB}',
  css: '\u{1F3A8}',
  html: '\u{1F310}',
  md: '\u{1F4DD}',
  folder: '\u{1F4C1}',
  default: '\u{1F4C4}',
}

const INITIAL_TREE: FileNode[] = [
  {
    id: 'src', name: 'src', type: 'folder', icon: FILE_ICONS.folder,
    children: [
      {
        id: 'src/engines', name: 'engines', type: 'folder', icon: FILE_ICONS.folder,
        children: [
          { id: 'src/engines/todo.ts', name: 'todo-list.ts', type: 'file', icon: FILE_ICONS.ts, size: '2.4kb' },
          { id: 'src/engines/api.ts', name: 'api-call.ts', type: 'file', icon: FILE_ICONS.ts, size: '3.1kb' },
          { id: 'src/engines/anim.ts', name: 'animation.ts', type: 'file', icon: FILE_ICONS.ts, size: '4.2kb' },
        ],
      },
      {
        id: 'src/pages', name: 'pages', type: 'folder', icon: FILE_ICONS.folder,
        children: [
          { id: 'src/pages/todo.ts', name: 'todo-list.ts', type: 'file', icon: FILE_ICONS.ts, size: '5.1kb' },
          { id: 'src/pages/api.ts', name: 'api-call.ts', type: 'file', icon: FILE_ICONS.ts, size: '4.8kb' },
          { id: 'src/pages/anim.ts', name: 'animation.ts', type: 'file', icon: FILE_ICONS.ts, size: '6.3kb' },
        ],
      },
      {
        id: 'src/styles', name: 'styles', type: 'folder', icon: FILE_ICONS.folder,
        children: [
          { id: 'src/styles/main.css', name: 'main.css', type: 'file', icon: FILE_ICONS.css, size: '8.2kb' },
          { id: 'src/styles/theme.css', name: 'theme.css', type: 'file', icon: FILE_ICONS.css, size: '1.5kb' },
        ],
      },
      { id: 'src/main.ts', name: 'main.ts', type: 'file', icon: FILE_ICONS.ts, size: '1.8kb' },
      { id: 'src/routes.ts', name: 'routes.ts', type: 'file', icon: FILE_ICONS.ts, size: '0.9kb' },
    ],
  },
  {
    id: 'public', name: 'public', type: 'folder', icon: FILE_ICONS.folder,
    children: [
      { id: 'public/index.html', name: 'index.html', type: 'file', icon: FILE_ICONS.html, size: '0.5kb' },
      { id: 'public/favicon.ico', name: 'favicon.ico', type: 'file', icon: FILE_ICONS.default, size: '4.2kb' },
    ],
  },
  { id: 'package.json', name: 'package.json', type: 'file', icon: FILE_ICONS.json, size: '0.8kb' },
  { id: 'tsconfig.json', name: 'tsconfig.json', type: 'file', icon: FILE_ICONS.json, size: '0.4kb' },
  { id: 'README.md', name: 'README.md', type: 'file', icon: FILE_ICONS.md, size: '2.1kb' },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const ToggleExpand = engine.event<string>('ToggleExpand')
export const SelectNode = engine.event<string>('SelectNode')
export const ShowContextMenu = engine.event<ContextMenuState>('ShowContextMenu')
export const HideContextMenu = engine.event<void>('HideContextMenu')
export const SearchChanged = engine.event<string>('SearchChanged')
export const CreateFile = engine.event<{ parentId: string; name: string }>('CreateFile')
export const DeleteNode = engine.event<string>('DeleteNode')
export const RenameNode = engine.event<{ id: string; name: string }>('RenameNode')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const fileTree = engine.signal<FileNode[]>(
  CreateFile, [...INITIAL_TREE],
  (prev, { parentId, name }) => {
    const ext = name.split('.').pop() || 'default'
    const newNode: FileNode = {
      id: `${parentId}/${name}`,
      name,
      type: name.includes('.') ? 'file' : 'folder',
      icon: FILE_ICONS[ext] || FILE_ICONS.default,
      size: '0kb',
      children: name.includes('.') ? undefined : [],
    }
    return addToTree(prev, parentId, newNode)
  },
)

engine.signalUpdate(fileTree, DeleteNode, (prev, id) => removeFromTree(prev, id))
engine.signalUpdate(fileTree, RenameNode, (prev, { id, name }) => renameInTree(prev, id, name))

export const expandedNodes = engine.signal<Set<string>>(
  ToggleExpand,
  new Set(['src', 'src/engines', 'src/pages']),
  (prev, id) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  },
)

export const selectedNode = engine.signal<string | null>(
  SelectNode, null, (_prev, id) => id,
)

export const contextMenu = engine.signal<ContextMenuState>(
  ShowContextMenu, { visible: false, x: 0, y: 0, nodeId: null },
  (_prev, state) => state,
)
engine.signalUpdate(contextMenu, HideContextMenu, () => ({ visible: false, x: 0, y: 0, nodeId: null }))

export const searchQuery = engine.signal<string>(
  SearchChanged, '', (_prev, q) => q,
)

// ---------------------------------------------------------------------------
// Tree manipulation helpers
// ---------------------------------------------------------------------------

function addToTree(nodes: FileNode[], parentId: string, newNode: FileNode): FileNode[] {
  return nodes.map((node) => {
    if (node.id === parentId && node.children) {
      return { ...node, children: [...node.children, newNode] }
    }
    if (node.children) {
      return { ...node, children: addToTree(node.children, parentId, newNode) }
    }
    return node
  })
}

function removeFromTree(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => n.children ? { ...n, children: removeFromTree(n.children, id) } : n)
}

function renameInTree(nodes: FileNode[], id: string, name: string): FileNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, name }
    if (n.children) return { ...n, children: renameInTree(n.children, id, name) }
    return n
  })
}

// Helper: flatten tree for search
export function flattenTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = []
  function walk(list: FileNode[]) {
    for (const n of list) {
      result.push(n)
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return result
}
