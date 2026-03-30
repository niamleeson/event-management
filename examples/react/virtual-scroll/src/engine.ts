import { createEngine, type Signal } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Item {
  id: string
  title: string
  description: string
  category: string
  timestamp: number
}

export interface PagePayload {
  page: number
  items: Item[]
}

export interface VisibleRange {
  start: number
  end: number
}

export type SortDir = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TOTAL_ITEMS = 10000
export const PAGE_SIZE = 50
export const ITEM_HEIGHT = 60
export const VIEWPORT_HEIGHT = 900

const categories = ['Engineering', 'Design', 'Marketing', 'Sales', 'Support', 'Product', 'Finance', 'Legal']
const adjectives = ['Efficient', 'Dynamic', 'Robust', 'Scalable', 'Innovative', 'Critical', 'Strategic', 'Advanced']
const nouns = ['System', 'Module', 'Service', 'Pipeline', 'Framework', 'Platform', 'Dashboard', 'Workflow']

function generateItem(index: number): Item {
  const adj = adjectives[index % adjectives.length]
  const noun = nouns[Math.floor(index / adjectives.length) % nouns.length]
  return {
    id: `item-${index}`,
    title: `${adj} ${noun} #${index + 1}`,
    description: `Item ${index + 1} of ${TOTAL_ITEMS} — belongs to ${categories[index % categories.length]} department`,
    category: categories[index % categories.length],
    timestamp: Date.now() - (TOTAL_ITEMS - index) * 60000,
  }
}

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const ScrollChanged = engine.event<number>('ScrollChanged')
export const PageRequested = engine.event<number>('PageRequested')
export const PageLoaded = engine.event<PagePayload>('PageLoaded')
export const ItemClicked = engine.event<string>('ItemClicked')
export const FilterChanged = engine.event<string>('FilterChanged')
export const SortChanged = engine.event<SortDir>('SortChanged')
export const DebounceFilterApply = engine.event<string>('DebounceFilterApply')

// ---------------------------------------------------------------------------
// Async: PageRequested -> PageLoaded (simulated API)
// ---------------------------------------------------------------------------

const requestedPages = new Set<number>()

engine.async(PageRequested, {
  done: PageLoaded,
  strategy: 'all',
  do: async (page) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100))
    const start = page * PAGE_SIZE
    const items: Item[] = []
    for (let i = start; i < start + PAGE_SIZE && i < TOTAL_ITEMS; i++) {
      items.push(generateItem(i))
    }
    return { page, items }
  },
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const items: Signal<Map<number, Item>> = engine.signal<Map<number, Item>>(
  PageLoaded,
  new Map(),
  (prev, payload) => {
    const next = new Map(prev)
    for (const item of payload.items) {
      const idx = parseInt(item.id.split('-')[1])
      next.set(idx, item)
    }
    return next
  },
)

export const scrollPosition: Signal<number> = engine.signal<number>(
  ScrollChanged,
  0,
  (_prev, pos) => pos,
)

export const visibleRange: Signal<VisibleRange> = engine.signal<VisibleRange>(
  ScrollChanged,
  { start: 0, end: Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) },
  (_prev, scrollTop) => {
    const start = Math.floor(scrollTop / ITEM_HEIGHT)
    const end = Math.min(TOTAL_ITEMS - 1, start + Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) + 1)
    return { start, end }
  },
)

export const filter: Signal<string> = engine.signal<string>(
  DebounceFilterApply,
  '',
  (_prev, val) => val,
)

export const sort: Signal<SortDir> = engine.signal<SortDir>(
  SortChanged,
  'asc',
  (_prev, dir) => dir,
)

export const loadingPages: Signal<Set<number>> = engine.signal<Set<number>>(
  PageRequested,
  new Set(),
  (prev, page) => {
    const next = new Set(prev)
    next.add(page)
    return next
  },
)

engine.signalUpdate(loadingPages, PageLoaded, (prev, payload) => {
  const next = new Set(prev)
  next.delete(payload.page)
  return next
})

export const selectedItem: Signal<string | null> = engine.signal<string | null>(
  ItemClicked,
  null,
  (_prev, id) => id,
)

// ---------------------------------------------------------------------------
// Pipe: ScrollChanged -> prefetch pages
// ---------------------------------------------------------------------------

engine.on(ScrollChanged, (scrollTop) => {
  const startIdx = Math.floor(scrollTop / ITEM_HEIGHT)
  const endIdx = startIdx + Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) + 1

  // Calculate which pages we need
  const startPage = Math.floor(startIdx / PAGE_SIZE)
  const endPage = Math.floor(endIdx / PAGE_SIZE)

  // Also prefetch next page
  const prefetchPage = endPage + 1

  for (let p = startPage; p <= prefetchPage; p++) {
    if (p * PAGE_SIZE >= TOTAL_ITEMS) break
    if (!requestedPages.has(p)) {
      requestedPages.add(p)
      engine.emit(PageRequested, p)
    }
  }
})

// ---------------------------------------------------------------------------
// Debounced filter
// ---------------------------------------------------------------------------

engine.debounce(FilterChanged, 300, DebounceFilterApply)

// ---------------------------------------------------------------------------
// Load initial page
// ---------------------------------------------------------------------------

requestedPages.add(0)
engine.emit(PageRequested, 0)
