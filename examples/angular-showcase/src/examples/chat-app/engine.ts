import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Message {
  id: string
  sender: string
  text: string
  timestamp: number
  read: boolean
}

export type TypingUser = string

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BOT_NAMES = ['Alice', 'Bob']
const BOT_MESSAGES = [
  'Hey! How are you doing?',
  'Have you tried the new Pulse engine?',
  'I love the reactive event-driven architecture!',
  'The spring animations are so smooth.',
  'Did you see the new devtools?',
  'TypeScript support is excellent.',
  'Working on something exciting today!',
  'The tween system is really flexible.',
  'Just deployed a new feature.',
  'Check out the new examples!',
]

let messageId = 0

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const SendMessage = engine.event<{ text: string; sender: string }>('SendMessage')
export const MessageReceived = engine.event<Message>('MessageReceived')
export const StartTyping = engine.event<TypingUser>('StartTyping')
export const StopTyping = engine.event<TypingUser>('StopTyping')
export const MarkRead = engine.event<string>('MarkRead')

// Animation events
export const MessageEnter = engine.event<string>('MessageEnter')
export const MessageEnterDone = engine.event<string>('MessageEnterDone')

// ---------------------------------------------------------------------------
// Pipes
// ---------------------------------------------------------------------------

engine.pipe(SendMessage, MessageReceived, ({ text, sender }) => ({
  id: `msg-${++messageId}`,
  sender,
  text,
  timestamp: Date.now(),
  read: sender === 'You',
}))

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const messages = engine.signal<Message[]>(
  MessageReceived,
  [],
  (prev, msg) => [...prev, msg],
)

engine.signalUpdate(messages, MarkRead, (prev, id) =>
  prev.map((m) => (m.id === id ? { ...m, read: true } : m)),
)

export const typingUsers = engine.signal<Set<TypingUser>>(
  StartTyping,
  new Set(),
  (prev, user) => new Set([...prev, user]),
)
engine.signalUpdate(typingUsers, StopTyping, (prev, user) => {
  const next = new Set(prev)
  next.delete(user)
  return next
})

export const unreadCount = engine.signal<number>(
  MessageReceived,
  0,
  (prev, msg) => msg.read ? prev : prev + 1,
)
engine.signalUpdate(unreadCount, MarkRead, (prev) => Math.max(0, prev - 1))

// ---------------------------------------------------------------------------
// Tween: message entrance
// ---------------------------------------------------------------------------

export const messageEntrance = engine.tween({
  start: MessageEnter,
  done: MessageEnterDone,
  from: 0,
  to: 1,
  duration: 300,
  easing: (t: number) => 1 - Math.pow(1 - t, 3),
})

// ---------------------------------------------------------------------------
// Bot simulation
// ---------------------------------------------------------------------------

let botInterval: ReturnType<typeof setInterval> | null = null

export function startBots() {
  if (botInterval) return
  botInterval = setInterval(() => {
    const bot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
    const msg = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)]

    // Show typing
    engine.emit(StartTyping, bot)
    setTimeout(() => {
      engine.emit(StopTyping, bot)
      engine.emit(SendMessage, { text: msg, sender: bot })
      engine.emit(MessageEnter, `msg-${messageId + 1}`)
    }, 1500 + Math.random() * 2000)
  }, 4000 + Math.random() * 3000)
}

export function stopBots() {
  if (botInterval) {
    clearInterval(botInterval)
    botInterval = null
  }
}

// Start frame loop
engine.startFrameLoop()
