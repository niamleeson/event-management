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
export const PREFETCH_THRESHOLD = 200

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const ScrollTo = engine.event<number>('ScrollTo')
export const ItemsLoaded = engine.event<{ startIndex: number; items: VirtualItem[] }>('ItemsLoaded')
export const LoadBatch = engine.event<number>('LoadBatch')
export const SearchChanged = engine.event<string>('SearchChanged')
export const StateChanged = engine.event<void>('StateChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _scrollTop = 0
let _searchQuery = ''
let _loadedItems = new Map<number, VirtualItem>()
let _loadingRanges = new Set<number>()
let _totalLoadedCount = 0

export function getScrollTop(): number { return _scrollTop }
export function getSearchQuery(): string { return _searchQuery }
export function getLoadedItems(): Map<number, VirtualItem> { return _loadedItems }
export function getLoadingRanges(): Set<number> { return _loadingRanges }
export function getTotalLoadedCount(): number { return _totalLoadedCount }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(ScrollTo, (pos: number) => {
  _scrollTop = Math.max(0, pos)
  engine.emit(StateChanged, undefined)
})

engine.on(SearchChanged, (q: string) => {
  _searchQuery = q
  engine.emit(StateChanged, undefined)
})

engine.on(LoadBatch, (batchStart: number) => {
  _loadingRanges = new Set(_loadingRanges)
  _loadingRanges.add(batchStart)

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

engine.on(ItemsLoaded, ({ startIndex, items }) => {
  _loadedItems = new Map(_loadedItems)
  items.forEach((item, i) => {
    _loadedItems.set(startIndex + i, item)
  })
  _loadingRanges = new Set(_loadingRanges)
  _loadingRanges.delete(startIndex)
  _totalLoadedCount += items.length
  engine.emit(StateChanged, undefined)
})

// ---------------------------------------------------------------------------
// Computed helpers
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
    if (!_loadingRanges.has(i) && !_loadedItems.has(i)) {
      engine.emit(LoadBatch, i)
    }
  }
}
