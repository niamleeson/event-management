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
async function searchUsers(
  query: string,
  signal: AbortSignal,
): Promise<User[]> {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 600 + Math.random() * 400)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
  const q = query.toLowerCase()
  return MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q),
  )
}

async function fetchUserDetails(
  userId: string,
  signal: AbortSignal,
): Promise<UserDetails> {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 400 + Math.random() * 300)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
  const details = MOCK_DETAILS[userId]
  if (!details) throw new Error(`User ${userId} not found`)
  return details
}

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const SearchInput = engine.event<string>('SearchInput')
export const SearchPending = engine.event<void>('SearchPending')
export const SearchDone = engine.event<User[]>('SearchDone')
export const SearchError = engine.event<string>('SearchError')
export const UserSelected = engine.event<string>('UserSelected')
export const UserDetailsPending = engine.event<void>('UserDetailsPending')
export const UserDetailsDone = engine.event<UserDetails>('UserDetailsDone')
export const UserDetailsError = engine.event<string>('UserDetailsError')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _searchQuery = ''
let _searchResults: User[] = []
let _isSearching = false
let _selectedUserId: string | null = null
let _userDetails: UserDetails | null = null
let _isLoadingDetails = false
let _error: string | null = null

export function getSearchQuery(): string { return _searchQuery }
export function getSearchResults(): User[] { return _searchResults }
export function getIsSearching(): boolean { return _isSearching }
export function getSelectedUserId(): string | null { return _selectedUserId }
export function getUserDetails(): UserDetails | null { return _userDetails }
export function getIsLoadingDetails(): boolean { return _isLoadingDetails }
export function getError(): string | null { return _error }

// ---------------------------------------------------------------------------
// Async search with debounce and cancellation
// ---------------------------------------------------------------------------

let _searchAbort: AbortController | null = null

engine.on(SearchInput, (query: string) => {
  _searchQuery = query
  _error = null

  // Cancel previous search
  if (_searchAbort) {
    _searchAbort.abort()
    _searchAbort = null
  }

  _isSearching = true
  engine.emit(SearchPending, undefined)

  const abort = new AbortController()
  _searchAbort = abort

  // Debounce 300ms then search
  const debounceTimer = setTimeout(async () => {
    try {
      if (query.trim().length === 0) {
        _searchResults = []
        _isSearching = false
        engine.emit(SearchDone, [])
        return
      }
      const results = await searchUsers(query, abort.signal)
      _searchResults = results
      _isSearching = false
      engine.emit(SearchDone, results)
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      _isSearching = false
      const msg = err instanceof Error ? err.message : String(err)
      _error = msg
      engine.emit(SearchError, msg)
    }
  }, 300)

  abort.signal.addEventListener('abort', () => clearTimeout(debounceTimer))
})

// ---------------------------------------------------------------------------
// Async user details fetch
// ---------------------------------------------------------------------------

let _detailsAbort: AbortController | null = null

engine.on(UserSelected, (userId: string) => {
  _selectedUserId = userId

  if (_detailsAbort) {
    _detailsAbort.abort()
    _detailsAbort = null
  }

  _isLoadingDetails = true
  engine.emit(UserDetailsPending, undefined)

  const abort = new AbortController()
  _detailsAbort = abort

  ;(async () => {
    try {
      const details = await fetchUserDetails(userId, abort.signal)
      _userDetails = details
      _isLoadingDetails = false
      engine.emit(UserDetailsDone, details)
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      _isLoadingDetails = false
      const msg = err instanceof Error ? err.message : String(err)
      engine.emit(UserDetailsError, msg)
    }
  })()
})
