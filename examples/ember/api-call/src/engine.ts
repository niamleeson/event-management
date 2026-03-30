import { createEngine } from '@pulse/core'
import { createPulseService } from '@pulse/ember'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: number
  name: string
  email: string
  avatar: string
}

export interface SearchState {
  query: string
  results: User[]
  loading: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const SearchQueryChanged = engine.event<string>('SearchQueryChanged')
export const SearchSubmitted = engine.event<string>('SearchSubmitted')
export const SearchPending = engine.event<string>('SearchPending')
export const SearchDone = engine.event<User[]>('SearchDone')
export const SearchError = engine.event<Error>('SearchError')
export const SearchCleared = engine.event<void>('SearchCleared')

// ---------------------------------------------------------------------------
// Pipes
// ---------------------------------------------------------------------------

// When a non-empty query is submitted, forward to the async handler
engine.pipe(SearchQueryChanged, SearchSubmitted, (query: string) => query)

// ---------------------------------------------------------------------------
// Async: simulated API search
// ---------------------------------------------------------------------------

const MOCK_USERS: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', avatar: 'AJ' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', avatar: 'BS' },
  { id: 3, name: 'Carol Davis', email: 'carol@example.com', avatar: 'CD' },
  { id: 4, name: 'David Wilson', email: 'david@example.com', avatar: 'DW' },
  { id: 5, name: 'Eva Martinez', email: 'eva@example.com', avatar: 'EM' },
  { id: 6, name: 'Frank Brown', email: 'frank@example.com', avatar: 'FB' },
  { id: 7, name: 'Grace Lee', email: 'grace@example.com', avatar: 'GL' },
  { id: 8, name: 'Henry Taylor', email: 'henry@example.com', avatar: 'HT' },
]

engine.async(SearchSubmitted, {
  pending: SearchPending,
  done: SearchDone,
  error: SearchError,
  strategy: 'latest',
  do: async (query: string, { signal }) => {
    // Simulate network delay
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 800)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })

    if (!query.trim()) return []

    // Simulate occasional errors
    if (query.toLowerCase() === 'error') {
      throw new Error('Search service unavailable')
    }

    const lower = query.toLowerCase()
    return MOCK_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower),
    )
  },
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

// Current search query text
export const queryText = engine.signal<string>(
  SearchQueryChanged,
  '',
  (_prev, query) => query,
)

// Loading state
export const isLoading = engine.signal<boolean>(
  SearchPending,
  false,
  () => true,
)
engine.signalUpdate(isLoading, SearchDone, () => false)
engine.signalUpdate(isLoading, SearchError, () => false)

// Search results
export const searchResults = engine.signal<User[]>(
  SearchDone,
  [],
  (_prev, results) => results,
)
engine.signalUpdate(searchResults, SearchCleared, () => [])

// Error state
export const searchError = engine.signal<string | null>(
  SearchError,
  null,
  (_prev, err) => err.message,
)
engine.signalUpdate(searchError, SearchDone, () => null)
engine.signalUpdate(searchError, SearchQueryChanged, () => null)

// ---------------------------------------------------------------------------
// Pulse Service
// ---------------------------------------------------------------------------

export const pulse = createPulseService(engine)
