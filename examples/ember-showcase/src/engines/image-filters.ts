import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterDef {
  id: string
  name: string
  property: string
  unit: string
  min: number
  max: number
  defaultValue: number
  step: number
}

export interface FilterState {
  id: string
  value: number
  enabled: boolean
}

export interface HistoryEntry {
  filters: FilterState[]
  label: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FILTER_DEFS: FilterDef[] = [
  { id: 'brightness', name: 'Brightness', property: 'brightness', unit: '%', min: 0, max: 200, defaultValue: 100, step: 5 },
  { id: 'contrast', name: 'Contrast', property: 'contrast', unit: '%', min: 0, max: 200, defaultValue: 100, step: 5 },
  { id: 'saturate', name: 'Saturation', property: 'saturate', unit: '%', min: 0, max: 200, defaultValue: 100, step: 5 },
  { id: 'hue-rotate', name: 'Hue Rotate', property: 'hue-rotate', unit: 'deg', min: 0, max: 360, defaultValue: 0, step: 10 },
  { id: 'blur', name: 'Blur', property: 'blur', unit: 'px', min: 0, max: 20, defaultValue: 0, step: 1 },
  { id: 'grayscale', name: 'Grayscale', property: 'grayscale', unit: '%', min: 0, max: 100, defaultValue: 0, step: 5 },
  { id: 'sepia', name: 'Sepia', property: 'sepia', unit: '%', min: 0, max: 100, defaultValue: 0, step: 5 },
  { id: 'invert', name: 'Invert', property: 'invert', unit: '%', min: 0, max: 100, defaultValue: 0, step: 5 },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const FilterValueChanged = engine.event<{ id: string; value: number }>('FilterValueChanged')
export const FilterToggled = engine.event<string>('FilterToggled')
export const FilterReorder = engine.event<{ fromIndex: number; toIndex: number }>('FilterReorder')
export const UndoFilter = engine.event<void>('UndoFilter')
export const RedoFilter = engine.event<void>('RedoFilter')
export const ResetFilters = engine.event<void>('ResetFilters')
export const ToggleSplitView = engine.event<void>('ToggleSplitView')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

const defaultFilters: FilterState[] = FILTER_DEFS.map((f) => ({
  id: f.id,
  value: f.defaultValue,
  enabled: true,
}))

export const filters = engine.signal<FilterState[]>(
  FilterValueChanged, [...defaultFilters],
  (prev, { id, value }) => prev.map((f) => f.id === id ? { ...f, value } : f),
)

engine.signalUpdate(filters, FilterToggled, (prev, id) =>
  prev.map((f) => f.id === id ? { ...f, enabled: !f.enabled } : f),
)

engine.signalUpdate(filters, FilterReorder, (prev, { fromIndex, toIndex }) => {
  const next = [...prev]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
})

engine.signalUpdate(filters, ResetFilters, () => [...defaultFilters])

export const splitView = engine.signal<boolean>(
  ToggleSplitView, false, (prev) => !prev,
)

// Undo/Redo history
export const undoHistory = engine.signal<HistoryEntry[]>(
  FilterValueChanged, [],
  (prev, _change) => {
    // Push current state before change
    return [...prev, { filters: filters.value.map((f) => ({ ...f })), label: 'Filter change' }].slice(-30)
  },
)

export const redoHistory = engine.signal<HistoryEntry[]>(
  UndoFilter, [],
  (prev) => {
    return [...prev, { filters: filters.value.map((f) => ({ ...f })), label: 'Undo' }].slice(-30)
  },
)

// Undo action
engine.on(UndoFilter, () => {
  const history = undoHistory.value
  if (history.length > 0) {
    const prev = history[history.length - 1]
    filters.set(prev.filters)
    undoHistory.set(history.slice(0, -1))
  }
})

// Redo action
engine.on(RedoFilter, () => {
  const redo = redoHistory.value
  if (redo.length > 0) {
    const next = redo[redo.length - 1]
    filters.set(next.filters)
    redoHistory.set(redo.slice(0, -1))
  }
})

// ---------------------------------------------------------------------------
// Helper: build CSS filter string
// ---------------------------------------------------------------------------

export function buildFilterCSS(filterList: FilterState[]): string {
  return filterList
    .filter((f) => f.enabled)
    .map((f) => {
      const def = FILTER_DEFS.find((d) => d.id === f.id)!
      return `${def.property}(${f.value}${def.unit})`
    })
    .join(' ')
}
