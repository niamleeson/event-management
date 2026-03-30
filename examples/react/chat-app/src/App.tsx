import { useRef, useEffect } from 'react'
import { useSignal, useEmit, useTween } from '@pulse/react'
import {
  messages,
  typingUsers,
  unreadCount,
  messageSlideIn,
  badgeBounce,
  MessageSent,
  MessageRead,
  type Message,
} from './engine'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#efeae2',
  },
  header: {
    background: '#075e54',
    color: '#fff',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 600,
  },
  headerParticipants: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  badge: (scale: number) => ({
    background: '#25d366',
    color: '#fff',
    borderRadius: '50%',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    transform: `scale(${scale})`,
  }),
  messagesArea: {
    flex: 1,
    overflow: 'auto' as const,
    padding: '16px 60px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4cfc4\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
  },
  messageBubble: (isMine: boolean, slideOffset: number) => ({
    maxWidth: '65%',
    padding: '8px 14px',
    borderRadius: isMine ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
    background: isMine ? '#dcf8c6' : '#fff',
    alignSelf: isMine ? 'flex-end' as const : 'flex-start' as const,
    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
    position: 'relative' as const,
    transform: `translateY(${slideOffset}px)`,
    transition: 'transform 0.1s',
  }),
  senderName: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
    color: '#075e54',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 1.4,
    color: '#303030',
    wordBreak: 'break-word' as const,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right' as const,
    marginTop: 4,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  checkmark: (read: boolean) => ({
    color: read ? '#4fc3f7' : '#999',
    fontSize: 12,
  }),
  typingIndicator: {
    alignSelf: 'flex-start' as const,
    background: '#fff',
    padding: '10px 16px',
    borderRadius: '12px 12px 12px 4px',
    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  typingDots: {
    display: 'flex',
    gap: 3,
  },
  typingDot: (delay: number) => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#999',
    animation: `typingBounce 1.4s infinite ease-in-out both`,
    animationDelay: `${delay}s`,
  }),
  typingName: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic' as const,
  },
  inputArea: {
    display: 'flex',
    gap: 10,
    padding: '10px 20px',
    background: '#f0f0f0',
    borderTop: '1px solid #ddd',
  },
  input: {
    flex: 1,
    padding: '10px 16px',
    fontSize: 15,
    border: 'none',
    borderRadius: 24,
    outline: 'none',
    background: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    background: '#075e54',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceBar: {
    display: 'flex',
    gap: 12,
    padding: '6px 20px',
    background: '#f7f7f7',
    borderBottom: '1px solid #e0e0e0',
    fontSize: 12,
  },
  presenceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  presenceDot: (color: string) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
  }),
  avatar: (color: string) => ({
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: color,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  }),
}

const globalStyle = `
@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
body { margin: 0; }
`

const userColors: Record<string, string> = {
  'You': '#075e54',
  'Bot Alice': '#e91e63',
  'Bot Bob': '#ff9800',
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function PresenceBar() {
  const typing = useSignal(typingUsers)
  const participants = ['You', 'Bot Alice', 'Bot Bob']

  return (
    <div style={styles.presenceBar}>
      {participants.map(p => (
        <div key={p} style={styles.presenceItem}>
          <div style={styles.presenceDot(userColors[p] ?? '#999')} />
          <span>{p}</span>
          {typing.includes(p) && (
            <span style={{ color: '#999', fontStyle: 'italic' }}> typing...</span>
          )}
        </div>
      ))}
    </div>
  )
}

function MessageBubble({ msg, isLast }: { msg: Message; isLast: boolean }) {
  const slideVal = useTween(messageSlideIn)
  const isMine = msg.sender === 'You'
  const offset = isLast ? slideVal : 0
  const time = new Date(msg.timestamp)
  const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
      {!isMine && (
        <div style={styles.avatar(userColors[msg.sender] ?? '#999')}>
          {msg.sender.charAt(4) || msg.sender.charAt(0)}
        </div>
      )}
      <div style={styles.messageBubble(isMine, offset)}>
        {!isMine && <div style={styles.senderName}>{msg.sender}</div>}
        <div style={styles.messageText}>{msg.text}</div>
        <div style={styles.messageTime}>
          {timeStr}
          {isMine && <span style={styles.checkmark(msg.read)}>{'✓✓'}</span>}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  const typing = useSignal(typingUsers)

  if (typing.length === 0) return null

  return (
    <>
      {typing.map(user => (
        <div key={user} style={styles.typingIndicator}>
          <div style={styles.avatar(userColors[user] ?? '#999')}>
            {user.charAt(4) || user.charAt(0)}
          </div>
          <div>
            <div style={styles.typingName}>{user}</div>
            <div style={styles.typingDots}>
              <div style={styles.typingDot(0)} />
              <div style={styles.typingDot(0.2)} />
              <div style={styles.typingDot(0.4)} />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function MessageList() {
  const msgs = useSignal(messages)
  const emit = useEmit()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [msgs.length])

  // Mark messages as read when scrolled to bottom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleScroll = () => {
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
      if (isAtBottom) {
        emit(MessageRead, 'all')
      }
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [emit])

  return (
    <div ref={containerRef} style={styles.messagesArea}>
      {msgs.map((msg, i) => (
        <MessageBubble key={msg.id} msg={msg} isLast={i === msgs.length - 1} />
      ))}
      <TypingIndicator />
    </div>
  )
}

function ChatInput() {
  const emit = useEmit()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const text = inputRef.current?.value.trim()
    if (!text) return
    emit(MessageSent, { text, sender: 'You' })
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={styles.inputArea}>
      <input
        ref={inputRef}
        style={styles.input}
        placeholder="Type a message..."
        onKeyDown={handleKeyDown}
      />
      <button style={styles.sendBtn} onClick={handleSend}>
        {'➤'}
      </button>
    </div>
  )
}

function Header() {
  const unread = useSignal(unreadCount)
  const badgeScale = useTween(badgeBounce)

  return (
    <div style={styles.header}>
      <div>
        <div style={styles.headerTitle}>Pulse Chat</div>
        <div style={styles.headerParticipants}>You, Bot Alice, Bot Bob</div>
      </div>
      {unread > 0 && (
        <div style={styles.badge(badgeScale || 1)}>
          {unread}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <>
      <style>{globalStyle}</style>
      <div style={styles.container}>
        <Header />
        <PresenceBar />
        <MessageList />
        <ChatInput />
      </div>
    </>
  )
}
