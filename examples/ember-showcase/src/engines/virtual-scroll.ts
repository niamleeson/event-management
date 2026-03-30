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
  subtitle: string
  loaded: boolean
  loading: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TOTAL_ITEMS = 10000
export const ITEM_HEIGHT = 64
export const OVERSCAN = 5
export const BATCH_SIZE = 50
export const PREFETCH_THRESHOLD = 200 // pixels before end to trigger prefetch

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const ScrollTo = engine.event<number>('ScrollTo')
export const ItemsLoaded = engine.event<{ startIndex: number; items: VirtualItem[] }>('ItemsLoaded')
export const LoadBatch = engine.event<number>('LoadBatch')
export const SearchChanged = engine.event<string>('SearchChanged')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const scrollTop = engine.signal<number>(
  ScrollTo, 0, (_prev, pos) => Math.max(0, pos),
)

export const searchQuery = engine.signal<string>(
  SearchChanged, '', (_prev, q) => q,
)

// Loaded items cache
export const loadedItems = engine.signal<Map<number, VirtualItem>>(
  ItemsLoaded, new Map(),
  (prev, { startIndex, items }) => {
    const next = new Map(prev)
    items.forEach((item, i) => {
      next.set(startIndex + i, item)
    })
    return next
  },
)

export const loadingRanges = engine.signal<Set<number>>(
  LoadBatch, new Set(),
  (prev, batchStart) => {
    const next = new Set(prev)
    next.add(batchStart)
    return next
  },
)

engine.signalUpdate(loadingRanges, ItemsLoaded, (prev, { startIndex }) => {
  const next = new Set(prev)
  next.delete(startIndex)
  return next
})

export const totalLoadedCount = engine.signal<number>(
  ItemsLoaded, 0, (prev, { items }) => prev + items.length,
)

// ---------------------------------------------------------------------------
// Async — simulate loading batches
// ---------------------------------------------------------------------------

engine.on(LoadBatch, (batchStart) => {
  // Simulate async network delay
  const delay = 200 + Math.random() * 300
  setTimeout(() => {
    const items: VirtualItem[] = []
    for (let i = 0; i < BATCH_SIZE; i++) {
      const idx = batchStart + i
      if (idx >= TOTAL_ITEMS) break
      items.push({
        id: idx,
        title: `Item #${idx + 1}`,
        subtitle: `This is the description for item ${idx + 1} of ${TOTAL_ITEMS.toLocaleString()}`,
        loaded: true,
        loading: false,
      })
    }
    engine.emit(ItemsLoaded, { startIndex: batchStart, items })
  }, delay)
})

// ---------------------------------------------------------------------------
// Computed helpers (called from page)
// ---------------------------------------------------------------------------

export function getVisibleRange(scrollPos: number, viewportHeight: number): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollPos / ITEM_HEIGHT) - OVERSCAN)
  const end = Math.min(TOTAL_ITEMS - 1, Math.ceil((scrollPos + viewportHeight) / ITEM_HEIGHT) + OVERSCAN)
  return { start, end }
}

export function ensureLoaded(start: number, end: number): void {
  const batchStart = Math.floor(start / BATCH_SIZE) * BATCH_SIZE
  const batchEnd = Math.ceil((end + 1) / BATCH_SIZE) * BATCH_SIZE

  for (let i = batchStart; i < batchEnd; i += BATCH_SIZE) {
    if (!loadingRanges.value.has(i) && !loadedItems.value.has(i)) {
      engine.emit(LoadBatch, i)
    }
  }
}
