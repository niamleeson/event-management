import { createEngine } from '@pulse/core'

export const engine = createEngine()
export interface ModalConfig { id: string; title: string; content: string; size: 'sm' | 'md' | 'lg'; color: string }
export const OpenModal = engine.event<ModalConfig>('OpenModal')
export const CloseModal = engine.event<string>('CloseModal')
export const CloseAll = engine.event<void>('CloseAll')
export const ModalStackChanged = engine.event<ModalConfig[]>('ModalStackChanged')
let modalStack: ModalConfig[] = []

engine.on(OpenModal, (config) => { if (modalStack.length >= 5) return; modalStack = [...modalStack, config]; engine.emit(ModalStackChanged, modalStack) })
engine.on(CloseModal, (id) => { modalStack = modalStack.filter((m) => m.id !== id); engine.emit(ModalStackChanged, modalStack) })
engine.on(CloseAll, () => { modalStack = []; engine.emit(ModalStackChanged, modalStack) })
