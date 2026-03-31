import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FilterName = 'brightness' | 'contrast' | 'saturate' | 'blur' | 'grayscale' | 'sepia' | 'hue-rotate' | 'invert'

export interface Filter {
  id: string
  name: FilterName
  value: number // 0-200 for most, 0-20 for blur, 0-360 for hue-rotate
  enabled: boolean
}

export interface FilterParamPayload {
  index: number
  param: 'value' | 'enabled'
  value: number | boolean
}

export interface ReorderPayload {
  from: number
  to: number
}

// ---------------------------------------------------------------------------
// Filter configs
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const FilterAdded = engine.event<Filter>('FilterAdded')
export const FilterRemoved = engine.event<number>('FilterRemoved')
export const FilterReordered = engine.event<ReorderPayload>('FilterReordered')
export const FilterParamChanged = engine.event<FilterParamPayload>('FilterParamChanged')
export const UndoRequested = engine.event<void>('UndoRequested')
export const RedoRequested = engine.event<void>('RedoRequested')
export const ResetAll = engine.event<void>('ResetAll')
export const ImageLoaded = engine.event<void>('ImageLoaded')
export const FiltersChanged = engine.event<Filter[]>('FiltersChanged')
export const SnapshotPushed = engine.event<Filter[]>('SnapshotPushed')
export const TransitionStart = engine.event<void>('TransitionStart')
export const TransitionDone = engine.event<void>('TransitionDone')

// ---------------------------------------------------------------------------
// Tween: smooth filter transitions
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------


const RedoStackPush = engine.event<Filter[]>('RedoStackPush')

const UndoStackPop = engine.event<void>('UndoStackPop')

const RedoStackPop = engine.event<void>('RedoStackPop')

// State change events
export const UndoStackChanged = engine.event<Filter[][]>('UndoStackChanged')
export const RedoStackChanged = engine.event<Filter[][]>('RedoStackChanged')

// ---------------------------------------------------------------------------
// Compute CSS filter string
// ---------------------------------------------------------------------------

export function computeFilterString(filterList: Filter[]): string {
  return filterList
    .filter(f => f.enabled)
    .map(f => {
      const cfg = filterConfigs[f.name]
      if (f.name === 'blur') return `blur(${f.value}${cfg.unit})`
      if (f.name === 'hue-rotate') return `hue-rotate(${f.value}${cfg.unit})`
      return `${f.name}(${f.value}${cfg.unit})`
    })
    .join(' ')
}

// ---------------------------------------------------------------------------
// Pipes: filter changes -> recompute + push to undo
// ---------------------------------------------------------------------------

function pushChange(newFilters: Filter[]) {
  const current = filters.value
  engine.emit(SnapshotPushed, [...current])
  engine.emit(FiltersChanged, newFilters)
  engine.emit(TransitionStart, undefined)
}

engine.on(FilterAdded, (filter) => {
  pushChange([...filters.value, filter])
})

engine.on(FilterRemoved, (index) => {
  const next = [...filters.value]
  next.splice(index, 1)
  pushChange(next)
})

engine.on(FilterReordered, (payload) => {
  const next = [...filters.value]
  const [moved] = next.splice(payload.from, 1)
  next.splice(payload.to, 0, moved)
  pushChange(next)
})

engine.on(FilterParamChanged, (payload) => {
  const next = filters.value.map((f, i) => {
    if (i !== payload.index) return f
    if (payload.param === 'enabled') {
      return { ...f, enabled: payload.value as boolean }
    }
    return { ...f, value: payload.value as number }
  })
  pushChange(next)
})

engine.on(ResetAll, () => {
  pushChange([])
})

engine.on(UndoRequested, () => {
  const stack = undoStack.value
  if (stack.length === 0) return
  const prev = stack[stack.length - 1]
  engine.emit(RedoStackPush, [...filters.value])
  engine.emit(UndoStackPop, undefined)
  engine.emit(FiltersChanged, prev)
  engine.emit(TransitionStart, undefined)
})

engine.on(RedoRequested, () => {
  const stack = redoStack.value
  if (stack.length === 0) return
  const next = stack[stack.length - 1]
  // Push current to undo without clearing redo
  const currentUndo = [...undoStack.value, [...filters.value]]
  engine.emit(RedoStackPop, undefined)
  engine.emit(FiltersChanged, next)
  engine.emit(TransitionStart, undefined)
})

// Start frame loop for tweens

// ---------------------------------------------------------------------------
// Sample image URL (placeholder)
// ---------------------------------------------------------------------------

export const SAMPLE_IMAGE = 'https://picsum.photos/800/600?random=42'
