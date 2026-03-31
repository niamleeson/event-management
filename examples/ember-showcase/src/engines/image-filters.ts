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
export const FiltersChanged = engine.event<void>('FiltersChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const defaultFilters: FilterState[] = FILTER_DEFS.map((f) => ({
  id: f.id,
  value: f.defaultValue,
  enabled: true,
}))

let _filters: FilterState[] = [...defaultFilters]
let _splitView = false
let _undoHistory: HistoryEntry[] = []
let _redoHistory: HistoryEntry[] = []

export function getFilters(): FilterState[] { return _filters }
export function getSplitView(): boolean { return _splitView }
export function getUndoHistory(): HistoryEntry[] { return _undoHistory }
export function getRedoHistory(): HistoryEntry[] { return _redoHistory }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(FilterValueChanged, ({ id, value }) => {
  _undoHistory = [..._undoHistory, { filters: _filters.map((f) => ({ ...f })), label: 'Filter change' }].slice(-30)
  _filters = _filters.map((f) => f.id === id ? { ...f, value } : f)
  engine.emit(FiltersChanged, undefined)
})

engine.on(FilterToggled, (id: string) => {
  _filters = _filters.map((f) => f.id === id ? { ...f, enabled: !f.enabled } : f)
  engine.emit(FiltersChanged, undefined)
})

engine.on(FilterReorder, ({ fromIndex, toIndex }) => {
  const next = [..._filters]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  _filters = next
  engine.emit(FiltersChanged, undefined)
})

engine.on(ResetFilters, () => {
  _filters = [...defaultFilters]
  engine.emit(FiltersChanged, undefined)
})

engine.on(ToggleSplitView, () => {
  _splitView = !_splitView
  engine.emit(FiltersChanged, undefined)
})

engine.on(UndoFilter, () => {
  if (_undoHistory.length > 0) {
    _redoHistory = [..._redoHistory, { filters: _filters.map((f) => ({ ...f })), label: 'Undo' }].slice(-30)
    const prev = _undoHistory[_undoHistory.length - 1]
    _filters = prev.filters
    _undoHistory = _undoHistory.slice(0, -1)
    engine.emit(FiltersChanged, undefined)
  }
})

engine.on(RedoFilter, () => {
  if (_redoHistory.length > 0) {
    _undoHistory = [..._undoHistory, { filters: _filters.map((f) => ({ ...f })), label: 'Redo' }].slice(-30)
    const next = _redoHistory[_redoHistory.length - 1]
    _filters = next.filters
    _redoHistory = _redoHistory.slice(0, -1)
    engine.emit(FiltersChanged, undefined)
  }
})

// ---------------------------------------------------------------------------
// Helper
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
