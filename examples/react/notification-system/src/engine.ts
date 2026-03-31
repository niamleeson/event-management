import { createEngine } from '@pulse/core'

export const engine = createEngine()

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export interface NotificationData { title: string; message: string }
export interface Notification { id: string; type: NotificationType; title: string; message: string; timestamp: number; entering: boolean; exiting: boolean }

export const NotifyInfo = engine.event<NotificationData>('NotifyInfo')
export const NotifySuccess = engine.event<NotificationData>('NotifySuccess')
export const NotifyWarning = engine.event<NotificationData>('NotifyWarning')
export const NotifyError = engine.event<NotificationData>('NotifyError')
export const DismissNotification = engine.event<string>('DismissNotification')
export const DismissAll = engine.event<void>('DismissAll')

export const NotificationsChanged = engine.event<Notification[]>('NotificationsChanged')
export const NotificationCountChanged = engine.event<number>('NotificationCountChanged')

let notifications: Notification[] = []
let nextId = 0

const PRIORITY: Record<NotificationType, number> = { error: 0, warning: 1, success: 2, info: 3 }

function sortByPriority(items: Notification[]): Notification[] {
  return [...items].sort((a, b) => { const pd = PRIORITY[a.type] - PRIORITY[b.type]; return pd !== 0 ? pd : a.timestamp - b.timestamp })
}

function emitState() { engine.emit(NotificationsChanged, [...notifications]); engine.emit(NotificationCountChanged, notifications.length) }

function addNotification(type: NotificationType, data: NotificationData) {
  const notif: Notification = { id: `notif-${++nextId}`, type, title: data.title, message: data.message, timestamp: Date.now(), entering: true, exiting: false }
  notifications = sortByPriority([...notifications, notif]); emitState()
  setTimeout(() => { notifications = notifications.map(n => n.id === notif.id ? { ...n, entering: false } : n); emitState() }, 50)
  const delays: Record<NotificationType, number | null> = { info: 5000, success: 5000, warning: 10000, error: null }
  const delay = delays[type]
  if (delay !== null) setTimeout(() => startExit(notif.id), delay)
}

function startExit(id: string) {
  if (!notifications.find(n => n.id === id && !n.exiting)) return
  notifications = notifications.map(n => n.id === id ? { ...n, exiting: true } : n); emitState()
  setTimeout(() => { notifications = notifications.filter(n => n.id !== id); emitState() }, 400)
}

engine.on(NotifyInfo, (d) => addNotification('info', d))
engine.on(NotifySuccess, (d) => addNotification('success', d))
engine.on(NotifyWarning, (d) => addNotification('warning', d))
engine.on(NotifyError, (d) => addNotification('error', d))
engine.on(DismissNotification, (id) => startExit(id))
engine.on(DismissAll, () => { for (const n of notifications) if (!n.exiting) startExit(n.id) })
