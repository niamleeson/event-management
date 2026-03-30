import { createEngine } from '@pulse/core'
import type { Signal } from '@pulse/core'

export const engine = createEngine()

/* ------------------------------------------------------------------ */
/*  Config                                                            */
/* ------------------------------------------------------------------ */

export const TOTAL_ITEMS = 10000
export const PAGE_SIZE = 50
export const ITEM_HEIGHT = 48

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface Item {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive' | 'pending'
}

/* ------------------------------------------------------------------ */
/*  Generate all items lazily                                         */
/* ------------------------------------------------------------------ */

const FIRST_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Taylor']
const STATUSES: Item['status'][] = ['active', 'inactive', 'pending']

function generateItem(id: number): Item {
  const first = FIRST_NAMES[id % FIRST_NAMES.length]
  const last = LAST_NAMES[Math.floor(id / FIRST_NAMES.length) % LAST_NAMES.length]
  return {
    id,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${id}@example.com`,
    status: STATUSES[id % 3],
  }
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const ScrollTo = engine.event<number>('ScrollTo')
export const FetchPage = engine.event<number>('FetchPage')
export const PageLoaded = engine.event<{ page: number; items: Item[] }>('PageLoaded')
export const SearchChanged = engine.event<string>('SearchChanged')
export const FetchPending = engine.event<number>('FetchPending')

/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */

export const scrollTop: Signal<number> = engine.signal(ScrollTo, 0, (_prev, val) => val)

export const searchQuery: Signal<string> = engine.signal(SearchChanged, '', (_prev, q) => q)

export const loadedPages: Signal<Map<number, Item[]>> = engine.signal(
  PageLoaded,
  new Map<number, Item[]>(),
  (prev, { page, items }) => {
    const next = new Map(prev)
    next.set(page, items)
    return next
  },
)

export const loadingPages: Signal<Set<number>> = engine.signal(FetchPending, new Set<number>(), (prev, page) => {
  const next = new Set(prev)
  next.add(page)
  return next
})
engine.signalUpdate(loadingPages, PageLoaded, (prev, { page }) => {
  const next = new Set(prev)
  next.delete(page)
  return next
})

/* ------------------------------------------------------------------ */
/*  Async page fetching                                               */
/* ------------------------------------------------------------------ */

engine.async<number, { page: number; items: Item[] }>(FetchPage, {
  pending: FetchPending,
  done: PageLoaded,
  strategy: 'all',
  do: async (page) => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
    const start = page * PAGE_SIZE
    const items: Item[] = []
    for (let i = 0; i < PAGE_SIZE && start + i < TOTAL_ITEMS; i++) {
      items.push(generateItem(start + i))
    }
    return { page, items }
  },
})

/* ------------------------------------------------------------------ */
/*  Prefetch logic: when scroll changes, prefetch nearby pages        */
/* ------------------------------------------------------------------ */

engine.on(ScrollTo, (top) => {
  const startIdx = Math.floor(top / ITEM_HEIGHT)
  const startPage = Math.floor(startIdx / PAGE_SIZE)

  // Prefetch current and next 2 pages
  for (let p = Math.max(0, startPage - 1); p <= startPage + 2; p++) {
    if (!loadedPages.value.has(p) && !loadingPages.value.has(p)) {
      engine.emit(FetchPage, p)
    }
  }
})

// Load first page immediately
engine.emit(FetchPage, 0)
