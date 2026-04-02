import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  Component as ReactComponent,
  type ComponentType,
  type ReactNode,
  type ErrorInfo,
} from 'react'
import { PulseProvider } from '@pulse/react'
import { examples, categories, type ExampleEntry } from './examples'
import DAGViewer from './DAGViewer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LoadedExample {
  id: string
  Component: ComponentType
  engine: any
  startLoop: () => void
  stopLoop: () => void
  resetState: () => void
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState<LoadedExample | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevRef = useRef<LoadedExample | null>(null)
  const initialLoad = useRef(false)

  const selectExample = useCallback(
    async (entry: ExampleEntry) => {
      if (entry.id === activeId) return
      setLoading(true)
      setError(null)
      setActiveId(entry.id)

      // Stop previous example's loop (don't destroy — modules are cached singletons)
      const prev = prevRef.current
      if (prev) {
        try { prev.stopLoop() } catch { /* ignore */ }
        try { prev.engine.debug.onEmit = undefined } catch { /* ignore */ }
        prevRef.current = null
      }

      try {
        const mod = await entry.load()
        const ex: LoadedExample = {
          id: entry.id,
          Component: mod.default,
          engine: mod.engine,
          startLoop: mod.startLoop,
          stopLoop: mod.stopLoop,
          resetState: mod.resetState,
        }

        // Reset module-level state and start loop
        try { ex.resetState() } catch { /* ignore */ }
        try { ex.startLoop() } catch { /* ignore */ }

        prevRef.current = ex
        setLoaded(ex)
      } catch (err: any) {
        console.error('Failed to load example:', err)
        setError(err.message ?? 'Unknown error loading example')
        setLoaded(null)
      } finally {
        setLoading(false)
      }
    },
    [activeId],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const prev = prevRef.current
      if (prev) {
        try { prev.stopLoop() } catch { /* ignore */ }
        try { prev.engine.debug.onEmit = undefined } catch { /* ignore */ }
      }
    }
  }, [])

  // Auto-load example from URL ?example=todo-list
  useEffect(() => {
    if (initialLoad.current) return
    initialLoad.current = true
    const params = new URLSearchParams(window.location.search)
    const exId = params.get('example')
    if (exId) {
      const entry = examples.find(e => e.id === exId)
      if (entry) selectExample(entry)
    }
  }, [selectExample])

  // Update URL when example changes
  useEffect(() => {
    if (activeId) {
      const url = new URL(window.location.href)
      url.searchParams.set('example', activeId)
      window.history.replaceState({}, '', url.toString())
    }
  }, [activeId])

  // Group examples by category
  const grouped = categories.map((cat) => ({
    ...cat,
    items: examples.filter((e) => e.category === cat.key),
  }))

  return (
    <div style={styles.root}>
      {/* ---- Sidebar ---- */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.logo}>Pulse Playground</h1>
          <p style={styles.tagline}>Interactive example browser</p>
        </div>

        <nav style={styles.nav}>
          {grouped.map((group) => (
            <div key={group.key} style={styles.group}>
              <div style={styles.groupHeader}>
                <span
                  style={{
                    ...styles.groupDot,
                    background: group.color,
                  }}
                />
                <span style={styles.groupLabel}>{group.label}</span>
                <span style={styles.groupCount}>{group.items.length}</span>
              </div>

              {group.items.map((entry) => {
                const isActive = entry.id === activeId
                return (
                  <button
                    key={entry.id}
                    onClick={() => selectExample(entry)}
                    style={{
                      ...styles.navItem,
                      ...(isActive ? styles.navItemActive : {}),
                      borderLeftColor: isActive ? group.color : 'transparent',
                    }}
                  >
                    <span style={styles.navItemName}>{entry.name}</span>
                    <span style={styles.navItemDesc}>{entry.description}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ---- Main ---- */}
      <main style={styles.main}>
        {/* Top: live preview */}
        <div style={styles.preview}>
          {loading && (
            <div style={styles.loadingOverlay}>
              <div style={styles.spinner} />
              <span style={styles.loadingText}>Loading example...</span>
            </div>
          )}

          {error && (
            <div style={styles.errorOverlay}>
              <span style={styles.errorTitle}>Failed to load</span>
              <span style={styles.errorMsg}>{error}</span>
            </div>
          )}

          {!loaded && !loading && !error && (
            <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>&#9654;</div>
              <div style={styles.placeholderText}>
                Select an example from the sidebar to begin
              </div>
            </div>
          )}

          {loaded && !loading && (
            <PulseProvider key={loaded.id} engine={loaded.engine}>
              <div style={styles.exampleWrapper}>
                <ExampleRenderer
                  key={loaded.id}
                  Component={loaded.Component}
                />
              </div>
            </PulseProvider>
          )}
        </div>

        {/* Bottom: DAG viewer */}
        <div style={styles.dagPanel}>
          <div style={styles.dagHeader}>
            <span style={styles.dagTitle}>DAG Visualization</span>
            {loaded && (
              <span style={styles.dagSubtitle}>
                {examples.find((e) => e.id === loaded.id)?.name ?? ''}
              </span>
            )}
          </div>
          <div style={styles.dagContent}>
            <DAGViewer engine={loaded?.engine ?? null} />
          </div>
        </div>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Error boundary wrapper for each example
// ---------------------------------------------------------------------------

function ExampleRenderer({ Component }: { Component: ComponentType }) {
  const [renderError, setRenderError] = useState<string | null>(null)

  if (renderError) {
    return (
      <div style={styles.errorOverlay}>
        <span style={styles.errorTitle}>Render error</span>
        <span style={styles.errorMsg}>{renderError}</span>
      </div>
    )
  }

  return (
    <ErrorBoundary onError={(msg) => setRenderError(msg)}>
      <Component />
    </ErrorBoundary>
  )
}

// Minimal class-based error boundary (React requirement)
class ErrorBoundary extends ReactComponent<
  { children: ReactNode; onError: (msg: string) => void },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError(error.message)
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: '#0a0a1a',
  },

  // ---- Sidebar ----
  sidebar: {
    width: 280,
    minWidth: 280,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#0d0d20',
    borderRight: '1px solid #1e293b',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '24px 20px 16px',
    borderBottom: '1px solid #1e293b',
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #4361ee 0%, #7209b7 50%, #f72585 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },
  tagline: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 0',
  },

  // ---- Groups ----
  group: {
    marginBottom: 8,
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 20px 4px',
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#94a3b8',
  },
  groupCount: {
    fontSize: 10,
    color: '#475569',
    marginLeft: 'auto',
    fontFamily: "'JetBrains Mono', monospace",
  },

  // ---- Nav items ----
  navItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    padding: '8px 20px 8px 24px',
    border: 'none',
    borderLeft: '3px solid transparent',
    background: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'background 0.15s',
    outline: 'none',
  },
  navItemActive: {
    background: 'rgba(67, 97, 238, 0.08)',
  },
  navItemName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#e2e8f0',
    fontFamily: "'Inter', sans-serif",
  },
  navItemDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 1.3,
    fontFamily: "'Inter', sans-serif",
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  // ---- Main area ----
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },

  // ---- Preview ----
  preview: {
    flex: '0 0 60%',
    position: 'relative' as const,
    overflow: 'auto',
    background: '#0a0a1a',
  },
  exampleWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'auto',
  },

  // ---- Loading / Error / Placeholder ----
  loadingOverlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(10, 10, 26, 0.85)',
    zIndex: 10,
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '3px solid #1e293b',
    borderTopColor: '#4361ee',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
  },
  errorOverlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(10, 10, 26, 0.9)',
    zIndex: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMsg: {
    fontSize: 13,
    color: '#94a3b8',
    maxWidth: 400,
    textAlign: 'center' as const,
    fontFamily: "'JetBrains Mono', monospace",
  },
  placeholder: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  placeholderIcon: {
    fontSize: 40,
    color: '#1e293b',
  },
  placeholderText: {
    fontSize: 14,
    color: '#475569',
  },

  // ---- DAG panel ----
  dagPanel: {
    flex: '0 0 40%',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    borderTop: '1px solid #1e293b',
  },
  dagHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 16px',
    background: '#0d0d20',
    borderBottom: '1px solid #1e293b',
  },
  dagTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  dagSubtitle: {
    fontSize: 12,
    color: '#475569',
    fontFamily: "'JetBrains Mono', monospace",
  },
  dagContent: {
    flex: 1,
    overflow: 'hidden',
  },
}
