import { useRef, useEffect, useState, useCallback } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { createDevTools } from '@pulse/devtools'
import type { DevTools } from '@pulse/devtools'
import { routeInfo } from './routes'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const SIDEBAR_WIDTH = 260

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
  } as React.CSSProperties,

  sidebar: {
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
    background: '#1a1a2e',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    bottom: 0,
    overflowY: 'auto' as const,
    zIndex: 100,
  } as React.CSSProperties,

  logoArea: {
    padding: '28px 24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties,

  logoTitle: {
    fontSize: 26,
    fontWeight: 800,
    margin: 0,
    letterSpacing: -0.5,
    background: 'linear-gradient(135deg, #4361ee 0%, #7c3aed 50%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } as React.CSSProperties,

  logoSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontWeight: 500,
    letterSpacing: 0.3,
  } as React.CSSProperties,

  nav: {
    flex: 1,
    padding: '12px 0',
  } as React.CSSProperties,

  navLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    padding: '12px 24px 8px',
  } as React.CSSProperties,

  navLink: (isActive: boolean) =>
    ({
      display: 'block',
      padding: '10px 24px',
      textDecoration: 'none',
      borderLeft: `3px solid ${isActive ? '#4361ee' : 'transparent'}`,
      background: isActive ? 'rgba(67, 97, 238, 0.1)' : 'transparent',
      transition: 'all 0.15s ease',
      cursor: 'pointer',
    }) as React.CSSProperties,

  navLinkName: (isActive: boolean) =>
    ({
      fontSize: 14,
      fontWeight: isActive ? 600 : 500,
      color: isActive ? '#fff' : '#cbd5e1',
      lineHeight: 1.3,
    }) as React.CSSProperties,

  navLinkDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 1.4,
  } as React.CSSProperties,

  footer: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.5,
  } as React.CSSProperties,

  main: {
    flex: 1,
    marginLeft: SIDEBAR_WIDTH,
    background: '#f8fafc',
    minHeight: '100vh',
  } as React.CSSProperties,

  contentHeader: {
    padding: '24px 32px 0',
  } as React.CSSProperties,

  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  } as React.CSSProperties,

  pageDesc: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 0,
  } as React.CSSProperties,

  divider: {
    height: 1,
    background: '#e2e8f0',
    margin: '16px 32px 0',
  } as React.CSSProperties,

  contentBody: {
    padding: '0',
  } as React.CSSProperties,

  devtoolsBtn: (active: boolean) =>
    ({
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      margin: '8px 24px 4px',
      padding: '8px 14px',
      border: 'none',
      borderRadius: 8,
      background: active ? '#4361ee' : 'rgba(255,255,255,0.08)',
      color: active ? '#fff' : 'rgba(255,255,255,0.6)',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      letterSpacing: 0.2,
    }) as React.CSSProperties,
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function Layout() {
  const location = useLocation()
  const currentRoute = routeInfo.find((r) => location.pathname === r.path)
  const devtoolsRef = useRef<DevTools | null>(null)
  const [devtoolsOpen, setDevtoolsOpen] = useState(false)

  const destroyDevTools = useCallback(() => {
    if (devtoolsRef.current) {
      devtoolsRef.current.destroy()
      devtoolsRef.current = null
    }
    setDevtoolsOpen(false)
  }, [])

  // When route changes, destroy existing devtools and re-create if it was open
  useEffect(() => {
    if (devtoolsOpen) {
      // Destroy old instance
      if (devtoolsRef.current) {
        devtoolsRef.current.destroy()
        devtoolsRef.current = null
      }
      // Small delay to allow the new page to set __pulseEngine
      const timer = setTimeout(() => {
        const engine = (window as any).__pulseEngine
        if (engine) {
          devtoolsRef.current = createDevTools(engine, { position: 'bottom', theme: 'dark' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [location.pathname, devtoolsOpen])

  // Clean up devtools on unmount
  useEffect(() => {
    return () => {
      if (devtoolsRef.current) {
        devtoolsRef.current.destroy()
        devtoolsRef.current = null
      }
    }
  }, [])

  const toggleDevTools = () => {
    if (devtoolsRef.current) {
      destroyDevTools()
    } else {
      const engine = (window as any).__pulseEngine
      if (engine) {
        devtoolsRef.current = createDevTools(engine, { position: 'bottom', theme: 'dark' })
        setDevtoolsOpen(true)
      }
    }
  }

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <h1 style={styles.logoTitle}>Pulse</h1>
          <div style={styles.logoSubtitle}>React Examples Showcase</div>
        </div>

        <nav style={styles.nav}>
          {(['basics', '3d', 'complex'] as const).map((section) => {
            const sectionLabel = section === 'basics' ? 'Basics' : section === '3d' ? '3D Animations' : 'Complex UI'
            const sectionRoutes = routeInfo.filter((r) => r.section === section)
            return (
              <div key={section}>
                <div style={styles.navLabel}>{sectionLabel}</div>
                {sectionRoutes.map((route) => (
                  <NavLink
                    key={route.path}
                    to={route.path}
                    style={({ isActive }) => styles.navLink(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <div style={styles.navLinkName(isActive)}>{route.label}</div>
                        <div style={styles.navLinkDesc}>{route.description}</div>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <button
          style={styles.devtoolsBtn(devtoolsOpen)}
          onClick={toggleDevTools}
          title="Toggle Pulse DevTools"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
          </svg>
          DevTools
        </button>

        <div style={styles.footer}>
          Built with @pulse/core and @pulse/react
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        {currentRoute && (
          <>
            <div style={styles.contentHeader}>
              <h2 style={styles.pageTitle}>{currentRoute.label}</h2>
              <p style={styles.pageDesc}>{currentRoute.description}</p>
            </div>
            <div style={styles.divider} />
          </>
        )}
        <div style={styles.contentBody}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
