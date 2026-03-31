import { usePulse, useEmit } from '@pulse/solid'
import {
  ScrollChanged,
  FilterChanged,
  SortChanged,
  ItemClicked,
  TOTAL_ITEMS,
  ITEM_HEIGHT,
  VIEWPORT_HEIGHT,
  type SortDir,
} from './engine'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    height: '100vh',
    display: 'flex',
    'flex-direction': 'column' as const,
    background: '#f8f9fa',
  },
  header: {
    background: '#fff',
    'border-bottom': '1px solid #e0e0e0',
    padding: '16px 24px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    gap: 16,
    'box-shadow': '0 1px 3px rgba(0,0,0,0.05)',
  },
  title: {
    'font-size': 20,
    'font-weight': 700,
    color: '#1a1a2e',
    margin: 0,
  },
  toolbar: {
    display: 'flex',
    'align-items': 'center',
    gap: 12,
  },
  searchInput: {
    padding: '8px 14px',
    'font-size': 14,
    border: '1px solid #d0d0d0',
    'border-radius': 8,
    outline: 'none',
    width: 240,
    transition: 'border-color 0.2s',
  },
  sortBtn: (active: boolean) => ({
    padding: '8px 16px',
    'font-size': 13,
    'font-weight': 600,
    border: '1px solid #d0d0d0',
    'border-radius': 8,
    background: active ? '#4361ee' : '#fff',
    color: active ? '#fff' : '#333',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  stats: {
    'font-size': 13,
    color: '#888',
    padding: '8px 24px',
    background: '#fff',
    'border-bottom': '1px solid #eee',
    display: 'flex',
    'justify-content': 'space-between',
  },
  viewport: {
    flex: 1,
    overflow: 'auto' as const,
    position: 'relative' as const,
  },
  scrollContent: (height: number) => ({
    height,
    position: 'relative' as const,
  }),
  itemRow: (top: number, isSelected: boolean) => ({
    position: 'absolute' as const,
    top,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    display: 'flex',
    'align-items': 'center',
    padding: '0 24px',
    'border-bottom': '1px solid #eee',
    background: isSelected ? '#eef0ff' : '#fff',
    cursor: 'pointer',
    transition: 'background 0.15s',
    'box-sizing': 'border-box' as const,
  }),
  itemIndex: {
    width: 60,
    'font-size': 12,
    color: '#999',
    'font-weight': 600,
    'flex-shrink': 0,
  },
  itemContent: {
    flex: 1,
    overflow: 'hidden' as const,
  },
  itemTitle: {
    'font-size': 14,
    'font-weight': 600,
    color: '#1a1a2e',
    'white-space': 'nowrap' as const,
    overflow: 'hidden' as const,
    'text-overflow': 'ellipsis' as const,
  },
  itemDesc: {
    'font-size': 12,
    color: '#888',
    'margin-top': 2,
    'white-space': 'nowrap' as const,
    overflow: 'hidden' as const,
    'text-overflow': 'ellipsis' as const,
  },
  itemCategory: (cat: string) => {
    const colors: Record<string, string> = {
      Engineering: '#4361ee',
      Design: '#e91e63',
      Marketing: '#ff9800',
      Sales: '#4caf50',
      Support: '#00bcd4',
      Product: '#9c27b0',
      Finance: '#607d8b',
      Legal: '#795548',
    }
    return {
      'font-size': 11,
      'font-weight': 600,
      padding: '2px 8px',
      'border-radius': 10,
      background: (colors[cat] ?? '#999') + '20',
      color: colors[cat] ?? '#999',
      'flex-shrink': 0,
    }
  },
  skeleton: {
    position: 'absolute' as const,
    left: 24,
    right: 24,
    display: 'flex',
    'align-items': 'center',
    gap: 12,
    height: ITEM_HEIGHT,
    'box-sizing': 'border-box' as const,
  },
  skeletonBar: (width: number) => ({
    height: 12,
    width,
    background: '#e8e8e8',
    'border-radius': 6,
    animation: 'shimmer 1.5s infinite',
  }),
  loadingBadge: {
    'font-size': 11,
    color: '#4361ee',
    'font-weight': 600,
  },
}

const globalStyle = `
body { margin: 0; }
@keyframes shimmer {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}
`

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function Toolbar() {
  const emit = useEmit()
  const currentSort = usePulse(sort)
  const currentFilter = usePulse(filter)

  const handleFilterChange = (e: Event) => {
    emit(FilterChanged, e.currentTarget.value)
  }

  const toggleSort = () => {
    const next: SortDir = currentSort === 'asc' ? 'desc' : 'asc'
    emit(SortChanged, next)
  }

  return (
    <div style={styles.header}>
      <h1 style={styles.title}>Virtual Scroll</h1>
      <div style={styles.toolbar}>
        <input
          style={styles.searchInput}
          placeholder="Search items..."
          defaultValue={currentFilter}
          onChange={handleFilterChange}
        />
        <button
          style={styles.sortBtn(true)}
          onClick={toggleSort}
        >
          Sort: {currentSort === 'asc' ? 'A-Z ↑' : 'Z-A ↓'}
        </button>
      </div>
    </div>
  )
}

function StatsBar() {
  const loadedItems = usePulse(items)
  const loading = usePulse(loadingPages)
  const range = usePulse(visibleRange)
  const currentFilter = usePulse(filter)

  const loadedCount = loadedItems.size
  const filtered = currentFilter
    ? Array.from(loadedItems.values()).filter(
        it => it.title.toLowerCase().includes(currentFilter.toLowerCase()) ||
              it.category.toLowerCase().includes(currentFilter.toLowerCase())
      ).length
    : loadedCount

  return (
    <div style={styles.stats}>
      <span>
        {currentFilter
          ? `${filtered} matching of ${loadedCount} loaded / ${TOTAL_ITEMS.toLocaleString()} total`
          : `${loadedCount} of ${TOTAL_ITEMS.toLocaleString()} items loaded`
        }
      </span>
      <span>
        Viewing rows {range.start + 1} - {range.end + 1}
        {loading.size > 0 && (
          <span style={styles.loadingBadge}> | Loading {loading.size} page(s)...</span>
        )}
      </span>
    </div>
  )
}

function SkeletonRow({ top }: { top: number }) {
  return (
    <div style={{ ...styles.skeleton, top }}>
      <div style={styles.skeletonBar(40)} />
      <div style={{ flex: 1 }}>
        <div style={styles.skeletonBar(180)} />
        <div style={{ ...styles.skeletonBar(250), 'margin-top': 6, height: 8 }} />
      </div>
      <div style={styles.skeletonBar(60)} />
    </div>
  )
}

function VirtualList() {
  const emit = useEmit()
  const allItems = usePulse(items)
  const range = usePulse(visibleRange)
  const selected = usePulse(selectedItem)
  const currentFilter = usePulse(filter)
  const currentSort = usePulse(sort)
  let viewportRef = null

  const handleScroll = () => {
    if (viewportRef) {
      emit(ScrollChanged, viewportRef.scrollTop)
    }
  }

  // Build filtered + sorted index mapping
  // For virtual scroll with filter, we still show full height but filter visible items
  const totalHeight = TOTAL_ITEMS * ITEM_HEIGHT

  // Render items in visible range
  const rows: any[] = []
  const overscan = 3
  const start = Math.max(0, range.start - overscan)
  const end = Math.min(TOTAL_ITEMS - 1, range.end + overscan)

  for (let i = start; i <= end; i++) {
    const item = allItems.get(i)
    const top = i * ITEM_HEIGHT

    if (!item) {
      rows.push(<SkeletonRow top={top} />)
      continue
    }

    // Apply filter
    if (currentFilter) {
      const matchesFilter =
        item.title.toLowerCase().includes(currentFilter.toLowerCase()) ||
        item.category.toLowerCase().includes(currentFilter.toLowerCase())
      if (!matchesFilter) {
        rows.push(
          <div
            style={{
              ...styles.itemRow(top, false),
              opacity: 0.15,
              'pointer-events': 'none',
            }}
          >
            <div style={styles.itemIndex}>#{i + 1}</div>
            <div style={styles.itemContent}>
              <div style={styles.itemTitle}>{item.title}</div>
            </div>
          </div>
        )
        continue
      }
    }

    rows.push(
      <div
        style={styles.itemRow(top, selected === item.id)}
        onClick={() => emit(ItemClicked, item.id)}
      >
        <div style={styles.itemIndex}>#{i + 1}</div>
        <div style={styles.itemContent}>
          <div style={styles.itemTitle}>{item.title}</div>
          <div style={styles.itemDesc}>{item.description}</div>
        </div>
        <div style={styles.itemCategory(item.category)}>{item.category}</div>
      </div>
    )
  }

  return (
    <div
      ref={viewportRef}
      style={styles.viewport}
      onScroll={handleScroll}
    >
      <div style={styles.scrollContent(totalHeight)}>
        {rows}
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
        <Toolbar />
        <StatsBar />
        <VirtualList />
      </div>
    </>
  )
}
