import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ---------------------------------------------------------------------------
// DAG (3 levels deep)
// ---------------------------------------------------------------------------
// NotifyInfo ──→ NotificationsChanged ──→ NotificationCountChanged
// NotifySuccess ──→ NotificationsChanged ──→ NotificationCountChanged
// NotifyWarning ──→ NotificationsChanged ──→ NotificationCountChanged
// NotifyError ──→ NotificationsChanged ──→ NotificationCountChanged
// DismissNotification ──→ NotificationsChanged ──→ NotificationCountChanged
// DismissAll ──→ DismissNotification (per notification)
//
// EnterDone ──→ NotificationsChanged (clear entering flag)
// ExitStart ──→ NotificationsChanged (mark exiting)
// ExitDone ──→ NotificationsChanged (remove)
// ---------------------------------------------------------------------------

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export interface NotificationData { title: string; message: string }
export interface Notification { id: string; type: NotificationType; title: string; message: string; timestamp: number; entering: boolean; exiting: boolean }

export const NotifyInfo = engine.event<NotificationData>('NotifyInfo')
export const NotifySuccess = engine.event<NotificationData>('NotifySuccess')
export const NotifyWarning = engine.event<NotificationData>('NotifyWarning')
export const NotifyError = engine.event<NotificationData>('NotifyError')
export const DismissNotification = engine.event<string>('DismissNotification')
export const DismissAll = engine.event<void>('DismissAll')

// Internal transition events (async triggers)
const EnterDone = engine.event<string>('EnterDone')
const ExitStart = engine.event<string>('ExitStart')
const ExitDone = engine.event<string>('ExitDone')

export const NotificationsChanged = engine.event<Notification[]>('NotificationsChanged')
export const NotificationCountChanged = engine.event<number>('NotificationCountChanged')

let notifications: Notification[] = []
let nextId = 0

const PRIORITY: Record<NotificationType, number> = { error: 0, warning: 1, success: 2, info: 3 }

function sortByPriority(items: Notification[]): Notification[] {
  return [...items].sort((a, b) => { const pd = PRIORITY[a.type] - PRIORITY[b.type]; return pd !== 0 ? pd : a.timestamp - b.timestamp })
}

function addNotification(type: NotificationType, data: NotificationData, setNotifs: (v: Notification[]) => void) {
  const notif: Notification = { id: `notif-${++nextId}`, type, title: data.title, message: data.message, timestamp: Date.now(), entering: true, exiting: false }
  notifications = sortByPriority([...notifications, notif])
  setNotifs([...notifications])
  setTimeout(() => engine.emit(EnterDone, notif.id), 50)
  const delays: Record<NotificationType, number | null> = { info: 5000, success: 5000, warning: 10000, error: null }
  const delay = delays[type]
  if (delay !== null) setTimeout(() => engine.emit(ExitStart, notif.id), delay)
}

// Layer 0 -> Layer 1: Input -> NotificationsChanged
engine.on(NotifyInfo, [NotificationsChanged], (d, setNotifs) => addNotification('info', d, setNotifs))
engine.on(NotifySuccess, [NotificationsChanged], (d, setNotifs) => addNotification('success', d, setNotifs))
engine.on(NotifyWarning, [NotificationsChanged], (d, setNotifs) => addNotification('warning', d, setNotifs))
engine.on(NotifyError, [NotificationsChanged], (d, setNotifs) => addNotification('error', d, setNotifs))

engine.on(DismissNotification, [NotificationsChanged], (id, setNotifs) => {
  if (!notifications.find(n => n.id === id && !n.exiting)) return
  notifications = notifications.map(n => n.id === id ? { ...n, exiting: true } : n)
  setNotifs([...notifications])
  setTimeout(() => engine.emit(ExitDone, id), 400)
})

engine.on(DismissAll, () => { for (const n of notifications) if (!n.exiting) engine.emit(DismissNotification, n.id) })

// Internal transition handlers -> NotificationsChanged
engine.on(EnterDone, [NotificationsChanged], (id, setNotifs) => {
  notifications = notifications.map(n => n.id === id ? { ...n, entering: false } : n)
  setNotifs([...notifications])
})

engine.on(ExitStart, [NotificationsChanged], (id, setNotifs) => {
  if (!notifications.find(n => n.id === id && !n.exiting)) return
  notifications = notifications.map(n => n.id === id ? { ...n, exiting: true } : n)
  setNotifs([...notifications])
  setTimeout(() => engine.emit(ExitDone, id), 400)
})

engine.on(ExitDone, [NotificationsChanged], (id, setNotifs) => {
  notifications = notifications.filter(n => n.id !== id)
  setNotifs([...notifications])
})

// Layer 1 -> Layer 2: NotificationsChanged -> NotificationCountChanged (derived)
engine.on(NotificationsChanged, [NotificationCountChanged], (notifs, setCount) => {
  setCount(notifs.length)
})

export function startLoop() {}
export function stopLoop() {}

export function resetState() {
  notifications = []
  nextId = 0
}
