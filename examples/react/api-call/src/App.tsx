import { usePulse, useEmit } from '@pulse/react'
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
    maxWidth: 720,
    margin: '40px auto',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '0 20px',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    marginBottom: 32,
  } as React.CSSProperties,
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: colors.text,
    margin: 0,
  } as React.CSSProperties,
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  } as React.CSSProperties,
  searchBox: {
    position: 'relative' as const,
    marginBottom: 24,
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '14px 16px 14px 44px',
    fontSize: 16,
    border: `2px solid ${colors.border}`,
    borderRadius: 12,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  searchIcon: {
    position: 'absolute' as const,
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.muted,
    fontSize: 18,
  } as React.CSSProperties,
  spinner: {
    position: 'absolute' as const,
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 20,
    height: 20,
    border: `2px solid ${colors.border}`,
    borderTop: `2px solid ${colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  } as React.CSSProperties,
  userCard: (selected: boolean) =>
    ({
      padding: 16,
      background: selected ? colors.primaryLight : colors.card,
      borderRadius: 12,
      border: `2px solid ${selected ? colors.primary : colors.border}`,
      cursor: 'pointer',
      transition: 'all 0.2s',
    }) as React.CSSProperties,
  avatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: colors.primary,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 8,
  } as React.CSSProperties,
  userName: {
    fontWeight: 600,
    fontSize: 16,
    color: colors.text,
    margin: 0,
  } as React.CSSProperties,
  userRole: {
    fontSize: 13,
    color: colors.muted,
    margin: '2px 0 0',
  } as React.CSSProperties,
  detailsPanel: {
    marginTop: 24,
    padding: 24,
    background: colors.card,
    borderRadius: 12,
    border: `2px solid ${colors.border}`,
  } as React.CSSProperties,
  detailsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  } as React.CSSProperties,
  detailsAvatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: colors.primary,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 22,
    flexShrink: 0,
  } as React.CSSProperties,
  detailField: {
    marginBottom: 12,
  } as React.CSSProperties,
  detailLabel: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: colors.muted,
    letterSpacing: 0.5,
  } as React.CSSProperties,
  detailValue: {
    fontSize: 15,
    color: colors.text,
    marginTop: 2,
  } as React.CSSProperties,
  tag: {
    display: 'inline-block',
    padding: '4px 10px',
    background: colors.primaryLight,
    color: colors.primary,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    marginRight: 6,
    marginTop: 4,
  } as React.CSSProperties,
  errorBox: {
    padding: 16,
    background: '#fef2f2',
    border: `1px solid ${colors.danger}`,
    borderRadius: 8,
    color: colors.danger,
    fontSize: 14,
    marginBottom: 16,
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: 40,
    color: colors.muted,
  } as React.CSSProperties,
  loadingOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    color: colors.muted,
  } as React.CSSProperties,
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
        onChange={(e) => emit(SearchInput, e.target.value)}
      />
      {loading && <div style={styles.spinner} />}
      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  )
}

function UserCard({ user }: { user: User }) {
  const emit = useEmit()
  const selected = usePulse(UserSelected, null as string | null)

  return (
    <div
      style={styles.userCard(selected === user.id)}
      onClick={() => emit(UserSelected, user.id)}
      onMouseEnter={(e) => {
        if (selected !== user.id) {
          e.currentTarget.style.borderColor = colors.primary
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (selected !== user.id) {
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

  if (loading && results.length === 0) {
    return <div style={styles.loadingOverlay}>Searching...</div>
  }

  if (query.length > 0 && results.length === 0 && !loading) {
    return <div style={styles.empty}>No users found for "{query}"</div>
  }

  if (results.length === 0) {
    return (
      <div style={styles.empty}>
        Type in the search box to find users
      </div>
    )
  }

  return (
    <div style={styles.grid}>
      {results.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}

function UserDetailsPanel() {
  const details = usePulse(UserDetailsDone, null as UserDetails | null)
  const loading = usePulse(UserDetailsLoading, false)
  const selected = usePulse(UserSelected, null as string | null)

  if (!selected) return null

  if (loading) {
    return (
      <div style={styles.detailsPanel}>
        <div style={styles.loadingOverlay}>Loading user details...</div>
      </div>
    )
  }

  if (!details) return null

  return (
    <div style={styles.detailsPanel}>
      <div style={styles.detailsHeader}>
        <div style={styles.detailsAvatar}>{details.avatar}</div>
        <div>
          <h3 style={{ margin: 0, fontSize: 22, color: colors.text }}>
            {details.name}
          </h3>
          <p style={{ margin: '4px 0 0', color: colors.muted, fontSize: 14 }}>
            {details.email}
          </p>
        </div>
      </div>
      <div style={styles.detailField}>
        <div style={styles.detailLabel}>Role</div>
        <div style={styles.detailValue}>{details.role}</div>
      </div>
      <div style={styles.detailField}>
        <div style={styles.detailLabel}>Bio</div>
        <div style={styles.detailValue}>{details.bio}</div>
      </div>
      <div style={styles.detailField}>
        <div style={styles.detailLabel}>Location</div>
        <div style={styles.detailValue}>{details.location}</div>
      </div>
      <div style={styles.detailField}>
        <div style={styles.detailLabel}>Joined</div>
        <div style={styles.detailValue}>{details.joinDate}</div>
      </div>
      <div style={styles.detailField}>
        <div style={styles.detailLabel}>Projects</div>
        <div>
          {details.projects.map((p) => (
            <span key={p} style={styles.tag}>
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
  if (!err) return null
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
          Async search with debounce, cancellation, and details fetching via
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
