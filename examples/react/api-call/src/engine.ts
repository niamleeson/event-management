import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: string
}

export interface UserDetails extends User {
  bio: string
  location: string
  joinDate: string
  projects: string[]
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_USERS: User[] = [
  { id: '1', name: 'Alice Chen', email: 'alice@example.com', avatar: 'AC', role: 'Engineer' },
  { id: '2', name: 'Bob Martinez', email: 'bob@example.com', avatar: 'BM', role: 'Designer' },
  { id: '3', name: 'Carol White', email: 'carol@example.com', avatar: 'CW', role: 'Product Manager' },
  { id: '4', name: 'David Kim', email: 'david@example.com', avatar: 'DK', role: 'Engineer' },
  { id: '5', name: 'Elena Popov', email: 'elena@example.com', avatar: 'EP', role: 'Data Scientist' },
  { id: '6', name: 'Frank Johnson', email: 'frank@example.com', avatar: 'FJ', role: 'DevOps' },
  { id: '7', name: 'Grace Liu', email: 'grace@example.com', avatar: 'GL', role: 'Engineer' },
  { id: '8', name: 'Henry Tanaka', email: 'henry@example.com', avatar: 'HT', role: 'Designer' },
]

const MOCK_DETAILS: Record<string, UserDetails> = Object.fromEntries(
  MOCK_USERS.map((u) => [
    u.id,
    {
      ...u,
      bio: `${u.name} is a talented ${u.role.toLowerCase()} with years of experience.`,
      location: ['San Francisco', 'New York', 'London', 'Tokyo', 'Berlin'][
        Math.floor(parseInt(u.id) % 5)
      ],
      joinDate: `202${parseInt(u.id) % 4}-0${(parseInt(u.id) % 9) + 1}-15`,
      projects: ['Project Alpha', 'Project Beta', 'Project Gamma'].slice(
        0,
        (parseInt(u.id) % 3) + 1,
      ),
    },
  ]),
)

// Mock API functions
async function searchUsers(query: string): Promise<User[]> {
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400))
  const q = query.toLowerCase()
  return MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q),
  )
}

async function fetchUserDetails(userId: string): Promise<UserDetails> {
  await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300))
  const details = MOCK_DETAILS[userId]
  if (!details) throw new Error(`User ${userId} not found`)
  return details
}

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// SearchInput ──→ SearchQueryChanged
//             └──→ DoSearch (debounced)
// DoSearch ──→ SearchLoading, SearchDone, SearchError (async)
// UserSelected ──→ UserDetailsDone, UserDetailsLoading, SearchError (async)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const SearchInput = engine.event<string>('SearchInput')
export const SearchQueryChanged = engine.event<string>('SearchQueryChanged')
export const SearchLoading = engine.event<boolean>('SearchLoading')
export const SearchDone = engine.event<User[]>('SearchDone')
export const SearchError = engine.event<string | null>('SearchError')
export const UserSelected = engine.event<string | null>('UserSelected')
export const UserDetailsDone = engine.event<UserDetails | null>('UserDetailsDone')
export const UserDetailsLoading = engine.event<boolean>('UserDetailsLoading')

// Internal trigger for the debounced async search
const DoSearch = engine.event<string>('DoSearch')

// ---------------------------------------------------------------------------
// Debounce: SearchInput -> SearchQueryChanged + debounced DoSearch
// ---------------------------------------------------------------------------

let debounceTimer: ReturnType<typeof setTimeout> | null = null

engine.on(SearchInput, [SearchQueryChanged], (query: string, setQuery) => {
  setQuery(query)

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    engine.emit(DoSearch, query)
  }, 300)
})

// ---------------------------------------------------------------------------
// Async search handler: DoSearch -> SearchLoading, SearchDone, SearchError
// ---------------------------------------------------------------------------

engine.on(DoSearch, [SearchLoading, SearchDone, SearchError], async (query, setLoading, setDone, setError) => {
  setError(null)
  if (query.trim().length === 0) {
    setDone([])
    return
  }
  setLoading(true)
  try {
    const results = await searchUsers(query)
    setDone(results)
  } catch (e: any) {
    setError(e instanceof Error ? e.message : String(e))
  }
  setLoading(false)
})

// ---------------------------------------------------------------------------
// Async user details handler
// ---------------------------------------------------------------------------

engine.on(UserSelected, [UserDetailsDone, UserDetailsLoading, SearchError], async (userId: string | null, setDetails, setLoading, setError) => {
  if (!userId) {
    setDetails(null)
    return
  }
  setLoading(true)
  try {
    const details = await fetchUserDetails(userId)
    setDetails(details)
  } catch (e: any) {
    setError(e instanceof Error ? e.message : String(e))
  }
  setLoading(false)
})

export function startLoop() {}
export function stopLoop() {}

export function resetState() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = null
}
