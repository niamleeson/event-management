import { createEngine, type TweenValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModalConfig {
  id: string
  title: string
  content: string
  type: 'default' | 'confirm' | 'form'
  canDismiss: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SAMPLE_MODALS: ModalConfig[] = [
  { id: 'welcome', title: 'Welcome', content: 'Welcome to the Pulse Modal System. Modals stack with backdrop dimming.', type: 'default', canDismiss: true },
  { id: 'confirm', title: 'Confirm Action', content: 'Are you sure you want to proceed? This action cannot be undone.', type: 'confirm', canDismiss: true },
  { id: 'settings', title: 'Settings', content: 'Configure your preferences here. Changes are saved automatically via Pulse signals.', type: 'form', canDismiss: true },
  { id: 'warning', title: 'Warning', content: 'System resources are running low. Please close unused applications.', type: 'default', canDismiss: true },
  { id: 'nested', title: 'Nested Modal', content: 'This is a deeply nested modal. Press Escape to dismiss the top-most modal.', type: 'default', canDismiss: true },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const OpenModal = engine.event<ModalConfig>('OpenModal')
export const CloseModal = engine.event<string>('CloseModal')
export const CloseTopModal = engine.event<void>('CloseTopModal')
export const CloseAllModals = engine.event<void>('CloseAllModals')
export const ModalOpened = engine.event<string>('ModalOpened')
export const ModalClosed = engine.event<string>('ModalClosed')

// Animation events per modal
export const ModalEnter: Record<string, ReturnType<typeof engine.event<void>>> = {}
export const ModalEnterDone: Record<string, ReturnType<typeof engine.event<void>>> = {}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const modalStack = engine.signal<ModalConfig[]>(
  OpenModal, [],
  (prev, modal) => [...prev, modal],
)

engine.signalUpdate(modalStack, CloseModal, (prev, id) =>
  prev.filter((m) => m.id !== id),
)

engine.signalUpdate(modalStack, CloseTopModal, (prev) =>
  prev.length > 0 ? prev.slice(0, -1) : prev,
)

engine.signalUpdate(modalStack, CloseAllModals, () => [])

export const stackDepth = engine.signal<number>(
  OpenModal, 0, (prev) => prev + 1,
)
engine.signalUpdate(stackDepth, CloseModal, (prev) => Math.max(0, prev - 1))
engine.signalUpdate(stackDepth, CloseTopModal, (prev) => Math.max(0, prev - 1))
engine.signalUpdate(stackDepth, CloseAllModals, () => 0)

// ---------------------------------------------------------------------------
// Tweens — backdrop opacity and modal scale
// ---------------------------------------------------------------------------

export const modalTweens: Record<string, { scale: TweenValue; opacity: TweenValue }> = {}

export function createModalTweens(id: string): { scale: TweenValue; opacity: TweenValue } {
  const enterEvt = engine.event<void>(`ModalEnter_${id}`)
  const enterDone = engine.event<void>(`ModalEnterDone_${id}`)
  ModalEnter[id] = enterEvt
  ModalEnterDone[id] = enterDone

  const scale = engine.tween({
    start: enterEvt,
    done: enterDone,
    from: 0.85,
    to: 1,
    duration: 250,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  })

  const opacity = engine.tween({
    start: enterEvt,
    from: 0,
    to: 1,
    duration: 200,
    easing: (t: number) => t,
  })

  modalTweens[id] = { scale, opacity }
  return { scale, opacity }
}

// Trigger animations on open
engine.on(OpenModal, (modal) => {
  createModalTweens(modal.id)
  setTimeout(() => {
    if (ModalEnter[modal.id]) {
      engine.emit(ModalEnter[modal.id], undefined)
    }
  }, 10)
})

// Start frame loop for tweens
engine.startFrameLoop()
