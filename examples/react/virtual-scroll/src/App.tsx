import { useRef, useCallback } from 'react'
import { usePulse, useEmit } from '@pulse/react'
import {
  ItemsChanged,
  VisibleRangeChanged,
  FilterStateChanged,
  SortStateChanged,
  LoadingPagesChanged,
  SelectedItemChanged,
  ScrollChanged,
  FilterChanged,
  SortChanged,
  ItemClicked,
  TOTAL_ITEMS,
  ITEM_HEIGHT,
  VIEWPORT_HEIGHT,
  type SortDir,
  type Item,
  type VisibleRange,
} from './engine'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#f8f9fa',
  },
  header: {
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1a1a2e',
    margin: 0,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    padding: '8px 14px',
    fontSize: 14,
    border: '1px solid #d0d0d0',
    borderRadius: 8,
    outline: 'none',
    width: 240,
    transition: 'border-color 0.2s',
  },
  sortBtn: (active: boolean) => ({
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    border: '1px solid #d0d0d0',
    borderRadius: 8,
    background: active ? '#4361ee' : '#fff',
    color: active ? '#fff' : '#333',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  stats: {
    fontSize: 13,
    color: '#888',
    padding: '8px 24px',
    background: '#fff',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
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
    alignItems: 'center',
    padding: '0 24px',
    borderBottom: '1px solid #eee',
    background: isSelected ? '#eef0ff' : '#fff',
    cursor: 'pointer',
    transition: 'background 0.15s',
    boxSizing: 'border-box' as const,
  }),
  itemIndex: {
    width: 60,
    fontSize: 12,
    color: '#999',
    fontWeight: 600,
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    overflow: 'hidden' as const,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a2e',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  itemDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
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
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 10,
      background: (colors[cat] ?? '#999') + '20',
      color: colors[cat] ?? '#999',
      flexShrink: 0,
    }
  },
  skeleton: {
    position: 'absolute' as const,
    left: 24,
    right: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    height: ITEM_HEIGHT,
    boxSizing: 'border-box' as const,
  },
  skeletonBar: (width: number) => ({
    height: 12,
    width,
    background: '#e8e8e8',
    borderRadius: 6,
    animation: 'shimmer 1.5s infinite',
  }),
  loadingBadge: {
    fontSize: 11,
    color: '#4361ee',
    fontWeight: 600,
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
  const currentSort = usePulse(SortStateChanged, 'asc' as SortDir)
  const currentFilter = usePulse(FilterStateChanged, '')

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    emit(FilterChanged, e.target.value)
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
          Sort: {currentSort === 'asc' ? 'A-Z \u2191' : 'Z-A \u2193'}
        </button>
      </div>
    </div>
  )
}

function StatsBar() {
  const loadedItems = usePulse(ItemsChanged, new Map<number, Item>())
  const loading = usePulse(LoadingPagesChanged, new Set<number>())
  const range = usePulse(VisibleRangeChanged, { start: 0, end: Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) } as VisibleRange)
  const currentFilter = usePulse(FilterStateChanged, '')

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
        <div style={{ ...styles.skeletonBar(250), marginTop: 6, height: 8 }} />
      </div>
      <div style={styles.skeletonBar(60)} />
    </div>
  )
}

function VirtualList() {
  const emit = useEmit()
  const allItems = usePulse(ItemsChanged, new Map<number, Item>())
  const range = usePulse(VisibleRangeChanged, { start: 0, end: Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) } as VisibleRange)
  const selected = usePulse(SelectedItemChanged, null as string | null)
  const currentFilter = usePulse(FilterStateChanged, '')
  const currentSort = usePulse(SortStateChanged, 'asc' as SortDir)
  const viewportRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    if (viewportRef.current) {
      emit(ScrollChanged, viewportRef.current.scrollTop)
    }
  }, [emit])

  // Build filtered + sorted index mapping
  // For virtual scroll with filter, we still show full height but filter visible items
  const totalHeight = TOTAL_ITEMS * ITEM_HEIGHT

  // Render items in visible range
  const rows: React.ReactNode[] = []
  const overscan = 3
  const start = Math.max(0, range.start - overscan)
  const end = Math.min(TOTAL_ITEMS - 1, range.end + overscan)

  for (let i = start; i <= end; i++) {
    const item = allItems.get(i)
    const top = i * ITEM_HEIGHT

    if (!item) {
      rows.push(<SkeletonRow key={`skeleton-${i}`} top={top} />)
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
            key={item.id}
            style={{
              ...styles.itemRow(top, false),
              opacity: 0.15,
              pointerEvents: 'none',
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
        key={item.id}
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
