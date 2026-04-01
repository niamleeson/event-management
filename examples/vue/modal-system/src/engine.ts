// DAG
// ModalOpened ──→ ModalStackChanged
// ModalClosed ──→ ModalStackChanged
// OpenModal ──→ ModalOpened
// CloseModal ──→ ModalClosed
// CloseTopModal ──→ CloseModal

import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type ModalSize = 'sm' | 'md' | 'lg'

export interface ModalConfig {
  id: number
  title: string
  content: string
  size: ModalSize
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

export const SIZE_WIDTHS: Record<ModalSize, number> = { sm: 360, md: 500, lg: 700 }

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const OpenModal = engine.event<{ title: string; content: string; size: ModalSize }>('OpenModal')
export const CloseModal = engine.event<number>('CloseModal')
export const CloseTopModal = engine.event('CloseTopModal')
export const ModalOpened = engine.event<ModalConfig>('ModalOpened')
export const ModalClosed = engine.event<number>('ModalClosed')

/* ------------------------------------------------------------------ */
/*  State-changed events                                              */
/* ------------------------------------------------------------------ */

export const ModalStackChanged = engine.event<ModalConfig[]>('ModalStackChanged')
export const BackdropOpacityChanged = engine.event<number>('BackdropOpacityChanged')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let nextModalId = 1
let modalStack: ModalConfig[] = []
let backdropOpacity = 0

engine.on(ModalOpened, [ModalStackChanged], (modal, setStack) => {
  modalStack = [...modalStack, modal]
  setStack(modalStack)
})
engine.on(ModalClosed, [ModalStackChanged], (id, setStack) => {
  modalStack = modalStack.filter(m => m.id !== id)
  setStack(modalStack)
})

/* ------------------------------------------------------------------ */
/*  Backdrop animation (CSS transition-friendly opacity)              */
/* ------------------------------------------------------------------ */

function animateBackdrop() {
  const target = modalStack.length > 0 ? 1 : 0
  const from = backdropOpacity
  const duration = 200
  let elapsed = 0
  let last = performance.now()

  function tick(now: number) {
    elapsed += now - last
    last = now
    const p = Math.min(1, elapsed / duration)
    backdropOpacity = from + (target - from) * p
    engine.emit(BackdropOpacityChanged, backdropOpacity)
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

/* ------------------------------------------------------------------ */
/*  Open/close logic                                                  */
/* ------------------------------------------------------------------ */

engine.on(OpenModal, [ModalOpened], ({ title, content, size }, setOpened) => {
  const modal: ModalConfig = { id: nextModalId++, title, content, size }
  setOpened(modal)
  animateBackdrop()
})

engine.on(CloseModal, [ModalClosed], (id, setClosed) => {
  setClosed(id)
})

engine.on(ModalClosed, () => {
  setTimeout(() => animateBackdrop(), 50)
})

engine.on(CloseTopModal, [CloseModal], (_payload, setClose) => {
  const stack = modalStack
  if (stack.length > 0) {
    setClose(stack[stack.length - 1].id)
  }
})

/* ------------------------------------------------------------------ */
/*  Initial values                                                    */
/* ------------------------------------------------------------------ */

export function getModalStack() { return modalStack }
export function getBackdropOpacity() { return backdropOpacity }

export function startLoop() {}
export function stopLoop() {}
