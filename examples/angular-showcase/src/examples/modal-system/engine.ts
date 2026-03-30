import { createEngine, type TweenValue, type EventType } from '@pulse/core'

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
  size: 'sm' | 'md' | 'lg'
  color: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_MODALS = 5

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const OpenModal = engine.event<ModalConfig>('OpenModal')
export const CloseModal = engine.event<string>('CloseModal')
export const CloseAll = engine.event<void>('CloseAll')
export const ModalOpened = engine.event<string>('ModalOpened')
export const ModalClosed = engine.event<string>('ModalClosed')

// Tween events per modal slot
export const ModalFadeIn: EventType<void>[] = []
export const ModalFadeInDone: EventType<void>[] = []

for (let i = 0; i < MAX_MODALS; i++) {
  ModalFadeIn.push(engine.event<void>(`ModalFadeIn_${i}`))
  ModalFadeInDone.push(engine.event<void>(`ModalFadeInDone_${i}`))
}

// ---------------------------------------------------------------------------
// Tweens: opacity and scale per modal slot
// ---------------------------------------------------------------------------

export const modalOpacity: TweenValue[] = []
export const modalScale: TweenValue[] = []

for (let i = 0; i < MAX_MODALS; i++) {
  modalOpacity.push(engine.tween({
    start: ModalFadeIn[i],
    done: ModalFadeInDone[i],
    from: 0,
    to: 1,
    duration: 250,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  }))

  modalScale.push(engine.tween({
    start: ModalFadeIn[i],
    from: 0.9,
    to: 1,
    duration: 250,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  }))
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const modalStack = engine.signal<ModalConfig[]>(
  ModalOpened,
  [],
  (prev, _id) => prev,  // Actual push happens in the handler below
)

// Track the actual stack via dedicated handlers
engine.on(OpenModal, (config) => {
  const current = modalStack.value
  if (current.length >= MAX_MODALS) return
  const next = [...current, config]
  modalStack.set(next)
  engine.emit(ModalOpened, config.id)
  // Trigger fade-in for the new modal
  const slot = current.length % MAX_MODALS
  engine.emit(ModalFadeIn[slot], undefined)
})

engine.on(CloseModal, (id) => {
  const current = modalStack.value
  modalStack.set(current.filter((m) => m.id !== id))
  engine.emit(ModalClosed, id)
})

engine.on(CloseAll, () => {
  modalStack.set([])
})

// Backdrop blur intensity: increases with stack depth
export const backdropBlur = engine.signal<number>(
  ModalOpened,
  0,
  () => modalStack.value.length * 4,
)
engine.signalUpdate(backdropBlur, ModalClosed, () => Math.max(0, modalStack.value.length * 4))
engine.signalUpdate(backdropBlur, CloseAll, () => 0)

// Start frame loop
engine.startFrameLoop()
