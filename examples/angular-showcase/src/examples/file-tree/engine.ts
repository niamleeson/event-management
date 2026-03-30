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
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FILE_TREE: FileNode[] = [
  {
    id: 'src', name: 'src', type: 'folder', icon: 'D',
    children: [
      {
        id: 'src/components', name: 'components', type: 'folder', icon: 'D',
        children: [
          { id: 'src/components/Button.tsx', name: 'Button.tsx', type: 'file', icon: 'T' },
          { id: 'src/components/Card.tsx', name: 'Card.tsx', type: 'file', icon: 'T' },
          { id: 'src/components/Modal.tsx', name: 'Modal.tsx', type: 'file', icon: 'T' },
          {
            id: 'src/components/forms', name: 'forms', type: 'folder', icon: 'D',
            children: [
              { id: 'src/components/forms/Input.tsx', name: 'Input.tsx', type: 'file', icon: 'T' },
              { id: 'src/components/forms/Select.tsx', name: 'Select.tsx', type: 'file', icon: 'T' },
            ],
          },
        ],
      },
      {
        id: 'src/engine', name: 'engine', type: 'folder', icon: 'D',
        children: [
          { id: 'src/engine/core.ts', name: 'core.ts', type: 'file', icon: 'T' },
          { id: 'src/engine/types.ts', name: 'types.ts', type: 'file', icon: 'T' },
          { id: 'src/engine/tween.ts', name: 'tween.ts', type: 'file', icon: 'T' },
          { id: 'src/engine/spring.ts', name: 'spring.ts', type: 'file', icon: 'T' },
        ],
      },
      { id: 'src/index.ts', name: 'index.ts', type: 'file', icon: 'T' },
      { id: 'src/styles.css', name: 'styles.css', type: 'file', icon: 'C' },
    ],
  },
  {
    id: 'tests', name: 'tests', type: 'folder', icon: 'D',
    children: [
      { id: 'tests/engine.test.ts', name: 'engine.test.ts', type: 'file', icon: 'T' },
      { id: 'tests/tween.test.ts', name: 'tween.test.ts', type: 'file', icon: 'T' },
    ],
  },
  { id: 'package.json', name: 'package.json', type: 'file', icon: 'J' },
  { id: 'tsconfig.json', name: 'tsconfig.json', type: 'file', icon: 'J' },
  { id: 'README.md', name: 'README.md', type: 'file', icon: 'M' },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const ToggleNode = engine.event<string>('ToggleNode')
export const SelectNode = engine.event<string>('SelectNode')
export const ContextMenu = engine.event<{ nodeId: string; x: number; y: number } | null>('ContextMenu')
export const KeyboardNav = engine.event<'up' | 'down' | 'enter' | 'left' | 'right'>('KeyboardNav')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const expandedNodes = engine.signal<Set<string>>(
  ToggleNode,
  new Set(['src', 'src/components']),
  (prev, id) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  },
)

export const selectedNode = engine.signal<string>(
  SelectNode,
  '',
  (_prev, id) => id,
)

export const contextMenuState = engine.signal<{ nodeId: string; x: number; y: number } | null>(
  ContextMenu,
  null,
  (_prev, state) => state,
)

// ---------------------------------------------------------------------------
// Flatten tree for keyboard navigation
// ---------------------------------------------------------------------------

function flattenVisible(nodes: FileNode[], expanded: Set<string>, depth = 0): { node: FileNode; depth: number }[] {
  const result: { node: FileNode; depth: number }[] = []
  for (const node of nodes) {
    result.push({ node, depth })
    if (node.type === 'folder' && node.children && expanded.has(node.id)) {
      result.push(...flattenVisible(node.children, expanded, depth + 1))
    }
  }
  return result
}

export { flattenVisible }

// Keyboard navigation
engine.on(KeyboardNav, (key) => {
  const flat = flattenVisible(FILE_TREE, expandedNodes.value)
  const currentIdx = flat.findIndex((f) => f.node.id === selectedNode.value)

  switch (key) {
    case 'up':
      if (currentIdx > 0) engine.emit(SelectNode, flat[currentIdx - 1].node.id)
      break
    case 'down':
      if (currentIdx < flat.length - 1) engine.emit(SelectNode, flat[currentIdx + 1].node.id)
      break
    case 'enter':
    case 'right': {
      const current = flat[currentIdx]
      if (current?.node.type === 'folder') engine.emit(ToggleNode, current.node.id)
      break
    }
    case 'left': {
      const current = flat[currentIdx]
      if (current?.node.type === 'folder' && expandedNodes.value.has(current.node.id)) {
        engine.emit(ToggleNode, current.node.id)
      }
      break
    }
  }
})

// Close context menu on selection change
engine.on(SelectNode, () => {
  if (contextMenuState.value) {
    engine.emit(ContextMenu, null)
  }
})

// Start frame loop
engine.startFrameLoop()
