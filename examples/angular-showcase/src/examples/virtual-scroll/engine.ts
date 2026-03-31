import { createEngine } from '@pulse/core'

export const engine = createEngine()
export interface VirtualItem { id: number; title: string; description: string; status: 'loaded' | 'loading' | 'skeleton' }
export const TOTAL_ITEMS = 10000, ITEM_HEIGHT = 60, PAGE_SIZE = 50, PREFETCH_THRESHOLD = 10

export const ScrollTo = engine.event<number>('ScrollTo')
export const ScrollTopChanged = engine.event<number>('ScrollTopChanged')
export const ItemsChanged = engine.event<Map<number, VirtualItem>>('ItemsChanged')
export const TotalLoadedChanged = engine.event<number>('TotalLoadedChanged')
export const LoadingPagesChanged = engine.event<Set<number>>('LoadingPagesChanged')

let items = new Map<number, VirtualItem>()
let loadedPages = new Set<number>()
let loadingPages = new Set<number>()
let totalLoaded = 0

engine.on(ScrollTo, async (scrollTop) => {
  engine.emit(ScrollTopChanged, scrollTop)
  const visibleStart = Math.floor(scrollTop / ITEM_HEIGHT)
  const visibleEnd = visibleStart + Math.ceil(600 / ITEM_HEIGHT)
  const prefetchEnd = visibleEnd + PREFETCH_THRESHOLD
  const startPage = Math.floor(visibleStart / PAGE_SIZE)
  const endPage = Math.floor(prefetchEnd / PAGE_SIZE)
  for (let p = startPage; p <= endPage; p++) {
    if (!loadedPages.has(p) && !loadingPages.has(p)) {
      loadingPages = new Set([...loadingPages, p]); engine.emit(LoadingPagesChanged, loadingPages)
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 500))
      const startIdx = p * PAGE_SIZE
      const newItems = new Map(items)
      for (let i = 0; i < PAGE_SIZE; i++) {
        const idx = startIdx + i; if (idx >= TOTAL_ITEMS) break
        newItems.set(idx, { id: idx, title: `Item #${idx + 1}`, description: `This is item ${idx + 1} of ${TOTAL_ITEMS}`, status: 'loaded' })
      }
      items = newItems; loadedPages.add(p)
      loadingPages = new Set([...loadingPages]); loadingPages.delete(p)
      totalLoaded = items.size
      engine.emit(ItemsChanged, items); engine.emit(TotalLoadedChanged, totalLoaded); engine.emit(LoadingPagesChanged, loadingPages)
    }
  }
})
