import { usePulse, useEmit } from '@pulse/solid'
import {
  NotificationsChanged,
  NotifyInfo,
  NotifySuccess,
  NotifyWarning,
  NotifyError,
  DismissNotification,
  DismissAll,
} from './engine'
import type { Notification, NotificationType } from './engine'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 5

const TYPE_COLORS: Record<NotificationType, { bg: string; border: string; icon: string }> = {
  info: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', icon: '#3b82f6' },
  success: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', icon: '#22c55e' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', icon: '#f59e0b' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', icon: '#ef4444' },
}

const TYPE_ICONS: Record<NotificationType, string> = {
  info: '\u2139',
  success: '\u2713',
  warning: '\u26A0',
  error: '\u2717',
}

// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------

function NotificationItem({
  notif,
  index,
  onDismiss,
}: {
  notif: Notification
  index: number
  onDismiss: (id: string) => void
}) {
  const colors = TYPE_COLORS[notif.type]
  const icon = TYPE_ICONS[notif.type]

  const isEntering = notif.entering
  const isExiting = notif.exiting

  return (
    <div
      style={{
        position: 'relative',
        padding: '14px 44px 14px 16px',
        'border-radius': 12,
        background: colors.bg,
        'backdrop-filter': 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${colors.border}`,
        'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.12)',
        transform: isEntering
          ? 'translateX(120%)'
          : isExiting
            ? 'translateX(120%) scale(0.95)'
            : 'translateX(0)',
        opacity: isEntering ? 0 : isExiting ? 0 : 1,
        transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease',
        'margin-bottom': 10,
        'min-width': 320,
        'max-width': 400,
      }}
    >
      <div style={{ display: 'flex', 'align-items': 'flex-start', gap: 10 }}>
        <span
          style={{
            'font-size': 18,
            color: colors.icon,
            'line-height': 1,
            'margin-top': 2,
            'font-weight': 700,
          }}
        >
          {icon}
        </span>
        <div style={{ flex: 1, 'min-width': 0 }}>
          <div
            style={{
              'font-weight': 600,
              'font-size': 14,
              color: '#e2e8f0',
              'margin-bottom': 2,
            }}
          >
            {notif.title}
          </div>
          <div style={{ 'font-size': 13, color: '#94a3b8', 'line-height': 1.4 }}>
            {notif.message}
          </div>
        </div>
      </div>
      <button
        onClick={() => onDismiss(notif.id)}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'none',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          'font-size': 16,
          'line-height': 1,
          padding: '2px 6px',
          'border-radius': 4,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#e2e8f0'
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#64748b'
          e.currentTarget.style.background = 'none'
        }}
      >
        \u2715
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const allNotifications = usePulse(NotificationsChanged, [] as Notification[])
  const count = usePulse(NotificationCountChanged, 0)

  const visibleNotifications = allNotifications().slice(0, MAX_VISIBLE)
  const queuedCount = Math.max(0, allNotifications().length - MAX_VISIBLE)

  const handleDismiss = (id: string) => emit(DismissNotification, id)
  const handleFlood = () => {
    const types: Array<{ event: typeof NotifyInfo; type: string }> = [
      { event: NotifyInfo, type: 'Info' },
      { event: NotifySuccess, type: 'Success' },
      { event: NotifyWarning, type: 'Warning' },
      { event: NotifyError, type: 'Error' },
    ]
    for (let i = 0; i < 20; i++) {
      const t = types[i % types.length]
      setTimeout(
        () =>
          emit(t.event, {
            title: `${t.type} #${i + 1}`,
            message: `Flood notification message number ${i + 1}`,
          }),
        i * 80,
      )
    }
  }

  return (
    <div
      style={{
        'min-height': '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        'font-family':
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: 40,
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ 'max-width': 600, margin: '0 auto', 'text-align': 'center' }}>
        <h1
          style={{
            'font-size': 32,
            'font-weight': 800,
            color: '#f1f5f9',
            'margin-bottom': 8,
          }}
        >
          Notification System
        </h1>
        <p style={{ color: '#64748b', 'font-size': 14, 'margin-bottom': 40 }}>
          Toast notifications with priority ordering, auto-dismiss, and animated
          transitions. Max {MAX_VISIBLE} visible at a time.
        </p>

        {/* Control buttons */}
        <div
          style={{
            display: 'flex',
            'flex-wrap': 'wrap',
            gap: 10,
            'justify-content': 'center',
            'margin-bottom': 20,
          }}
        >
          <ControlButton
            label="Info"
            color="#3b82f6"
            onClick={() =>
              emit(NotifyInfo, {
                title: 'Information',
                message: 'This is an informational notification that will auto-dismiss in 5 seconds.',
              })
            }
          />
          <ControlButton
            label="Success"
            color="#22c55e"
            onClick={() =>
              emit(NotifySuccess, {
                title: 'Success!',
                message: 'Operation completed successfully. This dismisses in 5 seconds.',
              })
            }
          />
          <ControlButton
            label="Warning"
            color="#f59e0b"
            onClick={() =>
              emit(NotifyWarning, {
                title: 'Warning',
                message: 'Something needs your attention. This stays for 10 seconds.',
              })
            }
          />
          <ControlButton
            label="Error"
            color="#ef4444"
            onClick={() =>
              emit(NotifyError, {
                title: 'Error',
                message: 'Something went wrong! This notification stays until dismissed manually.',
              })
            }
          />
          <ControlButton
            label="Flood (20)"
            color="#8b5cf6"
            onClick={handleFlood}
          />
          <ControlButton
            label="Dismiss All"
            color="#64748b"
            onClick={() => emit(DismissAll, undefined)}
          />
        </div>

        {/* Stats */}
        <div style={{ color: '#475569', 'font-size': 13 }}>
          Active: {count}
          {queuedCount > 0 && (
            <span style={{ 'margin-left': 12 }}>
              Queued: {queuedCount}
            </span>
          )}
        </div>
      </div>

      {/* Notification stack (top-right) */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          'z-index': 1000,
          display: 'flex',
          'flex-direction': 'column',
        }}
      >
        {visibleNotifications.map((notif, i) => (
          <NotificationItem
            notif={notif}
            index={i}
            onDismiss={handleDismiss}
          />
        ))}
        {queuedCount > 0 && (
          <div
            style={{
              'text-align': 'center',
              color: '#475569',
              'font-size': 12,
              'margin-top': 4,
            }}
          >
            +{queuedCount} more queued
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ControlButton
// ---------------------------------------------------------------------------

function ControlButton({
  label,
  color,
  onClick,
}: {
  label: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        'border-radius': 10,
        border: `1px solid ${color}40`,
        background: `${color}20`,
        color: color,
        'font-size': 14,
        'font-weight': 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${color}35`
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${color}20`
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {label}
    </button>
  )
}
