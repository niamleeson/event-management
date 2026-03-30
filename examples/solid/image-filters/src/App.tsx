import { For, Show } from 'solid-js'
import { useSignal, useEmit } from '@pulse/solid'
import type { Signal } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface FilterDef {
  id: string
  label: string
  property: string
  min: number
  max: number
  defaultValue: number
  unit: string
}

interface FilterState {
  id: string
  value: number
}

interface HistoryEntry {
  filters: FilterState[]
  label: string
}

/* ------------------------------------------------------------------ */
/*  Filter definitions                                                */
/* ------------------------------------------------------------------ */

const FILTER_DEFS: FilterDef[] = [
  { id: 'brightness', label: 'Brightness', property: 'brightness', min: 0, max: 200, defaultValue: 100, unit: '%' },
  { id: 'contrast', label: 'Contrast', property: 'contrast', min: 0, max: 200, defaultValue: 100, unit: '%' },
  { id: 'saturate', label: 'Saturation', property: 'saturate', min: 0, max: 200, defaultValue: 100, unit: '%' },
  { id: 'hue-rotate', label: 'Hue Rotate', property: 'hue-rotate', min: 0, max: 360, defaultValue: 0, unit: 'deg' },
  { id: 'blur', label: 'Blur', property: 'blur', min: 0, max: 20, defaultValue: 0, unit: 'px' },
  { id: 'sepia', label: 'Sepia', property: 'sepia', min: 0, max: 100, defaultValue: 0, unit: '%' },
  { id: 'grayscale', label: 'Grayscale', property: 'grayscale', min: 0, max: 100, defaultValue: 0, unit: '%' },
  { id: 'invert', label: 'Invert', property: 'invert', min: 0, max: 100, defaultValue: 0, unit: '%' },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const UpdateFilter = engine.event<FilterState>('UpdateFilter')
const ReorderFilter = engine.event<{ from: number; to: number }>('ReorderFilter')
const Undo = engine.event('Undo')
const Redo = engine.event('Redo')
const ResetFilters = engine.event('ResetFilters')
const ToggleSplit = engine.event('ToggleSplit')
const SplitPositionChanged = engine.event<number>('SplitPositionChanged')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const defaultFilters: FilterState[] = FILTER_DEFS.map(f => ({ id: f.id, value: f.defaultValue }))

const filterOrder = engine.signal<string[]>(
  ReorderFilter, FILTER_DEFS.map(f => f.id),
  (prev, { from, to }) => {
    const next = [...prev]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
  },
)
engine.signalUpdate(filterOrder, ResetFilters, () => FILTER_DEFS.map(f => f.id))

const filters = engine.signal<FilterState[]>(
  UpdateFilter, defaultFilters,
  (prev, update) => prev.map(f => f.id === update.id ? { ...f, value: update.value } : f),
)
engine.signalUpdate(filters, ResetFilters, () => defaultFilters)

// Undo/Redo history
const history = engine.signal<{ entries: HistoryEntry[]; index: number }>(
  UpdateFilter, { entries: [{ filters: defaultFilters, label: 'Initial' }], index: 0 },
  (prev, _update) => {
    const newEntries = prev.entries.slice(0, prev.index + 1)
    newEntries.push({ filters: filters.value, label: 'Filter changed' })
    return { entries: newEntries, index: newEntries.length - 1 }
  },
)

engine.signalUpdate(history, Undo, (prev) => ({
  ...prev,
  index: Math.max(0, prev.index - 1),
}))

engine.signalUpdate(history, Redo, (prev) => ({
  ...prev,
  index: Math.min(prev.entries.length - 1, prev.index + 1),
}))

// Restore filters on undo/redo
engine.on(Undo, () => {
  const h = history.value
  if (h.index > 0) {
    const entry = h.entries[h.index - 1]
    entry.filters.forEach(f => engine.emit(UpdateFilter, f))
  }
})

engine.on(Redo, () => {
  const h = history.value
  if (h.index < h.entries.length - 1) {
    const entry = h.entries[h.index + 1]
    entry.filters.forEach(f => engine.emit(UpdateFilter, f))
  }
})

const splitEnabled = engine.signal<boolean>(ToggleSplit, false, (prev) => !prev)
const splitPosition = engine.signal<number>(SplitPositionChanged, 50, (_prev, pos) => pos)

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function buildFilterString(filterValues: FilterState[], order: string[]): string {
  return order.map(id => {
    const def = FILTER_DEFS.find(f => f.id === id)!
    const state = filterValues.find(f => f.id === id)!
    return `${def.property}(${state.value}${def.unit})`
  }).join(' ')
}

/* ------------------------------------------------------------------ */
/*  Placeholder image (gradient-based)                                */
/* ------------------------------------------------------------------ */

const IMAGE_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)'

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function FilterSlider(props: { def: FilterDef; value: number }) {
  const emit = useEmit()
  const pct = () => ((props.value - props.def.min) / (props.def.max - props.def.min)) * 100

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': '4px' }}>
        <span style={{ 'font-size': '12px', color: '#ccc' }}>{props.def.label}</span>
        <span style={{ 'font-size': '12px', color: '#888' }}>{Math.round(props.value)}{props.def.unit}</span>
      </div>
      <input
        type="range"
        min={props.def.min}
        max={props.def.max}
        value={props.value}
        onInput={(e) => emit(UpdateFilter, { id: props.def.id, value: parseFloat(e.currentTarget.value) })}
        style={{ width: '100%', cursor: 'pointer' }}
      />
    </div>
  )
}

export default function App() {
  const emit = useEmit()
  const currentFilters = useSignal(filters)
  const order = useSignal(filterOrder)
  const split = useSignal(splitEnabled)
  const splitPos = useSignal(splitPosition)
  const hist = useSignal(history)

  const filterStr = () => buildFilterString(currentFilters(), order())
  const canUndo = () => hist().index > 0
  const canRedo = () => hist().index < hist().entries.length - 1

  let dragIdx = -1

  return (
    <div style={{ display: 'flex', height: '100vh', 'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Image preview */}
      <div style={{ flex: '1', display: 'flex', 'align-items': 'center', 'justify-content': 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Filtered image */}
        <div style={{
          width: '100%', height: '100%', background: IMAGE_GRADIENT,
          'background-size': 'cover', filter: filterStr(),
          'clip-path': split() ? `inset(0 ${100 - splitPos()}% 0 0)` : undefined,
        }} />

        {/* Original (before/after split) */}
        <Show when={split()}>
          <div style={{
            position: 'absolute', inset: '0', background: IMAGE_GRADIENT,
            'background-size': 'cover',
            'clip-path': `inset(0 0 0 ${splitPos()}%)`,
          }} />
          <div
            onPointerDown={(e) => {
              const el = e.currentTarget.parentElement!
              const move = (ev: PointerEvent) => {
                const rect = el.getBoundingClientRect()
                const pct = ((ev.clientX - rect.left) / rect.width) * 100
                emit(SplitPositionChanged, Math.max(0, Math.min(100, pct)))
              }
              const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
              window.addEventListener('pointermove', move)
              window.addEventListener('pointerup', up)
            }}
            style={{
              position: 'absolute', left: `${splitPos()}%`, top: '0', bottom: '0',
              width: '4px', background: '#fff', cursor: 'ew-resize',
              'box-shadow': '0 0 8px rgba(0,0,0,0.5)',
              transform: 'translateX(-50%)',
            }}
          >
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff', 'border-radius': '50%', width: '32px', height: '32px',
              display: 'flex', 'align-items': 'center', 'justify-content': 'center',
              'font-size': '14px', 'box-shadow': '0 2px 8px rgba(0,0,0,0.3)',
            }}>\u2194</div>
          </div>
        </Show>

        {/* Labels */}
        <Show when={split()}>
          <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 12px', 'border-radius': '4px', 'font-size': '12px' }}>Filtered</div>
          <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 12px', 'border-radius': '4px', 'font-size': '12px' }}>Original</div>
        </Show>
      </div>

      {/* Controls panel */}
      <div style={{ width: '300px', background: '#16213e', padding: '20px', overflow: 'auto', 'border-left': '1px solid #2d2d44' }}>
        <h2 style={{ 'font-size': '18px', 'font-weight': '600', 'margin-bottom': '16px', color: '#fff' }}>Image Filters</h2>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '8px', 'margin-bottom': '16px', 'flex-wrap': 'wrap' }}>
          <button disabled={!canUndo()} onClick={() => emit(Undo, undefined)} style={{ padding: '6px 12px', 'border-radius': '6px', border: 'none', background: canUndo() ? '#4361ee' : '#333', color: '#fff', cursor: canUndo() ? 'pointer' : 'default', 'font-size': '12px' }}>Undo</button>
          <button disabled={!canRedo()} onClick={() => emit(Redo, undefined)} style={{ padding: '6px 12px', 'border-radius': '6px', border: 'none', background: canRedo() ? '#4361ee' : '#333', color: '#fff', cursor: canRedo() ? 'pointer' : 'default', 'font-size': '12px' }}>Redo</button>
          <button onClick={() => emit(ResetFilters, undefined)} style={{ padding: '6px 12px', 'border-radius': '6px', border: 'none', background: '#d63031', color: '#fff', cursor: 'pointer', 'font-size': '12px' }}>Reset</button>
          <button onClick={() => emit(ToggleSplit, undefined)} style={{ padding: '6px 12px', 'border-radius': '6px', border: 'none', background: split() ? '#00b894' : '#333', color: '#fff', cursor: 'pointer', 'font-size': '12px' }}>
            {split() ? 'Hide Split' : 'Before/After'}
          </button>
        </div>

        {/* Filter pipeline (drag reorder) */}
        <div style={{ 'font-size': '11px', color: '#888', 'margin-bottom': '8px', 'text-transform': 'uppercase', 'letter-spacing': '0.5px' }}>
          Filter Pipeline (drag to reorder)
        </div>

        <For each={order()}>
          {(id, i) => {
            const def = () => FILTER_DEFS.find(f => f.id === id)!
            const val = () => currentFilters().find(f => f.id === id)?.value ?? def().defaultValue
            return (
              <div
                draggable={true}
                onDragStart={() => { dragIdx = i() }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx !== i()) emit(ReorderFilter, { from: dragIdx, to: i() })
                  dragIdx = -1
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)', 'border-radius': '8px',
                  padding: '8px 12px', 'margin-bottom': '6px', cursor: 'grab',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <FilterSlider def={def()} value={val()} />
              </div>
            )
          }}
        </For>

        {/* CSS output */}
        <div style={{ 'margin-top': '16px', padding: '12px', background: 'rgba(0,0,0,0.3)', 'border-radius': '8px' }}>
          <div style={{ 'font-size': '11px', color: '#888', 'margin-bottom': '4px' }}>CSS filter:</div>
          <code style={{ 'font-size': '10px', color: '#a29bfe', 'word-break': 'break-all' }}>{filterStr()}</code>
        </div>
      </div>
    </div>
  )
}
