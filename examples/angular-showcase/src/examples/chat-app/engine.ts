// DAG
// SendMessage ──→ MessagesChanged
//             └──→ UnreadCountChanged
// MarkRead ──→ MessagesChanged
//          └──→ UnreadCountChanged

import { createEngine } from '@pulse/core'

export const engine = createEngine()

export interface Message { id: string; sender: string; text: string; timestamp: number; read: boolean }
export type TypingUser = string

const BOT_NAMES = ['Alice', 'Bob']
const BOT_MESSAGES = ['Hey! How are you doing?', 'Have you tried the new Pulse engine?', 'I love the reactive event-driven architecture!', 'The animations are so smooth.', 'Did you see the new devtools?', 'TypeScript support is excellent.', 'Working on something exciting today!', 'The event system is really flexible.', 'Just deployed a new feature.', 'Check out the new examples!']
let messageId = 0

export const SendMessage = engine.event<{ text: string; sender: string }>('SendMessage')
export const MarkRead = engine.event<string>('MarkRead')
export const MessagesChanged = engine.event<Message[]>('MessagesChanged')
export const TypingUsersChanged = engine.event<Set<TypingUser>>('TypingUsersChanged')
export const UnreadCountChanged = engine.event<number>('UnreadCountChanged')

let messages: Message[] = []
let typingUsers = new Set<TypingUser>()
let unreadCount = 0

engine.on(SendMessage, [MessagesChanged, UnreadCountChanged], ({ text, sender }, setMessages, setUnread) => {
  const msg: Message = { id: `msg-${++messageId}`, sender, text, timestamp: Date.now(), read: sender === 'You' }
  messages = [...messages, msg]
  if (!msg.read) unreadCount++
  setMessages(messages)
  setUnread(unreadCount)
})

engine.on(MarkRead, [MessagesChanged, UnreadCountChanged], (id, setMessages, setUnread) => {
  messages = messages.map((m) => (m.id === id ? { ...m, read: true } : m))
  unreadCount = Math.max(0, unreadCount - 1)
  setMessages(messages)
  setUnread(unreadCount)
})

let botInterval: ReturnType<typeof setInterval> | null = null
export function startBots() {
  if (botInterval) return
  botInterval = setInterval(() => {
    const bot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
    const msg = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)]
    typingUsers = new Set([...typingUsers, bot]); engine.emit(TypingUsersChanged, typingUsers)
    setTimeout(() => {
      typingUsers = new Set([...typingUsers]); typingUsers.delete(bot); engine.emit(TypingUsersChanged, typingUsers)
      engine.emit(SendMessage, { text: msg, sender: bot })
    }, 1500 + Math.random() * 2000)
  }, 4000 + Math.random() * 3000)
}
export function stopBots() { if (botInterval) { clearInterval(botInterval); botInterval = null } }

export function startLoop() { startBots() }
export function stopLoop() { stopBots() }
