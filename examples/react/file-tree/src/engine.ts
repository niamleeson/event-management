import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TreeNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: TreeNode[]
  parentId: string | null
}

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  targetId: string | null
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const ToggleFolder = engine.event<string>('ToggleFolder')
export const SelectItem = engine.event<string>('SelectItem')
export const CreateFile = engine.event<{ parentId: string; name: string }>('CreateFile')
export const CreateFolder = engine.event<{ parentId: string; name: string }>('CreateFolder')
export const DeleteItem = engine.event<string>('DeleteItem')
export const RenameItem = engine.event<{ id: string; name: string }>('RenameItem')
export const DragItem = engine.event<{ id: string; targetId: string }>('DragItem')
export const SearchChanged = engine.event<string>('SearchChanged')
export const ContextMenuOpen = engine.event<{ x: number; y: number; targetId: string }>('ContextMenuOpen')
export const ContextMenuClose = engine.event<void>('ContextMenuClose')
export const ClipboardCopy = engine.event<string>('ClipboardCopy')
export const ClipboardPaste = engine.event<string>('ClipboardPaste')
export const KeyNav = engine.event<string>('KeyNav')

// State-changed events for React subscriptions
export const TreeChanged = engine.event<TreeNode[]>('TreeChanged')
export const SelectedIdChanged = engine.event<string | null>('SelectedIdChanged')
export const ExpandedIdsChanged = engine.event<Set<string>>('ExpandedIdsChanged')
export const SearchFilterChanged = engine.event<string>('SearchFilterChanged')
export const ClipboardChanged = engine.event<string | null>('ClipboardChanged')
export const ContextMenuChanged = engine.event<ContextMenuState>('ContextMenuChanged')

// ---------------------------------------------------------------------------
// Initial tree
// ---------------------------------------------------------------------------

const INITIAL_TREE: TreeNode[] = [
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
]

// ---------------------------------------------------------------------------
// Tree helpers
// ---------------------------------------------------------------------------

let nodeCounter = 100

function deepCloneTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((n) => ({
    ...n,
    children: n.children ? deepCloneTree(n.children) : undefined,
  }))
}

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({
      ...n,
      children: n.children ? removeNode(n.children, id) : undefined,
    }))
}

function addChild(nodes: TreeNode[], parentId: string, child: TreeNode): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === parentId && n.type === 'folder') {
      return { ...n, children: [...(n.children || []), child] }
    }
    if (n.children) {
      return { ...n, children: addChild(n.children, parentId, child) }
    }
    return n
  })
}

function renameNode(nodes: TreeNode[], id: string, name: string): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, name }
    if (n.children) return { ...n, children: renameNode(n.children, id, name) }
    return n
  })
}

export function flattenTree(nodes: TreeNode[], expanded: Set<string>): TreeNode[] {
  const result: TreeNode[] = []
  function walk(items: TreeNode[]) {
    for (const item of items) {
      result.push(item)
      if (item.type === 'folder' && item.children && expanded.has(item.id)) {
        walk(item.children)
      }
    }
  }
  walk(nodes)
  return result
}

export function getPath(nodes: TreeNode[], id: string): string[] {
  function walk(items: TreeNode[], path: string[]): string[] | null {
    for (const item of items) {
      const currentPath = [...path, item.name]
      if (item.id === id) return currentPath
      if (item.children) {
        const found = walk(item.children, currentPath)
        if (found) return found
      }
    }
    return null
  }
  return walk(nodes, []) || []
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let tree: TreeNode[] = INITIAL_TREE
let selectedId: string | null = null
let expandedIds: Set<string> = new Set(['root', 'src'])
let searchFilter = ''
let clipboard: string | null = null
let contextMenu: ContextMenuState = { visible: false, x: 0, y: 0, targetId: null }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(SelectItem, (id) => {
  selectedId = id
  engine.emit(SelectedIdChanged, selectedId)
})

engine.on(SearchChanged, (value) => {
  searchFilter = value
  engine.emit(SearchFilterChanged, searchFilter)
})

engine.on(ToggleFolder, (id) => {
  const current = new Set(expandedIds)
  if (current.has(id)) {
    current.delete(id)
  } else {
    current.add(id)
  }
  expandedIds = current
  engine.emit(ExpandedIdsChanged, expandedIds)
})

engine.on(CreateFile, ({ parentId, name }) => {
  const id = `file-${++nodeCounter}`
  const newNode: TreeNode = { id, name, type: 'file', parentId }
  tree = addChild(deepCloneTree(tree), parentId, newNode)
  engine.emit(TreeChanged, tree)
  // Auto-expand parent
  const exp = new Set(expandedIds)
  exp.add(parentId)
  expandedIds = exp
  engine.emit(ExpandedIdsChanged, expandedIds)
})

engine.on(CreateFolder, ({ parentId, name }) => {
  const id = `folder-${++nodeCounter}`
  const newNode: TreeNode = { id, name, type: 'folder', parentId, children: [] }
  tree = addChild(deepCloneTree(tree), parentId, newNode)
  engine.emit(TreeChanged, tree)
  const exp = new Set(expandedIds)
  exp.add(parentId)
  expandedIds = exp
  engine.emit(ExpandedIdsChanged, expandedIds)
})

engine.on(DeleteItem, (id) => {
  if (id === 'root') return
  tree = removeNode(deepCloneTree(tree), id)
  engine.emit(TreeChanged, tree)
  if (selectedId === id) {
    selectedId = ''
    engine.emit(SelectedIdChanged, selectedId)
  }
})

engine.on(RenameItem, ({ id, name }) => {
  tree = renameNode(deepCloneTree(tree), id, name)
  engine.emit(TreeChanged, tree)
})

engine.on(DragItem, ({ id, targetId }) => {
  if (id === targetId) return
  const current = deepCloneTree(tree)
  const node = findNode(current, id)
  if (!node) return
  const target = findNode(current, targetId)
  if (!target || target.type !== 'folder') return
  const without = removeNode(current, id)
  tree = addChild(without, targetId, { ...node, parentId: targetId })
  engine.emit(TreeChanged, tree)
})

engine.on(ContextMenuOpen, ({ x, y, targetId }) => {
  contextMenu = { visible: true, x, y, targetId }
  engine.emit(ContextMenuChanged, contextMenu)
})

engine.on(ContextMenuClose, () => {
  contextMenu = { visible: false, x: 0, y: 0, targetId: null }
  engine.emit(ContextMenuChanged, contextMenu)
})

engine.on(ClipboardCopy, (id) => {
  clipboard = id
  engine.emit(ClipboardChanged, clipboard)
})

engine.on(ClipboardPaste, (parentId) => {
  if (!clipboard) return
  const current = deepCloneTree(tree)
  const node = findNode(current, clipboard)
  if (!node) return
  const newId = `copy-${++nodeCounter}`
  const copy: TreeNode = { ...node, id: newId, parentId, name: `${node.name} (copy)` }
  tree = addChild(current, parentId, copy)
  engine.emit(TreeChanged, tree)
})
