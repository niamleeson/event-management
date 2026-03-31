import { createEngine } from '@pulse/core'

export const engine = createEngine()

export interface Message { id: string; text: string; sender: string; timestamp: number; read: boolean }
export interface SendPayload { text: string; sender: string }

// Events
export const MessageSent = engine.event<SendPayload>('MessageSent')
export const MessageReceived = engine.event<Message>('MessageReceived')
export const TypingStarted = engine.event<string>('TypingStarted')
export const TypingStopped = engine.event<string>('TypingStopped')
export const MessageRead = engine.event<string>('MessageRead')

// State change events
export const MessagesChanged = engine.event<Message[]>('MessagesChanged')
export const TypingUsersChanged = engine.event<string[]>('TypingUsersChanged')
export const UnreadCountChanged = engine.event<number>('UnreadCountChanged')

// State
let messages: Message[] = []
let typingUsers: string[] = []
let unreadCount = 0

// MessageSent -> MessageReceived (user's own msg)
engine.on(MessageSent, (payload) => {
  engine.emit(MessageReceived, { id: crypto.randomUUID(), text: payload.text, sender: payload.sender, timestamp: Date.now(), read: true })
})

engine.on(MessageReceived, (msg) => {
  messages = [...messages, msg]
  engine.emit(MessagesChanged, [...messages])
  if (msg.sender !== 'You') { unreadCount++; engine.emit(UnreadCountChanged, unreadCount) }
})

engine.on(TypingStarted, (user) => {
  if (!typingUsers.includes(user)) { typingUsers = [...typingUsers, user]; engine.emit(TypingUsersChanged, [...typingUsers]) }
})

engine.on(TypingStopped, (user) => {
  typingUsers = typingUsers.filter(u => u !== user)
  engine.emit(TypingUsersChanged, [...typingUsers])
})

engine.on(MessageRead, () => { unreadCount = 0; engine.emit(UnreadCountChanged, 0) })

// Bot responses
const botReplies: Record<string, string[]> = {
  'Bot Alice': ['That sounds interesting!','I agree with you on that.','Have you considered the alternatives?','Let me think about that for a moment...','Great point! Here is what I think...','Thanks for sharing that!','I was just thinking the same thing.','Could you elaborate on that?'],
  'Bot Bob': ['Hey, that is cool!','I have a different perspective on this.','Absolutely! Count me in.','Not sure I follow, can you explain?','That reminds me of something...','Ha, good one!','I will get back to you on that.','Interesting approach!'],
}

function getRandomReply(bot: string): string { const r = botReplies[bot] ?? ['...']; return r[Math.floor(Math.random() * r.length)] }

engine.on(MessageSent, (payload) => {
  if (payload.sender !== 'You') return
  const bots = ['Bot Alice', 'Bot Bob']
  const responding = bots.filter(() => Math.random() > 0.3)
  if (responding.length === 0) responding.push(bots[0])
  responding.forEach((bot, i) => {
    const delay = 1000 + Math.random() * 2000 + i * 1500
    setTimeout(() => engine.emit(TypingStarted, bot), 500 + i * 800)
    setTimeout(() => { engine.emit(TypingStopped, bot); engine.emit(MessageReceived, { id: crypto.randomUUID(), text: getRandomReply(bot), sender: bot, timestamp: Date.now(), read: false }) }, delay)
  })
})
