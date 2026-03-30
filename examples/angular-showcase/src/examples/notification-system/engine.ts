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
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTO_DISMISS_MS = 4000

const TYPE_CONFIG: Record<NotificationType, { color: string; icon: string }> = {
  success: { color: '#06d6a0', icon: 'V' },
  error: { color: '#ef476f', icon: 'X' },
  warning: { color: '#ffd166', icon: '!' },
  info: { color: '#4361ee', icon: 'i' },
}

export { TYPE_CONFIG }

let nextId = 0

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const AddNotification = engine.event<Omit<Notification, 'id' | 'timestamp'>>('AddNotification')
export const DismissNotification = engine.event<string>('DismissNotification')
export const NotificationAdded = engine.event<Notification>('NotificationAdded')
export const NotificationRemoved = engine.event<string>('NotificationRemoved')

// Per-notification entrance/exit tweens
export const NotifEnter: EventType<void>[] = []
export const NotifEnterDone: EventType<void>[] = []
export const NotifExit: EventType<void>[] = []
export const NotifExitDone: EventType<void>[] = []
export const notifOpacity: TweenValue[] = []
export const notifTranslateX: TweenValue[] = []

// Pre-allocate tween slots (max 20 simultaneous notifications)
const MAX_NOTIFS = 20
for (let i = 0; i < MAX_NOTIFS; i++) {
  NotifEnter.push(engine.event<void>(`NotifEnter_${i}`))
  NotifEnterDone.push(engine.event<void>(`NotifEnterDone_${i}`))
  NotifExit.push(engine.event<void>(`NotifExit_${i}`))
  NotifExitDone.push(engine.event<void>(`NotifExitDone_${i}`))

  notifOpacity.push(engine.tween({
    start: NotifEnter[i],
    done: NotifEnterDone[i],
    from: 0,
    to: 1,
    duration: 300,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  }))

  notifTranslateX.push(engine.tween({
    start: NotifEnter[i],
    from: 100,
    to: 0,
    duration: 300,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  }))
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const notifications = engine.signal<Notification[]>(
  NotificationAdded,
  [],
  (prev, notif) => [...prev, notif],
)

engine.signalUpdate(notifications, NotificationRemoved, (prev, id) =>
  prev.filter((n) => n.id !== id),
)

// ---------------------------------------------------------------------------
// Pipes
// ---------------------------------------------------------------------------

engine.on(AddNotification, (data) => {
  const notif: Notification = {
    ...data,
    id: `notif-${++nextId}`,
    timestamp: Date.now(),
  }
  engine.emit(NotificationAdded, notif)

  // Trigger entrance tween
  const slot = nextId % MAX_NOTIFS
  engine.emit(NotifEnter[slot], undefined)

  // Auto-dismiss
  if (data.autoDismiss) {
    setTimeout(() => {
      engine.emit(DismissNotification, notif.id)
    }, AUTO_DISMISS_MS)
  }
})

engine.pipe(DismissNotification, NotificationRemoved, (id) => id)

// ---------------------------------------------------------------------------
// Spring: stack reflow positions
// ---------------------------------------------------------------------------

export const stackPositions = engine.signal<number[]>(
  NotificationAdded,
  [],
  (prev) => [...prev, 0].map((_, i) => i),
)

engine.signalUpdate(stackPositions, NotificationRemoved, (prev) =>
  prev.slice(0, -1).map((_, i) => i),
)

// Start frame loop
engine.startFrameLoop()
