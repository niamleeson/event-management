import { createEngine } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const MOCK_USERS = [
    { id: '1', name: 'Alice Chen', email: 'alice@example.com', avatar: 'AC', role: 'Engineer' },
    { id: '2', name: 'Bob Martinez', email: 'bob@example.com', avatar: 'BM', role: 'Designer' },
    { id: '3', name: 'Carol White', email: 'carol@example.com', avatar: 'CW', role: 'Product Manager' },
    { id: '4', name: 'David Kim', email: 'david@example.com', avatar: 'DK', role: 'Engineer' },
    { id: '5', name: 'Elena Popov', email: 'elena@example.com', avatar: 'EP', role: 'Data Scientist' },
    { id: '6', name: 'Frank Johnson', email: 'frank@example.com', avatar: 'FJ', role: 'DevOps' },
    { id: '7', name: 'Grace Liu', email: 'grace@example.com', avatar: 'GL', role: 'Engineer' },
    { id: '8', name: 'Henry Tanaka', email: 'henry@example.com', avatar: 'HT', role: 'Designer' },
];
const MOCK_DETAILS = Object.fromEntries(MOCK_USERS.map((u) => [
    u.id,
    {
        ...u,
        bio: `${u.name} is a talented ${u.role.toLowerCase()} with years of experience.`,
        location: ['San Francisco', 'New York', 'London', 'Tokyo', 'Berlin'][Math.floor(parseInt(u.id) % 5)],
        joinDate: `202${parseInt(u.id) % 4}-0${(parseInt(u.id) % 9) + 1}-15`,
        projects: ['Project Alpha', 'Project Beta', 'Project Gamma'].slice(0, (parseInt(u.id) % 3) + 1),
    },
]));
// Mock API functions
async function searchUsers(query, signal) {
    await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 600 + Math.random() * 400);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        });
    });
    const q = query.toLowerCase();
    return MOCK_USERS.filter((u) => u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q));
}
async function fetchUserDetails(userId, signal) {
    await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 400 + Math.random() * 300);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        });
    });
    const details = MOCK_DETAILS[userId];
    if (!details)
        throw new Error(`User ${userId} not found`);
    return details;
}
// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------
export const SearchInput = engine.event('SearchInput');
export const SearchPending = engine.event('SearchPending');
export const SearchDone = engine.event('SearchDone');
export const SearchError = engine.event('SearchError');
export const UserSelected = engine.event('UserSelected');
export const UserDetailsPending = engine.event('UserDetailsPending');
export const UserDetailsDone = engine.event('UserDetailsDone');
export const UserDetailsError = engine.event('UserDetailsError');
// ---------------------------------------------------------------------------
// Async: SearchInput -> debounced search -> SearchDone
// Uses 'latest' strategy so new searches cancel pending ones
// ---------------------------------------------------------------------------
engine.async(SearchInput, {
    pending: SearchPending,
    done: SearchDone,
    error: SearchError,
    strategy: 'latest',
    do: async (query, { signal }) => {
        // Debounce: wait 300ms before firing the request
        await new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, 300);
            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(new DOMException('Aborted', 'AbortError'));
            });
        });
        if (query.trim().length === 0)
            return [];
        return searchUsers(query, signal);
    },
});
// ---------------------------------------------------------------------------
// Async: UserSelected -> fetch user details
// ---------------------------------------------------------------------------
engine.async(UserSelected, {
    pending: UserDetailsPending,
    done: UserDetailsDone,
    error: UserDetailsError,
    strategy: 'latest',
    do: async (userId, { signal }) => {
        return fetchUserDetails(userId, signal);
    },
});
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
export const searchQuery = engine.signal(SearchInput, '', (_prev, query) => query);
export const searchResults = engine.signal(SearchDone, [], (_prev, results) => results);
export const isSearching = engine.signal(SearchPending, false, () => true);
engine.signalUpdate(isSearching, SearchDone, () => false);
engine.signalUpdate(isSearching, SearchError, () => false);
export const selectedUserId = engine.signal(UserSelected, null, (_prev, id) => id);
export const userDetails = engine.signal(UserDetailsDone, null, (_prev, details) => details);
export const isLoadingDetails = engine.signal(UserDetailsPending, false, () => true);
engine.signalUpdate(isLoadingDetails, UserDetailsDone, () => false);
engine.signalUpdate(isLoadingDetails, UserDetailsError, () => false);
export const error = engine.signal(SearchError, null, (_prev, err) => (err instanceof Error ? err.message : String(err)));
engine.signalUpdate(error, SearchDone, () => null);
engine.signalUpdate(error, SearchInput, () => null);
