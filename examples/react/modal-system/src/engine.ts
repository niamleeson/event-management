import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// OpenModal ──┬──→ ModalStackChanged
//             └──→ ActiveModalIdChanged
// CloseModal ─┬──→ ModalStackChanged
//             └──→ ActiveModalIdChanged
// CloseAll ──→ CloseModal (per modal)
// ConfirmAction ──→ CloseModal (chain)
// CancelAction ──→ CloseModal (chain)
// ---------------------------------------------------------------------------

export type ModalSize = 'small' | 'medium' | 'large'

export interface ModalData {
  id: string
  title: string
  content: string
  size: ModalSize
  state: 'entering' | 'open' | 'exiting'
}

// Events
export const OpenModal = engine.event<{ id: string; title: string; content: string; size: ModalSize }>('OpenModal')
export const CloseModal = engine.event<string>('CloseModal')
export const CloseAll = engine.event<void>('CloseAll')
export const ConfirmAction = engine.event<string>('ConfirmAction')
export const CancelAction = engine.event<string>('CancelAction')

// State change events
export const ModalStackChanged = engine.event<ModalData[]>('ModalStackChanged')
export const ActiveModalIdChanged = engine.event<string | null>('ActiveModalIdChanged')

// State
let modalStack: ModalData[] = []
let activeModalId: string | null = null

engine.on(OpenModal, [ModalStackChanged, ActiveModalIdChanged], ({ id, title, content, size }, setStack, setActive) => {
  if (modalStack.find((m) => m.id === id)) return
  const modal: ModalData = { id, title, content, size, state: 'entering' }
  modalStack = [...modalStack, modal]
  activeModalId = id
  setStack([...modalStack])
  setActive(activeModalId)

  setTimeout(() => {
    modalStack = modalStack.map((m) => m.id === id ? { ...m, state: 'open' as const } : m)
    engine.emit(ModalStackChanged, [...modalStack])
  }, 50)
})

engine.on(CloseModal, [ModalStackChanged, ActiveModalIdChanged], (id, setStack, setActive) => {
  const modal = modalStack.find((m) => m.id === id)
  if (!modal || modal.state === 'exiting') return
  modalStack = modalStack.map((m) => m.id === id ? { ...m, state: 'exiting' as const } : m)
  setStack([...modalStack])

  setTimeout(() => {
    modalStack = modalStack.filter((m) => m.id !== id)
    if (modalStack.length > 0) activeModalId = modalStack[modalStack.length - 1].id
    else activeModalId = null
    engine.emit(ModalStackChanged, [...modalStack])
    engine.emit(ActiveModalIdChanged, activeModalId)
  }, 300)
})

engine.on(CloseAll, () => {
  const toClose = [...modalStack].reverse().filter((m) => m.state !== 'exiting')
  toClose.forEach((m, i) => setTimeout(() => engine.emit(CloseModal, m.id), i * 100))
})

engine.on(ConfirmAction).emit(CloseModal)
engine.on(CancelAction).emit(CloseModal)

export function startLoop() {}
export function stopLoop() {}

export function resetState() {
  modalStack = []
  activeModalId = null
}
