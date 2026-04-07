import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// OpenModal ──┬──→ ModalStackChanged
//             └──→ ActiveModalIdChanged
// ModalEnterDone ──→ ModalStackChanged (entering → open)
// CloseModal ──→ ModalStackChanged (mark exiting)
// ModalExitDone ──┬──→ ModalStackChanged (remove)
//                 └──→ ActiveModalIdChanged
// CloseAll ──→ CloseModal (per modal, staggered)
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

// Internal transition events
const ModalEnterDone = engine.event<string>('ModalEnterDone')
const ModalExitDone = engine.event<string>('ModalExitDone')

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

  setTimeout(() => engine.emit(ModalEnterDone, id), 50)
})

engine.on(ModalEnterDone, [ModalStackChanged], (id, setStack) => {
  modalStack = modalStack.map((m) => m.id === id ? { ...m, state: 'open' as const } : m)
  setStack([...modalStack])
})

engine.on(CloseModal, [ModalStackChanged], (id, setStack) => {
  const modal = modalStack.find((m) => m.id === id)
  if (!modal || modal.state === 'exiting') return
  modalStack = modalStack.map((m) => m.id === id ? { ...m, state: 'exiting' as const } : m)
  setStack([...modalStack])

  setTimeout(() => engine.emit(ModalExitDone, id), 300)
})

engine.on(ModalExitDone, [ModalStackChanged, ActiveModalIdChanged], (id, setStack, setActive) => {
  modalStack = modalStack.filter((m) => m.id !== id)
  if (modalStack.length > 0) activeModalId = modalStack[modalStack.length - 1].id
  else activeModalId = null
  setStack([...modalStack])
  setActive(activeModalId)
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
