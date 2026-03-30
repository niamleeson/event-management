import {
  engine,
  ToggleExpand,
  SelectNode,
  ShowContextMenu,
  HideContextMenu,
  SearchChanged,
  CreateFile,
  DeleteNode,
  fileTree,
  expandedNodes,
  selectedNode,
  contextMenu,
  searchQuery,
  flattenTree,
  type FileNode,
} from '../engines/file-tree'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 600px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'File Tree'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 16px;'
  sub.textContent = 'Nested expand/collapse, file icons, context menu, and search filtering.'
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Search
  const searchRow = document.createElement('div')
  searchRow.style.cssText = 'margin-bottom: 12px;'
  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.style.cssText = 'width: 100%; padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; outline: none;'
  searchInput.placeholder = 'Search files...'
  searchInput.addEventListener('input', () => engine.emit(SearchChanged, searchInput.value))
  searchRow.appendChild(searchInput)
  wrapper.appendChild(searchRow)

  // File tree container
  const treeContainer = document.createElement('div')
  treeContainer.style.cssText = 'border: 1px solid #e4e7ec; border-radius: 10px; background: #fff; min-height: 400px; overflow: hidden;'

  // Tree content
  const treeContent = document.createElement('div')
  treeContent.style.cssText = 'padding: 8px 0;'
  treeContainer.appendChild(treeContent)
  wrapper.appendChild(treeContainer)

  // Context menu
  const ctxMenu = document.createElement('div')
  ctxMenu.style.cssText = 'position: fixed; display: none; background: #fff; border: 1px solid #e4e7ec; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 4px; z-index: 1000; min-width: 160px;'

  function addCtxItem(label: string, onClick: () => void) {
    const item = document.createElement('div')
    item.style.cssText = 'padding: 6px 12px; font-size: 13px; cursor: pointer; border-radius: 4px; color: #344054;'
    item.textContent = label
    item.addEventListener('mouseenter', () => { item.style.background = '#f0f2f5' })
    item.addEventListener('mouseleave', () => { item.style.background = '' })
    item.addEventListener('click', () => { onClick(); engine.emit(HideContextMenu, undefined) })
    ctxMenu.appendChild(item)
    return item
  }

  const ctxNewFile = addCtxItem('New File...', () => {
    const nodeId = contextMenu.value.nodeId
    if (nodeId) {
      const name = prompt('File name:')
      if (name) engine.emit(CreateFile, { parentId: nodeId, name })
    }
  })
  const ctxNewFolder = addCtxItem('New Folder...', () => {
    const nodeId = contextMenu.value.nodeId
    if (nodeId) {
      const name = prompt('Folder name:')
      if (name) engine.emit(CreateFile, { parentId: nodeId, name })
    }
  })
  addCtxItem('Delete', () => {
    const nodeId = contextMenu.value.nodeId
    if (nodeId) engine.emit(DeleteNode, nodeId)
  })

  document.body.appendChild(ctxMenu)
  document.addEventListener('click', () => engine.emit(HideContextMenu, undefined))

  // Info footer
  const info = document.createElement('div')
  info.style.cssText = 'margin-top: 12px; font-size: 12px; color: #98a2b3;'
  wrapper.appendChild(info)

  container.appendChild(wrapper)

  // Render tree
  function renderTree() {
    treeContent.innerHTML = ''
    const tree = fileTree.value
    const expanded = expandedNodes.value
    const selected = selectedNode.value
    const query = searchQuery.value.toLowerCase()

    // If searching, show flat list
    if (query) {
      const all = flattenTree(tree)
      const matches = all.filter((n) => n.name.toLowerCase().includes(query))
      if (matches.length === 0) {
        const empty = document.createElement('div')
        empty.style.cssText = 'padding: 24px; text-align: center; color: #98a2b3; font-size: 14px;'
        empty.textContent = 'No matching files'
        treeContent.appendChild(empty)
      } else {
        for (const node of matches) {
          const row = createNodeRow(node, 0, selected)
          treeContent.appendChild(row)
        }
      }
      info.textContent = `${matches.length} result(s) for "${query}"`
      return
    }

    // Normal tree view
    function renderNodes(nodes: FileNode[], depth: number) {
      for (const node of nodes) {
        const row = createNodeRow(node, depth, selected)
        treeContent.appendChild(row)

        if (node.type === 'folder' && node.children && expanded.has(node.id)) {
          renderNodes(node.children, depth + 1)
        }
      }
    }

    renderNodes(tree, 0)

    const all = flattenTree(tree)
    const files = all.filter((n) => n.type === 'file').length
    const folders = all.filter((n) => n.type === 'folder').length
    info.textContent = `${folders} folders, ${files} files | ${expanded.size} expanded`
  }

  function createNodeRow(node: FileNode, depth: number, selected: string | null): HTMLElement {
    const row = document.createElement('div')
    const isExpanded = expandedNodes.value.has(node.id)
    const isSelected = selected === node.id

    row.style.cssText = `display: flex; align-items: center; padding: 4px 12px 4px ${12 + depth * 20}px; cursor: pointer; font-size: 13px; border-left: 3px solid ${isSelected ? '#4361ee' : 'transparent'}; background: ${isSelected ? '#eef0ff' : ''}; transition: background 0.1s;`

    row.addEventListener('mouseenter', () => { if (!isSelected) row.style.background = '#f8f9fa' })
    row.addEventListener('mouseleave', () => { if (!isSelected) row.style.background = '' })

    // Expand arrow for folders
    if (node.type === 'folder') {
      const arrow = document.createElement('span')
      arrow.style.cssText = 'width: 16px; font-size: 10px; color: #98a2b3; user-select: none;'
      arrow.textContent = isExpanded ? '\u25BC' : '\u25B6'
      arrow.addEventListener('click', (e) => { e.stopPropagation(); engine.emit(ToggleExpand, node.id) })
      row.appendChild(arrow)
    } else {
      const spacer = document.createElement('span')
      spacer.style.cssText = 'width: 16px;'
      row.appendChild(spacer)
    }

    const icon = document.createElement('span')
    icon.style.cssText = 'margin-right: 6px; font-size: 14px;'
    icon.textContent = node.icon
    row.appendChild(icon)

    const name = document.createElement('span')
    name.style.cssText = `font-weight: ${node.type === 'folder' ? '600' : '400'}; color: #344054; flex: 1;`
    name.textContent = node.name
    row.appendChild(name)

    if (node.size) {
      const size = document.createElement('span')
      size.style.cssText = 'font-size: 11px; color: #98a2b3; margin-left: 8px;'
      size.textContent = node.size
      row.appendChild(size)
    }

    row.addEventListener('click', () => {
      engine.emit(SelectNode, node.id)
      if (node.type === 'folder') engine.emit(ToggleExpand, node.id)
    })

    row.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      if (node.type === 'folder') {
        engine.emit(ShowContextMenu, { visible: true, x: e.clientX, y: e.clientY, nodeId: node.id })
      }
    })

    return row
  }

  unsubs.push(fileTree.subscribe(() => renderTree()))
  unsubs.push(expandedNodes.subscribe(() => renderTree()))
  unsubs.push(selectedNode.subscribe(() => renderTree()))
  unsubs.push(searchQuery.subscribe(() => renderTree()))
  unsubs.push(contextMenu.subscribe((ctx) => {
    if (ctx.visible) {
      ctxMenu.style.display = 'block'
      ctxMenu.style.left = `${ctx.x}px`
      ctxMenu.style.top = `${ctx.y}px`
    } else {
      ctxMenu.style.display = 'none'
    }
  }))

  renderTree()

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    ctxMenu.remove()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
