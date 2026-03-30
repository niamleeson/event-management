import { createEngine, type TweenValue } from '@pulse/core'

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
export const NewMessageAnim = engine.event<void>('NewMessageAnim')
export const NewMessageAnimDone = engine.event<void>('NewMessageAnimDone')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const messages = engine.signal<Message[]>(
  MessageReceived, [], (prev, msg) => [...prev, msg],
)

engine.signalUpdate(messages, MarkAsRead, (prev, id) =>
  prev.map((m) => m.id === id ? { ...m, read: true } : m),
)

export const typingIndicators = engine.signal<Record<string, boolean>>(
  BotTypingStart, {}, (prev, sender) => ({ ...prev, [sender]: true }),
)
engine.signalUpdate(typingIndicators, BotTypingEnd, (prev, sender) => ({ ...prev, [sender]: false }))

export const unreadCount = engine.signal<number>(
  MessageReceived, 0, (prev) => prev + 1,
)
engine.signalUpdate(unreadCount, MarkAsRead, (prev) => Math.max(0, prev - 1))

// ---------------------------------------------------------------------------
// Tweens — message entrance animation
// ---------------------------------------------------------------------------

export const messageSlideIn: TweenValue = engine.tween({
  start: NewMessageAnim,
  done: NewMessageAnimDone,
  from: 20,
  to: 0,
  duration: 300,
  easing: (t: number) => 1 - Math.pow(1 - t, 3),
})

export const messageOpacity: TweenValue = engine.tween({
  start: NewMessageAnim,
  from: 0,
  to: 1,
  duration: 300,
  easing: (t: number) => t,
})

// ---------------------------------------------------------------------------
// Bot logic — respond to user messages
// ---------------------------------------------------------------------------

engine.on(SendMessage, ({ text }) => {
  // Add user message
  const userMsg: Message = {
    id: `msg-${Date.now()}-user`,
    sender: 'You',
    text,
    timestamp: Date.now(),
    read: true,
  }
  engine.emit(MessageReceived, userMsg)
  engine.emit(NewMessageAnim, undefined)

  // Random bot responds after typing delay
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
    engine.emit(NewMessageAnim, undefined)

    // Sometimes the other bot also responds
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
          engine.emit(NewMessageAnim, undefined)
        }, 800 + Math.random() * 1500)
      }, 500)
    }
  }, delay)
})

// Start frame loop for tweens
engine.startFrameLoop()
