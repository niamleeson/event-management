// DAG
// OpenModal ──→ ModalStackChanged
// CloseModal ──→ ModalStackChanged
// CloseAll ──→ ModalStackChanged

import { createEngine } from '@pulse/core'

export const engine = createEngine()
export interface ModalConfig { id: string; title: string; content: string; size: 'sm' | 'md' | 'lg'; color: string }
export const OpenModal = engine.event<ModalConfig>('OpenModal')
export const CloseModal = engine.event<string>('CloseModal')
export const CloseAll = engine.event<void>('CloseAll')
export const ModalStackChanged = engine.event<ModalConfig[]>('ModalStackChanged')
let modalStack: ModalConfig[] = []

engine.on(OpenModal, [ModalStackChanged], (config, setStack) => { if (modalStack.length >= 5) return; modalStack = [...modalStack, config]; setStack(modalStack) })
engine.on(CloseModal, [ModalStackChanged], (id, setStack) => { modalStack = modalStack.filter((m) => m.id !== id); setStack(modalStack) })
engine.on(CloseAll, [ModalStackChanged], (_payload, setStack) => { modalStack = []; setStack(modalStack) })

export function startLoop() {}
export function stopLoop() {}
