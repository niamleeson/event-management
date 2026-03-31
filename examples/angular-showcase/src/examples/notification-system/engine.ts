import { createEngine } from '@pulse/core'

export const engine = createEngine()
export type NotificationType = 'success' | 'error' | 'warning' | 'info'
export interface Notification { id: string; type: NotificationType; title: string; message: string; timestamp: number; autoDismiss: boolean }

const AUTO_DISMISS_MS = 4000
const TYPE_CONFIG: Record<NotificationType, { color: string; icon: string }> = {
  success: { color: '#06d6a0', icon: 'V' }, error: { color: '#ef476f', icon: 'X' }, warning: { color: '#ffd166', icon: '!' }, info: { color: '#4361ee', icon: 'i' },
}
export { TYPE_CONFIG }
let nextId = 0

export const AddNotification = engine.event<Omit<Notification, 'id' | 'timestamp'>>('AddNotification')
export const DismissNotification = engine.event<string>('DismissNotification')
export const NotificationsChanged = engine.event<Notification[]>('NotificationsChanged')

let notifications: Notification[] = []

engine.on(AddNotification, (data) => {
  const notif: Notification = { ...data, id: `notif-${++nextId}`, timestamp: Date.now() }
  notifications = [...notifications, notif]; engine.emit(NotificationsChanged, notifications)
  if (data.autoDismiss) setTimeout(() => engine.emit(DismissNotification, notif.id), AUTO_DISMISS_MS)
})

engine.on(DismissNotification, (id) => { notifications = notifications.filter((n) => n.id !== id); engine.emit(NotificationsChanged, notifications) })
