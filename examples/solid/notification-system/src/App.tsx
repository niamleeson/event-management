import { For, Show, onMount, onCleanup } from 'solid-js'
import { useSignal, useEmit, useTween } from '@pulse/solid'
import type { Signal, TweenValue, EventType } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: number
  type: NotificationType
  title: string
  message: string
  createdAt: number
  dismissing: boolean
}

/* ------------------------------------------------------------------ */
/*  Config                                                            */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string; bg: string }> = {
  success: { icon: '\u2713', color: '#00b894', bg: '#00b89415' },
  error: { icon: '\u2717', color: '#d63031', bg: '#d6303115' },
  warning: { icon: '\u26A0', color: '#fdcb6e', bg: '#fdcb6e15' },
  info: { icon: '\u2139', color: '#0984e3', bg: '#0984e315' },
}

const AUTO_DISMISS_MS = 5000
const MAX_VISIBLE = 6

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const AddNotification = engine.event<{ type: NotificationType; title: string; message: string }>('AddNotification')
const DismissNotification = engine.event<number>('DismissNotification')
const DismissAll = engine.event('DismissAll')
const NotificationAdded = engine.event<Notification>('NotificationAdded')
const FloodDemo = engine.event('FloodDemo')

// Entrance/exit tweens
const EntranceStart = engine.event('EntranceStart')
const ExitStart = engine.event('ExitStart')

const entranceTween: TweenValue = engine.tween({
  start: EntranceStart,
  from: -100,
  to: 0,
  duration: 400,
  easing: 'easeOutBack',
})

const exitTween: TweenValue = engine.tween({
  start: ExitStart,
  from: 0,
  to: 100,
  duration: 300,
  easing: 'easeOut',
})

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let nextId = 0

const notifications = engine.signal<Notification[]>(
  NotificationAdded, [],
  (prev, notif) => [notif, ...prev].slice(0, MAX_VISIBLE * 2),
)

engine.signalUpdate(notifications, DismissNotification, (prev, id) =>
  prev.map(n => n.id === id ? { ...n, dismissing: true } : n)
)

engine.signalUpdate(notifications, DismissAll, (prev) =>
  prev.map(n => ({ ...n, dismissing: true }))
)

// Actually remove after exit animation
engine.on(DismissNotification, (id) => {
  setTimeout(() => {
    notifications._set(notifications.value.filter(n => n.id !== id))
  }, 350)
})

engine.on(DismissAll, () => {
  setTimeout(() => { notifications._set([]) }, 350)
})

/* ------------------------------------------------------------------ */
/*  Add notification logic                                            */
/* ------------------------------------------------------------------ */

engine.on(AddNotification, ({ type, title, message }) => {
  const notif: Notification = {
    id: nextId++, type, title, message,
    createdAt: Date.now(), dismissing: false,
  }
  engine.emit(NotificationAdded, notif)
  engine.emit(EntranceStart, undefined)

  // Auto-dismiss
  setTimeout(() => {
    engine.emit(DismissNotification, notif.id)
  }, AUTO_DISMISS_MS)
})

/* ------------------------------------------------------------------ */
/*  Flood demo                                                        */
/* ------------------------------------------------------------------ */

engine.on(FloodDemo, () => {
  const types: NotificationType[] = ['success', 'error', 'warning', 'info']
  const messages = [
    { title: 'Deployment Complete', message: 'v2.4.1 is now live in production' },
    { title: 'Build Failed', message: 'TypeScript compilation error in module.ts' },
    { title: 'High CPU Usage', message: 'Server load exceeds 85% threshold' },
    { title: 'New Update Available', message: 'Version 3.0 includes breaking changes' },
    { title: 'Payment Processed', message: 'Invoice #1234 has been paid' },
    { title: 'Connection Lost', message: 'WebSocket disconnected from server' },
    { title: 'Low Disk Space', message: 'Only 2.3GB remaining on primary drive' },
    { title: 'User Registered', message: 'New team member added to workspace' },
  ]

  messages.forEach((msg, i) => {
    setTimeout(() => {
      engine.emit(AddNotification, {
        type: types[i % types.length],
        title: msg.title,
        message: msg.message,
      })
    }, i * 400)
  })
})

// Spring reflow for stack repositioning
const stackOffset = engine.signal<number>(NotificationAdded, 0, () => 0)
const stackSpring = engine.spring(stackOffset, { stiffness: 200, damping: 22 })

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function NotificationCard(props: { notif: Notification; index: number }) {
  const emit = useEmit()
  const entrance = useTween(entranceTween)
  const n = props.notif
  const config = TYPE_CONFIG[n.type]
  const isNew = () => props.index === 0 && !n.dismissing

  return (
    <div style={{
      display: 'flex', gap: '12px', padding: '14px 16px',
      background: n.dismissing ? 'rgba(255,255,255,0.02)' : config.bg,
      border: `1px solid ${config.color}33`,
      'border-radius': '12px',
      'margin-bottom': '8px',
      transform: isNew() ? `translateX(${entrance()}px)` : n.dismissing ? 'translateX(100px)' : 'translateX(0)',
      opacity: n.dismissing ? '0' : '1',
      transition: n.dismissing ? 'all 0.3s ease-out' : undefined,
      'max-width': '380px',
    }}>
      {/* Icon */}
      <div style={{
        width: '32px', height: '32px', 'border-radius': '50%',
        background: config.color + '22', color: config.color,
        display: 'flex', 'align-items': 'center', 'justify-content': 'center',
        'font-size': '14px', 'flex-shrink': '0',
      }}>{config.icon}</div>

      {/* Content */}
      <div style={{ flex: '1', 'min-width': '0' }}>
        <div style={{ 'font-size': '13px', 'font-weight': '600', color: '#fff', 'margin-bottom': '2px' }}>
          {n.title}
        </div>
        <div style={{ 'font-size': '12px', color: '#999', 'line-height': '1.4' }}>
          {n.message}
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => emit(DismissNotification, n.id)}
        style={{
          background: 'none', border: 'none', color: '#666', cursor: 'pointer',
          'font-size': '16px', padding: '0', 'line-height': '1', 'flex-shrink': '0',
        }}
      >\u2715</button>
    </div>
  )
}

export default function App() {
  const emit = useEmit()
  const notifs = useSignal(notifications)

  return (
    <div style={{
      'min-height': '100vh', padding: '40px', display: 'flex', 'flex-direction': 'column',
      'align-items': 'center', 'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <h1 style={{ 'font-size': '28px', 'font-weight': '300', 'letter-spacing': '2px', 'margin-bottom': '32px' }}>
        Notification System
      </h1>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', 'margin-bottom': '40px', 'flex-wrap': 'wrap', 'justify-content': 'center' }}>
        <button
          onClick={() => emit(AddNotification, { type: 'success', title: 'Success!', message: 'Operation completed successfully.' })}
          style={{ padding: '10px 20px', 'border-radius': '8px', border: 'none', background: '#00b894', color: '#fff', cursor: 'pointer', 'font-size': '13px', 'font-weight': '500' }}
        >Success</button>
        <button
          onClick={() => emit(AddNotification, { type: 'error', title: 'Error!', message: 'Something went wrong. Please try again.' })}
          style={{ padding: '10px 20px', 'border-radius': '8px', border: 'none', background: '#d63031', color: '#fff', cursor: 'pointer', 'font-size': '13px', 'font-weight': '500' }}
        >Error</button>
        <button
          onClick={() => emit(AddNotification, { type: 'warning', title: 'Warning', message: 'This action cannot be undone.' })}
          style={{ padding: '10px 20px', 'border-radius': '8px', border: 'none', background: '#fdcb6e', color: '#333', cursor: 'pointer', 'font-size': '13px', 'font-weight': '500' }}
        >Warning</button>
        <button
          onClick={() => emit(AddNotification, { type: 'info', title: 'Info', message: 'Here is some useful information.' })}
          style={{ padding: '10px 20px', 'border-radius': '8px', border: 'none', background: '#0984e3', color: '#fff', cursor: 'pointer', 'font-size': '13px', 'font-weight': '500' }}
        >Info</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', 'margin-bottom': '40px' }}>
        <button
          onClick={() => emit(FloodDemo, undefined)}
          style={{ padding: '10px 20px', 'border-radius': '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', 'font-size': '13px' }}
        >Flood Demo (8 notifications)</button>
        <button
          onClick={() => emit(DismissAll, undefined)}
          style={{ padding: '10px 20px', 'border-radius': '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', 'font-size': '13px' }}
        >Dismiss All</button>
      </div>

      {/* Notification stack */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', 'z-index': '1000' }}>
        <For each={notifs().slice(0, MAX_VISIBLE)}>
          {(notif, i) => <NotificationCard notif={notif} index={i()} />}
        </For>
        <Show when={notifs().length > MAX_VISIBLE}>
          <div style={{ 'text-align': 'center', 'font-size': '12px', color: '#666', padding: '4px' }}>
            +{notifs().length - MAX_VISIBLE} more
          </div>
        </Show>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.3)', 'font-size': '13px', 'margin-top': 'auto' }}>
        Notifications auto-dismiss after {AUTO_DISMISS_MS / 1000}s &middot; Spring-based stack reflow
      </p>
    </div>
  )
}
