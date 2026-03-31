import { engine, SAMPLE_MODALS, OpenModal, CloseModal, CloseTopModal, CloseAllModals, getModalStack, getStackDepth, ModalStackChanged } from '../engines/modal-system'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const wrapper = document.createElement('div'); wrapper.style.cssText = 'max-width: 600px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  wrapper.innerHTML = `<h2 style="font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;">Modal System</h2><p style="color: #666; font-size: 14px; margin-bottom: 16px;">Stacked modals with backdrop dimming. Press Escape to dismiss top modal.</p>`

  const controls = document.createElement('div'); controls.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;'
  for (const modal of SAMPLE_MODALS) {
    const btn = document.createElement('button'); btn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 8px; background: #4361ee; color: #fff; font-weight: 600; cursor: pointer;'; btn.textContent = modal.title
    btn.addEventListener('click', () => engine.emit(OpenModal, { ...modal, id: `${modal.id}-${Date.now()}` })); controls.appendChild(btn)
  }
  const clearBtn = document.createElement('button'); clearBtn.style.cssText = 'padding: 8px 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff; cursor: pointer;'; clearBtn.textContent = 'Close All'
  clearBtn.addEventListener('click', () => engine.emit(CloseAllModals, undefined)); controls.appendChild(clearBtn)
  wrapper.appendChild(controls)

  const infoEl = document.createElement('div'); infoEl.style.cssText = 'font-size: 13px; color: #667085; margin-bottom: 16px;'; wrapper.appendChild(infoEl)
  const modalContainer = document.createElement('div'); modalContainer.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000; pointer-events: none;'
  document.body.appendChild(modalContainer)
  container.appendChild(wrapper)

  const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') engine.emit(CloseTopModal, undefined) }
  document.addEventListener('keydown', onKeyDown)

  function render() {
    const stack = getModalStack()
    infoEl.textContent = `Stack depth: ${stack.length}`
    modalContainer.innerHTML = ''

    if (stack.length === 0) { modalContainer.style.pointerEvents = 'none'; return }
    modalContainer.style.pointerEvents = 'auto'

    for (let i = 0; i < stack.length; i++) {
      const modal = stack[i]
      // Backdrop
      const backdrop = document.createElement('div'); backdrop.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,${0.2 + i * 0.1});`
      backdrop.addEventListener('click', () => engine.emit(CloseTopModal, undefined)); modalContainer.appendChild(backdrop)
      // Modal
      const modalEl = document.createElement('div'); modalEl.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) translateY(${i * 10}px); background: #fff; border-radius: 16px; padding: 32px; max-width: 420px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); z-index: ${1001 + i}; animation: modalIn 0.25s ease-out;`
      modalEl.innerHTML = `<h3 style="font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px;">${modal.title}</h3><p style="font-size: 14px; color: #667085; line-height: 1.5; margin-bottom: 20px;">${modal.content}</p>`
      const closeBtn = document.createElement('button'); closeBtn.style.cssText = 'padding: 10px 20px; border: none; border-radius: 8px; background: #4361ee; color: #fff; font-weight: 600; cursor: pointer;'; closeBtn.textContent = 'Close'
      closeBtn.addEventListener('click', () => engine.emit(CloseModal, modal.id)); modalEl.appendChild(closeBtn)
      // Nested open button
      if (i < SAMPLE_MODALS.length - 1) {
        const nestedBtn = document.createElement('button'); nestedBtn.style.cssText = 'padding: 10px 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff; cursor: pointer; margin-left: 8px;'; nestedBtn.textContent = 'Open Nested'
        nestedBtn.addEventListener('click', () => { const next = SAMPLE_MODALS[(i + 1) % SAMPLE_MODALS.length]; engine.emit(OpenModal, { ...next, id: `${next.id}-${Date.now()}` }) }); modalEl.appendChild(nestedBtn)
      }
      modalContainer.appendChild(modalEl)
    }
  }

  const styleTag = document.createElement('style'); styleTag.textContent = '@keyframes modalIn { from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }'; document.head.appendChild(styleTag)
  unsubs.push(engine.on(ModalStackChanged, () => render())); render()
  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); unsubs.forEach((u) => u()); document.removeEventListener('keydown', onKeyDown); if (modalContainer.parentNode) modalContainer.parentNode.removeChild(modalContainer); if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag) }
}
