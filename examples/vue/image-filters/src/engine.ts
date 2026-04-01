// DAG
// FilterValueChanged ──→ FiltersChanged
//                    └──→ CanUndoChanged
//                    └──→ CanRedoChanged
// FilterReordered ──→ FiltersChanged
// ResetAll ──→ FiltersChanged
// SplitChanged ──→ SplitPositionChanged
// Undo ──→ ResetAll
//      └──→ FilterValueChanged (restore)
// Redo ──→ ResetAll
//      └──→ FilterValueChanged (restore)

import { createEngine } from '@pulse/core'
export const engine = createEngine()

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface FilterDef {
  name: string
  prop: string
  unit: string
  min: number
  max: number
  default: number
}

export interface FilterState {
  id: string
  name: string
  prop: string
  unit: string
  value: number
  default: number
  min: number
  max: number
}

export interface HistoryEntry {
  filters: FilterState[]
  label: string
}

/* ------------------------------------------------------------------ */
/*  Available filters                                                 */
/* ------------------------------------------------------------------ */

export const FILTER_DEFS: FilterDef[] = [
  { name: 'Brightness', prop: 'brightness', unit: '%', min: 0, max: 200, default: 100 },
  { name: 'Contrast', prop: 'contrast', unit: '%', min: 0, max: 200, default: 100 },
  { name: 'Saturate', prop: 'saturate', unit: '%', min: 0, max: 200, default: 100 },
  { name: 'Blur', prop: 'blur', unit: 'px', min: 0, max: 20, default: 0 },
  { name: 'Hue Rotate', prop: 'hue-rotate', unit: 'deg', min: 0, max: 360, default: 0 },
  { name: 'Grayscale', prop: 'grayscale', unit: '%', min: 0, max: 100, default: 0 },
  { name: 'Sepia', prop: 'sepia', unit: '%', min: 0, max: 100, default: 0 },
  { name: 'Invert', prop: 'invert', unit: '%', min: 0, max: 100, default: 0 },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const FilterValueChanged = engine.event<{ id: string; value: number }>('FilterValueChanged')
export const FilterReordered = engine.event<{ fromIdx: number; toIdx: number }>('FilterReordered')
export const Undo = engine.event('Undo')
export const Redo = engine.event('Redo')
export const ResetAll = engine.event('ResetAll')
export const SplitChanged = engine.event<number>('SplitChanged')

/* ------------------------------------------------------------------ */
/*  Initial state                                                     */
/* ------------------------------------------------------------------ */

let filterId = 0
function makeDefaultFilters(): FilterState[] {
  return FILTER_DEFS.map(d => ({
    id: `filter_${filterId++}`,
    name: d.name,
    prop: d.prop,
    unit: d.unit,
    value: d.default,
    default: d.default,
    min: d.min,
    max: d.max,
  }))
}

/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */

export let filters = makeDefaultFilters()
export const FiltersChanged = engine.event('FiltersChanged')
engine.on(FilterValueChanged, [FiltersChanged], ({ id, value }, setFilters) => {
  filters = filters.map(f => f.id === id ? { ...f, value } : f)
  setFilters(filters)
})

engine.on(FilterReordered, [FiltersChanged], ({ fromIdx, toIdx }, setFilters) => {
  const next = [...filters]
  const [item] = next.splice(fromIdx, 1)
  next.splice(toIdx, 0, item)
  filters = next
  setFilters(filters)
})

engine.on(ResetAll, [FiltersChanged], (_payload, setFilters) => {
  filters = makeDefaultFilters()
  setFilters(filters)
})

export let splitPosition = 50
export const SplitPositionChanged = engine.event('SplitPositionChanged')
engine.on(SplitChanged, [SplitPositionChanged], (val, setSplit) => {
  splitPosition = val
  setSplit(splitPosition)
})

/* ------------------------------------------------------------------ */
/*  Undo/Redo stack                                                   */
/* ------------------------------------------------------------------ */

const undoStack: HistoryEntry[] = []
const redoStack: HistoryEntry[] = []

export let canUndo = false
export const CanUndoChanged = engine.event('CanUndoChanged')
engine.on(FilterValueChanged, [CanUndoChanged], (_payload, setCanUndo) => {
  canUndo = undoStack.length > 0
  setCanUndo(canUndo)
})
export let canRedo = false
export const CanRedoChanged = engine.event('CanRedoChanged')
engine.on(FilterValueChanged, [CanRedoChanged], (_payload, setCanRedo) => {
  canRedo = redoStack.length > 0
  setCanRedo(canRedo)
})

// Record history on each change
engine.on(FilterValueChanged, ({ id }) => {
  const filterName = filters.find(f => f.id === id)?.name ?? 'unknown'
  undoStack.push({ filters: filters.map(f => ({ ...f })), label: `Changed ${filterName}` })
  redoStack.length = 0
})

engine.on(Undo, () => {
  if (undoStack.length === 0) return
  const entry = undoStack.pop()!
  redoStack.push({ filters: filters.map(f => ({ ...f })), label: 'Undo' })
  // Restore filters by emitting reset then re-applying
  engine.emit(ResetAll, undefined)
  for (const f of entry.filters) {
    engine.emit(FilterValueChanged, { id: f.id, value: f.value })
  }
})

engine.on(Redo, () => {
  if (redoStack.length === 0) return
  const entry = redoStack.pop()!
  undoStack.push({ filters: filters.map(f => ({ ...f })), label: 'Redo' })
  engine.emit(ResetAll, undefined)
  for (const f of entry.filters) {
    engine.emit(FilterValueChanged, { id: f.id, value: f.value })
  }
})

export function startLoop() {}
export function stopLoop() {}
