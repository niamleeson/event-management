import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Middleware: log all non-frame events
// ---------------------------------------------------------------------------

engine.use((event) => {
  if (event.type.name !== '__frame__') {
    console.log(`[Pulse] ${event.type.name}`, event.payload)
  }
  return event
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Message {
  id: string
  text: string
  sender: string
  timestamp: number
  read: boolean
}

export interface SendPayload {
  text: string
  sender: string
}

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const MessageSent = engine.event<SendPayload>('MessageSent')
export const MessageReceived = engine.event<Message>('MessageReceived')
export const TypingStarted = engine.event<string>('TypingStarted')
export const TypingStopped = engine.event<string>('TypingStopped')
export const MessageRead = engine.event<string>('MessageRead')
export const BotReply = engine.event<void>('BotReply')
export const NewMessageAnim = engine.event<void>('NewMessageAnim')
export const NewMessageAnimDone = engine.event<void>('NewMessageAnimDone')
export const BadgeBounce = engine.event<void>('BadgeBounce')
export const BadgeBounceDone = engine.event<void>('BadgeBounceDone')
export const ScrollTarget = engine.event<void>('ScrollTarget')

// State change events
export const MessagesChanged = engine.event<Message[]>('MessagesChanged')
export const TypingUsersChanged = engine.event<string[]>('TypingUsersChanged')
export const UnreadCountChanged = engine.event<number>('UnreadCountChanged')

// ---------------------------------------------------------------------------
// Tween: new message slide-in animation
// ---------------------------------------------------------------------------


// Badge bounce tween

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Pipes: MessageSent -> MessageReceived (for user's own message)
// Then simulate bot typing and reply
// ---------------------------------------------------------------------------


// When a message is received, trigger animation
engine.on(MessageReceived, () => {
  engine.emit(NewMessageAnim, undefined)
})

// When unread count changes (non-zero), bounce badge
engine.on(MessageReceived, (msg) => {
  if (msg.sender !== 'You') {
    engine.emit(BadgeBounce, undefined)
  }
})

// Bot responses
const botReplies: Record<string, string[]> = {
  'Bot Alice': [
    'That sounds interesting!',
    'I agree with you on that.',
    'Have you considered the alternatives?',
    'Let me think about that for a moment...',
    'Great point! Here is what I think...',
    'Thanks for sharing that!',
    'I was just thinking the same thing.',
    'Could you elaborate on that?',
  ],
  'Bot Bob': [
    'Hey, that is cool!',
    'I have a different perspective on this.',
    'Absolutely! Count me in.',
    'Not sure I follow, can you explain?',
    'That reminds me of something...',
    'Ha, good one!',
    'I will get back to you on that.',
    'Interesting approach!',
  ],
}

function getRandomReply(bot: string): string {
  const replies = botReplies[bot] ?? ['...']
  return replies[Math.floor(Math.random() * replies.length)]
}

// Simulate bot replies when user sends a message
engine.on(MessageSent, (payload) => {
  if (payload.sender !== 'You') return

  // Randomly pick 1 or 2 bots to reply
  const bots = ['Bot Alice', 'Bot Bob']
  const respondingBots = bots.filter(() => Math.random() > 0.3)
  if (respondingBots.length === 0) respondingBots.push(bots[0])

  respondingBots.forEach((bot, i) => {
    const delay = 1000 + Math.random() * 2000 + i * 1500

    // Start typing
    setTimeout(() => {
      engine.emit(TypingStarted, bot)
    }, 500 + i * 800)

    // Send reply after delay
    setTimeout(() => {
      engine.emit(TypingStopped, bot)
      engine.emit(MessageReceived, {
        id: crypto.randomUUID(),
        text: getRandomReply(bot),
        sender: bot,
        timestamp: Date.now(),
        read: false,
      })
    }, delay)
  })
})

// Start frame loop for animations
