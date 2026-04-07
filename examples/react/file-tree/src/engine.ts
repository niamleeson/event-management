import { createEngine } from '@pulse/core'

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

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
//
//  CreateFile ──→ ItemCreated ──→ TreeChanged
//  CreateFolder → ItemCreated
//  ClipboardPaste → ItemCreated
//
//  DeleteItem ──→ ItemDeleted ──→ TreeChanged
//
//  RenameItem ──→ TreeChanged
//  DragItem ────→ TreeChanged
//
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Events — domain only (tree mutations)
// ---------------------------------------------------------------------------

export const CreateFile = engine.event<{ parentId: string; name: string }>('CreateFile')
export const CreateFolder = engine.event<{ parentId: string; name: string }>('CreateFolder')
export const DeleteItem = engine.event<string>('DeleteItem')
export const RenameItem = engine.event<{ id: string; name: string }>('RenameItem')
export const DragItem = engine.event<{ id: string; targetId: string }>('DragItem')
export const ClipboardPaste = engine.event<string>('ClipboardPaste')

// Intermediate events (carry context for downstream)
export const ItemCreated = engine.event<{ parentId: string }>('ItemCreated')
export const ItemDeleted = engine.event<{ deletedId: string }>('ItemDeleted')

// State event (tree data)
export const TreeChanged = engine.event<TreeNode[]>('TreeChanged')

// ---------------------------------------------------------------------------
// Initial tree
// ---------------------------------------------------------------------------

const INITIAL_TREE: TreeNode[] = [
  {
    id: 'root', name: 'my-project', type: 'folder', parentId: null,
    children: [
      {
        id: 'src', name: 'src', type: 'folder', parentId: 'root',
        children: [
          {
            id: 'src-components', name: 'components', type: 'folder', parentId: 'src',
            children: [
              { id: 'header-tsx', name: 'Header.tsx', type: 'file', parentId: 'src-components' },
              { id: 'footer-tsx', name: 'Footer.tsx', type: 'file', parentId: 'src-components' },
              { id: 'sidebar-tsx', name: 'Sidebar.tsx', type: 'file', parentId: 'src-components' },
              { id: 'button-tsx', name: 'Button.tsx', type: 'file', parentId: 'src-components' },
            ],
          },
          {
            id: 'src-hooks', name: 'hooks', type: 'folder', parentId: 'src',
            children: [
              { id: 'use-auth-ts', name: 'useAuth.ts', type: 'file', parentId: 'src-hooks' },
              { id: 'use-theme-ts', name: 'useTheme.ts', type: 'file', parentId: 'src-hooks' },
            ],
          },
          {
            id: 'src-utils', name: 'utils', type: 'folder', parentId: 'src',
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
        id: 'public', name: 'public', type: 'folder', parentId: 'root',
        children: [
          { id: 'index-html', name: 'index.html', type: 'file', parentId: 'public' },
          { id: 'favicon-ico', name: 'favicon.ico', type: 'file', parentId: 'public' },
        ],
      },
      {
        id: 'tests', name: 'tests', type: 'folder', parentId: 'root',
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
  return nodes.map(n => ({ ...n, children: n.children ? deepCloneTree(n.children) : undefined }))
}

export function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) { const f = findNode(n.children, id); if (f) return f }
  }
  return null
}

function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes.filter(n => n.id !== id).map(n => ({
    ...n, children: n.children ? removeNode(n.children, id) : undefined,
  }))
}

function addChild(nodes: TreeNode[], parentId: string, child: TreeNode): TreeNode[] {
  return nodes.map(n => {
    if (n.id === parentId && n.type === 'folder') return { ...n, children: [...(n.children || []), child] }
    if (n.children) return { ...n, children: addChild(n.children, parentId, child) }
    return n
  })
}

function renameNode(nodes: TreeNode[], id: string, name: string): TreeNode[] {
  return nodes.map(n => {
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
      if (item.type === 'folder' && item.children && expanded.has(item.id)) walk(item.children)
    }
  }
  walk(nodes)
  return result
}

export function getPath(nodes: TreeNode[], id: string): string[] {
  function walk(items: TreeNode[], path: string[]): string[] | null {
    for (const item of items) {
      const cur = [...path, item.name]
      if (item.id === id) return cur
      if (item.children) { const f = walk(item.children, cur); if (f) return f }
    }
    return null
  }
  return walk(nodes, []) || []
}

// ---------------------------------------------------------------------------
// State — only tree data (selection, expansion, search are UI state)
// ---------------------------------------------------------------------------

let tree: TreeNode[] = INITIAL_TREE
let clipboard: string | null = null

export function getTree() { return tree }
export function getClipboard() { return clipboard }

// ---------------------------------------------------------------------------
// Layer 0 → 1: Create mutations → ItemCreated + TreeChanged
// ---------------------------------------------------------------------------

engine.on(CreateFile, [TreeChanged, ItemCreated], ({ parentId, name }, setTree, setCreated) => {
  const id = `file-${++nodeCounter}`
  tree = addChild(deepCloneTree(tree), parentId, { id, name, type: 'file', parentId })
  setTree(tree)
  setCreated({ parentId })
})

engine.on(CreateFolder, [TreeChanged, ItemCreated], ({ parentId, name }, setTree, setCreated) => {
  const id = `folder-${++nodeCounter}`
  tree = addChild(deepCloneTree(tree), parentId, { id, name, type: 'folder', parentId, children: [] })
  setTree(tree)
  setCreated({ parentId })
})

engine.on(ClipboardPaste, [TreeChanged, ItemCreated], (parentId, setTree, setCreated) => {
  if (!clipboard) return
  const current = deepCloneTree(tree)
  const node = findNode(current, clipboard)
  if (!node) return
  const newId = `copy-${++nodeCounter}`
  tree = addChild(current, parentId, { ...node, id: newId, parentId, name: `${node.name} (copy)` })
  setTree(tree)
  setCreated({ parentId })
})

// ---------------------------------------------------------------------------
// Layer 0 → 1: Delete → ItemDeleted + TreeChanged
// ---------------------------------------------------------------------------

engine.on(DeleteItem, [TreeChanged, ItemDeleted], (id, setTree, setDeleted) => {
  if (id === 'root') return
  tree = removeNode(deepCloneTree(tree), id)
  setTree(tree)
  setDeleted({ deletedId: id })
})

// ---------------------------------------------------------------------------
// Layer 0 → 1: Simple mutations → TreeChanged only
// ---------------------------------------------------------------------------

engine.on(RenameItem, [TreeChanged], ({ id, name }, setTree) => {
  tree = renameNode(deepCloneTree(tree), id, name)
  setTree(tree)
})

engine.on(DragItem, [TreeChanged], ({ id, targetId }, setTree) => {
  if (id === targetId) return
  const current = deepCloneTree(tree)
  const node = findNode(current, id)
  if (!node) return
  const target = findNode(current, targetId)
  if (!target || target.type !== 'folder') return
  tree = addChild(removeNode(current, id), targetId, { ...node, parentId: targetId })
  setTree(tree)
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export function setClipboard(id: string | null) { clipboard = id }

export function startLoop() {}
export function stopLoop() {}

export function resetState() {
  nodeCounter = 100
  tree = INITIAL_TREE
  clipboard = null
}
