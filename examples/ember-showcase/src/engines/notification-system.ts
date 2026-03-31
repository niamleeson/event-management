import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  autoDismiss: boolean
  duration: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_VISIBLE = 5
export const DEFAULT_DURATION = 4000

export const TYPE_STYLES: Record<NotificationType, { bg: string; border: string; icon: string; color: string }> = {
  success: { bg: '#ecfdf3', border: '#a6f4c5', icon: '\u2713', color: '#065f46' },
  error: { bg: '#fef3f2', border: '#fecdca', icon: '\u2717', color: '#b42318' },
  warning: { bg: '#fef3c7', border: '#fde68a', icon: '\u26A0', color: '#92400e' },
  info: { bg: '#eff6ff', border: '#bfdbfe', icon: '\u2139', color: '#1e40af' },
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const ShowNotification = engine.event<Notification>('ShowNotification')
export const DismissNotification = engine.event<string>('DismissNotification')
export const DismissAll = engine.event<void>('DismissAll')
export const PauseAutoDismiss = engine.event<string>('PauseAutoDismiss')
export const ResumeAutoDismiss = engine.event<string>('ResumeAutoDismiss')
export const NotificationsChanged = engine.event<void>('NotificationsChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _notifications: Notification[] = []
let _pausedNotifications = new Set<string>()
let _totalShown = 0
let _totalDismissed = 0

export function getNotifications(): Notification[] { return _notifications }
export function getPausedNotifications(): Set<string> { return _pausedNotifications }
export function getTotalShown(): number { return _totalShown }
export function getTotalDismissed(): number { return _totalDismissed }

// ---------------------------------------------------------------------------
// Auto-dismiss timers
// ---------------------------------------------------------------------------

const dismissTimers: Record<string, ReturnType<typeof setTimeout>> = {}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(ShowNotification, (notif: Notification) => {
  _notifications = [notif, ..._notifications].slice(0, MAX_VISIBLE * 2)
  _totalShown++
  engine.emit(NotificationsChanged, undefined)

  if (notif.autoDismiss) {
    dismissTimers[notif.id] = setTimeout(() => {
      if (!_pausedNotifications.has(notif.id)) {
        engine.emit(DismissNotification, notif.id)
      }
    }, notif.duration)
  }
})

engine.on(DismissNotification, (id: string) => {
  _notifications = _notifications.filter((n) => n.id !== id)
  _totalDismissed++
  if (dismissTimers[id]) {
    clearTimeout(dismissTimers[id])
    delete dismissTimers[id]
  }
  engine.emit(NotificationsChanged, undefined)
})

engine.on(DismissAll, () => {
  _totalDismissed += _notifications.length
  _notifications = []
  for (const id of Object.keys(dismissTimers)) {
    clearTimeout(dismissTimers[id])
    delete dismissTimers[id]
  }
  engine.emit(NotificationsChanged, undefined)
})

engine.on(PauseAutoDismiss, (id: string) => {
  _pausedNotifications = new Set(_pausedNotifications)
  _pausedNotifications.add(id)
  if (dismissTimers[id]) {
    clearTimeout(dismissTimers[id])
    delete dismissTimers[id]
  }
})

engine.on(ResumeAutoDismiss, (id: string) => {
  _pausedNotifications = new Set(_pausedNotifications)
  _pausedNotifications.delete(id)
  const notif = _notifications.find((n) => n.id === id)
  if (notif?.autoDismiss) {
    dismissTimers[id] = setTimeout(() => {
      engine.emit(DismissNotification, id)
    }, 2000)
  }
})

// Helper
export function notify(type: NotificationType, title: string, message: string, autoDismiss = true): void {
  engine.emit(ShowNotification, {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    message,
    timestamp: Date.now(),
    autoDismiss,
    duration: DEFAULT_DURATION,
  })
}
