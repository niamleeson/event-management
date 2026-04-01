// DAG
// ToggleFolder ──→ ExpandedFoldersChanged
// SelectFile ──→ SelectedFileChanged
// SearchChanged ──→ SearchQueryChanged
// KeyNav ──→ SelectFile
//        └──→ ToggleFolder

import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface FileNode {
  id: string
  name: string
  type: 'folder' | 'file'
  ext?: string
  children?: FileNode[]
}

/* ------------------------------------------------------------------ */
/*  File tree data                                                    */
/* ------------------------------------------------------------------ */

const FILE_TREE: FileNode = {
  id: 'root', name: 'project', type: 'folder', children: [
    { id: 'src', name: 'src', type: 'folder', children: [
      { id: 'comp', name: 'components', type: 'folder', children: [
        { id: 'app', name: 'App.vue', type: 'file', ext: 'vue' },
        { id: 'header', name: 'Header.vue', type: 'file', ext: 'vue' },
        { id: 'sidebar', name: 'Sidebar.vue', type: 'file', ext: 'vue' },
        { id: 'footer', name: 'Footer.vue', type: 'file', ext: 'vue' },
      ]},
      { id: 'utils', name: 'utils', type: 'folder', children: [
        { id: 'helpers', name: 'helpers.ts', type: 'file', ext: 'ts' },
        { id: 'api', name: 'api.ts', type: 'file', ext: 'ts' },
        { id: 'constants', name: 'constants.ts', type: 'file', ext: 'ts' },
      ]},
      { id: 'styles', name: 'styles', type: 'folder', children: [
        { id: 'main-css', name: 'main.css', type: 'file', ext: 'css' },
        { id: 'vars', name: 'variables.css', type: 'file', ext: 'css' },
      ]},
      { id: 'main', name: 'main.ts', type: 'file', ext: 'ts' },
      { id: 'engine', name: 'engine.ts', type: 'file', ext: 'ts' },
    ]},
    { id: 'pub', name: 'public', type: 'folder', children: [
      { id: 'index', name: 'index.html', type: 'file', ext: 'html' },
      { id: 'favicon', name: 'favicon.ico', type: 'file', ext: 'ico' },
    ]},
    { id: 'pkg', name: 'package.json', type: 'file', ext: 'json' },
    { id: 'tsconfig', name: 'tsconfig.json', type: 'file', ext: 'json' },
    { id: 'readme', name: 'README.md', type: 'file', ext: 'md' },
    { id: 'gitignore', name: '.gitignore', type: 'file', ext: '' },
  ],
}

/* ------------------------------------------------------------------ */
/*  File type icons                                                   */
/* ------------------------------------------------------------------ */

const FILE_ICONS: Record<string, { icon: string; color: string }> = {
  ts: { icon: 'TS', color: '#3178c6' },
  vue: { icon: 'V', color: '#42b883' },
  css: { icon: '#', color: '#264de4' },
  html: { icon: '<>', color: '#e34c26' },
  json: { icon: '{}', color: '#f5a623' },
  md: { icon: 'M', color: '#888' },
  ico: { icon: '*', color: '#888' },
  '': { icon: '.', color: '#888' },
  folder: { icon: '\u{1F4C1}', color: '#fdcb6e' },
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const ToggleFolder = engine.event<string>('ToggleFolder')
export const SelectFile = engine.event<string>('SelectFile')
export const SearchChanged = engine.event<string>('SearchChanged')
export const KeyNav = engine.event<'up' | 'down' | 'enter'>('KeyNav')

/* ------------------------------------------------------------------ */
/*  State-changed events                                              */
/* ------------------------------------------------------------------ */

export const ExpandedFoldersChanged = engine.event<Set<string>>('ExpandedFoldersChanged')
export const SelectedFileChanged = engine.event<string>('SelectedFileChanged')
export const SearchQueryChanged = engine.event<string>('SearchQueryChanged')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let expandedFolders = new Set<string>(['root', 'src'])
let selectedFile = ''
let searchQuery = ''

engine.on(ToggleFolder, [ExpandedFoldersChanged], (id, setExpanded) => {
  const next = new Set(expandedFolders)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedFolders = next
  setExpanded(expandedFolders)
})

engine.on(SelectFile, [SelectedFileChanged], (id, setSelected) => {
  selectedFile = id
  setSelected(selectedFile)
})

engine.on(SearchChanged, [SearchQueryChanged], (q, setQuery) => {
  searchQuery = q
  setQuery(searchQuery)
})

/* ------------------------------------------------------------------ */
/*  Keyboard navigation                                               */
/* ------------------------------------------------------------------ */

function flattenTree(node: FileNode, expanded: Set<string>): string[] {
  const result: string[] = [node.id]
  if (node.type === 'folder' && expanded.has(node.id) && node.children) {
    for (const child of node.children) {
      result.push(...flattenTree(child, expanded))
    }
  }
  return result
}

engine.on(KeyNav, (dir) => {
  const flat = flattenTree(FILE_TREE, expandedFolders)
  const currentIdx = flat.indexOf(selectedFile)

  if (dir === 'up' && currentIdx > 0) {
    engine.emit(SelectFile, flat[currentIdx - 1])
  } else if (dir === 'down' && currentIdx < flat.length - 1) {
    engine.emit(SelectFile, flat[currentIdx + 1])
  } else if (dir === 'enter') {
    const node = findNode(FILE_TREE, selectedFile)
    if (node?.type === 'folder') {
      engine.emit(ToggleFolder, node.id)
    }
  }
})

function findNode(root: FileNode, id: string): FileNode | null {
  if (root.id === id) return root
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, id)
      if (found) return found
    }
  }
  return null
}

function getBreadcrumbs(root: FileNode, id: string): string[] {
  const path: string[] = []
  function walk(node: FileNode): boolean {
    path.push(node.name)
    if (node.id === id) return true
    if (node.children) {
      for (const child of node.children) {
        if (walk(child)) return true
      }
    }
    path.pop()
    return false
  }
  walk(root)
  return path
}

/* ------------------------------------------------------------------ */
/*  Initial values                                                    */
/* ------------------------------------------------------------------ */

export function getExpandedFolders() { return expandedFolders }
export function getSelectedFile() { return selectedFile }
export function getSearchQuery() { return searchQuery }

export { FILE_TREE, FILE_ICONS, getBreadcrumbs }

export function startLoop() {}
export function stopLoop() {}
