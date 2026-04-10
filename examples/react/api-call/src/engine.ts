import { createEngine } from '@pulse/core'

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
// DAG
// ---------------------------------------------------------------------------
//
//  SearchInput ──→ DoSearch ──→ SearchLoadingStart ──→ SearchCompleted ──→ SearchLoadingEnd
//
//  UserSelected ──→ DetailLoadingStart ──→ DetailCompleted ──→ DetailLoadingEnd
//
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ctx = engine.context({
  query: '',
  selectedUserId: null as string | null,
  debounceTimer: null as ReturnType<typeof setTimeout> | null,
})

// ---------------------------------------------------------------------------
// Mock API
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
  MOCK_USERS.map(u => [u.id, {
    ...u,
    bio: `${u.name} is a talented ${u.role.toLowerCase()} with years of experience.`,
    location: ['San Francisco', 'New York', 'London', 'Tokyo', 'Berlin'][parseInt(u.id) % 5],
    joinDate: `202${parseInt(u.id) % 4}-0${(parseInt(u.id) % 9) + 1}-15`,
    projects: ['Project Alpha', 'Project Beta', 'Project Gamma'].slice(0, (parseInt(u.id) % 3) + 1),
  }]),
)

async function searchUsers(query: string): Promise<User[]> {
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
  const q = query.toLowerCase()
  return MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q),
  )
}

async function fetchUserDetails(userId: string): Promise<UserDetails> {
  await new Promise(r => setTimeout(r, 400 + Math.random() * 300))
  const details = MOCK_DETAILS[userId]
  if (!details) throw new Error(`User ${userId} not found`)
  return details
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const SearchInput = engine.event<string>('SearchInput')
const DoSearch = engine.event<string>('DoSearch')
export const SearchLoadingStart = engine.event<string>('SearchLoadingStart')
export const SearchCompleted = engine.event<{ users: User[]; error: string | null }>('SearchCompleted')
export const SearchLoadingEnd = engine.event<void>('SearchLoadingEnd')

export const UserSelected = engine.event<string | null>('UserSelected')
export const DetailLoadingStart = engine.event<string>('DetailLoadingStart')
export const DetailCompleted = engine.event<{ details: UserDetails | null; error: string | null }>('DetailCompleted')
export const DetailLoadingEnd = engine.event<void>('DetailLoadingEnd')

// ---------------------------------------------------------------------------
// Search: SearchInput → DoSearch (debounced) → Loading → Completed → End
// ---------------------------------------------------------------------------

engine.on(SearchInput, [DoSearch], (query, doSearch) => {
  ctx.query = query
  if (ctx.debounceTimer) clearTimeout(ctx.debounceTimer)
  ctx.debounceTimer = setTimeout(() => doSearch(query), 300)
})

engine.on(DoSearch, [SearchLoadingStart, SearchCompleted], (query, setStart, setCompleted) => {
  if (!query.trim()) {
    setCompleted({ users: [], error: null })
    return
  }
  setStart(query)
})

engine.on(SearchLoadingStart, [SearchCompleted], async (query, setCompleted) => {
  try {
    const users = await searchUsers(query)
    setCompleted({ users, error: null })
  } catch (e: any) {
    setCompleted({ users: [], error: e.message ?? String(e) })
  }
})

engine.on(SearchCompleted).emit(SearchLoadingEnd)

// ---------------------------------------------------------------------------
// Detail: UserSelected → Loading → Completed → End
// ---------------------------------------------------------------------------

engine.on(UserSelected, [DetailLoadingStart, DetailCompleted], (userId, setStart, setCompleted) => {
  ctx.selectedUserId = userId
  if (!userId) {
    setCompleted({ details: null, error: null })
    return
  }
  setStart(userId)
})

engine.on(DetailLoadingStart, [DetailCompleted], async (userId, setCompleted) => {
  try {
    const details = await fetchUserDetails(userId)
    setCompleted({ details, error: null })
  } catch (e: any) {
    setCompleted({ details: null, error: e.message ?? String(e) })
  }
})

engine.on(DetailCompleted).emit(DetailLoadingEnd)

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export function startLoop() {}
export function stopLoop() {}
export function resetState() {
  if (ctx.debounceTimer) clearTimeout(ctx.debounceTimer)
  engine.reset()
}
