import { usePulse, useEmit } from '@pulse/solid'
import {
  SearchInput,
  SearchQueryChanged,
  SearchLoading,
  SearchDone,
  SearchError,
  UserSelected,
  UserDetailsDone,
  UserDetailsLoading,
  type User,
  type UserDetails,
} from './engine'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const colors = {
  bg: '#f8f9fa',
  card: '#ffffff',
  primary: '#4361ee',
  primaryLight: '#eef0ff',
  text: '#1a1a2e',
  muted: '#6c757d',
  border: '#e9ecef',
  danger: '#e63946',
  success: '#2a9d8f',
}

const styles = {
  container: {
    'max-width': 720,
    margin: '40px auto',
    'font-family':
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '0 20px',
  },
  header: {
    'text-align': 'center' as const,
    'margin-bottom': 32,
  },
  title: {
    'font-size': 36,
    'font-weight': 700,
    color: colors.text,
    margin: 0,
  },
  subtitle: {
    color: colors.muted,
    'font-size': 14,
    'margin-top': 4,
  },
  searchBox: {
    position: 'relative' as const,
    'margin-bottom': 24,
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 44px',
    'font-size': 16,
    border: `2px solid ${colors.border}`,
    'border-radius': 12,
    outline: 'none',
    'box-sizing': 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.muted,
    'font-size': 18,
  },
  spinner: {
    position: 'absolute' as const,
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 20,
    height: 20,
    border: `2px solid ${colors.border}`,
    'border-top': `2px solid ${colors.primary}`,
    'border-radius': '50%',
    animation: 'spin 0.8s linear infinite',
  },
  grid: {
    display: 'grid',
    'grid-template-columns': '1fr 1fr',
    gap: 16,
  },
  userCard: (selected: boolean) =>
    ({
      padding: 16,
      background: selected ? colors.primaryLight : colors.card,
      'border-radius': 12,
      border: `2px solid ${selected ? colors.primary : colors.border}`,
      cursor: 'pointer',
      transition: 'all 0.2s',
    }),
  avatar: {
    width: 48,
    height: 48,
    'border-radius': '50%',
    background: colors.primary,
    color: '#fff',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'font-weight': 700,
    'font-size': 16,
    'margin-bottom': 8,
  },
  userName: {
    'font-weight': 600,
    'font-size': 16,
    color: colors.text,
    margin: 0,
  },
  userRole: {
    'font-size': 13,
    color: colors.muted,
    margin: '2px 0 0',
  },
  detailsPanel: {
    'margin-top': 24,
    padding: 24,
    background: colors.card,
    'border-radius': 12,
    border: `2px solid ${colors.border}`,
  },
  detailsHeader: {
    display: 'flex',
    'align-items': 'center',
    gap: 16,
    'margin-bottom': 16,
  },
  detailsAvatar: {
    width: 64,
    height: 64,
    'border-radius': '50%',
    background: colors.primary,
    color: '#fff',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'font-weight': 700,
    'font-size': 22,
    'flex-shrink': 0,
  },
  detailField: {
    'margin-bottom': 12,
  },
  detailLabel: {
    'font-size': 12,
    'font-weight': 600,
    'text-transform': 'uppercase' as const,
    color: colors.muted,
    'letter-spacing': 0.5,
  },
  detailValue: {
    'font-size': 15,
    color: colors.text,
    'margin-top': 2,
  },
  tag: {
    display: 'inline-block',
    padding: '4px 10px',
    background: colors.primaryLight,
    color: colors.primary,
    'border-radius': 12,
    'font-size': 12,
    'font-weight': 600,
    'margin-right': 6,
    'margin-top': 4,
  },
  errorBox: {
    padding: 16,
    background: '#fef2f2',
    border: `1px solid ${colors.danger}`,
    'border-radius': 8,
    color: colors.danger,
    'font-size': 14,
    'margin-bottom': 16,
  },
  empty: {
    'text-align': 'center' as const,
    padding: 40,
    color: colors.muted,
  },
  loadingOverlay: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    padding: 40,
    color: colors.muted,
  },
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function SearchBar() {
  const emit = useEmit()
  const query = usePulse(SearchQueryChanged, '')
  const loading = usePulse(SearchLoading, false)

  return (
    <div style={styles.searchBox}>
      <span style={styles.searchIcon}>&#128269;</span>
      <input
        style={styles.input}
        value={query}
        placeholder="Search users by name, email, or role..."
        onChange={(e) => emit(SearchInput, e.currentTarget.value)}
      />
      {loading() && <div style={styles.spinner} />}
      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  )
}

function UserCard({ user }: { user: User }) {
  const emit = useEmit()
  const selected = usePulse(UserSelected, null as string | null)

  return (
    <div
      style={styles.userCard(selected() === user.id)}
      onClick={() => emit(UserSelected, user.id)}
      onMouseEnter={(e) => {
        if (selected() !== user.id) {
          e.currentTarget.style.borderColor = colors.primary
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (selected() !== user.id) {
          e.currentTarget.style.borderColor = colors.border
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      <div style={styles.avatar}>{user.avatar}</div>
      <p style={styles.userName}>{user.name}</p>
      <p style={styles.userRole}>{user.role}</p>
    </div>
  )
}

function SearchResults() {
  const results = usePulse(SearchDone, [] as User[])
  const query = usePulse(SearchQueryChanged, '')
  const loading = usePulse(SearchLoading, false)

  if (loading() && results().length === 0) {
    return <div style={styles.loadingOverlay}>Searching...</div>
  }

  if (query().length > 0 && results().length === 0 && !loading()) {
    return <div style={styles.empty}>No users found for "{query}"</div>
  }

  if (results().length === 0) {
    return (
      <div style={styles.empty}>
        Type in the search box to find users
      </div>
    )
  }

  return (
    <div style={styles.grid}>
      {results().map((user) => (
        <UserCard user={user} />
      ))}
    </div>
  )
}

function UserDetailsPanel() {
  const details = usePulse(UserDetailsDone, null as UserDetails | null)
  const loading = usePulse(UserDetailsLoading, false)
  const selected = usePulse(UserSelected, null as string | null)

  if (!selected()) return null

  if (loading()) {
    return (
      <div style={styles.detailsPanel}>
        <div style={styles.loadingOverlay}>Loading user details...</div>
      </div>
    )
  }

  if (!details()) return null

  return (
    <div style={styles.detailsPanel}>
      <div style={styles.detailsHeader}>
        <div style={styles.detailsAvatar}>{details().avatar}</div>
        <div>
          <h3 style={{ margin: 0, 'font-size': 22, color: colors.text }}>
            {details().name}
          </h3>
          <p style={{ margin: '4px 0 0', color: colors.muted, 'font-size': 14 }}>
            {details().email}
          </p>
        </div>
      </div>
      <div style={styles.detailField}>
        <div style={styles.detailLabel}>Role</div>
        <div style={styles.detailValue}>{details().role}</div>
      </div>
      <div style={styles.detailField}>
        <div style={styles.detailLabel}>Bio</div>
        <div style={styles.detailValue}>{details().bio}</div>
      </div>
      <div style={styles.detailField}>
        <div style={styles.detailLabel}>Location</div>
        <div style={styles.detailValue}>{details().location}</div>
      </div>
      <div style={styles.detailField}>
        <div style={styles.detailLabel}>Joined</div>
        <div style={styles.detailValue}>{details().joinDate}</div>
      </div>
      <div style={styles.detailField}>
        <div style={styles.detailLabel}>Projects</div>
        <div>
          {details().projects.map((p) => (
            <span style={styles.tag}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorBanner() {
  const err = usePulse(SearchError, null as string | null)
  if (!err()) return null
  return <div style={styles.errorBox}>{err}</div>
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>User Search</h1>
        <p style={styles.subtitle}>
          Async search with debounce, cancellation, and details() fetching via
          Pulse
        </p>
      </div>
      <ErrorBanner />
      <SearchBar />
      <SearchResults />
      <UserDetailsPanel />
    </div>
  )
}
