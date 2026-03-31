import { usePulse, useEmit } from '@pulse/solid'
import {
  FilterAdded,
  FilterRemoved,
  FilterReordered,
  FilterParamChanged,
  UndoRequested,
  RedoRequested,
  ResetAll,
  filterConfigs,
  computeFilterString,
  SAMPLE_IMAGE,
  type FilterName,
  type Filter,
} from './engine'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#1a1a2e',
    color: '#fff',
  },
  sidebar: {
    width: 320,
    background: '#16213e',
    'border-right': '1px solid #0f3460',
    display: 'flex',
    'flex-direction': 'column' as const,
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '16px',
    'border-bottom': '1px solid #0f3460',
  },
  sidebarTitle: {
    'font-size': 16,
    'font-weight': 700,
    'margin-bottom': 12,
  },
  toolbar: {
    display: 'flex',
    gap: 6,
    'flex-wrap': 'wrap' as const,
  },
  filterBtn: {
    padding: '6px 12px',
    'font-size': 12,
    'font-weight': 600,
    border: '1px solid #0f3460',
    'border-radius': 6,
    background: '#1a1a2e',
    color: '#e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actionBar: {
    display: 'flex',
    gap: 8,
    padding: '10px 16px',
    'border-bottom': '1px solid #0f3460',
  },
  actionBtn: (disabled: boolean) => ({
    padding: '6px 14px',
    'font-size': 12,
    'font-weight': 600,
    border: '1px solid #0f3460',
    'border-radius': 6,
    background: disabled ? '#111' : '#0f3460',
    color: disabled ? '#555' : '#fff',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  }),
  filterList: {
    flex: 1,
    'overflow-y': 'auto' as const,
    padding: '8px 0',
  },
  filterItem: (isDragging: boolean) => ({
    padding: '12px 16px',
    'border-bottom': '1px solid #0f346033',
    background: isDragging ? '#0f3460' : 'transparent',
    transition: 'background 0.2s',
  }),
  filterItemHeader: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    'margin-bottom': 8,
  },
  filterItemName: {
    'font-size': 13,
    'font-weight': 600,
  },
  filterItemControls: {
    display: 'flex',
    'align-items': 'center',
    gap: 6,
  },
  toggleBtn: (enabled: boolean) => ({
    width: 36,
    height: 20,
    'border-radius': 10,
    border: 'none',
    background: enabled ? '#4361ee' : '#333',
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'background 0.2s',
  }),
  toggleKnob: (enabled: boolean) => ({
    position: 'absolute' as const,
    top: 2,
    left: enabled ? 18 : 2,
    width: 16,
    height: 16,
    'border-radius': '50%',
    background: '#fff',
    transition: 'left 0.2s',
  }),
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#e63946',
    'font-size': 16,
    cursor: 'pointer',
    padding: '0 4px',
  },
  moveBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    'font-size': 14,
    cursor: 'pointer',
    padding: '0 2px',
  },
  slider: {
    width: '100%',
    height: 4,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    background: '#333',
    'border-radius': 2,
    outline: 'none',
    cursor: 'pointer',
  },
  sliderValue: {
    'font-size': 11,
    color: '#aaa',
    'text-align': 'right' as const,
    'margin-top': 4,
  },
  main: {
    flex: 1,
    display: 'flex',
    'flex-direction': 'column' as const,
    overflow: 'hidden',
  },
  previewArea: {
    flex: 1,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    padding: 24,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  imageContainer: {
    position: 'relative' as const,
    'max-width': '100%',
    'max-height': '100%',
    overflow: 'hidden',
    'border-radius': 8,
    'box-shadow': '0 8px 32px rgba(0,0,0,0.4)',
  },
  image: (filterStr: string) => ({
    display: 'block',
    'max-width': '100%',
    'max-height': 'calc(100vh - 100px)',
    filter: filterStr || 'none',
    transition: 'filter 0.3s ease-out',
  }),
  splitView: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    'pointer-events': 'none' as const,
  },
  splitDivider: (pos: number) => ({
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    left: `${pos}%`,
    width: 3,
    background: '#fff',
    cursor: 'col-resize',
    'z-index': 10,
    'pointer-events': 'auto' as const,
    'box-shadow': '0 0 8px rgba(0,0,0,0.5)',
  }),
  splitLabel: (side: 'left' | 'right') => ({
    position: 'absolute' as const,
    top: 8,
    [side === 'left' ? 'left' : 'right']: 8,
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    'font-size': 11,
    'font-weight': 600,
    padding: '3px 8px',
    'border-radius': 4,
  }),
  bottomBar: {
    background: '#16213e',
    'border-top': '1px solid #0f3460',
    padding: '8px 20px',
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center',
    'font-size': 12,
    color: '#888',
  },
  cssOutput: {
    'font-family': 'monospace',
    'font-size': 11,
    color: '#4361ee',
    'max-width': 400,
    overflow: 'hidden',
    'text-overflow': 'ellipsis',
    'white-space': 'nowrap' as const,
  },
}

const globalStyle = `
body { margin: 0; overflow: hidden; }
input[type="range"] {
  -webkit-appearance: none;
  height: 4px;
  background: #333;
  border-radius: 2px;
  outline: none;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4361ee;
  cursor: pointer;
}
`

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function FilterToolbar() {
  const emit = useEmit()
  const allFilterNames: FilterName[] = [
    'brightness', 'contrast', 'saturate', 'blur',
    'grayscale', 'sepia', 'hue-rotate', 'invert',
  ]

  const addFilter = (name: FilterName) => {
    const cfg = filterConfigs[name]
    emit(FilterAdded, {
      id: crypto.randomUUID(),
      name,
      value: cfg.default,
      enabled: true,
    })
  }

  return (
    <div style={styles.sidebarHeader}>
      <div style={styles.sidebarTitle}>Add Filter</div>
      <div style={styles.toolbar}>
        {allFilterNames.map(name => (
          <button
            style={styles.filterBtn}
            onClick={() => addFilter(name)}
          >
            + {filterConfigs[name].label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ActionBar() {
  const emit = useEmit()
  const undo = usePulse(undoStack)
  const redo = usePulse(redoStack)
  const currentFilters = usePulse(filters)

  return (
    <div style={styles.actionBar}>
      <button
        style={styles.actionBtn(undo.length === 0)}
        onClick={() => emit(UndoRequested, undefined)}
        disabled={undo.length === 0}
      >
        Undo ({undo.length})
      </button>
      <button
        style={styles.actionBtn(redo.length === 0)}
        onClick={() => emit(RedoRequested, undefined)}
        disabled={redo.length === 0}
      >
        Redo ({redo.length})
      </button>
      <button
        style={styles.actionBtn(currentFilters.length === 0)}
        onClick={() => emit(ResetAll, undefined)}
        disabled={currentFilters.length === 0}
      >
        Reset All
      </button>
    </div>
  )
}

function FilterItem({ filter, index }: { filter: Filter; index: number }) {
  const emit = useEmit()
  const totalFilters = usePulse(filters).length
  const cfg = filterConfigs[filter.name]

  return (
    <div style={styles.filterItem(false)}>
      <div style={styles.filterItemHeader}>
        <span style={styles.filterItemName}>{cfg.label}</span>
        <div style={styles.filterItemControls}>
          <button
            style={styles.moveBtn}
            onClick={() => {
              if (index > 0) emit(FilterReordered, { from: index, to: index - 1 })
            }}
            disabled={index === 0}
            title="Move up"
          >
            {'▲'}
          </button>
          <button
            style={styles.moveBtn}
            onClick={() => {
              if (index < totalFilters - 1) emit(FilterReordered, { from: index, to: index + 1 })
            }}
            disabled={index === totalFilters - 1}
            title="Move down"
          >
            {'▼'}
          </button>
          <button
            style={styles.toggleBtn(filter.enabled)}
            onClick={() => emit(FilterParamChanged, { index, param: 'enabled', value: !filter.enabled })}
          >
            <div style={styles.toggleKnob(filter.enabled)} />
          </button>
          <button
            style={styles.removeBtn}
            onClick={() => emit(FilterRemoved, index)}
            title="Remove"
          >
            {'×'}
          </button>
        </div>
      </div>
      <input
        type="range"
        style={{ ...styles.slider, width: '100%' }}
        min={cfg.min}
        max={cfg.max}
        step={cfg.step}
        value={filter.value}
        onChange={(e) => emit(FilterParamChanged, { index, param: 'value', value: parseFloat(e.currentTarget.value) })}
        disabled={!filter.enabled}
      />
      <div style={styles.sliderValue}>
        {filter.value}{cfg.unit}
      </div>
    </div>
  )
}

function FilterList() {
  const currentFilters = usePulse(filters)

  if (currentFilters.length === 0) {
    return (
      <div style={{ padding: 20, color: '#666', 'font-size': 13, 'text-align': 'center' }}>
        No filters applied. Click a filter button above to add one.
      </div>
    )
  }

  return (
    <div style={styles.filterList}>
      {currentFilters.map((f, i) => (
        <FilterItem filter={f} index={i} />
      ))}
    </div>
  )
}

function ImagePreview() {
  const currentFilters = usePulse(filters)
  let splitRef = 50
  let containerRef = null
  let dragging = false

  const filterStr = computeFilterString(currentFilters)

  const handleMouseDown = () => { dragging = true }
  const handleMouseUp = () => { dragging = false }
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging || !containerRef) return
    const rect = containerRef.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    splitRef = Math.max(5, Math.min(95, pct))
    // Force re-render via DOM
    const divider = containerRef.querySelector('[data-divider]') as HTMLElement
    const clipEl = containerRef.querySelector('[data-before]') as HTMLElement
    if (divider) divider.style.left = `${splitRef}%`
    if (clipEl) clipEl.style.clipPath = `inset(0 ${100 - splitRef}% 0 0)`
  }

  return (
    <div style={styles.previewArea}>
      <div
        ref={containerRef}
        style={styles.imageContainer}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Filtered image (full) */}
        <img
          src={SAMPLE_IMAGE}
          alt="Preview"
          style={styles.image(filterStr)}
          crossOrigin="anonymous"
        />
        {/* Before image (clipped) */}
        {currentFilters.length > 0 && (
          <img
            data-before
            src={SAMPLE_IMAGE}
            alt="Before"
            style={{
              ...styles.image(''),
              position: 'absolute',
              top: 0,
              left: 0,
              'clip-path': `inset(0 50% 0 0)`,
            }}
            crossOrigin="anonymous"
          />
        )}
        {currentFilters.length > 0 && (
          <>
            <div
              data-divider
              style={styles.splitDivider(50)}
              onMouseDown={handleMouseDown}
            />
            <div style={{ ...styles.splitLabel('left'), position: 'absolute', top: 8, left: 8 }}>Before</div>
            <div style={{ ...styles.splitLabel('right'), position: 'absolute', top: 8, right: 8 }}>After</div>
          </>
        )}
      </div>
    </div>
  )
}

function BottomBar() {
  const currentFilters = usePulse(filters)
  const filterStr = computeFilterString(currentFilters)

  return (
    <div style={styles.bottomBar}>
      <span>{currentFilters.length} filter(s) applied</span>
      <div style={styles.cssOutput}>
        {filterStr ? `filter: ${filterStr};` : 'No filters'}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <>
      <style>{globalStyle}</style>
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <FilterToolbar />
          <ActionBar />
          <FilterList />
        </div>
        <div style={styles.main}>
          <ImagePreview />
          <BottomBar />
        </div>
      </div>
    </>
  )
}
