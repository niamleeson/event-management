import { createEngine } from '@pulse/core'

export const engine = createEngine()

export interface FilterConfig { id: string; name: string; property: string; min: number; max: number; default: number; unit: string }
export interface FilterState { id: string; value: number }

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

export const UpdateFilter = engine.event<FilterState>('UpdateFilter')
export const ReorderFilters = engine.event<string[]>('ReorderFilters')
export const Undo = engine.event<void>('Undo')
export const Redo = engine.event<void>('Redo')
export const ResetAll = engine.event<void>('ResetAll')
export const ToggleSplit = engine.event<void>('ToggleSplit')
export const PushHistory = engine.event<void>('PushHistory')

export const FilterValuesChanged = engine.event<Record<string, number>>('FilterValuesChanged')
export const FilterOrderChanged = engine.event<string[]>('FilterOrderChanged')
export const SplitViewChanged = engine.event<boolean>('SplitViewChanged')
export const CanUndoChanged = engine.event<boolean>('CanUndoChanged')
export const CanRedoChanged = engine.event<boolean>('CanRedoChanged')

let filterValues: Record<string, number> = Object.fromEntries(FILTERS.map((f) => [f.id, f.default]))
let filterOrder: string[] = FILTERS.map((f) => f.id)
let splitView = false
const undoStack: FilterState[][] = []
const redoStack: FilterState[][] = []

engine.on(UpdateFilter, ({ id, value }) => { filterValues = { ...filterValues, [id]: value }; engine.emit(FilterValuesChanged, filterValues) })
engine.on(ReorderFilters, (order) => { filterOrder = order; engine.emit(FilterOrderChanged, order) })
engine.on(ToggleSplit, () => { splitView = !splitView; engine.emit(SplitViewChanged, splitView) })
engine.on(ResetAll, () => { filterValues = Object.fromEntries(FILTERS.map((f) => [f.id, f.default])); engine.emit(FilterValuesChanged, filterValues) })

engine.on(PushHistory, () => {
  undoStack.push(Object.entries(filterValues).map(([id, value]) => ({ id, value }))); redoStack.length = 0
  engine.emit(CanUndoChanged, true); engine.emit(CanRedoChanged, false)
})

engine.on(Undo, () => {
  if (undoStack.length === 0) return
  redoStack.push(Object.entries(filterValues).map(([id, value]) => ({ id, value })))
  const snapshot = undoStack.pop()!
  filterValues = Object.fromEntries(snapshot.map((f) => [f.id, f.value]))
  engine.emit(FilterValuesChanged, filterValues); engine.emit(CanUndoChanged, undoStack.length > 0); engine.emit(CanRedoChanged, true)
})

engine.on(Redo, () => {
  if (redoStack.length === 0) return
  undoStack.push(Object.entries(filterValues).map(([id, value]) => ({ id, value })))
  const snapshot = redoStack.pop()!
  filterValues = Object.fromEntries(snapshot.map((f) => [f.id, f.value]))
  engine.emit(FilterValuesChanged, filterValues); engine.emit(CanUndoChanged, true); engine.emit(CanRedoChanged, redoStack.length > 0)
})
