/**
 * Pulse Ember Showcase — Main Entry Point
 *
 * This showcase demonstrates how the @pulse/ember adapter bridges Pulse's
 * event-driven engine into Ember's autotracking system using:
 *
 *   - TrackedSignal<T>  — wraps a Pulse Signal with @tracked
 *   - TrackedTween      — wraps a Pulse TweenValue with @tracked
 *   - TrackedSpring     — wraps a Pulse SpringValue with @tracked
 *   - PulseService      — manages lifecycle of tracked wrappers
 *   - createPulseService(engine) — factory to create a service
 *
 * In a real Ember Octane app, the PulseService would be registered as an
 * Ember Service via the DI container, and Glimmer components would read
 * tracked values in .hbs templates for automatic re-rendering.
 *
 * Since full Ember CLI requires a heavy build pipeline (broccoli, ember-cli-babel,
 * ember-cli-htmlbars), this showcase uses Vite + vanilla TypeScript DOM rendering
 * to demonstrate the same integration patterns in a lightweight way.
 */

import { createDevTools } from '@pulse/devtools'
import type { DevTools } from '@pulse/devtools'
import { injectStyles } from './styles'
import { routeInfos } from './routes'

// Page modules (lazy-loaded via dynamic import)
type PageModule = {
  mount(container: HTMLElement): () => void
}

const pageLoaders: Record<string, () => Promise<PageModule>> = {
  '/todo-list': () => import('./pages/todo-list'),
  '/api-call': () => import('./pages/api-call'),
  '/simple-animation': () => import('./pages/simple-animation'),
  '/complex-animation': () => import('./pages/complex-animation'),
  '/drag-api-animation': () => import('./pages/drag-api-animation'),
  '/realtime-dashboard': () => import('./pages/realtime-dashboard'),
  '/form-wizard': () => import('./pages/form-wizard'),
}

// ---- DevTools state ----

let devtoolsInstance: DevTools | null = null
let devtoolsOpen = false
let devtoolsBtn: HTMLButtonElement | null = null

function updateDevToolsButton(): void {
  if (devtoolsBtn) {
    devtoolsBtn.style.background = devtoolsOpen
      ? '#4361ee'
      : 'rgba(255, 255, 255, 0.08)'
    devtoolsBtn.style.color = devtoolsOpen
      ? '#fff'
      : 'rgba(255, 255, 255, 0.6)'
  }
}

function destroyDevTools(): void {
  if (devtoolsInstance) {
    devtoolsInstance.destroy()
    devtoolsInstance = null
  }
  devtoolsOpen = false
  updateDevToolsButton()
}

function toggleDevTools(): void {
  if (devtoolsInstance) {
    destroyDevTools()
  } else {
    const engine = (window as any).__pulseEngine
    if (engine) {
      devtoolsInstance = createDevTools(engine, { position: 'bottom', theme: 'dark' })
      devtoolsOpen = true
      updateDevToolsButton()
    }
  }
}

function reconnectDevToolsIfOpen(): void {
  if (devtoolsOpen) {
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

// ---- App ----

let currentCleanup: (() => void) | null = null
let mainContent: HTMLElement

function createSidebar(): HTMLElement {
  const nav = document.createElement('nav')
  nav.className = 'sidebar'

  nav.innerHTML = `
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-icon">P</div>
        <div class="logo-text">
          <span class="logo-title">Pulse</span>
          <span class="logo-subtitle">Ember Examples</span>
        </div>
      </div>
    </div>
    <div class="sidebar-nav" id="sidebar-nav"></div>
    <div id="devtools-btn-container"></div>
    <div class="sidebar-footer">
      <span class="footer-text">${routeInfos.length} examples</span>
    </div>
  `

  const navContainer = nav.querySelector('#sidebar-nav')!
  for (const route of routeInfos) {
    const link = document.createElement('a')
    link.className = 'nav-link'
    link.href = `#${route.path}`
    link.innerHTML = `
      <span class="nav-label">${route.label}</span>
      <span class="nav-desc">${route.description}</span>
    `
    navContainer.appendChild(link)
  }

  // DevTools toggle button
  const btnContainer = nav.querySelector('#devtools-btn-container')!
  devtoolsBtn = document.createElement('button')
  devtoolsBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg> DevTools`
  devtoolsBtn.title = 'Toggle Pulse DevTools'
  devtoolsBtn.style.cssText = `
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
    width: calc(100% - 20px);
  `
  devtoolsBtn.addEventListener('click', toggleDevTools)
  devtoolsBtn.addEventListener('mouseenter', () => {
    if (!devtoolsOpen && devtoolsBtn) {
      devtoolsBtn.style.background = 'rgba(255, 255, 255, 0.12)'
      devtoolsBtn.style.color = 'rgba(255, 255, 255, 0.85)'
    }
  })
  devtoolsBtn.addEventListener('mouseleave', () => {
    updateDevToolsButton()
  })
  btnContainer.appendChild(devtoolsBtn)

  return nav
}

function updateActiveNav(): void {
  const hash = window.location.hash || '#/todo-list'
  const path = hash.slice(1)

  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href')
    if (href === `#${path}`) {
      link.classList.add('active')
    } else {
      link.classList.remove('active')
    }
  })
}

async function navigateTo(path: string): Promise<void> {
  // Cleanup previous page
  if (currentCleanup) {
    currentCleanup()
    currentCleanup = null
  }
  mainContent.innerHTML = '<div class="loading-fallback">Loading...</div>'

  const loader = pageLoaders[path]
  if (!loader) {
    mainContent.innerHTML = '<div class="example-container"><h2>Not Found</h2><p>Unknown route.</p></div>'
    return
  }

  try {
    const mod = await loader()
    mainContent.innerHTML = ''
    currentCleanup = mod.mount(mainContent)
  } catch (err) {
    mainContent.innerHTML = `<div class="example-container"><h2>Error</h2><p>${err}</p></div>`
  }

  updateActiveNav()

  // Reconnect devtools if it was open
  reconnectDevToolsIfOpen()
}

function handleHashChange(): void {
  const hash = window.location.hash || '#/todo-list'
  const path = hash.slice(1)
  navigateTo(path)
}

// ---- Bootstrap ----

injectStyles()

const root = document.getElementById('root')!
root.innerHTML = ''

const layout = document.createElement('div')
layout.className = 'layout'

layout.appendChild(createSidebar())

mainContent = document.createElement('main')
mainContent.className = 'main-content'
layout.appendChild(mainContent)

root.appendChild(layout)

// Navigate on hash change
window.addEventListener('hashchange', handleHashChange)

// Initial navigation
if (!window.location.hash) {
  window.location.hash = '#/todo-list'
} else {
  handleHashChange()
}
