// DAG
// ScrollTo ──→ ScrollTopChanged
//          └──→ FetchPage (prefetch nearby)
// SearchChanged ──→ SearchQueryChanged
// PageLoaded ──→ LoadedPagesChanged
//            └──→ LoadingPagesChanged
// FetchPending ──→ LoadingPagesChanged
// FetchPage ──→ FetchPending
//           └──→ PageLoaded (async)

import { createEngine } from '@pulse/core'
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

export let scrollTop = 0
export const ScrollTopChanged = engine.event('ScrollTopChanged')
engine.on(ScrollTo, [ScrollTopChanged], (val, setScroll) => {
  scrollTop = val
  setScroll(scrollTop)
})

export let searchQuery = ''
export const SearchQueryChanged = engine.event('SearchQueryChanged')
engine.on(SearchChanged, [SearchQueryChanged], (q, setQuery) => {
  searchQuery = q
  setQuery(searchQuery)
})

export let loadedPages = new Map<number, Item[]>()
const LoadedPagesChanged = engine.event('LoadedPagesChanged')
engine.on(PageLoaded, [LoadedPagesChanged], ({ page, items }, setLoaded) => {
  const next = new Map(loadedPages)
  next.set(page, items)
  loadedPages = next
  setLoaded(loadedPages)
})

let loadingPages = new Set<number>()
const LoadingPagesChanged = engine.event('LoadingPagesChanged')
engine.on(FetchPending, [LoadingPagesChanged], (page, setLoading) => {
  const next = new Set(loadingPages)
  next.add(page)
  loadingPages = next
  setLoading(loadingPages)
})
engine.on(PageLoaded, [LoadingPagesChanged], ({ page }, setLoading) => {
  const next = new Set(loadingPages)
  next.delete(page)
  loadingPages = next
  setLoading(loadingPages)
})

/* ------------------------------------------------------------------ */
/*  Async page fetching                                               */
/* ------------------------------------------------------------------ */

{ const _ac = {
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
}
  let _aa: AbortController | null = null
  engine.on(FetchPage, async (p: any) => {
    if (_ac.strategy === 'latest' && _aa) _aa.abort()
    _aa = new AbortController()
    if (_ac.pending) engine.emit(_ac.pending, p)
    try { const r = await _ac.do(p, { signal: _aa.signal, progress: () => {} }); if (_ac.done) engine.emit(_ac.done, r) }
    catch (e: any) { if (e?.name !== 'AbortError' && _ac.error) engine.emit(_ac.error, e) }
  })
}

/* ------------------------------------------------------------------ */
/*  Prefetch logic: when scroll changes, prefetch nearby pages        */
/* ------------------------------------------------------------------ */

engine.on(ScrollTo, (top) => {
  const startIdx = Math.floor(top / ITEM_HEIGHT)
  const startPage = Math.floor(startIdx / PAGE_SIZE)

  // Prefetch current and next 2 pages
  for (let p = Math.max(0, startPage - 1); p <= startPage + 2; p++) {
    if (!loadedPages.has(p) && !loadingPages.has(p)) {
      engine.emit(FetchPage, p)
    }
  }
})

// Load first page immediately
engine.emit(FetchPage, 0)


export { loadingPages }

export { LoadingPagesChanged, LoadedPagesChanged }

export function startLoop() {}
export function stopLoop() {}
