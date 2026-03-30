import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterConfig {
  id: string
  name: string
  property: string
  min: number
  max: number
  default: number
  unit: string
}

export interface FilterState {
  id: string
  value: number
}

export interface HistorySnapshot {
  filters: FilterState[]
  timestamp: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FILTERS: FilterConfig[] = [
  { id: 'brightness', name: 'Brightness', property: 'brightness', min: 0, max: 200, default: 100, unit: '%' },
  { id: 'contrast', name: 'Contrast', property: 'contrast', min: 0, max: 200, default: 100, unit: '%' },
  { id: 'saturation', name: 'Saturation', property: 'saturate', min: 0, max: 200, default: 100, unit: '%' },
  { id: 'blur', name: 'Blur', property: 'blur', min: 0, max: 20, default: 0, unit: 'px' },
  { id: 'hue', name: 'Hue Rotate', property: 'hue-rotate', min: 0, max: 360, default: 0, unit: 'deg' },
  { id: 'sepia', name: 'Sepia', property: 'sepia', min: 0, max: 100, default: 0, unit: '%' },
  { id: 'grayscale', name: 'Grayscale', property: 'grayscale', min: 0, max: 100, default: 0, unit: '%' },
  { id: 'invert', name: 'Invert', property: 'invert', min: 0, max: 100, default: 0, unit: '%' },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const UpdateFilter = engine.event<FilterState>('UpdateFilter')
export const ReorderFilters = engine.event<string[]>('ReorderFilters')
export const Undo = engine.event<void>('Undo')
export const Redo = engine.event<void>('Redo')
export const ResetAll = engine.event<void>('ResetAll')
export const ToggleSplit = engine.event<void>('ToggleSplit')
export const PushHistory = engine.event<void>('PushHistory')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const filterValues = engine.signal<Record<string, number>>(
  UpdateFilter,
  Object.fromEntries(FILTERS.map((f) => [f.id, f.default])),
  (prev, { id, value }) => ({ ...prev, [id]: value }),
)

engine.signalUpdate(filterValues, ResetAll, () =>
  Object.fromEntries(FILTERS.map((f) => [f.id, f.default])),
)

export const filterOrder = engine.signal<string[]>(
  ReorderFilters,
  FILTERS.map((f) => f.id),
  (_prev, order) => order,
)

export const splitView = engine.signal<boolean>(ToggleSplit, false, (prev) => !prev)

// Undo/Redo history
const undoStack: HistorySnapshot[] = []
const redoStack: HistorySnapshot[] = []

engine.on(PushHistory, () => {
  undoStack.push({
    filters: Object.entries(filterValues.value).map(([id, value]) => ({ id, value })),
    timestamp: Date.now(),
  })
  redoStack.length = 0
})

engine.on(Undo, () => {
  if (undoStack.length === 0) return
  const current = Object.entries(filterValues.value).map(([id, value]) => ({ id, value }))
  redoStack.push({ filters: current, timestamp: Date.now() })
  const snapshot = undoStack.pop()!
  for (const f of snapshot.filters) {
    filterValues._set({ ...filterValues.value, [f.id]: f.value })
  }
})

engine.on(Redo, () => {
  if (redoStack.length === 0) return
  const current = Object.entries(filterValues.value).map(([id, value]) => ({ id, value }))
  undoStack.push({ filters: current, timestamp: Date.now() })
  const snapshot = redoStack.pop()!
  for (const f of snapshot.filters) {
    filterValues._set({ ...filterValues.value, [f.id]: f.value })
  }
})

export const canUndo = engine.signal<boolean>(PushHistory, false, () => true)
engine.signalUpdate(canUndo, Undo, () => undoStack.length > 0)
engine.signalUpdate(canUndo, Redo, () => undoStack.length > 0)

export const canRedo = engine.signal<boolean>(Redo, false, () => redoStack.length > 0)
engine.signalUpdate(canRedo, Undo, () => redoStack.length > 0)
engine.signalUpdate(canRedo, PushHistory, () => false)

// Start frame loop
engine.startFrameLoop()
