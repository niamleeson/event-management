import { createEngine } from '@pulse/core'
import type { Signal, TweenValue } from '@pulse/core'

export const engine = createEngine()
engine.startFrameLoop()

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
export const SlideInStart = engine.event<number>('SlideInStart')
export const SlideInDone = engine.event<number>('SlideInDone')

/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */

let nextId = 1
function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

export const messages: Signal<Message[]> = engine.signal(MessageReceived, [] as Message[], (prev, msg) => [...prev, msg])

export const typing: Signal<TypingState> = engine.signal(TypingStarted, {} as TypingState, (prev, user) => ({ ...prev, [user]: true }))
engine.signalUpdate(typing, TypingStopped, (prev, user) => ({ ...prev, [user]: false }))

export const unreadCount: Signal<number> = engine.signal(MessageReceived, 0, (prev) => prev + 1)
engine.signalUpdate(unreadCount, MarkRead, () => 0)

/* ------------------------------------------------------------------ */
/*  Slide-in tweens (pool of 50 reusable slots)                       */
/* ------------------------------------------------------------------ */

export const slideInTweens: TweenValue[] = []
const slideStarts = []

for (let i = 0; i < 50; i++) {
  const start = engine.event(`SlideIn_${i}`)
  slideStarts.push(start)
  slideInTweens.push(engine.tween({
    start,
    from: 40,
    to: 0,
    duration: 300,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  }))
}

/* ------------------------------------------------------------------ */
/*  Message sending pipe                                              */
/* ------------------------------------------------------------------ */

engine.on(SendMessage, (text) => {
  const msg: Message = { id: nextId++, sender: 'You', text, time: now(), read: true }
  engine.emit(MessageReceived, msg)

  const idx = (msg.id - 1) % 50
  if (slideStarts[idx]) engine.emit(slideStarts[idx], undefined)

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
      const bidx = (botMsg.id - 1) % 50
      if (slideStarts[bidx]) engine.emit(slideStarts[bidx], undefined)
    }, delay)
  })
})
