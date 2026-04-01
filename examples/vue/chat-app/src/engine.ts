// DAG
// MessageReceived ──→ MessagesChanged
//                 └──→ UnreadCountChanged
// TypingStarted ──→ TypingChanged
// TypingStopped ──→ TypingChanged
// MarkRead ──→ UnreadCountChanged
// SendMessage ──→ MessageReceived
//            └──→ TypingStarted (bot, delayed)
//            └──→ TypingStopped (bot, delayed)

import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface Message {
  id: number
  sender: string
  text: string
  time: string
  read: boolean
}

export interface TypingState {
  [user: string]: boolean
}

/* ------------------------------------------------------------------ */
/*  Bot data                                                          */
/* ------------------------------------------------------------------ */

const BOT_RESPONSES: Record<string, string[]> = {
  'Alice Bot': [
    'That sounds great!', 'I totally agree.', 'Interesting perspective!',
    'Let me think about that...', 'Absolutely!', 'Good point.',
    'I was just thinking the same thing!', 'Tell me more about that.',
  ],
  'Bob Bot': [
    'Hmm, not sure about that.', 'Could you elaborate?', 'Nice one!',
    'I have a different take on this.', 'That makes sense.', 'Brilliant idea!',
    'Let me check on that.', 'I see what you mean.',
  ],
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const SendMessage = engine.event<string>('SendMessage')
export const MessageReceived = engine.event<Message>('MessageReceived')
export const TypingStarted = engine.event<string>('TypingStarted')
export const TypingStopped = engine.event<string>('TypingStopped')
export const MarkRead = engine.event<number>('MarkRead')

/* ------------------------------------------------------------------ */
/*  State-changed events                                              */
/* ------------------------------------------------------------------ */

export const MessagesChanged = engine.event<Message[]>('MessagesChanged')
export const TypingChanged = engine.event<TypingState>('TypingChanged')
export const UnreadCountChanged = engine.event<number>('UnreadCountChanged')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let nextId = 1
function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

let messages: Message[] = []
let typing: TypingState = {}
let unreadCount = 0

// Messages state
engine.on(MessageReceived, [MessagesChanged], (msg, setMsgs) => {
  messages = [...messages, msg]
  setMsgs(messages)
})

// Typing state
engine.on(TypingStarted, [TypingChanged], (user, setTyping) => {
  typing = { ...typing, [user]: true }
  setTyping(typing)
})
engine.on(TypingStopped, [TypingChanged], (user, setTyping) => {
  typing = { ...typing, [user]: false }
  setTyping(typing)
})

// Unread count state
engine.on(MessageReceived, [UnreadCountChanged], (_msg, setUnread) => {
  unreadCount = unreadCount + 1
  setUnread(unreadCount)
})
engine.on(MarkRead, [UnreadCountChanged], (_payload, setUnread) => {
  unreadCount = 0
  setUnread(unreadCount)
})

/* ------------------------------------------------------------------ */
/*  Message sending                                                   */
/* ------------------------------------------------------------------ */

engine.on(SendMessage, [MessageReceived], (text, setMsg) => {
  const msg: Message = { id: nextId++, sender: 'You', text, time: now(), read: true }
  setMsg(msg)

  // Bot auto-responses with typing indicators
  const bots = ['Alice Bot', 'Bob Bot']
  bots.forEach((bot, bi) => {
    const delay = 1000 + bi * 1500 + Math.random() * 1000
    setTimeout(() => engine.emit(TypingStarted, bot), delay - 800)
    setTimeout(() => {
      engine.emit(TypingStopped, bot)
      const responses = BOT_RESPONSES[bot]
      const text = responses[Math.floor(Math.random() * responses.length)]
      const botMsg: Message = { id: nextId++, sender: bot, text, time: now(), read: false }
      engine.emit(MessageReceived, botMsg)
    }, delay)
  })
})

/* ------------------------------------------------------------------ */
/*  Initial values                                                    */
/* ------------------------------------------------------------------ */

export function getMessages() { return messages }
export function getTyping() { return typing }
export function getUnreadCount() { return unreadCount }

export function startLoop() {}
export function stopLoop() {}
