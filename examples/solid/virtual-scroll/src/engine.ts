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
export const DebounceFilterApply = engine.event<string>('DebounceFilterApply')

// State change events
export const ScrollPositionChanged = engine.event<number>('ScrollPositionChanged')
export const VisibleRangeChanged = engine.event<VisibleRange>('VisibleRangeChanged')
export const SelectedItemChanged = engine.event<string | null>('SelectedItemChanged')

// ---------------------------------------------------------------------------
// Async: PageRequested -> PageLoaded (simulated API)
// ---------------------------------------------------------------------------

const requestedPages = new Set<number>()


// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------


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


// ---------------------------------------------------------------------------
// Load initial page
// ---------------------------------------------------------------------------

requestedPages.add(0)
engine.emit(PageRequested, 0)

// Frame loop
let _lastFrame = performance.now()
requestAnimationFrame(function _loop() {
  const now = performance.now()
  engine.emit(Frame, now - _lastFrame)
  _lastFrame = now
  requestAnimationFrame(_loop)
})
