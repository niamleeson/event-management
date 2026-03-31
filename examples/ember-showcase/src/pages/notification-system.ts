import { engine, TYPE_STYLES, DismissNotification, DismissAll, PauseAutoDismiss, ResumeAutoDismiss, getNotifications, getTotalShown, getTotalDismissed, notify, NotificationsChanged } from '../engines/notification-system'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const wrapper = document.createElement('div'); wrapper.style.cssText = 'max-width: 600px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  wrapper.innerHTML = `<h2 style="font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;">Notification System</h2><p style="color: #666; font-size: 14px; margin-bottom: 16px;">Toast stack with auto-dismiss, pause on hover, reflow.</p>`

  const controls = document.createElement('div'); controls.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;'
  for (const [type, label] of [['success', 'Success'], ['error', 'Error'], ['warning', 'Warning'], ['info', 'Info']] as const) {
    const btn = document.createElement('button'); btn.style.cssText = `padding: 8px 16px; border: none; border-radius: 8px; background: ${TYPE_STYLES[type].color}; color: #fff; font-weight: 600; cursor: pointer;`; btn.textContent = label
    btn.addEventListener('click', () => notify(type, `${label} Notification`, `This is a ${type} notification from Pulse.`)); controls.appendChild(btn)
  }
  const clearBtn = document.createElement('button'); clearBtn.style.cssText = 'padding: 8px 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff; cursor: pointer; font-size: 13px;'; clearBtn.textContent = 'Dismiss All'; clearBtn.addEventListener('click', () => engine.emit(DismissAll, undefined)); controls.appendChild(clearBtn)
  wrapper.appendChild(controls)

  const statsEl = document.createElement('div'); statsEl.style.cssText = 'font-size: 13px; color: #667085; margin-bottom: 16px;'; wrapper.appendChild(statsEl)
  const notifList = document.createElement('div'); notifList.style.cssText = 'display: flex; flex-direction: column; gap: 8px;'; wrapper.appendChild(notifList)
  container.appendChild(wrapper)

  function render() {
    const notifs = getNotifications(); notifList.innerHTML = ''
    for (const notif of notifs) {
      const style = TYPE_STYLES[notif.type]
      const card = document.createElement('div'); card.style.cssText = `padding: 14px 18px; background: ${style.bg}; border: 1px solid ${style.border}; border-radius: 10px; display: flex; align-items: flex-start; gap: 12px; animation: slideIn 0.3s ease-out;`
      card.addEventListener('mouseenter', () => engine.emit(PauseAutoDismiss, notif.id))
      card.addEventListener('mouseleave', () => engine.emit(ResumeAutoDismiss, notif.id))
      const icon = document.createElement('div'); icon.style.cssText = `font-size: 18px; color: ${style.color}; flex-shrink: 0;`; icon.textContent = style.icon
      const content = document.createElement('div'); content.style.cssText = 'flex: 1;'
      content.innerHTML = `<div style="font-size: 14px; font-weight: 600; color: ${style.color}; margin-bottom: 2px;">${notif.title}</div><div style="font-size: 13px; color: ${style.color}; opacity: 0.8;">${notif.message}</div>`
      const dismissBtn = document.createElement('button'); dismissBtn.style.cssText = `font-size: 16px; color: ${style.color}; background: none; border: none; cursor: pointer; padding: 0; opacity: 0.5;`; dismissBtn.textContent = '\u00D7'
      dismissBtn.addEventListener('click', () => engine.emit(DismissNotification, notif.id))
      card.appendChild(icon); card.appendChild(content); card.appendChild(dismissBtn); notifList.appendChild(card)
    }
    statsEl.textContent = `Active: ${notifs.length} | Total shown: ${getTotalShown()} | Dismissed: ${getTotalDismissed()}`
  }

  const styleTag = document.createElement('style'); styleTag.textContent = '@keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }'; document.head.appendChild(styleTag)
  unsubs.push(engine.on(NotificationsChanged, () => render())); render()
  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); unsubs.forEach((u) => u()); if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag) }
}
