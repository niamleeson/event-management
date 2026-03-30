import { createEngine, type EventType, type TweenValue } from '@pulse/core'

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
  duration: number // ms
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

// Per-notification animation events
export const NotifEnter: Record<string, EventType<void>> = {}
export const NotifEnterDone: Record<string, EventType<void>> = {}
export const NotifExit: Record<string, EventType<void>> = {}
export const NotifExitDone: Record<string, EventType<void>> = {}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const notifications = engine.signal<Notification[]>(
  ShowNotification, [],
  (prev, notif) => [notif, ...prev].slice(0, MAX_VISIBLE * 2),
)

engine.signalUpdate(notifications, DismissNotification, (prev, id) =>
  prev.filter((n) => n.id !== id),
)

engine.signalUpdate(notifications, DismissAll, () => [])

export const pausedNotifications = engine.signal<Set<string>>(
  PauseAutoDismiss, new Set(),
  (prev, id) => { const s = new Set(prev); s.add(id); return s },
)
engine.signalUpdate(pausedNotifications, ResumeAutoDismiss, (prev, id) => {
  const s = new Set(prev); s.delete(id); return s
})

export const totalShown = engine.signal<number>(
  ShowNotification, 0, (prev) => prev + 1,
)

export const totalDismissed = engine.signal<number>(
  DismissNotification, 0, (prev) => prev + 1,
)

// ---------------------------------------------------------------------------
// Tweens — entrance/exit per notification (dynamic)
// ---------------------------------------------------------------------------

export const notifTweens: Record<string, { slideIn: TweenValue; opacity: TweenValue }> = {}

export function createNotifTweens(id: string): { slideIn: TweenValue; opacity: TweenValue } {
  const enterEvt = engine.event<void>(`NotifEnter_${id}`)
  const enterDone = engine.event<void>(`NotifEnterDone_${id}`)
  NotifEnter[id] = enterEvt
  NotifEnterDone[id] = enterDone

  const slideIn = engine.tween({
    start: enterEvt,
    done: enterDone,
    from: -60,
    to: 0,
    duration: 300,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  })

  const opacity = engine.tween({
    start: enterEvt,
    from: 0,
    to: 1,
    duration: 200,
    easing: (t: number) => t,
  })

  notifTweens[id] = { slideIn, opacity }
  return { slideIn, opacity }
}

// ---------------------------------------------------------------------------
// Auto-dismiss logic
// ---------------------------------------------------------------------------

const dismissTimers: Record<string, ReturnType<typeof setTimeout>> = {}

engine.on(ShowNotification, (notif) => {
  // Create animation tweens
  createNotifTweens(notif.id)

  // Trigger entrance
  setTimeout(() => {
    if (NotifEnter[notif.id]) {
      engine.emit(NotifEnter[notif.id], undefined)
    }
  }, 10)

  // Auto-dismiss
  if (notif.autoDismiss) {
    dismissTimers[notif.id] = setTimeout(() => {
      if (!pausedNotifications.value.has(notif.id)) {
        engine.emit(DismissNotification, notif.id)
      }
    }, notif.duration)
  }
})

engine.on(PauseAutoDismiss, (id) => {
  if (dismissTimers[id]) {
    clearTimeout(dismissTimers[id])
    delete dismissTimers[id]
  }
})

engine.on(ResumeAutoDismiss, (id) => {
  const notif = notifications.value.find((n) => n.id === id)
  if (notif?.autoDismiss) {
    dismissTimers[id] = setTimeout(() => {
      engine.emit(DismissNotification, id)
    }, 2000) // shorter resume duration
  }
})

// Helper to create a notification
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

// Start frame loop for tweens
engine.startFrameLoop()
