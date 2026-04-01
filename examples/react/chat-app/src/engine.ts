import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ---------------------------------------------------------------------------
// DAG (3 levels deep)
// ---------------------------------------------------------------------------
// MessageSent ──→ MessageReceived ──→ MessagesChanged ──→ UnreadCountChanged
//             └──→ (bot responses: TypingStarted → TypingUsersChanged,
//                                  TypingStopped → TypingUsersChanged,
//                                  MessageReceived)
// MessageRead ──→ UnreadCountChanged
// TypingStarted ──→ TypingUsersChanged
// TypingStopped ──→ TypingUsersChanged
// ---------------------------------------------------------------------------

export interface Message { id: string; text: string; sender: string; timestamp: number; read: boolean }
export interface SendPayload { text: string; sender: string }

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

// Layer 0: User / external input events
export const MessageSent = engine.event<SendPayload>('MessageSent')
export const TypingStarted = engine.event<string>('TypingStarted')
export const TypingStopped = engine.event<string>('TypingStopped')
export const MessageRead = engine.event<string>('MessageRead')

// Layer 1: Intermediate state events
export const MessageReceived = engine.event<Message>('MessageReceived')

// Layer 2: Primary collection state
export const MessagesChanged = engine.event<Message[]>('MessagesChanged')
export const TypingUsersChanged = engine.event<string[]>('TypingUsersChanged')

// Layer 3: Derived count (from messages)
export const UnreadCountChanged = engine.event<number>('UnreadCountChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let messages: Message[] = []
let typingUsers: string[] = []
let unreadCount = 0

// ---------------------------------------------------------------------------
// Layer 0 → Layer 1: Input → intermediate (MessageSent → MessageReceived)
// ---------------------------------------------------------------------------

engine.on(MessageSent).emit(MessageReceived, (payload) => ({
  id: crypto.randomUUID(),
  text: payload.text,
  sender: payload.sender,
  timestamp: Date.now(),
  read: true,
}))

// ---------------------------------------------------------------------------
// Layer 1 → Layer 2: Intermediate → primary state
// ---------------------------------------------------------------------------

engine.on(MessageReceived, [MessagesChanged], (msg, setMessages) => {
  messages = [...messages, msg]
  setMessages([...messages])
})

engine.on(TypingStarted, [TypingUsersChanged], (user, setTyping) => {
  if (!typingUsers.includes(user)) { typingUsers = [...typingUsers, user]; setTyping([...typingUsers]) }
})

engine.on(TypingStopped, [TypingUsersChanged], (user, setTyping) => {
  typingUsers = typingUsers.filter(u => u !== user)
  setTyping([...typingUsers])
})

// ---------------------------------------------------------------------------
// Layer 2 → Layer 3: Primary state → derived counts
// ---------------------------------------------------------------------------

engine.on(MessagesChanged, [UnreadCountChanged], (msgs, setUnread) => {
  // Count unread from non-self senders
  const lastMsg = msgs[msgs.length - 1]
  if (lastMsg && lastMsg.sender !== 'You') {
    unreadCount++
    setUnread(unreadCount)
  }
})

engine.on(MessageRead, [UnreadCountChanged], (_, setUnread) => {
  unreadCount = 0
  setUnread(0)
})

// ---------------------------------------------------------------------------
// Bot responses (side effects from MessageSent)
// ---------------------------------------------------------------------------

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

export function startLoop() {}
export function stopLoop() {}
