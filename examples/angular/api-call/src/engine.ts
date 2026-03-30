import { createEngine } from '@pulse/core'
import type { Engine, EventType, Signal } from '@pulse/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: number
  name: string
  email: string
  company: string
}

// ---------------------------------------------------------------------------
// Engine + Events
// ---------------------------------------------------------------------------

export const engine: Engine = createEngine()

export const SearchQuery: EventType<string> = engine.event<string>('SearchQuery')
export const SearchPending: EventType<string> = engine.event<string>('SearchPending')
export const SearchDone: EventType<User[]> = engine.event<User[]>('SearchDone')
export const SearchError: EventType<Error> = engine.event<Error>('SearchError')

// ---------------------------------------------------------------------------
// Mock API
// ---------------------------------------------------------------------------

const MOCK_USERS: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', company: 'Acme Corp' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', company: 'Tech Inc' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', company: 'Dev LLC' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', company: 'Hero Co' },
  { id: 5, name: 'Eve Adams', email: 'eve@example.com', company: 'Crypto Ltd' },
  { id: 6, name: 'Frank Castle', email: 'frank@example.com', company: 'Vigilante Inc' },
  { id: 7, name: 'Grace Hopper', email: 'grace@example.com', company: 'Navy Tech' },
  { id: 8, name: 'Hank Pym', email: 'hank@example.com', company: 'Pym Labs' },
]

async function mockSearch(query: string, signal: AbortSignal): Promise<User[]> {
  // Simulate network delay
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 600 + Math.random() * 400)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

  if (query.toLowerCase() === 'error') {
    throw new Error('Server error: unable to search users')
  }

  const lower = query.toLowerCase()
  return MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(lower) ||
      u.email.toLowerCase().includes(lower) ||
      u.company.toLowerCase().includes(lower),
  )
}

// ---------------------------------------------------------------------------
// Async rule with "latest" strategy (cancels previous on new search)
// ---------------------------------------------------------------------------

engine.async<string, User[]>(SearchQuery, {
  pending: SearchPending,
  done: SearchDone,
  error: SearchError,
  strategy: 'latest',
  do: async (query, { signal }) => {
    if (query.trim().length === 0) return []
    return mockSearch(query, signal)
  },
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const querySig: Signal<string> = engine.signal<string>(
  SearchQuery,
  '',
  (_prev, q) => q,
)

export const loadingSig: Signal<boolean> = engine.signal<boolean>(
  SearchPending,
  false,
  () => true,
)
engine.signalUpdate(loadingSig, SearchDone, () => false)
engine.signalUpdate(loadingSig, SearchError, () => false)

export const resultsSig: Signal<User[]> = engine.signal<User[]>(
  SearchDone,
  [],
  (_prev, users) => users,
)

export const errorSig: Signal<string | null> = engine.signal<string | null>(
  SearchError,
  null,
  (_prev, err) => err.message,
)
engine.signalUpdate(errorSig, SearchPending, () => null)
