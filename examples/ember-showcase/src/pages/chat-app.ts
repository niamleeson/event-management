import {
  engine,
  BOTS,
  SendMessage,
  MarkAsRead,
  messages,
  typingIndicators,
  unreadCount,
  messageSlideIn,
  messageOpacity,
} from '../engines/chat-app'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 600px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; height: 100vh; display: flex; flex-direction: column;'

  // Header
  const header = document.createElement('div')
  header.style.cssText = 'margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;'
  const headerLeft = document.createElement('div')
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 24px; font-weight: 800; color: #1a1a2e; margin: 0;'
  h1.textContent = 'Chat App'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 13px; margin-top: 2px;'
  sub.textContent = 'Message 2 bots with typing indicators and read receipts'
  headerLeft.appendChild(h1)
  headerLeft.appendChild(sub)

  const unreadBadge = document.createElement('div')
  unreadBadge.style.cssText = 'padding: 4px 12px; border-radius: 20px; background: #e63946; color: #fff; font-size: 13px; font-weight: 700; display: none;'

  header.appendChild(headerLeft)
  header.appendChild(unreadBadge)
  wrapper.appendChild(header)

  // Online users
  const usersBar = document.createElement('div')
  usersBar.style.cssText = 'display: flex; gap: 12px; margin-bottom: 12px; padding: 8px 12px; background: #f8f9fa; border-radius: 8px;'
  for (const bot of BOTS) {
    const user = document.createElement('div')
    user.style.cssText = 'display: flex; align-items: center; gap: 6px;'
    const avatar = document.createElement('div')
    avatar.style.cssText = `width: 28px; height: 28px; border-radius: 50%; background: ${bot.color}; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;`
    avatar.textContent = bot.avatar
    const name = document.createElement('span')
    name.style.cssText = 'font-size: 13px; color: #344054; font-weight: 600;'
    name.textContent = bot.name
    const dot = document.createElement('div')
    dot.style.cssText = 'width: 8px; height: 8px; border-radius: 50%; background: #51cf66;'
    user.appendChild(avatar)
    user.appendChild(name)
    user.appendChild(dot)
    usersBar.appendChild(user)
  }
  wrapper.appendChild(usersBar)

  // Messages area
  const messagesArea = document.createElement('div')
  messagesArea.style.cssText = 'flex: 1; overflow-y: auto; padding: 12px 0; display: flex; flex-direction: column; gap: 8px; min-height: 300px;'
  wrapper.appendChild(messagesArea)

  // Typing indicators
  const typingArea = document.createElement('div')
  typingArea.style.cssText = 'min-height: 24px; font-size: 12px; color: #98a2b3; padding: 4px 0; font-style: italic;'
  wrapper.appendChild(typingArea)

  // Input area
  const inputArea = document.createElement('div')
  inputArea.style.cssText = 'display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid #e4e7ec;'

  const input = document.createElement('input')
  input.type = 'text'
  input.style.cssText = 'flex: 1; padding: 10px 14px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; outline: none;'
  input.placeholder = 'Type a message...'

  const sendBtn = document.createElement('button')
  sendBtn.style.cssText = 'padding: 10px 20px; border: none; border-radius: 8px; background: #4361ee; color: #fff; font-weight: 600; cursor: pointer;'
  sendBtn.textContent = 'Send'

  function doSend() {
    const text = input.value.trim()
    if (!text) return
    engine.emit(SendMessage, { text })
    input.value = ''
    input.focus()
  }

  sendBtn.addEventListener('click', doSend)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSend()
  })

  inputArea.appendChild(input)
  inputArea.appendChild(sendBtn)
  wrapper.appendChild(inputArea)

  container.appendChild(wrapper)

  // Render messages
  function renderMessages() {
    const msgs = messages.value

    // Only add new messages (append-only for performance)
    while (messagesArea.children.length < msgs.length) {
      const idx = messagesArea.children.length
      const msg = msgs[idx]
      const isUser = msg.sender === 'You'
      const bot = BOTS.find((b) => b.name === msg.sender)

      const msgEl = document.createElement('div')
      msgEl.style.cssText = `display: flex; flex-direction: column; align-items: ${isUser ? 'flex-end' : 'flex-start'}; padding: 2px 0;`

      const bubble = document.createElement('div')
      bubble.style.cssText = `max-width: 75%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.4; ${
        isUser
          ? 'background: #4361ee; color: #fff; border-bottom-right-radius: 4px;'
          : `background: #f0f2f5; color: #1a1a2e; border-bottom-left-radius: 4px;`
      }`

      if (!isUser) {
        const senderLabel = document.createElement('div')
        senderLabel.style.cssText = `font-size: 11px; font-weight: 700; color: ${bot?.color || '#666'}; margin-bottom: 4px;`
        senderLabel.textContent = msg.sender
        bubble.appendChild(senderLabel)
      }

      const textEl = document.createElement('span')
      textEl.textContent = msg.text
      bubble.appendChild(textEl)

      // Read receipt
      if (isUser) {
        const receipt = document.createElement('div')
        receipt.style.cssText = 'font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 2px; text-align: right;'
        receipt.textContent = '\u2713\u2713'
        bubble.appendChild(receipt)
      }

      const meta = document.createElement('div')
      meta.style.cssText = 'font-size: 11px; color: #98a2b3; margin-top: 2px; display: flex; align-items: center; gap: 4px;'
      meta.textContent = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      if (!msg.read && !isUser) {
        const readBtn = document.createElement('button')
        readBtn.style.cssText = 'font-size: 10px; padding: 1px 6px; border: none; background: #e4e7ec; border-radius: 4px; cursor: pointer; color: #667085;'
        readBtn.textContent = 'Mark read'
        readBtn.addEventListener('click', () => engine.emit(MarkAsRead, msg.id))
        meta.appendChild(readBtn)
      }

      msgEl.appendChild(bubble)
      msgEl.appendChild(meta)
      messagesArea.appendChild(msgEl)
    }

    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight
  }

  // Subscriptions
  unsubs.push(messages.subscribe(() => {
    renderMessages()
  }))

  unsubs.push(typingIndicators.subscribe((indicators) => {
    const typing = Object.entries(indicators)
      .filter(([_, active]) => active)
      .map(([name]) => name)

    if (typing.length > 0) {
      typingArea.textContent = `${typing.join(' and ')} ${typing.length > 1 ? 'are' : 'is'} typing...`
    } else {
      typingArea.textContent = ''
    }
  }))

  unsubs.push(unreadCount.subscribe((count) => {
    if (count > 0) {
      unreadBadge.style.display = 'block'
      unreadBadge.textContent = `${count} unread`
    } else {
      unreadBadge.style.display = 'none'
    }
  }))

  // Initial render
  renderMessages()

  return () => {
    ;(window as any).__pulseEngine = null
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
