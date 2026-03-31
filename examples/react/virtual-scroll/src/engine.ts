import { createEngine } from '@pulse/core'

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

// State-changed events for React subscriptions
export const ItemsChanged = engine.event<Map<number, Item>>('ItemsChanged')
export const ScrollPositionChanged = engine.event<number>('ScrollPositionChanged')
export const VisibleRangeChanged = engine.event<VisibleRange>('VisibleRangeChanged')
export const FilterStateChanged = engine.event<string>('FilterStateChanged')
export const SortStateChanged = engine.event<SortDir>('SortStateChanged')
export const LoadingPagesChanged = engine.event<Set<number>>('LoadingPagesChanged')
export const SelectedItemChanged = engine.event<string | null>('SelectedItemChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let items: Map<number, Item> = new Map()
let scrollPosition = 0
let visibleRange: VisibleRange = { start: 0, end: Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) }
let filter = ''
let sort: SortDir = 'asc'
let loadingPages: Set<number> = new Set()
let selectedItem: string | null = null

const requestedPages = new Set<number>()

// ---------------------------------------------------------------------------
// Async: PageRequested -> PageLoaded (simulated API)
// ---------------------------------------------------------------------------

engine.on(PageRequested, async (page) => {
  loadingPages = new Set(loadingPages)
  loadingPages.add(page)
  engine.emit(LoadingPagesChanged, loadingPages)

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100))
  const start = page * PAGE_SIZE
  const pageItems: Item[] = []
  for (let i = start; i < start + PAGE_SIZE && i < TOTAL_ITEMS; i++) {
    pageItems.push(generateItem(i))
  }
  engine.emit(PageLoaded, { page, items: pageItems })
})

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(PageLoaded, (payload) => {
  const next = new Map(items)
  for (const item of payload.items) {
    const idx = parseInt(item.id.split('-')[1])
    next.set(idx, item)
  }
  items = next
  engine.emit(ItemsChanged, items)

  loadingPages = new Set(loadingPages)
  loadingPages.delete(payload.page)
  engine.emit(LoadingPagesChanged, loadingPages)
})

engine.on(ScrollChanged, (scrollTop) => {
  scrollPosition = scrollTop
  engine.emit(ScrollPositionChanged, scrollPosition)

  const start = Math.floor(scrollTop / ITEM_HEIGHT)
  const end = Math.min(TOTAL_ITEMS - 1, start + Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) + 1)
  visibleRange = { start, end }
  engine.emit(VisibleRangeChanged, visibleRange)

  // Prefetch pages
  const startPage = Math.floor(start / PAGE_SIZE)
  const endPage = Math.floor(end / PAGE_SIZE)
  const prefetchPage = endPage + 1

  for (let p = startPage; p <= prefetchPage; p++) {
    if (p * PAGE_SIZE >= TOTAL_ITEMS) break
    if (!requestedPages.has(p)) {
      requestedPages.add(p)
      engine.emit(PageRequested, p)
    }
  }
})

engine.on(ItemClicked, (id) => {
  selectedItem = id
  engine.emit(SelectedItemChanged, selectedItem)
})

engine.on(SortChanged, (dir) => {
  sort = dir
  engine.emit(SortStateChanged, sort)
})

// Debounced filter
let debounceTimer: ReturnType<typeof setTimeout> | null = null

engine.on(FilterChanged, (value) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    filter = value
    engine.emit(FilterStateChanged, filter)
  }, 300)
})

// ---------------------------------------------------------------------------
// Load initial page
// ---------------------------------------------------------------------------

requestedPages.add(0)
engine.emit(PageRequested, 0)
