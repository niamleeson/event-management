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

export interface TypingIndicator {
  sender: string
  active: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BOTS = [
  { name: 'Alice', color: '#4361ee', avatar: 'A' },
  { name: 'Bob', color: '#e76f51', avatar: 'B' },
]

const BOT_RESPONSES: Record<string, string[]> = {
  Alice: [
    'That sounds interesting! Tell me more.',
    'I agree, Pulse is great for handling complex state.',
    'Have you tried using springs for animations?',
    'The event-driven architecture makes everything so clean.',
    'Let me think about that for a moment...',
    'Great point! I hadn\'t considered that.',
  ],
  Bob: [
    'Interesting perspective! I see it differently.',
    'The DAG-based propagation is really powerful.',
    'I\'ve been experimenting with join rules.',
    'Async handling with cancellation is a game changer.',
    'That reminds me of something I read about ECS.',
    'Absolutely! The type safety is excellent.',
  ],
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const SendMessage = engine.event<{ text: string }>('SendMessage')
export const MessageReceived = engine.event<Message>('MessageReceived')
export const BotTypingStart = engine.event<string>('BotTypingStart')
export const BotTypingEnd = engine.event<string>('BotTypingEnd')
export const MarkAsRead = engine.event<string>('MarkAsRead')
export const MessagesChanged = engine.event<void>('MessagesChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _messages: Message[] = []
let _typingIndicators: Record<string, boolean> = {}
let _unreadCount = 0

export function getMessages(): Message[] { return _messages }
export function getTypingIndicators(): Record<string, boolean> { return _typingIndicators }
export function getUnreadCount(): number { return _unreadCount }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(MessageReceived, (msg: Message) => {
  _messages = [..._messages, msg]
  if (!msg.read) _unreadCount++
  engine.emit(MessagesChanged, undefined)
})

engine.on(MarkAsRead, (id: string) => {
  _messages = _messages.map((m) => m.id === id ? { ...m, read: true } : m)
  _unreadCount = Math.max(0, _unreadCount - 1)
  engine.emit(MessagesChanged, undefined)
})

engine.on(BotTypingStart, (sender: string) => {
  _typingIndicators = { ..._typingIndicators, [sender]: true }
  engine.emit(MessagesChanged, undefined)
})

engine.on(BotTypingEnd, (sender: string) => {
  _typingIndicators = { ..._typingIndicators, [sender]: false }
  engine.emit(MessagesChanged, undefined)
})

// Bot logic
engine.on(SendMessage, ({ text }) => {
  const userMsg: Message = {
    id: `msg-${Date.now()}-user`,
    sender: 'You',
    text,
    timestamp: Date.now(),
    read: true,
  }
  engine.emit(MessageReceived, userMsg)

  const bot = BOTS[Math.floor(Math.random() * BOTS.length)]
  const responses = BOT_RESPONSES[bot.name]
  const response = responses[Math.floor(Math.random() * responses.length)]
  const delay = 1000 + Math.random() * 2000

  engine.emit(BotTypingStart, bot.name)

  setTimeout(() => {
    engine.emit(BotTypingEnd, bot.name)
    const botMsg: Message = {
      id: `msg-${Date.now()}-${bot.name}`,
      sender: bot.name,
      text: response,
      timestamp: Date.now(),
      read: false,
    }
    engine.emit(MessageReceived, botMsg)

    if (Math.random() > 0.5) {
      const otherBot = BOTS.find((b) => b.name !== bot.name)!
      const otherResponses = BOT_RESPONSES[otherBot.name]
      const otherResponse = otherResponses[Math.floor(Math.random() * otherResponses.length)]

      setTimeout(() => {
        engine.emit(BotTypingStart, otherBot.name)
        setTimeout(() => {
          engine.emit(BotTypingEnd, otherBot.name)
          const otherMsg: Message = {
            id: `msg-${Date.now()}-${otherBot.name}`,
            sender: otherBot.name,
            text: otherResponse,
            timestamp: Date.now(),
            read: false,
          }
          engine.emit(MessageReceived, otherMsg)
        }, 800 + Math.random() * 1500)
      }, 500)
    }
  }, delay)
})
