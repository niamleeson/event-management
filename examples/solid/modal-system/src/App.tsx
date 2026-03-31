import { onMount } from 'solid-js'
import { usePulse, useEmit } from '@pulse/solid'
import {
  ModalStackChanged,
  ActiveModalIdChanged,
  OpenModal,
  CloseModal,
  CloseAll,
  ConfirmAction,
  CancelAction,
} from './engine'
import type { ModalSize, ModalData } from './engine'

// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------

const SIZE_CONFIG: Record<ModalSize, { width: number; 'min-height': number }> = {
  small: { width: 360, 'min-height': 200 },
  medium: { width: 520, 'min-height': 300 },
  large: { width: 700, 'min-height': 400 },
}

// ---------------------------------------------------------------------------
// Modal component
// ---------------------------------------------------------------------------

function Modal({
  modal,
  index,
  total,
  isActive,
}: {
  modal: ModalData
  index: number
  total: number
  isActive: boolean
}) {
  const emit = useEmit()
  let dialogRef = null
  const config = SIZE_CONFIG[modal.size]

  // Focus trap
  onMount(() => {
    if (!isActive || !dialogRef) return

    const el = dialogRef
    const focusableElements = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    firstFocusable?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (!firstFocusable || !lastFocusable) return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    el.addEventListener('keydown', handleTab)
    return () => el.removeEventListener('keydown', handleTab)
  })

  // Escape to close
  onMount(() => {
    if (!isActive) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        emit(CloseModal, modal.id)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  })

  const isEntering = modal.state === 'entering'
  const isExiting = modal.state === 'exiting'
  const stackOffset = (total - 1 - index) * 8
  const dimFactor = isActive ? 1 : 0.92 - (total - 1 - index) * 0.04

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={modal.title}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: config.width,
        'min-height': config.minHeight,
        transform: isEntering
          ? `translate(-50%, -50%) scale(0.9)`
          : isExiting
            ? `translate(-50%, -50%) scale(0.9)`
            : `translate(-50%, calc(-50% - ${stackOffset}px)) scale(${dimFactor})`,
        opacity: isEntering ? 0 : isExiting ? 0 : isActive ? 1 : 0.8,
        transition:
          'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease',
        background: '#1e293b',
        'border-radius': 16,
        border: '1px solid #334155',
        'box-shadow': isActive
          ? '0 24px 64px rgba(0,0,0,0.4)'
          : '0 8px 24px rgba(0,0,0,0.2)',
        'z-index': 1000 + index,
        display: 'flex',
        'flex-direction': 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px 16px',
          'border-bottom': '1px solid #334155',
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
        }}
      >
        <h2
          style={{
            margin: 0,
            'font-size': 18,
            'font-weight': 700,
            color: '#f1f5f9',
          }}
        >
          {modal.title}
        </h2>
        <button
          onClick={() => emit(CloseModal, modal.id)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            'font-size': 18,
            padding: '4px 8px',
            'border-radius': 6,
            transition: 'all 0.15s',
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

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: 24,
          color: '#94a3b8',
          'font-size': 14,
          'line-height': 1.6,
        }}
      >
        <p>{modal.content}</p>

        {/* Demo: open another modal from within */}
        <button
          onClick={() => {
            const sizes: ModalSize[] = ['small', 'medium', 'large']
            const nextSize = sizes[(sizes.indexOf(modal.size) + 1) % sizes.length]
            const nextNum = total + 1
            emit(OpenModal, {
              id: `modal-${Date.now()}`,
              title: `Nested Modal #${nextNum}`,
              content: `This is a ${nextSize} modal opened from within "${modal.title}". You can keep stacking modals. Press Escape to close the top modal.`,
              size: nextSize,
            })
          }}
          style={{
            'margin-top': 16,
            padding: '8px 16px',
            'border-radius': 8,
            border: '1px solid #6366f140',
            background: '#6366f120',
            color: '#818cf8',
            'font-size': 13,
            'font-weight': 600,
            cursor: 'pointer',
          }}
        >
          Open Another Modal
        </button>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '16px 24px',
          'border-top': '1px solid #334155',
          display: 'flex',
          'justify-content': 'flex-end',
          gap: 10,
        }}
      >
        <button
          onClick={() => emit(CancelAction, modal.id)}
          style={{
            padding: '8px 20px',
            'border-radius': 8,
            border: '1px solid #475569',
            background: 'transparent',
            color: '#94a3b8',
            'font-size': 13,
            'font-weight': 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => emit(ConfirmAction, modal.id)}
          style={{
            padding: '8px 20px',
            'border-radius': 8,
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            'font-size': 13,
            'font-weight': 600,
            cursor: 'pointer',
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const stack = usePulse(ModalStackChanged, [] as ModalData[])
  const activeId = usePulse(ActiveModalIdChanged, null as string | null)

  let modalCounter = useRef(0)

  const handleOpen = 
    (size: ModalSize) => {
      modalCounter++
      const n = modalCounter
      emit(OpenModal, {
        id: `modal-${Date.now()}`,
        title: `Modal #${n}`,
        content: `This is a ${size} modal dialog. It supports focus trapping, stacking with visual offset, and animated entrance/exit transitions. Try opening another modal from inside, or pressing Escape to close.`,
        size,
      })
    }
  const hasModals = stack().length > 0
  const anyEntering = stack().some((m) => m.state === 'entering')
  const anyExiting = stack().some((m) => m.state === 'exiting')

  return (
    <div
      style={{
        'min-height': '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'font-family':
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        padding: 40,
      }}
    >
      <h1
        style={{
          'font-size': 32,
          'font-weight': 800,
          color: '#f1f5f9',
          'margin-bottom': 8,
        }}
      >
        Modal System
      </h1>
      <p style={{ color: '#64748b', 'font-size': 14, 'margin-bottom': 40, 'text-align': 'center', 'max-width': 500 }}>
        Stacked modal dialogs with animated entrance/exit, focus trapping, backdrop blur,
        and visual stacking offset. Escape closes the top modal.
      </p>

      {/* Open buttons */}
      <div style={{ display: 'flex', gap: 12, 'margin-bottom': 24 }}>
        {(['small', 'medium', 'large'] as ModalSize[]).map((size) => (
          <button
            onClick={() => handleOpen(size)}
            style={{
              padding: '12px 24px',
              'border-radius': 10,
              border: '1px solid #3b82f640',
              background: '#3b82f620',
              color: '#60a5fa',
              'font-size': 14,
              'font-weight': 600,
              cursor: 'pointer',
              'text-transform': 'capitalize',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3b82f635'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f620'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Open {size}
          </button>
        ))}
      </div>

      {stack().length > 0 && (
        <button
          onClick={() => emit(CloseAll, undefined)}
          style={{
            padding: '10px 20px',
            'border-radius': 10,
            border: '1px solid #ef444440',
            background: '#ef444420',
            color: '#f87171',
            'font-size': 13,
            'font-weight': 600,
            cursor: 'pointer',
            'margin-bottom': 24,
          }}
        >
          Close All ({stack().length})
        </button>
      )}

      <p style={{ color: '#475569', 'font-size': 13 }}>
        Open modals: {stack().length}
      </p>

      {/* Backdrop + Modal stack() */}
      {hasModals && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            'z-index': 999,
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => {
              if (activeId()) emit(CloseModal, activeId())
            }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              'backdrop-filter': `blur(${Math.min(stack.length * 4, 16)}px)`,
              WebkitBackdropFilter: `blur(${Math.min(stack.length * 4, 16)}px)`,
              opacity: stack.some((m) => m.state === 'exiting') && stack().length <= 1 ? 0 : 1,
              transition: 'opacity 0.3s ease, backdrop-filter 0.3s ease',
            }}
          />

          {/* Modals */}
          {stack().map((modal, i) => (
            <Modal
              modal={modal}
              index={i}
              total={stack().length}
              isActive={modal.id === activeId()}
            />
          ))}
        </div>
      )}
    </div>
  )
}
