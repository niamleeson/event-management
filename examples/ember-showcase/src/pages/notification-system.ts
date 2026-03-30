import {
  engine,
  TYPE_STYLES,
  DismissNotification,
  DismissAll,
  PauseAutoDismiss,
  ResumeAutoDismiss,
  notifications,
  totalShown,
  totalDismissed,
  notifTweens,
  notify,
  type NotificationType,
} from '../engines/notification-system'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 700px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'Notification System'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 16px;'
  sub.textContent = 'Toast notifications with tween entrance animations, auto-dismiss, pause on hover, and stack reflow.'
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Trigger buttons
  const triggers = document.createElement('div')
  triggers.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;'

  const types: { type: NotificationType; label: string; title: string; msg: string }[] = [
    { type: 'success', label: 'Success', title: 'Success!', msg: 'Operation completed successfully.' },
    { type: 'error', label: 'Error', title: 'Error', msg: 'Something went wrong. Please try again.' },
    { type: 'warning', label: 'Warning', title: 'Warning', msg: 'Disk space is running low.' },
    { type: 'info', label: 'Info', title: 'Information', msg: 'A new version is available.' },
  ]

  for (const t of types) {
    const btn = document.createElement('button')
    btn.style.cssText = `padding: 8px 16px; border: none; border-radius: 6px; background: ${TYPE_STYLES[t.type].border}; color: ${TYPE_STYLES[t.type].color}; font-weight: 600; cursor: pointer; font-size: 13px;`
    btn.textContent = t.label
    btn.addEventListener('click', () => notify(t.type, t.title, t.msg))
    triggers.appendChild(btn)
  }

  const persistBtn = document.createElement('button')
  persistBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 6px; background: #264653; color: #fff; font-weight: 600; cursor: pointer; font-size: 13px;'
  persistBtn.textContent = 'Persistent'
  persistBtn.addEventListener('click', () => notify('info', 'Persistent', 'This notification must be dismissed manually.', false))
  triggers.appendChild(persistBtn)

  const clearAllBtn = document.createElement('button')
  clearAllBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 6px; background: #e63946; color: #fff; font-weight: 600; cursor: pointer; font-size: 13px;'
  clearAllBtn.textContent = 'Clear All'
  clearAllBtn.addEventListener('click', () => engine.emit(DismissAll, undefined))
  triggers.appendChild(clearAllBtn)

  wrapper.appendChild(triggers)

  // Stats
  const stats = document.createElement('div')
  stats.style.cssText = 'font-size: 13px; color: #667085; margin-bottom: 16px;'
  wrapper.appendChild(stats)

  // Notification stack
  const stackContainer = document.createElement('div')
  stackContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px; min-height: 200px;'
  wrapper.appendChild(stackContainer)

  container.appendChild(wrapper)

  function renderStack() {
    const notifs = notifications.value
    stackContainer.innerHTML = ''

    if (notifs.length === 0) {
      const empty = document.createElement('div')
      empty.style.cssText = 'text-align: center; padding: 40px; color: #98a2b3; font-size: 14px;'
      empty.textContent = 'No notifications. Click buttons above to trigger.'
      stackContainer.appendChild(empty)
      return
    }

    for (const notif of notifs) {
      const style = TYPE_STYLES[notif.type]
      const tweens = notifTweens[notif.id]

      const el = document.createElement('div')
      el.style.cssText = `display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; background: ${style.bg}; border: 1px solid ${style.border}; border-radius: 10px; color: ${style.color}; font-size: 14px; transition: opacity 0.2s; ${tweens ? `opacity: ${tweens.opacity.value}; transform: translateX(${tweens.slideIn.value}px);` : ''}`

      el.addEventListener('mouseenter', () => engine.emit(PauseAutoDismiss, notif.id))
      el.addEventListener('mouseleave', () => engine.emit(ResumeAutoDismiss, notif.id))

      const icon = document.createElement('div')
      icon.style.cssText = 'font-size: 18px; line-height: 1; flex-shrink: 0; margin-top: 2px;'
      icon.textContent = style.icon

      const content = document.createElement('div')
      content.style.cssText = 'flex: 1;'
      const title = document.createElement('div')
      title.style.cssText = 'font-weight: 700; margin-bottom: 2px;'
      title.textContent = notif.title
      const msg = document.createElement('div')
      msg.style.cssText = 'font-size: 13px; opacity: 0.8;'
      msg.textContent = notif.message
      const time = document.createElement('div')
      time.style.cssText = 'font-size: 11px; opacity: 0.5; margin-top: 4px;'
      time.textContent = new Date(notif.timestamp).toLocaleTimeString()
      if (!notif.autoDismiss) {
        const badge = document.createElement('span')
        badge.style.cssText = 'font-size: 10px; background: rgba(0,0,0,0.1); padding: 1px 4px; border-radius: 3px; margin-left: 6px;'
        badge.textContent = 'PERSISTENT'
        time.appendChild(badge)
      }
      content.appendChild(title)
      content.appendChild(msg)
      content.appendChild(time)

      const dismissBtn = document.createElement('button')
      dismissBtn.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 16px; padding: 0 4px; opacity: 0.5; color: inherit; line-height: 1;'
      dismissBtn.textContent = '\u00D7'
      dismissBtn.addEventListener('click', () => engine.emit(DismissNotification, notif.id))

      el.appendChild(icon)
      el.appendChild(content)
      el.appendChild(dismissBtn)
      stackContainer.appendChild(el)
    }
  }

  unsubs.push(notifications.subscribe(() => renderStack()))
  unsubs.push(totalShown.subscribe(() => {
    stats.textContent = `Total shown: ${totalShown.value} | Dismissed: ${totalDismissed.value} | Active: ${notifications.value.length}`
  }))
  unsubs.push(totalDismissed.subscribe(() => {
    stats.textContent = `Total shown: ${totalShown.value} | Dismissed: ${totalDismissed.value} | Active: ${notifications.value.length}`
  }))

  // Frame loop for tween animation on notifications
  unsubs.push(engine.on(engine.frame, () => {
    // Re-render to apply tween values
    renderStack()
  }))

  renderStack()

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
