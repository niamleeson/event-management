import { createEngine } from '@pulse/core'
import type { Signal, TweenValue } from '@pulse/core'

export const engine = createEngine()
engine.startFrameLoop()

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
/*  Signals                                                           */
/* ------------------------------------------------------------------ */

let nextModalId = 1

export const modalStack: Signal<ModalConfig[]> = engine.signal(
  ModalOpened,
  [] as ModalConfig[],
  (prev, modal) => [...prev, modal],
)
engine.signalUpdate(modalStack, ModalClosed, (prev, id) => prev.filter(m => m.id !== id))

/* ------------------------------------------------------------------ */
/*  Entrance/exit tweens (pool of 10)                                 */
/* ------------------------------------------------------------------ */

export const scaleEntranceTweens: TweenValue[] = []
export const fadeEntranceTweens: TweenValue[] = []
const entranceStarts = []

for (let i = 0; i < 10; i++) {
  const start = engine.event(`ModalEntrance_${i}`)
  entranceStarts.push(start)

  scaleEntranceTweens.push(engine.tween({
    start,
    from: 0.8,
    to: 1,
    duration: 250,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  }))

  fadeEntranceTweens.push(engine.tween({
    start,
    from: 0,
    to: 1,
    duration: 250,
    easing: (t: number) => t,
  }))
}

/* ------------------------------------------------------------------ */
/*  Backdrop blur tween                                               */
/* ------------------------------------------------------------------ */

const BackdropStart = engine.event('BackdropStart')
export const backdropOpacity = engine.tween({
  start: BackdropStart,
  from: () => backdropOpacity.value,
  to: () => modalStack.value.length > 0 ? 1 : 0,
  duration: 200,
  easing: (t: number) => t,
})

/* ------------------------------------------------------------------ */
/*  Open/close logic                                                  */
/* ------------------------------------------------------------------ */

engine.on(OpenModal, ({ title, content, size }) => {
  const modal: ModalConfig = { id: nextModalId++, title, content, size }
  engine.emit(ModalOpened, modal)

  const idx = modalStack.value.length // new stack index
  if (entranceStarts[idx]) engine.emit(entranceStarts[idx], undefined)
  engine.emit(BackdropStart, undefined)
})

engine.on(CloseModal, (id) => {
  engine.emit(ModalClosed, id)
  setTimeout(() => engine.emit(BackdropStart, undefined), 50)
})

engine.on(CloseTopModal, () => {
  const stack = modalStack.value
  if (stack.length > 0) {
    engine.emit(CloseModal, stack[stack.length - 1].id)
  }
})

// Escape key handling is done in the component
