import { For, Show, onMount, onCleanup } from 'solid-js'
import { useSignal, useEmit, useTween } from '@pulse/solid'
import type { Signal, TweenValue, EventType } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Message {
  id: number
  sender: string
  text: string
  time: number
  read: boolean
  color: string
}

/* ------------------------------------------------------------------ */
/*  Bot config                                                        */
/* ------------------------------------------------------------------ */

const BOTS = [
  { name: 'Alice', color: '#6c5ce7', responses: ['Interesting point!', 'I agree completely.', 'Let me think about that...', 'Great idea!', 'That reminds me of something.', 'Could you elaborate?'] },
  { name: 'Bob', color: '#00b894', responses: ['Sure thing!', 'I was just thinking the same.', 'Absolutely, good call.', 'Hmm, not sure about that.', 'Let me check on that.', 'Roger that!'] },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const SendMessage = engine.event<string>('SendMessage')
const MessageAdded = engine.event<Message>('MessageAdded')
const BotTyping = engine.event<{ bot: string; typing: boolean }>('BotTyping')
const MarkRead = engine.event<number>('MarkRead')
const MessageSlideStart = engine.event('MessageSlideStart')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let nextId = 0

const messages = engine.signal<Message[]>(MessageAdded, [], (prev, msg) => [...prev, msg])

const typingIndicators = engine.signal<Record<string, boolean>>(
  BotTyping, {} as Record<string, boolean>,
  (prev, { bot, typing }) => ({ ...prev, [bot]: typing }),
)

// Message slide-in tween
const slideTween: TweenValue = engine.tween({
  start: MessageSlideStart,
  from: 30,
  to: 0,
  duration: 300,
  easing: 'easeOutBack',
})

/* ------------------------------------------------------------------ */
/*  Bot responder logic                                               */
/* ------------------------------------------------------------------ */

engine.on(SendMessage, (text) => {
  const userMsg: Message = {
    id: nextId++, sender: 'You', text, time: Date.now(), read: true, color: '#4361ee',
  }
  engine.emit(MessageAdded, userMsg)
  engine.emit(MessageSlideStart, undefined)

  // Each bot responds after a random delay
  BOTS.forEach((bot) => {
    const delay = 1000 + Math.random() * 2000
    setTimeout(() => {
      engine.emit(BotTyping, { bot: bot.name, typing: true })
      setTimeout(() => {
        engine.emit(BotTyping, { bot: bot.name, typing: false })
        const response = bot.responses[Math.floor(Math.random() * bot.responses.length)]
        const msg: Message = {
          id: nextId++, sender: bot.name, text: response,
          time: Date.now(), read: false, color: bot.color,
        }
        engine.emit(MessageAdded, msg)
        engine.emit(MessageSlideStart, undefined)
        // Mark as read after 1s
        setTimeout(() => engine.emit(MarkRead, msg.id), 1000)
      }, 800 + Math.random() * 1200)
    }, delay)
  })
})

engine.signalUpdate(messages, MarkRead, (prev, id) =>
  prev.map(m => m.id === id ? { ...m, read: true } : m)
)

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function TypingIndicator(props: { name: string; color: string }) {
  return (
    <div style={{ display: 'flex', 'align-items': 'center', gap: '8px', padding: '8px 16px' }}>
      <span style={{ color: props.color, 'font-size': '13px', 'font-weight': '600' }}>{props.name}</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <For each={[0, 1, 2]}>
          {(i) => (
            <div style={{
              width: '6px', height: '6px', 'border-radius': '50%', background: props.color,
              animation: `typing 1.2s infinite ${i * 0.2}s`,
              opacity: '0.6',
            }} />
          )}
        </For>
      </div>
    </div>
  )
}

function MessageBubble(props: { msg: Message; isLast: boolean }) {
  const slide = useTween(slideTween)
  const isUser = () => props.msg.sender === 'You'

  return (
    <div style={{
      display: 'flex',
      'flex-direction': 'column',
      'align-items': isUser() ? 'flex-end' : 'flex-start',
      padding: '4px 16px',
      transform: props.isLast ? `translateY(${slide()}px)` : undefined,
      opacity: props.isLast ? String(1 - slide() / 30) : '1',
    }}>
      <div style={{ 'font-size': '11px', color: props.msg.color, 'font-weight': '600', 'margin-bottom': '2px', padding: '0 4px' }}>
        {props.msg.sender}
      </div>
      <div style={{
        background: isUser() ? '#4361ee' : '#2d2d44',
        color: '#fff', padding: '10px 16px', 'border-radius': '16px',
        'max-width': '70%', 'font-size': '14px', 'line-height': '1.5',
        'border-bottom-right-radius': isUser() ? '4px' : '16px',
        'border-bottom-left-radius': isUser() ? '16px' : '4px',
      }}>
        {props.msg.text}
      </div>
      <div style={{ display: 'flex', 'align-items': 'center', gap: '6px', padding: '2px 4px' }}>
        <span style={{ 'font-size': '10px', color: '#666' }}>
          {new Date(props.msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <Show when={isUser()}>
          <span style={{ 'font-size': '10px', color: props.msg.read ? '#00b894' : '#666' }}>
            {props.msg.read ? '\u2713\u2713' : '\u2713'}
          </span>
        </Show>
      </div>
    </div>
  )
}

export default function App() {
  const emit = useEmit()
  const msgs = useSignal(messages)
  const typing = useSignal(typingIndicators)
  let inputRef!: HTMLInputElement
  let scrollRef!: HTMLDivElement

  // Auto-scroll on new messages
  engine.on(MessageAdded, () => {
    setTimeout(() => { if (scrollRef) scrollRef.scrollTop = scrollRef.scrollHeight }, 50)
  })

  const handleSend = () => {
    const text = inputRef.value.trim()
    if (!text) return
    emit(SendMessage, text)
    inputRef.value = ''
  }

  return (
    <div style={{
      'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      height: '100vh', display: 'flex', 'flex-direction': 'column', background: '#1a1a2e',
    }}>
      <style>{`
        @keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
      `}</style>

      {/* Header */}
      <div style={{ background: '#16213e', padding: '16px 24px', display: 'flex', 'align-items': 'center', gap: '12px', 'border-bottom': '1px solid #2d2d44' }}>
        <div style={{ width: '40px', height: '40px', 'border-radius': '50%', background: '#4361ee', display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'font-size': '18px', color: '#fff' }}>
          \u2709
        </div>
        <div>
          <div style={{ color: '#fff', 'font-size': '16px', 'font-weight': '600' }}>Team Chat</div>
          <div style={{ color: '#888', 'font-size': '12px' }}>Alice, Bob, and You</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: '1', overflow: 'auto', padding: '16px 0' }}>
        <For each={msgs()}>
          {(msg, i) => <MessageBubble msg={msg} isLast={i() === msgs().length - 1} />}
        </For>

        {/* Typing indicators */}
        <For each={BOTS}>
          {(bot) => (
            <Show when={typing()[bot.name]}>
              <TypingIndicator name={bot.name} color={bot.color} />
            </Show>
          )}
        </For>
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', background: '#16213e', display: 'flex', gap: '12px', 'border-top': '1px solid #2d2d44' }}>
        <input
          ref={inputRef}
          placeholder="Type a message..."
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          style={{
            flex: '1', padding: '12px 16px', background: '#2d2d44', border: 'none',
            'border-radius': '24px', color: '#fff', 'font-size': '14px', outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          style={{
            background: '#4361ee', border: 'none', 'border-radius': '50%',
            width: '44px', height: '44px', cursor: 'pointer', color: '#fff',
            'font-size': '18px', display: 'flex', 'align-items': 'center', 'justify-content': 'center',
          }}
        >\u2191</button>
      </div>
    </div>
  )
}
