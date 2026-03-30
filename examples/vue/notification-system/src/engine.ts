import { createEngine } from '@pulse/core'
import type { Signal, TweenValue, SpringValue } from '@pulse/core'

export const engine = createEngine()
engine.startFrameLoop()

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type Priority = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: number
  title: string
  message: string
  priority: Priority
  createdAt: number
  dismissAt: number
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

export const PRIORITY_COLORS: Record<Priority, string> = {
  info: '#0984e3',
  success: '#00b894',
  warning: '#fdcb6e',
  error: '#d63031',
}

export const PRIORITY_ICONS: Record<Priority, string> = {
  info: '\u2139',
  success: '\u2713',
  warning: '\u26A0',
  error: '\u2717',
}

const AUTO_DISMISS_MS: Record<Priority, number> = {
  info: 4000,
  success: 3000,
  warning: 6000,
  error: 8000,
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const AddNotification = engine.event<{ title: string; message: string; priority: Priority }>('AddNotification')
export const DismissNotification = engine.event<number>('DismissNotification')
export const NotificationAdded = engine.event<Notification>('NotificationAdded')
export const FloodNotifications = engine.event('FloodNotifications')
export const ReflowUpdated = engine.event('ReflowUpdated')

/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */

let nextId = 1

export const notifications: Signal<Notification[]> = engine.signal(
  NotificationAdded,
  [] as Notification[],
  (prev, notif) => [notif, ...prev].slice(0, 20),
)
engine.signalUpdate(notifications, DismissNotification, (prev, id) => prev.filter(n => n.id !== id))

/* ------------------------------------------------------------------ */
/*  Entrance/exit tweens (pool of 20 slots)                           */
/* ------------------------------------------------------------------ */

export const entranceTweens: TweenValue[] = []
const entranceStarts = []

for (let i = 0; i < 20; i++) {
  const start = engine.event(`NotifEntrance_${i}`)
  entranceStarts.push(start)
  entranceTweens.push(engine.tween({
    start,
    from: -100,
    to: 0,
    duration: 300,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  }))
}

/* ------------------------------------------------------------------ */
/*  Spring-driven reflow                                              */
/* ------------------------------------------------------------------ */

export const reflowTargets: Signal<number>[] = []
export const reflowSprings: SpringValue[] = []

for (let i = 0; i < 20; i++) {
  const target = engine.signal(ReflowUpdated, 0 as number, () => i * 90)
  reflowTargets.push(target)
  reflowSprings.push(engine.spring(target, { stiffness: 200, damping: 22 }))
}

/* ------------------------------------------------------------------ */
/*  Pipes                                                             */
/* ------------------------------------------------------------------ */

engine.on(AddNotification, ({ title, message, priority }) => {
  const now = Date.now()
  const notif: Notification = {
    id: nextId++,
    title,
    message,
    priority,
    createdAt: now,
    dismissAt: now + AUTO_DISMISS_MS[priority],
  }
  engine.emit(NotificationAdded, notif)

  const idx = 0 // new notifications go to top
  if (entranceStarts[idx]) engine.emit(entranceStarts[idx], undefined)
  engine.emit(ReflowUpdated, undefined)

  // Auto-dismiss
  setTimeout(() => {
    engine.emit(DismissNotification, notif.id)
    engine.emit(ReflowUpdated, undefined)
  }, AUTO_DISMISS_MS[priority])
})

/* ------------------------------------------------------------------ */
/*  Flood: spawn 10 random notifications rapidly                      */
/* ------------------------------------------------------------------ */

const FLOOD_TITLES = ['System Alert', 'Update Available', 'Task Complete', 'New Message', 'Warning']
const FLOOD_MESSAGES = [
  'Something happened in the system.',
  'A new version is ready to install.',
  'Your background task completed.',
  'You received a new notification.',
  'Resource usage is getting high.',
]

engine.on(FloodNotifications, () => {
  const priorities: Priority[] = ['info', 'success', 'warning', 'error']
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      engine.emit(AddNotification, {
        title: FLOOD_TITLES[Math.floor(Math.random() * FLOOD_TITLES.length)],
        message: FLOOD_MESSAGES[Math.floor(Math.random() * FLOOD_MESSAGES.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
      })
    }, i * 200)
  }
})
