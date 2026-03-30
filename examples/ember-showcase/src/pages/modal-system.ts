import {
  engine,
  SAMPLE_MODALS,
  OpenModal,
  CloseModal,
  CloseTopModal,
  CloseAllModals,
  modalStack,
  stackDepth,
  modalTweens,
} from '../engines/modal-system'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 700px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'Modal System'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 16px;'
  sub.textContent = 'Stacked modals with tween entrance animations, backdrop dimming, and escape key support.'
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Trigger buttons
  const triggers = document.createElement('div')
  triggers.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;'

  for (const modal of SAMPLE_MODALS) {
    const btn = document.createElement('button')
    btn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 8px; background: #4361ee; color: #fff; font-weight: 600; cursor: pointer; font-size: 13px;'
    btn.textContent = modal.title
    btn.addEventListener('click', () => engine.emit(OpenModal, { ...modal, id: `${modal.id}-${Date.now()}` }))
    triggers.appendChild(btn)
  }

  const closeAllBtn = document.createElement('button')
  closeAllBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 8px; background: #e63946; color: #fff; font-weight: 600; cursor: pointer; font-size: 13px;'
  closeAllBtn.textContent = 'Close All'
  closeAllBtn.addEventListener('click', () => engine.emit(CloseAllModals, undefined))
  triggers.appendChild(closeAllBtn)

  wrapper.appendChild(triggers)

  // Stats
  const stats = document.createElement('div')
  stats.style.cssText = 'font-size: 13px; color: #667085; margin-bottom: 16px;'
  wrapper.appendChild(stats)

  // Preview area (shows modal stack visualization)
  const previewArea = document.createElement('div')
  previewArea.style.cssText = 'min-height: 200px; background: #f8f9fa; border-radius: 12px; border: 1px solid #e4e7ec; padding: 20px; display: flex; align-items: center; justify-content: center; color: #98a2b3; font-size: 14px;'
  previewArea.textContent = 'Click buttons above to open modals'
  wrapper.appendChild(previewArea)

  // Modal overlay container (absolute positioned)
  const overlayContainer = document.createElement('div')
  overlayContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100;'
  document.body.appendChild(overlayContainer)

  // Escape key
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      engine.emit(CloseTopModal, undefined)
    }
  }
  document.addEventListener('keydown', onKeyDown)

  container.appendChild(wrapper)

  function renderModals() {
    const stack = modalStack.value
    overlayContainer.innerHTML = ''

    if (stack.length === 0) {
      overlayContainer.style.pointerEvents = 'none'
      previewArea.textContent = 'No modals open. Click buttons above to start.'
      stats.textContent = `Stack depth: 0`
      return
    }

    overlayContainer.style.pointerEvents = 'auto'
    stats.textContent = `Stack depth: ${stack.length}`

    // Preview area shows stack summary
    previewArea.innerHTML = ''
    const stackViz = document.createElement('div')
    stackViz.style.cssText = 'display: flex; gap: 8px; align-items: center;'
    for (let i = 0; i < stack.length; i++) {
      const chip = document.createElement('div')
      chip.style.cssText = `padding: 4px 10px; border-radius: 6px; background: #4361ee; color: #fff; font-size: 12px; font-weight: 600; opacity: ${0.4 + (i / stack.length) * 0.6};`
      chip.textContent = stack[i].title
      stackViz.appendChild(chip)
      if (i < stack.length - 1) {
        const arrow = document.createElement('span')
        arrow.style.cssText = 'color: #98a2b3; font-size: 12px;'
        arrow.textContent = '\u2192'
        stackViz.appendChild(arrow)
      }
    }
    previewArea.appendChild(stackViz)

    // Render actual modals
    for (let i = 0; i < stack.length; i++) {
      const modal = stack[i]
      const tweens = modalTweens[modal.id]
      const isTop = i === stack.length - 1

      // Backdrop
      const backdrop = document.createElement('div')
      backdrop.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,${0.3 + i * 0.1}); ${tweens ? `opacity: ${tweens.opacity.value};` : ''}`
      if (modal.canDismiss && isTop) {
        backdrop.addEventListener('click', () => engine.emit(CloseTopModal, undefined))
      }

      // Modal dialog
      const dialog = document.createElement('div')
      const offsetY = i * 20
      dialog.style.cssText = `position: fixed; top: 50%; left: 50%; width: 420px; max-width: 90vw; background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 28px; transform: translate(-50%, calc(-50% + ${offsetY}px)) ${tweens ? `scale(${tweens.scale.value})` : ''}; ${tweens ? `opacity: ${tweens.opacity.value};` : ''} z-index: ${101 + i};`

      const titleEl = document.createElement('div')
      titleEl.style.cssText = 'font-size: 20px; font-weight: 800; color: #1a1a2e; margin-bottom: 12px;'
      titleEl.textContent = modal.title

      const badge = document.createElement('span')
      badge.style.cssText = 'font-size: 11px; background: #eef0ff; color: #4361ee; padding: 2px 8px; border-radius: 4px; margin-left: 8px; font-weight: 600;'
      badge.textContent = `#${i + 1}`
      titleEl.appendChild(badge)

      const contentEl = document.createElement('div')
      contentEl.style.cssText = 'font-size: 14px; color: #667085; line-height: 1.5; margin-bottom: 20px;'
      contentEl.textContent = modal.content

      const actions = document.createElement('div')
      actions.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end;'

      if (modal.type === 'confirm') {
        const cancelBtn = document.createElement('button')
        cancelBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 8px; background: #e4e7ec; color: #344054; font-weight: 600; cursor: pointer;'
        cancelBtn.textContent = 'Cancel'
        cancelBtn.addEventListener('click', () => engine.emit(CloseModal, modal.id))
        actions.appendChild(cancelBtn)

        const confirmBtn = document.createElement('button')
        confirmBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 8px; background: #2a9d8f; color: #fff; font-weight: 600; cursor: pointer;'
        confirmBtn.textContent = 'Confirm'
        confirmBtn.addEventListener('click', () => engine.emit(CloseModal, modal.id))
        actions.appendChild(confirmBtn)
      } else {
        const closeBtn = document.createElement('button')
        closeBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 8px; background: #4361ee; color: #fff; font-weight: 600; cursor: pointer;'
        closeBtn.textContent = 'Close'
        closeBtn.addEventListener('click', () => engine.emit(CloseModal, modal.id))
        actions.appendChild(closeBtn)

        // Button to open another modal from within
        if (isTop) {
          const nestedBtn = document.createElement('button')
          nestedBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 8px; background: #7209b7; color: #fff; font-weight: 600; cursor: pointer;'
          nestedBtn.textContent = 'Open Nested'
          nestedBtn.addEventListener('click', () => {
            const nested = SAMPLE_MODALS[Math.floor(Math.random() * SAMPLE_MODALS.length)]
            engine.emit(OpenModal, { ...nested, id: `${nested.id}-${Date.now()}` })
          })
          actions.appendChild(nestedBtn)
        }
      }

      dialog.appendChild(titleEl)
      dialog.appendChild(contentEl)
      dialog.appendChild(actions)

      overlayContainer.appendChild(backdrop)
      overlayContainer.appendChild(dialog)
    }
  }

  unsubs.push(modalStack.subscribe(() => renderModals()))

  // Frame loop for tween animations
  unsubs.push(engine.on(engine.frame, () => {
    renderModals()
  }))

  renderModals()

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    document.removeEventListener('keydown', onKeyDown)
    overlayContainer.remove()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
