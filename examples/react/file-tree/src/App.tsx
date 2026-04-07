import { useState, useCallback, useRef, useEffect } from 'react'
import { usePulse, useEmit } from '@pulse/react'
import {
  TreeChanged,
  ItemCreated,
  ItemDeleted,
  CreateFile,
  CreateFolder,
  DeleteItem,
  RenameItem,
  DragItem,
  ClipboardPaste,
  flattenTree,
  findNode,
  getPath,
  setClipboard as engineSetClipboard,
} from './engine'
import type { TreeNode } from './engine'

// ---------------------------------------------------------------------------
// File icons by extension
// ---------------------------------------------------------------------------

function getFileIcon(name: string): { icon: string; color: string } {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, { icon: string; color: string }> = {
    ts: { icon: 'TS', color: '#3178c6' },
    tsx: { icon: 'TX', color: '#3178c6' },
    js: { icon: 'JS', color: '#f7df1e' },
    jsx: { icon: 'JX', color: '#f7df1e' },
    json: { icon: '{}', color: '#5b9a4b' },
    css: { icon: '#', color: '#264de4' },
    html: { icon: '<>', color: '#e34c26' },
    md: { icon: 'M', color: '#755838' },
    ico: { icon: '\u25CF', color: '#8b8b8b' },
    env: { icon: '\u26A1', color: '#ecd53f' },
    local: { icon: '\u26A1', color: '#ecd53f' },
    gitignore: { icon: 'G', color: '#f05032' },
    test: { icon: '\u2713', color: '#15c213' },
  }
  if (name.includes('.test.')) return map.test
  if (name.startsWith('.env')) return map.env
  if (name.startsWith('.git')) return map.gitignore
  return map[ext] || { icon: '\u25A1', color: '#8b8b8b' }
}

// ---------------------------------------------------------------------------
// TreeItem
// ---------------------------------------------------------------------------

function TreeItem({
  node, depth, isSelected, isExpanded, searchTerm, onSelect,
}: {
  node: TreeNode; depth: number; isSelected: boolean; isExpanded: boolean
  searchTerm: string; onSelect: (id: string) => void
}) {
  const isFolder = node.type === 'folder'
  const fileIcon = !isFolder ? getFileIcon(node.name) : null

  function renderName() {
    if (!searchTerm) return node.name
    const idx = node.name.toLowerCase().indexOf(searchTerm.toLowerCase())
    if (idx === -1) return node.name
    return (
      <>
        {node.name.slice(0, idx)}
        <span style={{ background: '#fbbf2440', color: '#fbbf24', borderRadius: 2, padding: '0 1px' }}>
          {node.name.slice(idx, idx + searchTerm.length)}
        </span>
        {node.name.slice(idx + searchTerm.length)}
      </>
    )
  }

  return (
    <div
      onClick={() => onSelect(node.id)}
      style={{
        display: 'flex', alignItems: 'center', padding: '4px 8px',
        paddingLeft: 8 + depth * 18, cursor: 'pointer',
        background: isSelected ? 'rgba(59,130,246,0.15)' : 'transparent',
        borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
        color: isSelected ? '#e2e8f0' : '#94a3b8',
        fontSize: 13, userSelect: 'none', transition: 'background 0.15s',
        borderRadius: 4, margin: '1px 4px',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      {isFolder ? (
        <span style={{
          display: 'inline-block', width: 16, textAlign: 'center', marginRight: 4,
          fontSize: 10, color: '#64748b',
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}>
          {'\u25B6'}
        </span>
      ) : (
        <span style={{ width: 16, marginRight: 4 }} />
      )}
      {isFolder ? (
        <span style={{ marginRight: 6, fontSize: 14 }}>{isExpanded ? '\uD83D\uDCC2' : '\uD83D\uDCC1'}</span>
      ) : (
        <span style={{
          marginRight: 6, fontSize: 9, fontWeight: 700, color: fileIcon!.color,
          background: `${fileIcon!.color}18`, borderRadius: 3, padding: '1px 3px', fontFamily: 'monospace',
        }}>
          {fileIcon!.icon}
        </span>
      )}
      <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{renderName()}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ContextMenu
// ---------------------------------------------------------------------------

interface CtxState { visible: boolean; x: number; y: number; targetId: string | null }

function ContextMenu({ state, onClose }: { state: CtxState; onClose: () => void }) {
  const emit = useEmit()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!state.visible) return
    const handler = () => onClose()
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [state.visible, onClose])

  if (!state.visible || !state.targetId) return null
  const tid = state.targetId

  const items = [
    { label: 'New File', action: () => { const n = prompt('File name:'); if (n) emit(CreateFile, { parentId: tid, name: n }) } },
    { label: 'New Folder', action: () => { const n = prompt('Folder name:'); if (n) emit(CreateFolder, { parentId: tid, name: n }) } },
    { label: 'Rename', action: () => { const n = prompt('New name:'); if (n) emit(RenameItem, { id: tid, name: n }) } },
    { label: 'Delete', action: () => emit(DeleteItem, tid) },
    { label: 'Copy', action: () => engineSetClipboard(tid) },
    { label: 'Paste', action: () => emit(ClipboardPaste, tid) },
  ]

  return (
    <div ref={menuRef} style={{
      position: 'fixed', left: state.x, top: state.y, background: '#1e293b',
      border: '1px solid #334155', borderRadius: 8, padding: '4px 0',
      minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 9999,
    }}>
      {items.map(item => (
        <div
          key={item.label}
          onClick={e => { e.stopPropagation(); item.action(); onClose() }}
          style={{ padding: '8px 16px', fontSize: 13, color: '#e2e8f0', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          {item.label}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const INITIAL_EXPANDED = new Set(['root', 'src'])

export default function App() {
  const emit = useEmit()

  // Domain state from engine
  const treeData = usePulse(TreeChanged, [] as TreeNode[])

  // UI state — local React
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(INITIAL_EXPANDED)
  const [search, setSearch] = useState('')
  const [clipboard, setClipboard] = useState<string | null>(null)
  const [ctxMenu, setCtxMenu] = useState<CtxState>({ visible: false, x: 0, y: 0, targetId: null })

  // React to engine events that affect UI state
  const created = usePulse(ItemCreated, null as { parentId: string } | null)
  const deleted = usePulse(ItemDeleted, null as { deletedId: string } | null)

  // Auto-expand parent when item created
  useEffect(() => {
    if (created) {
      setExpandedIds(prev => { const next = new Set(prev); next.add(created.parentId); return next })
    }
  }, [created])

  // Deselect if selected item was deleted
  useEffect(() => {
    if (deleted) {
      setSelectedId(prev => prev === deleted.deletedId ? null : prev)
    }
  }, [deleted])

  // Handle item click: select + toggle folder
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    const node = findNode(treeData, id)
    if (node?.type === 'folder') {
      setExpandedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    }
  }, [treeData])

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, targetId: string) => {
    e.preventDefault()
    setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, targetId })
  }, [])

  const closeCtxMenu = useCallback(() => {
    setCtxMenu({ visible: false, x: 0, y: 0, targetId: null })
  }, [])

  // Sync clipboard to engine (for paste)
  const handleCopy = useCallback((id: string) => {
    setClipboard(id)
    engineSetClipboard(id)
  }, [])

  // Flatten and filter
  const flatItems = flattenTree(treeData, expandedIds)
  const visibleItems = search
    ? flatItems.filter(n => n.name.toLowerCase().includes(search.toLowerCase()))
    : flatItems
  const breadcrumb = selectedId ? getPath(treeData, selectedId) : []

  // Keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = visibleItems.findIndex(n => n.id === selectedId)
    if (e.key === 'ArrowDown') { e.preventDefault(); const next = Math.min(idx + 1, visibleItems.length - 1); setSelectedId(visibleItems[next].id) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const prev = Math.max(idx - 1, 0); setSelectedId(visibleItems[prev].id) }
    else if (e.key === 'ArrowRight' && selectedId) {
      const node = visibleItems.find(n => n.id === selectedId)
      if (node?.type === 'folder' && !expandedIds.has(node.id)) setExpandedIds(prev => { const n = new Set(prev); n.add(node.id); return n })
    }
    else if (e.key === 'ArrowLeft' && selectedId) {
      const node = visibleItems.find(n => n.id === selectedId)
      if (node?.type === 'folder' && expandedIds.has(node.id)) setExpandedIds(prev => { const n = new Set(prev); n.delete(node.id); return n })
    }
    else if (e.key === 'Enter' && selectedId) {
      const node = visibleItems.find(n => n.id === selectedId)
      if (node?.type === 'folder') setExpandedIds(prev => { const n = new Set(prev); if (n.has(node.id)) n.delete(node.id); else n.add(node.id); return n })
    }
    else if (e.key === 'Delete' && selectedId) emit(DeleteItem, selectedId)
  }, [emit, selectedId, expandedIds, visibleItems])

  // Depth computation
  function getDepth(node: TreeNode): number {
    let d = 0, cur = node
    while (cur.parentId) {
      d++
      const parent = flatItems.find(n => n.id === cur.parentId)
      if (!parent) break
      cur = parent
    }
    return d
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0, marginBottom: 12 }}>File Explorer</h1>
        <input
          type="text" placeholder="Search files..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: 400, padding: '8px 12px', borderRadius: 8,
            border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div style={{ padding: '8px 24px', fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid #1e293b22' }}>
          {breadcrumb.map((seg, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <span style={{ color: '#475569' }}>/</span>}
              <span style={{ color: i === breadcrumb.length - 1 ? '#e2e8f0' : '#64748b' }}>{seg}</span>
            </span>
          ))}
        </div>
      )}

      {/* Tree */}
      <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown}
        style={{ flex: 1, overflowY: 'auto', padding: '8px 0', outline: 'none' }}
        onContextMenu={e => {
          // Right-click on empty area → context menu for root
          if (e.target === e.currentTarget) {
            e.preventDefault()
            setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, targetId: 'root' })
          }
        }}
      >
        {visibleItems.map(node => (
          <div key={node.id} onContextMenu={e => handleContextMenu(e, node.id)}>
            <TreeItem
              node={node} depth={getDepth(node)}
              isSelected={node.id === selectedId}
              isExpanded={expandedIds.has(node.id)}
              searchTerm={search} onSelect={handleSelect}
            />
          </div>
        ))}
        {visibleItems.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 14 }}>
            No files match "{search}"
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{
        padding: '8px 24px', borderTop: '1px solid #1e293b', fontSize: 12, color: '#475569',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>{visibleItems.length} items</span>
        <span>{clipboard && 'Clipboard: copied'} | Arrow keys to navigate | Right-click for context menu</span>
      </div>

      <ContextMenu state={ctxMenu} onClose={closeCtxMenu} />
    </div>
  )
}
