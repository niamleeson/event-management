import { For, Show, createMemo } from 'solid-js'
import { useSignal, useEmit } from '@pulse/solid'
import {
  searchQuery,
  searchResults,
  isSearching,
  selectedUserId,
  userDetails,
  isLoadingDetails,
  error,
  SearchInput,
  UserSelected,
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

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function SearchBar() {
  const emit = useEmit()
  const query = useSignal(searchQuery)
  const loading = useSignal(isSearching)

  return (
    <div style={{ position: 'relative', 'margin-bottom': '24px' }}>
      <span
        style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: colors.muted,
          'font-size': '18px',
        }}
      >
        &#128269;
      </span>
      <input
        style={{
          width: '100%',
          padding: '14px 16px 14px 44px',
          'font-size': '16px',
          border: `2px solid ${colors.border}`,
          'border-radius': '12px',
          outline: 'none',
          'box-sizing': 'border-box',
          transition: 'border-color 0.2s',
        }}
        value={query()}
        placeholder="Search users by name, email, or role..."
        onInput={(e) => emit(SearchInput, e.currentTarget.value)}
      />
      <Show when={loading()}>
        <div
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            border: `2px solid ${colors.border}`,
            'border-top': `2px solid ${colors.primary}`,
            'border-radius': '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </Show>
      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  )
}

function UserCard(props: { user: User }) {
  const emit = useEmit()
  const selected = useSignal(selectedUserId)

  const isSelected = createMemo(() => selected() === props.user.id)

  return (
    <div
      style={{
        padding: '16px',
        background: isSelected() ? colors.primaryLight : colors.card,
        'border-radius': '12px',
        border: `2px solid ${isSelected() ? colors.primary : colors.border}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onClick={() => emit(UserSelected, props.user.id)}
      onMouseEnter={(e) => {
        if (!isSelected()) {
          e.currentTarget.style.borderColor = colors.primary
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected()) {
          e.currentTarget.style.borderColor = colors.border
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          'border-radius': '50%',
          background: colors.primary,
          color: '#fff',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'font-weight': '700',
          'font-size': '16px',
          'margin-bottom': '8px',
        }}
      >
        {props.user.avatar}
      </div>
      <p
        style={{
          'font-weight': '600',
          'font-size': '16px',
          color: colors.text,
          margin: '0',
        }}
      >
        {props.user.name}
      </p>
      <p
        style={{
          'font-size': '13px',
          color: colors.muted,
          margin: '2px 0 0',
        }}
      >
        {props.user.role}
      </p>
    </div>
  )
}

function SearchResultsView() {
  const results = useSignal(searchResults)
  const query = useSignal(searchQuery)
  const loading = useSignal(isSearching)

  return (
    <Show
      when={!(loading() && results().length === 0)}
      fallback={
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: '40px',
            color: colors.muted,
          }}
        >
          Searching...
        </div>
      }
    >
      <Show
        when={!(query().length > 0 && results().length === 0 && !loading())}
        fallback={
          <div
            style={{
              'text-align': 'center',
              padding: '40px',
              color: colors.muted,
            }}
          >
            No users found for "{query()}"
          </div>
        }
      >
        <Show
          when={results().length > 0}
          fallback={
            <div
              style={{
                'text-align': 'center',
                padding: '40px',
                color: colors.muted,
              }}
            >
              Type in the search box to find users
            </div>
          }
        >
          <div
            style={{
              display: 'grid',
              'grid-template-columns': '1fr 1fr',
              gap: '16px',
            }}
          >
            <For each={results()}>
              {(user) => <UserCard user={user} />}
            </For>
          </div>
        </Show>
      </Show>
    </Show>
  )
}

function UserDetailsPanel() {
  const details = useSignal(userDetails)
  const loading = useSignal(isLoadingDetails)
  const selected = useSignal(selectedUserId)

  return (
    <Show when={selected()}>
      <Show
        when={!loading()}
        fallback={
          <div
            style={{
              'margin-top': '24px',
              padding: '24px',
              background: colors.card,
              'border-radius': '12px',
              border: `2px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                padding: '40px',
                color: colors.muted,
              }}
            >
              Loading user details...
            </div>
          </div>
        }
      >
        <Show when={details()}>
          {(d) => (
            <div
              style={{
                'margin-top': '24px',
                padding: '24px',
                background: colors.card,
                'border-radius': '12px',
                border: `2px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '16px',
                  'margin-bottom': '16px',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    'border-radius': '50%',
                    background: colors.primary,
                    color: '#fff',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'font-weight': '700',
                    'font-size': '22px',
                    'flex-shrink': '0',
                  }}
                >
                  {d().avatar}
                </div>
                <div>
                  <h3
                    style={{
                      margin: '0',
                      'font-size': '22px',
                      color: colors.text,
                    }}
                  >
                    {d().name}
                  </h3>
                  <p
                    style={{
                      margin: '4px 0 0',
                      color: colors.muted,
                      'font-size': '14px',
                    }}
                  >
                    {d().email}
                  </p>
                </div>
              </div>
              <DetailField label="Role" value={d().role} />
              <DetailField label="Bio" value={d().bio} />
              <DetailField label="Location" value={d().location} />
              <DetailField label="Joined" value={d().joinDate} />
              <div style={{ 'margin-bottom': '12px' }}>
                <div
                  style={{
                    'font-size': '12px',
                    'font-weight': '600',
                    'text-transform': 'uppercase',
                    color: colors.muted,
                    'letter-spacing': '0.5px',
                  }}
                >
                  Projects
                </div>
                <div>
                  <For each={d().projects}>
                    {(p) => (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: colors.primaryLight,
                          color: colors.primary,
                          'border-radius': '12px',
                          'font-size': '12px',
                          'font-weight': '600',
                          'margin-right': '6px',
                          'margin-top': '4px',
                        }}
                      >
                        {p}
                      </span>
                    )}
                  </For>
                </div>
              </div>
            </div>
          )}
        </Show>
      </Show>
    </Show>
  )
}

function DetailField(props: { label: string; value: string }) {
  return (
    <div style={{ 'margin-bottom': '12px' }}>
      <div
        style={{
          'font-size': '12px',
          'font-weight': '600',
          'text-transform': 'uppercase',
          color: colors.muted,
          'letter-spacing': '0.5px',
        }}
      >
        {props.label}
      </div>
      <div
        style={{
          'font-size': '15px',
          color: colors.text,
          'margin-top': '2px',
        }}
      >
        {props.value}
      </div>
    </div>
  )
}

function ErrorBanner() {
  const err = useSignal(error)

  return (
    <Show when={err()}>
      <div
        style={{
          padding: '16px',
          background: '#fef2f2',
          border: `1px solid ${colors.danger}`,
          'border-radius': '8px',
          color: colors.danger,
          'font-size': '14px',
          'margin-bottom': '16px',
        }}
      >
        {err()}
      </div>
    </Show>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <div
      style={{
        'max-width': '720px',
        margin: '40px auto',
        'font-family':
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '0 20px',
      }}
    >
      <div style={{ 'text-align': 'center', 'margin-bottom': '32px' }}>
        <h1
          style={{
            'font-size': '36px',
            'font-weight': '700',
            color: colors.text,
            margin: '0',
          }}
        >
          User Search
        </h1>
        <p
          style={{
            color: colors.muted,
            'font-size': '14px',
            'margin-top': '4px',
          }}
        >
          Async search with debounce, cancellation, and details fetching via
          Pulse
        </p>
      </div>
      <ErrorBanner />
      <SearchBar />
      <SearchResultsView />
      <UserDetailsPanel />
    </div>
  )
}
