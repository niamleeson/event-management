import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// NotifyInfo    ──┬──→ NotificationsChanged
//                 └──→ CountChanged
//
// NotifySuccess ──┬──→ NotificationsChanged
//                 └──→ CountChanged
//
// NotifyWarning ──┬──→ NotificationsChanged
//                 └──→ CountChanged
//
// NotifyError   ──┬──→ NotificationsChanged
//                 └──→ CountChanged
//
// DismissNotification ──┬──→ NotificationsChanged
//                       └──→ CountChanged
//
// DismissAll ──→ DismissNotification (per notification)

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface NotificationData {
  title: string
  message: string
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  entering: boolean
  exiting: boolean
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const NotifyInfo = engine.event<NotificationData>('NotifyInfo')
export const NotifySuccess = engine.event<NotificationData>('NotifySuccess')
export const NotifyWarning = engine.event<NotificationData>('NotifyWarning')
export const NotifyError = engine.event<NotificationData>('NotifyError')
export const DismissNotification = engine.event<string>('DismissNotification')
export const DismissAll = engine.event<void>('DismissAll')

// State change events
export const NotificationsChanged = engine.event<Notification[]>('NotificationsChanged')
export const CountChanged = engine.event<number>('CountChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let notifications: Notification[] = []
let nextId = 0

const PRIORITY: Record<NotificationType, number> = {
  error: 0, warning: 1, success: 2, info: 3,
}

function sortByPriority(items: Notification[]): Notification[] {
  return [...items].sort((a, b) => {
    const pd = PRIORITY[a.type] - PRIORITY[b.type]
    if (pd !== 0) return pd
    return a.timestamp - b.timestamp
  })
}

function emitState() {
  engine.emit(NotificationsChanged, [...notifications])
  engine.emit(CountChanged, notifications.length)
}

function addNotification(type: NotificationType, data: NotificationData) {
  const notif: Notification = {
    id: `notif-${++nextId}`, type,
    title: data.title, message: data.message,
    timestamp: Date.now(), entering: true, exiting: false,
  }
  notifications = sortByPriority([...notifications, notif])
  emitState()

  setTimeout(() => {
    notifications = notifications.map((n) => n.id === notif.id ? { ...n, entering: false } : n)
    emitState()
  }, 50)

  const delays: Record<NotificationType, number | null> = { info: 5000, success: 5000, warning: 10000, error: null }
  const delay = delays[type]
  if (delay !== null) {
    setTimeout(() => dismiss(notif.id), delay)
  }
}

function dismiss(id: string) {
  const found = notifications.find((n) => n.id === id)
  if (!found || found.exiting) return
  notifications = notifications.map((n) => n.id === id ? { ...n, exiting: true } : n)
  emitState()
  setTimeout(() => {
    notifications = notifications.filter((n) => n.id !== id)
    emitState()
  }, 400)
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

engine.on(NotifyInfo, (data) => addNotification('info', data))
engine.on(NotifySuccess, (data) => addNotification('success', data))
engine.on(NotifyWarning, (data) => addNotification('warning', data))
engine.on(NotifyError, (data) => addNotification('error', data))
engine.on(DismissNotification, dismiss)
engine.on(DismissAll, () => {
  for (const n of [...notifications]) {
    if (!n.exiting) dismiss(n.id)
  }
})

export function startLoop() {}
export function stopLoop() {}
