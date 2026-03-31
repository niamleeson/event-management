import { createEngine } from '@pulse/core'

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
export const ModalStackChanged = engine.event<void>('ModalStackChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _modalStack: ModalConfig[] = []

export function getModalStack(): ModalConfig[] { return _modalStack }
export function getStackDepth(): number { return _modalStack.length }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(OpenModal, (modal: ModalConfig) => {
  _modalStack = [..._modalStack, modal]
  engine.emit(ModalStackChanged, undefined)
})

engine.on(CloseModal, (id: string) => {
  _modalStack = _modalStack.filter((m) => m.id !== id)
  engine.emit(ModalStackChanged, undefined)
})

engine.on(CloseTopModal, () => {
  if (_modalStack.length > 0) {
    _modalStack = _modalStack.slice(0, -1)
    engine.emit(ModalStackChanged, undefined)
  }
})

engine.on(CloseAllModals, () => {
  _modalStack = []
  engine.emit(ModalStackChanged, undefined)
})
