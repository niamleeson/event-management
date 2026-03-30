import { createEngine, createSignal } from '@pulse/core'
import type { Signal } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModalSize = 'small' | 'medium' | 'large'

export interface ModalData {
  id: string
  title: string
  content: string
  size: ModalSize
  state: 'entering' | 'open' | 'exiting'
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const OpenModal = engine.event<{ id: string; title: string; content: string; size: ModalSize }>('OpenModal')
export const CloseModal = engine.event<string>('CloseModal')
export const CloseAll = engine.event<void>('CloseAll')
export const ModalOpened = engine.event<string>('ModalOpened')
export const ModalClosed = engine.event<string>('ModalClosed')
export const ConfirmAction = engine.event<string>('ConfirmAction')
export const CancelAction = engine.event<string>('CancelAction')

// Internal animation events
const ModalEnterDone = engine.event<string>('ModalEnterDone')
const ModalExitDone = engine.event<string>('ModalExitDone')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const modalStack: Signal<ModalData[]> = createSignal<ModalData[]>([])
engine['_signals'].push(modalStack)

export const activeModalId: Signal<string | null> = createSignal<string | null>(null)
engine['_signals'].push(activeModalId)

// ---------------------------------------------------------------------------
// Open modal: add to stack in "entering" state
// ---------------------------------------------------------------------------

engine.on(OpenModal, ({ id, title, content, size }) => {
  const current = modalStack.value
  // Prevent duplicate ids
  if (current.find((m) => m.id === id)) return

  const modal: ModalData = { id, title, content, size, state: 'entering' }
  modalStack.set([...current, modal])
  activeModalId.set(id)

  // After entrance animation, mark as open and fire ModalOpened
  setTimeout(() => {
    engine.emit(ModalEnterDone, id)
  }, 50)
})

// Join: ModalEnterDone waits for entrance animation to complete
engine.on(ModalEnterDone, (id) => {
  const current = modalStack.value
  modalStack.set(
    current.map((m) => (m.id === id ? { ...m, state: 'open' as const } : m)),
  )
  engine.emit(ModalOpened, id)
})

// ---------------------------------------------------------------------------
// Close modal: trigger exit animation
// ---------------------------------------------------------------------------

engine.on(CloseModal, (id) => {
  const current = modalStack.value
  const modal = current.find((m) => m.id === id)
  if (!modal || modal.state === 'exiting') return

  modalStack.set(
    current.map((m) => (m.id === id ? { ...m, state: 'exiting' as const } : m)),
  )

  // After exit animation, remove from stack
  setTimeout(() => {
    engine.emit(ModalExitDone, id)
  }, 300)
})

engine.on(ModalExitDone, (id) => {
  const current = modalStack.value
  const newStack = current.filter((m) => m.id !== id)
  modalStack.set(newStack)

  // Update active modal
  if (newStack.length > 0) {
    activeModalId.set(newStack[newStack.length - 1].id)
  } else {
    activeModalId.set(null)
  }

  engine.emit(ModalClosed, id)
})

// ---------------------------------------------------------------------------
// Close all: close each modal in reverse order
// ---------------------------------------------------------------------------

engine.on(CloseAll, () => {
  const current = modalStack.value
  // Close from top to bottom with staggered timing
  const toClose = [...current].reverse().filter((m) => m.state !== 'exiting')
  toClose.forEach((m, i) => {
    setTimeout(() => engine.emit(CloseModal, m.id), i * 100)
  })
})

// ---------------------------------------------------------------------------
// Confirm/Cancel -> close
// ---------------------------------------------------------------------------

engine.pipe(ConfirmAction, CloseModal, (id) => id)
engine.pipe(CancelAction, CloseModal, (id) => id)

// ---------------------------------------------------------------------------
// Start frame loop
// ---------------------------------------------------------------------------

engine.startFrameLoop()
