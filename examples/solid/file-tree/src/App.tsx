import { For, Show, createSignal as solidSignal, onMount, onCleanup } from 'solid-js'
import { useSignal, useEmit, useTween } from '@pulse/solid'
import type { Signal, TweenValue, EventType } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  icon?: string
}

/* ------------------------------------------------------------------ */
/*  File tree data                                                    */
/* ------------------------------------------------------------------ */

const FILE_TREE: FileNode[] = [
  { id: '1', name: 'src', type: 'folder', children: [
    { id: '1.1', name: 'components', type: 'folder', children: [
      { id: '1.1.1', name: 'App.tsx', type: 'file', icon: '\u269B' },
      { id: '1.1.2', name: 'Header.tsx', type: 'file', icon: '\u269B' },
      { id: '1.1.3', name: 'Sidebar.tsx', type: 'file', icon: '\u269B' },
      { id: '1.1.4', name: 'Footer.tsx', type: 'file', icon: '\u269B' },
    ]},
    { id: '1.2', name: 'hooks', type: 'folder', children: [
      { id: '1.2.1', name: 'useAuth.ts', type: 'file', icon: '\u{1D4AF}' },
      { id: '1.2.2', name: 'useTheme.ts', type: 'file', icon: '\u{1D4AF}' },
    ]},
    { id: '1.3', name: 'utils', type: 'folder', children: [
      { id: '1.3.1', name: 'helpers.ts', type: 'file', icon: '\u{1D4AF}' },
      { id: '1.3.2', name: 'constants.ts', type: 'file', icon: '\u{1D4AF}' },
      { id: '1.3.3', name: 'api.ts', type: 'file', icon: '\u{1D4AF}' },
    ]},
    { id: '1.4', name: 'styles', type: 'folder', children: [
      { id: '1.4.1', name: 'global.css', type: 'file', icon: '\u{1F3A8}' },
      { id: '1.4.2', name: 'theme.css', type: 'file', icon: '\u{1F3A8}' },
    ]},
    { id: '1.5', name: 'main.tsx', type: 'file', icon: '\u269B' },
    { id: '1.6', name: 'index.html', type: 'file', icon: '\u{1F310}' },
  ]},
  { id: '2', name: 'public', type: 'folder', children: [
    { id: '2.1', name: 'favicon.ico', type: 'file', icon: '\u{1F5BC}' },
    { id: '2.2', name: 'robots.txt', type: 'file', icon: '\u{1F4C4}' },
  ]},
  { id: '3', name: 'package.json', type: 'file', icon: '\u{1F4E6}' },
  { id: '4', name: 'tsconfig.json', type: 'file', icon: '\u2699' },
  { id: '5', name: 'README.md', type: 'file', icon: '\u{1F4D6}' },
  { id: '6', name: '.gitignore', type: 'file', icon: '\u{1F6AB}' },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const ToggleExpand = engine.event<string>('ToggleExpand')
const SelectFile = engine.event<string>('SelectFile')
const SearchChanged = engine.event<string>('SearchChanged')
const KeyNav = engine.event<'up' | 'down' | 'enter' | 'left' | 'right'>('KeyNav')

// Expand/collapse tween
const ExpandStart = engine.event('ExpandStart')
const expandTween: TweenValue = engine.tween({
  start: ExpandStart,
  from: 0,
  to: 1,
  duration: 200,
  easing: 'easeOut',
})

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const expandedFolders = engine.signal<Set<string>>(
  ToggleExpand, new Set<string>(['1', '1.1']),
  (prev, id) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  },
)

const selectedFile = engine.signal<string>(SelectFile, '', (_prev, id) => id)
const searchQuery = engine.signal<string>(SearchChanged, '', (_prev, q) => q)

engine.on(ToggleExpand, () => engine.emit(ExpandStart, undefined))

/* ------------------------------------------------------------------ */
/*  Flatten tree for keyboard nav                                     */
/* ------------------------------------------------------------------ */

function flattenTree(nodes: FileNode[], expanded: Set<string>, query: string): FileNode[] {
  const result: FileNode[] = []
  const q = query.toLowerCase()

  function walk(items: FileNode[]) {
    for (const node of items) {
      if (q && !node.name.toLowerCase().includes(q)) {
        if (node.children) walk(node.children)
        continue
      }
      result.push(node)
      if (node.type === 'folder' && expanded.has(node.id) && node.children) {
        walk(node.children)
      }
    }
  }
  walk(nodes)
  return result
}

/* ------------------------------------------------------------------ */
/*  Keyboard navigation                                               */
/* ------------------------------------------------------------------ */

engine.on(KeyNav, (dir) => {
  const flat = flattenTree(FILE_TREE, expandedFolders.value, searchQuery.value)
  const idx = flat.findIndex(n => n.id === selectedFile.value)

  if (dir === 'up' && idx > 0) engine.emit(SelectFile, flat[idx - 1].id)
  else if (dir === 'down' && idx < flat.length - 1) engine.emit(SelectFile, flat[idx + 1].id)
  else if (dir === 'enter' || dir === 'right') {
    const node = flat[idx]
    if (node?.type === 'folder') engine.emit(ToggleExpand, node.id)
  } else if (dir === 'left') {
    const node = flat[idx]
    if (node?.type === 'folder' && expandedFolders.value.has(node.id)) {
      engine.emit(ToggleExpand, node.id)
    }
  }
})

/* ------------------------------------------------------------------ */
/*  Breadcrumbs                                                       */
/* ------------------------------------------------------------------ */

function getBreadcrumbs(nodes: FileNode[], targetId: string): FileNode[] {
  const path: FileNode[] = []
  function find(items: FileNode[]): boolean {
    for (const node of items) {
      path.push(node)
      if (node.id === targetId) return true
      if (node.children && find(node.children)) return true
      path.pop()
    }
    return false
  }
  find(nodes)
  return path
}

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function TreeNode(props: { node: FileNode; depth: number }) {
  const emit = useEmit()
  const expanded = useSignal(expandedFolders)
  const selected = useSignal(selectedFile)
  const expandVal = useTween(expandTween)

  const isExpanded = () => expanded().has(props.node.id)
  const isSelected = () => selected() === props.node.id

  return (
    <div>
      <div
        onClick={() => {
          emit(SelectFile, props.node.id)
          if (props.node.type === 'folder') emit(ToggleExpand, props.node.id)
        }}
        style={{
          display: 'flex', 'align-items': 'center', gap: '6px',
          padding: '4px 8px', 'padding-left': `${12 + props.depth * 20}px`,
          cursor: 'pointer', 'border-radius': '4px',
          background: isSelected() ? 'rgba(137, 180, 250, 0.15)' : 'transparent',
          color: isSelected() ? '#89b4fa' : '#cdd6f4',
          'font-size': '13px', 'user-select': 'none',
        }}
        onMouseEnter={(e) => { if (!isSelected()) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
        onMouseLeave={(e) => { if (!isSelected()) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {/* Expand arrow for folders */}
        <span style={{
          width: '16px', 'font-size': '10px', color: '#666',
          transform: props.node.type === 'folder' && isExpanded() ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
          display: 'inline-block', 'text-align': 'center',
        }}>
          {props.node.type === 'folder' ? '\u25B6' : ''}
        </span>

        {/* Icon */}
        <span style={{ 'font-size': '14px' }}>
          {props.node.type === 'folder' ? (isExpanded() ? '\u{1F4C2}' : '\u{1F4C1}') : (props.node.icon ?? '\u{1F4C4}')}
        </span>

        {/* Name */}
        <span style={{ 'font-weight': props.node.type === 'folder' ? '500' : '400' }}>
          {props.node.name}
        </span>
      </div>

      {/* Children */}
      <Show when={props.node.type === 'folder' && isExpanded() && props.node.children}>
        <div style={{ overflow: 'hidden' }}>
          <For each={props.node.children!}>
            {(child) => <TreeNode node={child} depth={props.depth + 1} />}
          </For>
        </div>
      </Show>
    </div>
  )
}

function Breadcrumbs() {
  const selected = useSignal(selectedFile)
  const crumbs = () => getBreadcrumbs(FILE_TREE, selected())

  return (
    <div style={{ display: 'flex', 'align-items': 'center', gap: '4px', padding: '8px 16px', background: '#181825', 'border-bottom': '1px solid #313244', 'font-size': '12px' }}>
      <For each={crumbs()}>
        {(node, i) => (
          <>
            <Show when={i() > 0}>
              <span style={{ color: '#585b70' }}>/</span>
            </Show>
            <span style={{ color: i() === crumbs().length - 1 ? '#89b4fa' : '#a6adc8' }}>
              {node.name}
            </span>
          </>
        )}
      </For>
      <Show when={crumbs().length === 0}>
        <span style={{ color: '#585b70' }}>No file selected</span>
      </Show>
    </div>
  )
}

export default function App() {
  const emit = useEmit()
  const query = useSignal(searchQuery)

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); emit(KeyNav, 'up') }
    else if (e.key === 'ArrowDown') { e.preventDefault(); emit(KeyNav, 'down') }
    else if (e.key === 'Enter') { e.preventDefault(); emit(KeyNav, 'enter') }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); emit(KeyNav, 'left') }
    else if (e.key === 'ArrowRight') { e.preventDefault(); emit(KeyNav, 'right') }
  }

  onMount(() => { window.addEventListener('keydown', handleKeyDown) })
  onCleanup(() => { window.removeEventListener('keydown', handleKeyDown) })

  return (
    <div style={{ height: '100vh', display: 'flex', 'flex-direction': 'column', 'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#181825', padding: '12px 16px', 'border-bottom': '1px solid #313244', display: 'flex', 'align-items': 'center', gap: '12px' }}>
        <span style={{ 'font-size': '18px' }}>{'\u{1F4C2}'}</span>
        <h1 style={{ 'font-size': '16px', 'font-weight': '600', margin: '0' }}>File Tree Explorer</h1>
      </div>

      <Breadcrumbs />

      {/* Search */}
      <div style={{ padding: '8px 16px', background: '#1e1e2e', 'border-bottom': '1px solid #313244' }}>
        <input
          placeholder="Search files..."
          value={query()}
          onInput={(e) => emit(SearchChanged, e.currentTarget.value)}
          style={{
            width: '100%', padding: '8px 12px', background: '#313244', border: 'none',
            'border-radius': '6px', color: '#cdd6f4', 'font-size': '13px', outline: 'none',
          }}
        />
      </div>

      {/* Tree */}
      <div style={{ flex: '1', overflow: 'auto', padding: '8px 0' }}>
        <For each={FILE_TREE}>
          {(node) => <TreeNode node={node} depth={0} />}
        </For>
      </div>

      {/* Status bar */}
      <div style={{
        background: '#181825', padding: '4px 16px', 'border-top': '1px solid #313244',
        'font-size': '11px', color: '#585b70', display: 'flex', gap: '16px',
      }}>
        <span>Use arrow keys to navigate</span>
        <span>Enter to expand/collapse</span>
      </div>
    </div>
  )
}
