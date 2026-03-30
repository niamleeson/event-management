import { For, Show, onMount, onCleanup, createSignal as solidSignal } from 'solid-js'
import { useSignal, useEmit } from '@pulse/solid'
import type { Signal } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Data generation                                                   */
/* ------------------------------------------------------------------ */

const TOTAL_ITEMS = 10000
const ROW_HEIGHT = 60
const PAGE_SIZE = 50
const PREFETCH_THRESHOLD = 200

interface Item {
  id: number
  name: string
  email: string
  department: string
  status: 'active' | 'inactive' | 'pending'
}

function generateItem(id: number): Item {
  const depts = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Legal', 'Ops']
  const statuses: Item['status'][] = ['active', 'inactive', 'pending']
  return {
    id,
    name: `User ${id.toString().padStart(5, '0')}`,
    email: `user${id}@example.com`,
    department: depts[id % depts.length],
    status: statuses[id % 3],
  }
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const ScrollTo = engine.event<number>('ScrollTo')
const SearchQuery = engine.event<string>('SearchQuery')
const PageLoaded = engine.event<{ page: number; items: Item[] }>('PageLoaded')
const LoadPage = engine.event<number>('LoadPage')
const LoadPagePending = engine.event<number>('LoadPagePending')
const LoadPageDone = engine.event<{ page: number; items: Item[] }>('LoadPageDone')
const LoadPageError = engine.event<{ page: number; error: string }>('LoadPageError')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const scrollTop = engine.signal<number>(ScrollTo, 0, (_prev, v) => v)
const searchQuery = engine.signal<string>(SearchQuery, '', (_prev, q) => q)

// Loaded pages cache
const loadedPages = engine.signal<Record<number, Item[]>>(
  PageLoaded, {} as Record<number, Item[]>,
  (prev, { page, items }) => ({ ...prev, [page]: items }),
)

const loadingPages = engine.signal<Set<number>>(
  LoadPagePending, new Set<number>(),
  (prev, page) => { const s = new Set(prev); s.add(page); return s },
)
engine.signalUpdate(loadingPages, LoadPageDone, (prev, { page }) => {
  const s = new Set(prev); s.delete(page); return s
})
engine.signalUpdate(loadingPages, LoadPageError, (prev, { page }) => {
  const s = new Set(prev); s.delete(page); return s
})

/* ------------------------------------------------------------------ */
/*  Async page loading                                                */
/* ------------------------------------------------------------------ */

engine.async<number, { page: number; items: Item[] }>(LoadPage, {
  pending: LoadPagePending,
  done: LoadPageDone,
  error: LoadPageError,
  strategy: 'all',
  do: async (page) => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
    const start = page * PAGE_SIZE
    const items = Array.from({ length: PAGE_SIZE }, (_, i) => generateItem(start + i))
    return { page, items }
  },
})

engine.on(LoadPageDone, ({ page, items }) => {
  engine.emit(PageLoaded, { page, items })
})

/* ------------------------------------------------------------------ */
/*  Prefetch logic                                                    */
/* ------------------------------------------------------------------ */

engine.on(ScrollTo, (top) => {
  const startIdx = Math.floor(top / ROW_HEIGHT)
  const endIdx = startIdx + Math.ceil(600 / ROW_HEIGHT)
  const startPage = Math.floor(startIdx / PAGE_SIZE)
  const endPage = Math.floor(endIdx / PAGE_SIZE)

  for (let p = Math.max(0, startPage - 1); p <= endPage + 1; p++) {
    if (!loadedPages.value[p] && !loadingPages.value.has(p) && p * PAGE_SIZE < TOTAL_ITEMS) {
      engine.emit(LoadPage, p)
    }
  }
})

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', 'align-items': 'center', padding: '0 24px', gap: '16px', height: `${ROW_HEIGHT}px` }}>
      <div style={{ width: '40px', height: '12px', background: '#e0e0e0', 'border-radius': '4px', animation: 'pulse 1.5s infinite' }} />
      <div style={{ width: '120px', height: '12px', background: '#e0e0e0', 'border-radius': '4px', animation: 'pulse 1.5s infinite 0.1s' }} />
      <div style={{ width: '180px', height: '12px', background: '#e0e0e0', 'border-radius': '4px', animation: 'pulse 1.5s infinite 0.2s' }} />
    </div>
  )
}

function VirtualList() {
  const emit = useEmit()
  const top = useSignal(scrollTop)
  const pages = useSignal(loadedPages)
  const loading = useSignal(loadingPages)
  const query = useSignal(searchQuery)
  let containerRef!: HTMLDivElement

  const filteredCount = () => {
    if (!query()) return TOTAL_ITEMS
    // Approximate filtered count
    return Math.floor(TOTAL_ITEMS * 0.3)
  }

  const totalHeight = () => filteredCount() * ROW_HEIGHT
  const startIdx = () => Math.floor(top() / ROW_HEIGHT)
  const visibleCount = () => Math.ceil(600 / ROW_HEIGHT) + 2
  const offsetY = () => startIdx() * ROW_HEIGHT

  const getItem = (index: number): Item | null => {
    const page = Math.floor(index / PAGE_SIZE)
    const pageItems = pages()[page]
    if (!pageItems) return null
    return pageItems[index % PAGE_SIZE] ?? null
  }

  const visibleItems = () => {
    const items: (Item | null)[] = []
    for (let i = 0; i < visibleCount(); i++) {
      const idx = startIdx() + i
      if (idx >= TOTAL_ITEMS) break
      const item = getItem(idx)
      if (query() && item && !item.name.toLowerCase().includes(query().toLowerCase()) && !item.department.toLowerCase().includes(query().toLowerCase())) {
        continue
      }
      items.push(item)
    }
    return items
  }

  const handleScroll = () => {
    if (containerRef) emit(ScrollTo, containerRef.scrollTop)
  }

  // Initial load
  onMount(() => {
    emit(ScrollTo, 0)
  })

  const statusColor = (s: string) => s === 'active' ? '#00b894' : s === 'pending' ? '#fdcb6e' : '#d63031'

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: '600px', overflow: 'auto', background: '#fff', 'border-radius': '8px', 'box-shadow': '0 2px 8px rgba(0,0,0,0.1)' }}
    >
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
      <div style={{ height: `${totalHeight()}px`, position: 'relative' }}>
        <div style={{ position: 'absolute', top: `${offsetY()}px`, left: '0', right: '0' }}>
          <For each={visibleItems()}>
            {(item) => (
              item ? (
                <div style={{
                  display: 'flex', 'align-items': 'center', padding: '0 24px',
                  height: `${ROW_HEIGHT}px`, 'border-bottom': '1px solid #f0f0f0',
                  gap: '16px', 'font-size': '14px',
                }}>
                  <div style={{ width: '60px', color: '#999', 'font-size': '12px' }}>#{item.id}</div>
                  <div style={{ width: '150px', 'font-weight': '500', color: '#333' }}>{item.name}</div>
                  <div style={{ flex: '1', color: '#666' }}>{item.email}</div>
                  <div style={{ width: '100px', color: '#888' }}>{item.department}</div>
                  <div style={{
                    padding: '2px 10px', 'border-radius': '10px', 'font-size': '11px',
                    'font-weight': '600', 'text-transform': 'uppercase',
                    background: statusColor(item.status) + '22', color: statusColor(item.status),
                  }}>{item.status}</div>
                </div>
              ) : <SkeletonRow />
            )}
          </For>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const emit = useEmit()
  const query = useSignal(searchQuery)
  const loading = useSignal(loadingPages)

  return (
    <div style={{ 'max-width': '900px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '16px' }}>
        <div>
          <h1 style={{ 'font-size': '24px', 'font-weight': '700', color: '#333', margin: '0' }}>Virtual Scroll</h1>
          <p style={{ 'font-size': '14px', color: '#888', margin: '4px 0 0' }}>10,000 items with async page loading</p>
        </div>
        <Show when={loading().size > 0}>
          <span style={{ 'font-size': '12px', color: '#0984e3' }}>Loading {loading().size} page(s)...</span>
        </Show>
      </div>

      <input
        placeholder="Search by name or department..."
        value={query()}
        onInput={(e) => emit(SearchQuery, e.currentTarget.value)}
        style={{
          width: '100%', padding: '12px 16px', 'font-size': '14px',
          border: '1px solid #ddd', 'border-radius': '8px', 'margin-bottom': '16px',
          outline: 'none', background: '#fff',
        }}
      />

      {/* Column headers */}
      <div style={{
        display: 'flex', 'align-items': 'center', padding: '0 24px', height: '40px',
        background: '#f8f9fa', 'border-radius': '8px 8px 0 0', gap: '16px',
        'font-size': '12px', 'font-weight': '600', color: '#888', 'text-transform': 'uppercase', 'letter-spacing': '0.5px',
      }}>
        <div style={{ width: '60px' }}>ID</div>
        <div style={{ width: '150px' }}>Name</div>
        <div style={{ flex: '1' }}>Email</div>
        <div style={{ width: '100px' }}>Dept</div>
        <div style={{ width: '80px' }}>Status</div>
      </div>

      <VirtualList />
    </div>
  )
}
