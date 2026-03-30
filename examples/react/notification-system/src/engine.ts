import { createEngine, createSignal } from '@pulse/core'
import type { Signal } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

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
export const NotificationExpired = engine.event<string>('NotificationExpired')

// Internal events for animation orchestration
export const NotificationAdded = engine.event<Notification>('NotificationAdded')
export const NotificationEnterDone = engine.event<string>('NotificationEnterDone')
export const NotificationExitStart = engine.event<string>('NotificationExitStart')
export const NotificationRemoved = engine.event<string>('NotificationRemoved')
export const ReflowTrigger = engine.event<void>('ReflowTrigger')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextId = 0
function genId(): string {
  return `notif-${++nextId}`
}

const PRIORITY: Record<NotificationType, number> = {
  error: 0,
  warning: 1,
  success: 2,
  info: 3,
}

function sortByPriority(items: Notification[]): Notification[] {
  return [...items].sort((a, b) => {
    const pd = PRIORITY[a.type] - PRIORITY[b.type]
    if (pd !== 0) return pd
    return a.timestamp - b.timestamp
  })
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const notifications: Signal<Notification[]> = createSignal<Notification[]>([])
engine['_signals'].push(notifications)

export const notificationCount = engine.signal<number>(
  NotificationAdded,
  0,
  () => notifications.value.length,
)

// Keep notificationCount in sync on removal too
engine.on(NotificationRemoved, () => {
  notificationCount.set(notifications.value.length)
})

// ---------------------------------------------------------------------------
// Pipes: Notify* -> NotificationAdded
// ---------------------------------------------------------------------------

function makeNotification(type: NotificationType, data: NotificationData): Notification {
  return {
    id: genId(),
    type,
    title: data.title,
    message: data.message,
    timestamp: Date.now(),
    entering: true,
    exiting: false,
  }
}

engine.pipe(NotifyInfo, NotificationAdded, (data) => makeNotification('info', data))
engine.pipe(NotifySuccess, NotificationAdded, (data) => makeNotification('success', data))
engine.pipe(NotifyWarning, NotificationAdded, (data) => makeNotification('warning', data))
engine.pipe(NotifyError, NotificationAdded, (data) => makeNotification('error', data))

// ---------------------------------------------------------------------------
// On NotificationAdded: add to list, schedule auto-dismiss
// ---------------------------------------------------------------------------

engine.on(NotificationAdded, (notif) => {
  const current = notifications.value
  const updated = sortByPriority([...current, notif])
  notifications.set(updated)

  // Mark enter done after a frame cycle
  setTimeout(() => engine.emit(NotificationEnterDone, notif.id), 50)

  // Auto-dismiss timers
  const delays: Record<NotificationType, number | null> = {
    info: 5000,
    success: 5000,
    warning: 10000,
    error: null,
  }
  const delay = delays[notif.type]
  if (delay !== null) {
    setTimeout(() => engine.emit(NotificationExpired, notif.id), delay)
  }
})

// ---------------------------------------------------------------------------
// Enter done: mark entering = false
// ---------------------------------------------------------------------------

engine.on(NotificationEnterDone, (id) => {
  const current = notifications.value
  notifications.set(
    current.map((n) => (n.id === id ? { ...n, entering: false } : n)),
  )
})

// ---------------------------------------------------------------------------
// Expired -> start exit
// ---------------------------------------------------------------------------

engine.pipe(NotificationExpired, NotificationExitStart, (id) => id)

// ---------------------------------------------------------------------------
// Dismiss -> start exit
// ---------------------------------------------------------------------------

engine.pipe(DismissNotification, NotificationExitStart, (id) => id)

// ---------------------------------------------------------------------------
// DismissAll -> start exit for each
// ---------------------------------------------------------------------------

engine.on(DismissAll, () => {
  const current = notifications.value
  for (const n of current) {
    if (!n.exiting) {
      engine.emit(NotificationExitStart, n.id)
    }
  }
})

// ---------------------------------------------------------------------------
// Exit start: mark exiting, then remove after animation
// ---------------------------------------------------------------------------

engine.on(NotificationExitStart, (id) => {
  const current = notifications.value
  if (!current.find((n) => n.id === id)) return
  notifications.set(
    current.map((n) => (n.id === id ? { ...n, exiting: true } : n)),
  )
  // Remove after exit animation completes
  setTimeout(() => engine.emit(NotificationRemoved, id), 400)
})

// ---------------------------------------------------------------------------
// Remove: actually remove from array, trigger reflow
// ---------------------------------------------------------------------------

engine.on(NotificationRemoved, (id) => {
  const current = notifications.value
  notifications.set(current.filter((n) => n.id !== id))
  engine.emit(ReflowTrigger, undefined)
})

// ---------------------------------------------------------------------------
// Start frame loop for spring-driven reflow animations
// ---------------------------------------------------------------------------

engine.startFrameLoop()
