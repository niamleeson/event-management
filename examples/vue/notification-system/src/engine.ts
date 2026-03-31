import { createEngine } from '@pulse/core'
export const engine = createEngine()
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

const PRIORITY_COLORS: Record<Priority, string> = {
  info: '#0984e3',
  success: '#00b894',
  warning: '#fdcb6e',
  error: '#d63031',
}

const PRIORITY_ICONS: Record<Priority, string> = {
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

/* ------------------------------------------------------------------ */
/*  State-changed events                                              */
/* ------------------------------------------------------------------ */

export const NotificationsChanged = engine.event<Notification[]>('NotificationsChanged')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let nextId = 1
let notifications: Notification[] = []

engine.on(NotificationAdded, (notif) => {
  notifications = [notif, ...notifications].slice(0, 20)
  engine.emit(NotificationsChanged, notifications)
})
engine.on(DismissNotification, (id) => {
  notifications = notifications.filter(n => n.id !== id)
  engine.emit(NotificationsChanged, notifications)
})

/* ------------------------------------------------------------------ */
/*  Add notification logic                                            */
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

  // Auto-dismiss
  setTimeout(() => {
    engine.emit(DismissNotification, notif.id)
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

/* ------------------------------------------------------------------ */
/*  Initial values                                                    */
/* ------------------------------------------------------------------ */

export function getNotifications() { return notifications }

export { PRIORITY_COLORS, PRIORITY_ICONS }
