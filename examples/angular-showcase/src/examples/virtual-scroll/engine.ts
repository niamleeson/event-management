import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VirtualItem {
  id: number
  title: string
  description: string
  status: 'loaded' | 'loading' | 'skeleton'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TOTAL_ITEMS = 10000
export const ITEM_HEIGHT = 60
export const PAGE_SIZE = 50
export const PREFETCH_THRESHOLD = 10

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const ScrollTo = engine.event<number>('ScrollTo')
export const PageRequest = engine.event<number>('PageRequest')
export const PageLoaded = engine.event<{ page: number; items: VirtualItem[] }>('PageLoaded')
export const PageError = engine.event<{ page: number; error: string }>('PageError')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const scrollTop = engine.signal<number>(ScrollTo, 0, (_prev, val) => val)

export const loadedPages = engine.signal<Set<number>>(
  PageLoaded,
  new Set(),
  (prev, { page }) => new Set([...prev, page]),
)

export const loadingPages = engine.signal<Set<number>>(
  PageRequest,
  new Set(),
  (prev, page) => new Set([...prev, page]),
)
engine.signalUpdate(loadingPages, PageLoaded, (prev, { page }) => {
  const next = new Set(prev)
  next.delete(page)
  return next
})

export const items = engine.signal<Map<number, VirtualItem>>(
  PageLoaded,
  new Map(),
  (prev, { items: pageItems }) => {
    const next = new Map(prev)
    for (const item of pageItems) {
      next.set(item.id, item)
    }
    return next
  },
)

export const totalLoaded = engine.signal<number>(
  PageLoaded,
  0,
  (prev, { items: pageItems }) => prev + pageItems.length,
)

// ---------------------------------------------------------------------------
// Async: page loading with simulated delay
// ---------------------------------------------------------------------------

engine.async(PageRequest, {
  done: PageLoaded,
  error: PageError,
  strategy: 'all',
  do: async (page: number, { signal }) => {
    // Simulated network delay
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 300 + Math.random() * 500)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })

    const startIdx = page * PAGE_SIZE
    const pageItems: VirtualItem[] = Array.from({ length: PAGE_SIZE }, (_, i) => {
      const idx = startIdx + i
      return {
        id: idx,
        title: `Item #${idx + 1}`,
        description: `This is item ${idx + 1} of ${TOTAL_ITEMS}`,
        status: 'loaded' as const,
      }
    }).filter(item => item.id < TOTAL_ITEMS)

    return { page, items: pageItems }
  },
})

// ---------------------------------------------------------------------------
// Auto-prefetch: when scroll position nears unloaded pages, request them
// ---------------------------------------------------------------------------

engine.on(ScrollTo, (scrollTop: number) => {
  const visibleStart = Math.floor(scrollTop / ITEM_HEIGHT)
  const visibleEnd = visibleStart + Math.ceil(600 / ITEM_HEIGHT) // assume 600px viewport
  const prefetchEnd = visibleEnd + PREFETCH_THRESHOLD

  const startPage = Math.floor(visibleStart / PAGE_SIZE)
  const endPage = Math.floor(prefetchEnd / PAGE_SIZE)

  for (let p = startPage; p <= endPage; p++) {
    if (!loadedPages.value.has(p) && !loadingPages.value.has(p)) {
      engine.emit(PageRequest, p)
    }
  }
})

// Start frame loop
engine.startFrameLoop()
