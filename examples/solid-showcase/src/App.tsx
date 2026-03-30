import { For, Suspense, createSignal, onCleanup } from 'solid-js'
import { A, useLocation, type RouteSectionProps } from '@solidjs/router'
import { createDevTools } from '@pulse/devtools'
import type { DevTools } from '@pulse/devtools'
import { routeInfos, sectionLabels } from './routes'

function Sidebar() {
  const location = useLocation()
  const [devtoolsOpen, setDevtoolsOpen] = createSignal(false)
  let devtoolsInstance: DevTools | null = null

  function destroyDevTools() {
    if (devtoolsInstance) {
      devtoolsInstance.destroy()
      devtoolsInstance = null
    }
    setDevtoolsOpen(false)
  }

  function toggleDevTools() {
    if (devtoolsInstance) {
      destroyDevTools()
    } else {
      const engine = (window as any).__pulseEngine
      if (engine) {
        devtoolsInstance = createDevTools(engine, { position: 'bottom', theme: 'dark' })
        setDevtoolsOpen(true)
      }
    }
  }

  // Watch for route changes to reconnect devtools
  let lastPath = location.pathname
  const interval = setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname
      if (devtoolsOpen()) {
        if (devtoolsInstance) {
          devtoolsInstance.destroy()
          devtoolsInstance = null
        }
        setTimeout(() => {
          const engine = (window as any).__pulseEngine
          if (engine) {
            devtoolsInstance = createDevTools(engine, { position: 'bottom', theme: 'dark' })
          }
        }, 100)
      }
    }
  }, 50)

  onCleanup(() => {
    clearInterval(interval)
    if (devtoolsInstance) {
      devtoolsInstance.destroy()
      devtoolsInstance = null
    }
  })

  return (
    <nav class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">P</div>
          <div class="logo-text">
            <span class="logo-title">Pulse</span>
            <span class="logo-subtitle">Solid Examples</span>
          </div>
        </div>
      </div>
      <div class="sidebar-nav">
        <For each={['basics', '3d', 'complex'] as const}>
          {(section) => (
            <div class="nav-section">
              <div class="nav-section-title">{sectionLabels[section]}</div>
              <For each={routeInfos.filter((r) => r.section === section)}>
                {(route) => (
                  <A
                    href={route.path}
                    class="nav-link"
                    classList={{ active: location.pathname === route.path }}
                  >
                    <span class="nav-label">{route.label}</span>
                    <span class="nav-desc">{route.description}</span>
                  </A>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
      <button
        class="devtools-btn"
        classList={{ active: devtoolsOpen() }}
        onClick={toggleDevTools}
        title="Toggle Pulse DevTools"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
        </svg>
        DevTools
      </button>
      <div class="sidebar-footer">
        <span class="footer-text">{routeInfos.length} examples</span>
      </div>
    </nav>
  )
}

export default function App(props: RouteSectionProps) {
  return (
    <>
      <style>{layoutStyles}</style>
      <div class="layout">
        <Sidebar />
        <main class="main-content">
          <Suspense fallback={<div class="loading-fallback">Loading...</div>}>
            {props.children}
          </Suspense>
        </main>
      </div>
    </>
  )
}

const layoutStyles = `
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f0f2f5;
  }

  .layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .sidebar {
    width: 260px;
    min-width: 260px;
    background: #1a1a2e;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }

  .sidebar-header {
    padding: 24px 20px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #4361ee, #7c3aed);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 800;
    font-size: 1.25rem;
    letter-spacing: -0.5px;
    flex-shrink: 0;
  }

  .logo-title {
    display: block;
    color: #ffffff;
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }

  .logo-subtitle {
    display: block;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.2;
    margin-top: 1px;
  }

  .sidebar-nav {
    flex: 1;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-section {
    margin-bottom: 8px;
  }

  .nav-section-title {
    font-size: 0.65rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    padding: 10px 14px 4px;
  }

  .nav-link {
    display: flex;
    flex-direction: column;
    padding: 10px 14px;
    border-radius: 8px;
    text-decoration: none;
    transition: background 0.15s, transform 0.1s;
    cursor: pointer;
  }

  .nav-link:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .nav-link.active {
    background: #4361ee;
  }

  .nav-link.active:hover {
    background: #3a56d4;
  }

  .nav-label {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .nav-link.active .nav-label {
    color: #ffffff;
  }

  .nav-desc {
    color: rgba(255, 255, 255, 0.35);
    font-size: 0.75rem;
    line-height: 1.3;
    margin-top: 2px;
  }

  .nav-link.active .nav-desc {
    color: rgba(255, 255, 255, 0.65);
  }

  .devtools-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 8px 10px 4px;
    padding: 8px 14px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.2px;
  }

  .devtools-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.85);
  }

  .devtools-btn.active {
    background: #4361ee;
    color: #fff;
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .footer-text {
    color: rgba(255, 255, 255, 0.25);
    font-size: 0.75rem;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    background: #f0f2f5;
    position: relative;
  }

  .main-content > * {
    min-height: 100%;
  }

  .loading-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #888;
    font-size: 1rem;
  }
`
