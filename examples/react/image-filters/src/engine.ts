import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// FilterAdded ───┬──→ FiltersChanged
//                ├──→ UndoStackChanged
//                └──→ RedoStackChanged
// FilterRemoved ─┬──→ FiltersChanged
//                ├──→ UndoStackChanged
//                └──→ RedoStackChanged
// FilterReordered ┬──→ FiltersChanged
//                 ├──→ UndoStackChanged
//                 └──→ RedoStackChanged
// FilterParamChanged ┬──→ FiltersChanged
//                    ├──→ UndoStackChanged
//                    └──→ RedoStackChanged
// ResetAll ──┬──→ FiltersChanged
//            ├──→ UndoStackChanged
//            └──→ RedoStackChanged
// UndoRequested ┬──→ FiltersChanged
//               ├──→ UndoStackChanged
//               └──→ RedoStackChanged
// RedoRequested ┬──→ FiltersChanged
//               ├──→ UndoStackChanged
//               └──→ RedoStackChanged
// ---------------------------------------------------------------------------

export type FilterName = 'brightness' | 'contrast' | 'saturate' | 'blur' | 'grayscale' | 'sepia' | 'hue-rotate' | 'invert'
export interface Filter { id: string; name: FilterName; value: number; enabled: boolean }
export interface FilterParamPayload { index: number; param: 'value' | 'enabled'; value: number | boolean }
export interface ReorderPayload { from: number; to: number }

export const filterConfigs: Record<FilterName, { label: string; unit: string; min: number; max: number; default: number; step: number }> = {
  'brightness': { label: 'Brightness', unit: '%', min: 0, max: 200, default: 100, step: 1 },
  'contrast': { label: 'Contrast', unit: '%', min: 0, max: 200, default: 100, step: 1 },
  'saturate': { label: 'Saturate', unit: '%', min: 0, max: 200, default: 100, step: 1 },
  'blur': { label: 'Blur', unit: 'px', min: 0, max: 20, default: 0, step: 0.5 },
  'grayscale': { label: 'Grayscale', unit: '%', min: 0, max: 100, default: 0, step: 1 },
  'sepia': { label: 'Sepia', unit: '%', min: 0, max: 100, default: 0, step: 1 },
  'hue-rotate': { label: 'Hue Rotate', unit: 'deg', min: 0, max: 360, default: 0, step: 1 },
  'invert': { label: 'Invert', unit: '%', min: 0, max: 100, default: 0, step: 1 },
}

export const FilterAdded = engine.event<Filter>('FilterAdded')
export const FilterRemoved = engine.event<number>('FilterRemoved')
export const FilterReordered = engine.event<ReorderPayload>('FilterReordered')
export const FilterParamChanged = engine.event<FilterParamPayload>('FilterParamChanged')
export const UndoRequested = engine.event<void>('UndoRequested')
export const RedoRequested = engine.event<void>('RedoRequested')
export const ResetAll = engine.event<void>('ResetAll')

export const FiltersChanged = engine.event<Filter[]>('FiltersChanged')
export const UndoStackChanged = engine.event<Filter[][]>('UndoStackChanged')
export const RedoStackChanged = engine.event<Filter[][]>('RedoStackChanged')

let filters: Filter[] = []
let undoStack: Filter[][] = []
let redoStack: Filter[][] = []

type EmitAllFn = (f: Filter[], u: Filter[][], r: Filter[][]) => void

function pushChange(newFilters: Filter[], setFilters: (v: Filter[]) => void, setUndo: (v: Filter[][]) => void, setRedo: (v: Filter[][]) => void) {
  undoStack = [...undoStack, [...filters]]; redoStack = []
  filters = newFilters
  setFilters([...filters]); setUndo([...undoStack]); setRedo([...redoStack])
}

engine.on(FilterAdded, [FiltersChanged, UndoStackChanged, RedoStackChanged], (f, setFilters, setUndo, setRedo) => pushChange([...filters, f], setFilters, setUndo, setRedo))
engine.on(FilterRemoved, [FiltersChanged, UndoStackChanged, RedoStackChanged], (i, setFilters, setUndo, setRedo) => { const n = [...filters]; n.splice(i, 1); pushChange(n, setFilters, setUndo, setRedo) })
engine.on(FilterReordered, [FiltersChanged, UndoStackChanged, RedoStackChanged], (p, setFilters, setUndo, setRedo) => { const n = [...filters]; const [m] = n.splice(p.from, 1); n.splice(p.to, 0, m); pushChange(n, setFilters, setUndo, setRedo) })
engine.on(FilterParamChanged, [FiltersChanged, UndoStackChanged, RedoStackChanged], (p, setFilters, setUndo, setRedo) => {
  pushChange(filters.map((f, i) => i !== p.index ? f : p.param === 'enabled' ? { ...f, enabled: p.value as boolean } : { ...f, value: p.value as number }), setFilters, setUndo, setRedo)
})
engine.on(ResetAll, [FiltersChanged, UndoStackChanged, RedoStackChanged], (_, setFilters, setUndo, setRedo) => pushChange([], setFilters, setUndo, setRedo))
engine.on(UndoRequested, [FiltersChanged, UndoStackChanged, RedoStackChanged], (_, setFilters, setUndo, setRedo) => {
  if (undoStack.length === 0) return
  redoStack = [...redoStack, [...filters]]; filters = undoStack[undoStack.length - 1]; undoStack = undoStack.slice(0, -1)
  setFilters([...filters]); setUndo([...undoStack]); setRedo([...redoStack])
})
engine.on(RedoRequested, [FiltersChanged, UndoStackChanged, RedoStackChanged], (_, setFilters, setUndo, setRedo) => {
  if (redoStack.length === 0) return
  undoStack = [...undoStack, [...filters]]; filters = redoStack[redoStack.length - 1]; redoStack = redoStack.slice(0, -1)
  setFilters([...filters]); setUndo([...undoStack]); setRedo([...redoStack])
})

export function computeFilterString(filterList: Filter[]): string {
  return filterList.filter(f => f.enabled).map(f => {
    const cfg = filterConfigs[f.name]
    if (f.name === 'blur') return `blur(${f.value}${cfg.unit})`
    if (f.name === 'hue-rotate') return `hue-rotate(${f.value}${cfg.unit})`
    return `${f.name}(${f.value}${cfg.unit})`
  }).join(' ')
}

export const SAMPLE_IMAGE = 'https://picsum.photos/800/600?random=42'

export function startLoop() {}
export function stopLoop() {}
