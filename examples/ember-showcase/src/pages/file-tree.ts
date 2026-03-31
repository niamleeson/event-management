import { engine, ToggleExpand, SelectNode, ShowContextMenu, HideContextMenu, SearchChanged, CreateFile, DeleteNode, getFileTree, getExpandedNodes, getSelectedNode, getContextMenu, getSearchQuery, flattenTree, TreeChanged, type FileNode } from '../engines/file-tree'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const wrapper = document.createElement('div'); wrapper.style.cssText = 'max-width: 500px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  wrapper.innerHTML = `<h2 style="font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;">File Tree</h2><p style="color: #666; font-size: 14px; margin-bottom: 16px;">Nested expand, icons, context menu, search.</p>`

  const searchInput = document.createElement('input'); searchInput.type = 'text'; searchInput.style.cssText = 'width: 100%; padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; margin-bottom: 12px;'; searchInput.placeholder = 'Search files...'
  searchInput.addEventListener('input', () => engine.emit(SearchChanged, searchInput.value)); wrapper.appendChild(searchInput)

  const treeContainer = document.createElement('div'); treeContainer.style.cssText = 'border: 1px solid #e4e7ec; border-radius: 8px; overflow: hidden;'; wrapper.appendChild(treeContainer)

  const contextMenuEl = document.createElement('div'); contextMenuEl.style.cssText = 'position: fixed; background: #fff; border: 1px solid #e4e7ec; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 1000; display: none; min-width: 140px;'
  document.body.appendChild(contextMenuEl)
  document.addEventListener('click', () => engine.emit(HideContextMenu, undefined))
  container.appendChild(wrapper)

  function renderNode(node: FileNode, depth: number): HTMLElement {
    const expanded = getExpandedNodes(); const selected = getSelectedNode(); const query = getSearchQuery().toLowerCase()
    if (query && !node.name.toLowerCase().includes(query) && (!node.children || !flattenTree(node.children).some((c) => c.name.toLowerCase().includes(query)))) return document.createDocumentFragment() as any

    const row = document.createElement('div'); row.style.cssText = `display: flex; align-items: center; padding: 6px 12px; padding-left: ${12 + depth * 20}px; cursor: pointer; font-size: 14px; background: ${selected === node.id ? '#eef0ff' : 'transparent'}; border-bottom: 1px solid #f5f5f5;`
    row.addEventListener('click', (e) => { e.stopPropagation(); if (node.type === 'folder') engine.emit(ToggleExpand, node.id); engine.emit(SelectNode, node.id) })
    row.addEventListener('contextmenu', (e) => { e.preventDefault(); engine.emit(ShowContextMenu, { visible: true, x: e.clientX, y: e.clientY, nodeId: node.id }) })

    if (node.type === 'folder') { const arrow = document.createElement('span'); arrow.style.cssText = 'margin-right: 4px; font-size: 10px; color: #98a2b3;'; arrow.textContent = expanded.has(node.id) ? '\u25BC' : '\u25B6'; row.appendChild(arrow) }
    const icon = document.createElement('span'); icon.style.cssText = 'margin-right: 8px;'; icon.textContent = node.icon; row.appendChild(icon)
    const name = document.createElement('span'); name.style.cssText = `font-weight: ${node.type === 'folder' ? 600 : 400}; color: #344054; flex: 1;`; name.textContent = node.name; row.appendChild(name)
    if (node.size) { const size = document.createElement('span'); size.style.cssText = 'font-size: 12px; color: #98a2b3;'; size.textContent = node.size; row.appendChild(size) }

    const frag = document.createDocumentFragment(); frag.appendChild(row)
    if (node.type === 'folder' && expanded.has(node.id) && node.children) { for (const child of node.children) { const childEl = renderNode(child, depth + 1); if (childEl) frag.appendChild(childEl) } }
    return frag as any
  }

  function render() {
    treeContainer.innerHTML = ''; const tree = getFileTree()
    for (const node of tree) { const el = renderNode(node, 0); if (el) treeContainer.appendChild(el) }
    const ctx = getContextMenu()
    if (ctx.visible) {
      contextMenuEl.style.display = 'block'; contextMenuEl.style.left = `${ctx.x}px`; contextMenuEl.style.top = `${ctx.y}px`; contextMenuEl.innerHTML = ''
      const newFileBtn = document.createElement('div'); newFileBtn.style.cssText = 'padding: 8px 16px; cursor: pointer; font-size: 13px;'; newFileBtn.textContent = 'New File'; newFileBtn.addEventListener('click', () => { if (ctx.nodeId) engine.emit(CreateFile, { parentId: ctx.nodeId, name: `new-file-${Date.now()}.ts` }); engine.emit(HideContextMenu, undefined) })
      const deleteBtn = document.createElement('div'); deleteBtn.style.cssText = 'padding: 8px 16px; cursor: pointer; font-size: 13px; color: #e63946;'; deleteBtn.textContent = 'Delete'; deleteBtn.addEventListener('click', () => { if (ctx.nodeId) engine.emit(DeleteNode, ctx.nodeId); engine.emit(HideContextMenu, undefined) })
      contextMenuEl.appendChild(newFileBtn); contextMenuEl.appendChild(deleteBtn)
    } else { contextMenuEl.style.display = 'none' }
  }

  unsubs.push(engine.on(TreeChanged, () => render())); render()
  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); unsubs.forEach((u) => u()); if (contextMenuEl.parentNode) contextMenuEl.parentNode.removeChild(contextMenuEl) }
}
