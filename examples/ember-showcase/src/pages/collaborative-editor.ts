import { engine, USERS, UserEdit, CursorMoved, getLines, getCursors, getCursorSpringX, getCursorSpringY, updateFrame, startSimulation, stopSimulation, EditorChanged } from '../engines/collaborative-editor'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []; let rafId = 0
  const wrapper = document.createElement('div'); wrapper.style.cssText = 'max-width: 800px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  wrapper.innerHTML = `<h2 style="font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;">Collaborative Editor</h2><p style="color: #666; font-size: 14px; margin-bottom: 16px;">Multi-user editing with spring-animated cursors.</p>`
  const usersBar = document.createElement('div'); usersBar.style.cssText = 'display: flex; gap: 12px; margin-bottom: 12px;'
  for (const u of USERS) usersBar.innerHTML += `<div style="display: flex; align-items: center; gap: 6px;"><div style="width: 8px; height: 8px; border-radius: 50%; background: ${u.color};"></div><span style="font-size: 13px; font-weight: 600;">${u.name}</span></div>`
  wrapper.appendChild(usersBar)
  const editorWrapper = document.createElement('div'); editorWrapper.style.cssText = 'position: relative; background: #1e1e2e; border-radius: 12px; padding: 16px; font-family: monospace; font-size: 14px; line-height: 22px; color: #cdd6f4; overflow: hidden; min-height: 400px;'
  const linesContainer = document.createElement('div'); linesContainer.style.cssText = 'position: relative; z-index: 1;'
  const cursorsLayer = document.createElement('div'); cursorsLayer.style.cssText = 'position: absolute; top: 16px; left: 16px; pointer-events: none; z-index: 2;'
  editorWrapper.appendChild(linesContainer); editorWrapper.appendChild(cursorsLayer); wrapper.appendChild(editorWrapper)
  container.appendChild(wrapper)

  function escapeHtml(s: string): string { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
  function renderEditor() {
    const lines = getLines(); linesContainer.innerHTML = ''
    for (let i = 0; i < lines.length; i++) {
      const lineEl = document.createElement('div'); lineEl.style.cssText = 'white-space: pre; min-height: 22px;'
      lineEl.innerHTML = `<span style="color: #585b70; margin-right: 16px; display: inline-block; width: 24px; text-align: right;">${i + 1}</span>${escapeHtml(lines[i])}`
      lineEl.addEventListener('click', () => engine.emit(CursorMoved, { userId: 'user-1', line: i, col: 0, color: '#4361ee', name: 'You' }))
      linesContainer.appendChild(lineEl)
    }
  }
  unsubs.push(engine.on(EditorChanged, () => renderEditor())); renderEditor(); startSimulation()

  function frame() {
    updateFrame(); cursorsLayer.innerHTML = ''
    for (const [userId, cursor] of Object.entries(getCursors())) {
      if (userId === 'user-1') continue
      const x = getCursorSpringX(userId); const y = getCursorSpringY(userId)
      cursorsLayer.innerHTML += `<div style="position: absolute; left: ${40 + x}px; top: ${y}px; width: 2px; height: 22px; background: ${cursor.color};"><div style="position: absolute; top: -16px; left: 0; font-size: 10px; color: ${cursor.color}; white-space: nowrap; font-family: sans-serif;">${cursor.name}</div></div>`
    }
    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)
  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); cancelAnimationFrame(rafId); stopSimulation(); unsubs.forEach((u) => u()) }
}
