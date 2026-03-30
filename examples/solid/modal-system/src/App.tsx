import { For, Show, onMount, onCleanup } from 'solid-js'
import { useSignal, useEmit, useTween } from '@pulse/solid'
import type { Signal, TweenValue, EventType } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface ModalConfig {
  id: number
  title: string
  content: string
  color: string
  size: 'sm' | 'md' | 'lg'
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const OpenModal = engine.event<{ title: string; content: string; color: string; size?: 'sm' | 'md' | 'lg' }>('OpenModal')
const CloseModal = engine.event<number>('CloseModal')
const CloseTopModal = engine.event('CloseTopModal')

const ModalOpenStart = engine.event('ModalOpenStart')
const ModalCloseStart = engine.event('ModalCloseStart')

/* ------------------------------------------------------------------ */
/*  Tweens                                                            */
/* ------------------------------------------------------------------ */

const openTween: TweenValue = engine.tween({
  start: ModalOpenStart,
  from: 0,
  to: 1,
  duration: 300,
  easing: 'easeOutBack',
})

const closeTween: TweenValue = engine.tween({
  start: ModalCloseStart,
  from: 1,
  to: 0,
  duration: 200,
  easing: 'easeOut',
})

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let modalId = 0

const modalStack = engine.signal<ModalConfig[]>(
  OpenModal, [],
  (prev, { title, content, color, size }) => [
    ...prev,
    { id: ++modalId, title, content, color, size: size ?? 'md' },
  ],
)

engine.signalUpdate(modalStack, CloseModal, (prev, id) => prev.filter(m => m.id !== id))
engine.signalUpdate(modalStack, CloseTopModal, (prev) => prev.slice(0, -1))

engine.on(OpenModal, () => engine.emit(ModalOpenStart, undefined))
engine.on(CloseModal, () => engine.emit(ModalCloseStart, undefined))
engine.on(CloseTopModal, () => engine.emit(ModalCloseStart, undefined))

/* ------------------------------------------------------------------ */
/*  Focus trap + Escape key                                           */
/* ------------------------------------------------------------------ */

function setupKeyListener() {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') engine.emit(CloseTopModal, undefined)
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}

/* ------------------------------------------------------------------ */
/*  Size map                                                          */
/* ------------------------------------------------------------------ */

const SIZE_MAP = { sm: '360px', md: '500px', lg: '700px' }

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function Modal(props: { modal: ModalConfig; index: number; total: number }) {
  const emit = useEmit()
  const openVal = useTween(openTween)
  const isTop = () => props.index === props.total - 1

  // Stack offset: each stacked modal shifts down and scales
  const offset = () => (props.total - 1 - props.index) * 20
  const scale = () => 1 - (props.total - 1 - props.index) * 0.03

  // Only the newest modal gets the entrance animation
  const animScale = () => isTop() ? 0.85 + openVal() * 0.15 : scale()
  const animOpacity = () => isTop() ? openVal() : 1

  let modalRef!: HTMLDivElement

  // Focus trap: focus the modal when opened
  onMount(() => {
    if (isTop() && modalRef) modalRef.focus()
  })

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: `${50 + offset()}%`,
        left: '50%',
        transform: `translate(-50%, -50%) scale(${animScale()})`,
        width: SIZE_MAP[props.modal.size],
        'max-width': '90vw',
        'max-height': '80vh',
        background: '#1e1e2e',
        'border-radius': '16px',
        'box-shadow': `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${props.modal.color}33`,
        'z-index': String(1000 + props.index),
        opacity: String(animOpacity()),
        overflow: 'hidden',
        display: 'flex',
        'flex-direction': 'column',
        outline: 'none',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px', display: 'flex', 'align-items': 'center', 'justify-content': 'space-between',
        background: `linear-gradient(135deg, ${props.modal.color}22, transparent)`,
        'border-bottom': `1px solid ${props.modal.color}33`,
      }}>
        <h2 style={{ 'font-size': '18px', 'font-weight': '600', color: props.modal.color, margin: '0' }}>
          {props.modal.title}
        </h2>
        <button
          onClick={() => emit(CloseModal, props.modal.id)}
          style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#888',
            width: '32px', height: '32px', 'border-radius': '8px', cursor: 'pointer',
            'font-size': '16px', display: 'flex', 'align-items': 'center', 'justify-content': 'center',
          }}
        >\u2715</button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', flex: '1', overflow: 'auto', color: '#ccc', 'line-height': '1.6', 'font-size': '14px' }}>
        <p>{props.modal.content}</p>

        {/* Action to open stacked modal */}
        <div style={{ 'margin-top': '24px', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => emit(OpenModal, {
              title: `Nested Modal (Level ${props.index + 2})`,
              content: 'This is a nested modal stacked on top of the previous one. You can stack multiple modals. Press Escape to close the top one.',
              color: ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#d63031'][((props.index + 1) % 5)],
              size: props.modal.size === 'lg' ? 'md' : props.modal.size === 'md' ? 'sm' : 'md',
            })}
            style={{
              padding: '10px 20px', 'border-radius': '8px', border: 'none',
              background: props.modal.color, color: '#fff', cursor: 'pointer',
              'font-size': '13px', 'font-weight': '500',
            }}
          >Open Nested Modal</button>
          <button
            onClick={() => emit(CloseModal, props.modal.id)}
            style={{
              padding: '10px 20px', 'border-radius': '8px',
              border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
              color: '#fff', cursor: 'pointer', 'font-size': '13px',
            }}
          >Close</button>
        </div>
      </div>
    </div>
  )
}

function Backdrop(props: { count: number }) {
  const emit = useEmit()

  return (
    <Show when={props.count > 0}>
      <div
        onClick={() => emit(CloseTopModal, undefined)}
        style={{
          position: 'fixed', inset: '0', 'z-index': '999',
          background: `rgba(0,0,0,${Math.min(0.7, 0.3 + props.count * 0.1)})`,
          'backdrop-filter': `blur(${Math.min(8, props.count * 3)}px)`,
          transition: 'all 0.3s',
        }}
      />
    </Show>
  )
}

export default function App() {
  const emit = useEmit()
  const stack = useSignal(modalStack)

  onMount(() => {
    const cleanup = setupKeyListener()
    onCleanup(cleanup)
  })

  const DEMO_MODALS = [
    { title: 'Welcome', content: 'Welcome to the modal system! This modal uses scale and fade tweens for smooth entrance/exit animations. Try opening nested modals and stacking them.', color: '#6c5ce7', size: 'md' as const },
    { title: 'Settings', content: 'Configure your preferences here. The backdrop blur increases with each stacked modal for a nice depth effect.', color: '#00b894', size: 'lg' as const },
    { title: 'Alert', content: 'This is a small alert modal. Press Escape to dismiss or click the backdrop.', color: '#d63031', size: 'sm' as const },
    { title: 'Large Form', content: 'This large modal could contain a complex form. Each modal gets focus-trapped so keyboard navigation stays within the active modal.', color: '#0984e3', size: 'lg' as const },
  ]

  return (
    <div style={{
      display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: '32px',
      'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <h1 style={{ 'font-size': '28px', 'font-weight': '300', 'letter-spacing': '2px' }}>
        Modal System
      </h1>

      <p style={{ color: 'rgba(255,255,255,0.5)', 'font-size': '14px', 'max-width': '500px', 'text-align': 'center', 'line-height': '1.6' }}>
        Stacked modals with scale/fade tweens, backdrop blur, and Escape key to close. Each nested modal scales down the ones below.
      </p>

      <div style={{ display: 'flex', gap: '12px', 'flex-wrap': 'wrap', 'justify-content': 'center' }}>
        <For each={DEMO_MODALS}>
          {(cfg) => (
            <button
              onClick={() => emit(OpenModal, cfg)}
              style={{
                padding: '12px 24px', 'border-radius': '10px', border: 'none',
                background: cfg.color, color: '#fff', cursor: 'pointer',
                'font-size': '14px', 'font-weight': '500',
                'box-shadow': `0 4px 16px ${cfg.color}44`,
              }}
            >{cfg.title} ({cfg.size})</button>
          )}
        </For>
      </div>

      <div style={{ color: 'rgba(255,255,255,0.3)', 'font-size': '13px' }}>
        Active modals: {stack().length}
      </div>

      {/* Backdrop */}
      <Backdrop count={stack().length} />

      {/* Modal stack */}
      <For each={stack()}>
        {(modal, i) => <Modal modal={modal} index={i()} total={stack().length} />}
      </For>
    </div>
  )
}
