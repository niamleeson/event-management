// DAG
// SearchInput ──→ SearchQueryChanged
//             └──→ ErrorChanged
//             └──→ IsSearchingChanged
//             └──→ SearchResultsChanged (async debounced)
// UserSelected ──→ SelectedUserIdChanged
//              └──→ IsLoadingDetailsChanged
//              └──→ UserDetailsChanged (async)
//              └──→ ErrorChanged

import { createEngine } from '@pulse/core'

export const engine = createEngine()

// Types
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

// Mock data
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
      projects: ['Project Alpha', 'Project Beta', 'Project Gamma'].slice(0, (parseInt(u.id) % 3) + 1),
    },
  ]),
)

async function searchUsers(query: string, signal: AbortSignal): Promise<User[]> {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 600 + Math.random() * 400)
    signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) })
  })
  const q = query.toLowerCase()
  return MOCK_USERS.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q))
}

async function fetchUserDetails(userId: string, signal: AbortSignal): Promise<UserDetails> {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 400 + Math.random() * 300)
    signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) })
  })
  const details = MOCK_DETAILS[userId]
  if (!details) throw new Error(`User ${userId} not found`)
  return details
}

// Events
export const SearchInput = engine.event<string>('SearchInput')
export const SearchQueryChanged = engine.event<string>('SearchQueryChanged')
export const SearchResultsChanged = engine.event<User[]>('SearchResultsChanged')
export const IsSearchingChanged = engine.event<boolean>('IsSearchingChanged')
export const UserSelected = engine.event<string>('UserSelected')
export const SelectedUserIdChanged = engine.event<string | null>('SelectedUserIdChanged')
export const UserDetailsChanged = engine.event<UserDetails | null>('UserDetailsChanged')
export const IsLoadingDetailsChanged = engine.event<boolean>('IsLoadingDetailsChanged')
export const ErrorChanged = engine.event<string | null>('ErrorChanged')

// State
let searchQuery = ''
let searchResults: User[] = []
let isSearching = false
let selectedUserId: string | null = null
let userDetails: UserDetails | null = null
let isLoadingDetails = false
let error: string | null = null

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let searchAbort: AbortController | null = null
let detailsAbort: AbortController | null = null

// Debounced search
engine.on(SearchInput, [SearchQueryChanged, ErrorChanged], (query: string, setQuery, setError) => {
  searchQuery = query
  setQuery(query)
  error = null
  setError(null)

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    if (query.trim().length === 0) {
      searchResults = []
      engine.emit(SearchResultsChanged, [])
      return
    }
    if (searchAbort) searchAbort.abort()
    searchAbort = new AbortController()
    isSearching = true
    engine.emit(IsSearchingChanged, true)
    try {
      const results = await searchUsers(query, searchAbort.signal)
      searchResults = results
      engine.emit(SearchResultsChanged, results)
      error = null
      engine.emit(ErrorChanged, null)
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        error = err instanceof Error ? err.message : String(err)
        engine.emit(ErrorChanged, error)
      }
    } finally {
      isSearching = false
      engine.emit(IsSearchingChanged, false)
    }
  }, 300)
})

// User details fetch
engine.on(UserSelected, [SelectedUserIdChanged], async (userId: string, setSelectedId) => {
  selectedUserId = userId
  setSelectedId(userId)

  if (detailsAbort) detailsAbort.abort()
  detailsAbort = new AbortController()
  isLoadingDetails = true
  engine.emit(IsLoadingDetailsChanged, true)
  try {
    const details = await fetchUserDetails(userId, detailsAbort.signal)
    userDetails = details
    engine.emit(UserDetailsChanged, details)
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      error = err instanceof Error ? err.message : String(err)
      engine.emit(ErrorChanged, error)
    }
  } finally {
    isLoadingDetails = false
    engine.emit(IsLoadingDetailsChanged, false)
  }
})

// Getters
export function getSearchQuery() { return searchQuery }
export function getSearchResults() { return searchResults }
export function getIsSearching() { return isSearching }
export function getSelectedUserId() { return selectedUserId }
export function getUserDetails() { return userDetails }
export function getIsLoadingDetails() { return isLoadingDetails }
export function getError() { return error }


export { error, searchQuery, isSearching, userDetails, isLoadingDetails, selectedUserId, searchResults }

export function startLoop() {}
export function stopLoop() {}
