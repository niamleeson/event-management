const FRAMEWORKS = [
  { id: 'react', name: 'React', port: 3001, color: '#61dafb', logo: '⚛' },
  { id: 'vue', name: 'Vue', port: 3002, color: '#42b883', logo: '💚' },
  { id: 'solid', name: 'Solid', port: 3003, color: '#4f88c6', logo: '💠' },
  { id: 'angular', name: 'Angular', port: 3004, color: '#dd0031', logo: '🅰' },
  { id: 'ember', name: 'Ember', port: 3005, color: '#e04e39', logo: '🐹' },
] as const

const EXAMPLE_GROUPS = [
  { label: 'Basics', examples: [
    { id: 'todo-list', name: 'Todo List', desc: 'Event-driven todos with validation pipes' },
    { id: 'api-call', name: 'API Call', desc: 'Async search with cancel & retry' },
    { id: 'simple-animation', name: 'Simple Animation', desc: 'Tweened counter with springs' },
    { id: 'complex-animation', name: 'Complex Animation', desc: 'Staggered card entrance with joins' },
    { id: 'drag-api-animation', name: 'Drag + API + Animation', desc: 'Kanban board with springs & async save' },
    { id: 'realtime-dashboard', name: 'Realtime Dashboard', desc: 'Mock WebSocket with threshold joins' },
    { id: 'form-wizard', name: 'Form Wizard', desc: 'Multi-step validation with guards' },
  ]},
  { label: '3D Animations', examples: [
    { id: '3d-card-flip', name: '3D Card Flip', desc: 'Photo gallery with 3D flip transitions' },
    { id: '3d-cube-menu', name: '3D Cube Menu', desc: 'Drag-rotatable 3D cube navigation' },
    { id: '3d-particle-explosion', name: '3D Particles', desc: 'Canvas particle explosions with physics' },
    { id: '3d-carousel', name: '3D Carousel', desc: 'Circular 3D item carousel' },
    { id: '3d-layered-parallax', name: '3D Parallax', desc: 'Multi-layer depth parallax scene' },
    { id: '3d-morphing-grid', name: '3D Morphing Grid', desc: 'Grid morphing between 3D shapes' },
  ]},
  { label: 'Complex UI', examples: [
    { id: 'spreadsheet', name: 'Spreadsheet', desc: 'Reactive spreadsheet with formulas' },
    { id: 'chat-app', name: 'Chat App', desc: 'Real-time chat with bot responders' },
    { id: 'music-player', name: 'Music Player', desc: 'Audio player with visualizer' },
    { id: 'virtual-scroll', name: 'Virtual Scroll', desc: '10,000 items with virtual rendering' },
    { id: 'collaborative-editor', name: 'Collab Editor', desc: 'Multi-user text editing simulation' },
    { id: 'image-filters', name: 'Image Filters', desc: 'CSS filter pipeline with undo/redo' },
    { id: 'gantt-chart', name: 'Gantt Chart', desc: 'Timeline with draggable tasks' },
    { id: 'notification-system', name: 'Notifications', desc: 'Toast stack with priority & animation' },
    { id: 'file-tree', name: 'File Tree', desc: 'Hierarchical file explorer' },
    { id: 'stock-dashboard', name: 'Stock Dashboard', desc: 'Real-time stock ticker with charts' },
    { id: 'sortable-grid', name: 'Sortable Grid', desc: 'Drag-to-reorder with spring animations' },
    { id: 'modal-system', name: 'Modal System', desc: 'Stacked modal dialogs with transitions' },
    { id: 'canvas-paint', name: 'Canvas Paint', desc: 'Drawing app with tools & layers' },
    { id: 'data-table', name: 'Data Table', desc: 'Sortable, filterable, paginated table' },
  ]},
] as const

const EXAMPLES = EXAMPLE_GROUPS.flatMap(g => g.examples)

type FrameworkId = typeof FRAMEWORKS[number]['id']
type ExampleId = typeof EXAMPLES[number]['id']

let activeFramework: FrameworkId = 'react'
let activeExample: ExampleId = 'todo-list'

function getIframeSrc(): string {
  const fw = FRAMEWORKS.find(f => f.id === activeFramework)!
  return `http://localhost:${fw.port}/${activeExample}`
}

function render() {
  const activeFw = FRAMEWORKS.find(f => f.id === activeFramework)!

  document.body.innerHTML = `
    <div class="shell">
      <div class="topbar">
        <div class="brand">
          <span class="brand-icon">⚡</span>
          <span class="brand-name">Pulse</span>
          <span class="brand-tag">Event Engine</span>
        </div>
        <div class="framework-tabs">
          ${FRAMEWORKS.map(fw => `
            <button
              class="fw-tab ${fw.id === activeFramework ? 'active' : ''}"
              data-fw="${fw.id}"
              style="${fw.id === activeFramework ? `--accent: ${fw.color}; border-bottom-color: ${fw.color}; color: ${fw.color};` : ''}"
            >
              <span class="fw-logo">${fw.logo}</span>
              <span class="fw-name">${fw.name}</span>
            </button>
          `).join('')}
        </div>
        <div class="topbar-status">
          <span class="status-dot" style="background: ${activeFw.color}"></span>
          <span class="status-text">localhost:${activeFw.port}</span>
        </div>
      </div>
      <div class="main">
        <nav class="sidebar">
          <div class="sidebar-header">
            <span style="color: ${activeFw.color}">${activeFw.logo}</span>
            ${activeFw.name} Examples
          </div>
          ${EXAMPLE_GROUPS.map(group => `
            <div class="example-group">
              <div class="group-label">${group.label}</div>
              ${group.examples.map(ex => `
                <button
                  class="example-link ${ex.id === activeExample ? 'active' : ''}"
                  data-ex="${ex.id}"
                  style="${ex.id === activeExample ? `--link-accent: ${activeFw.color}` : ''}"
                >
                  <span class="example-name">${ex.name}</span>
                  <span class="example-desc">${ex.desc}</span>
                </button>
              `).join('')}
            </div>
          `).join('')}
        </nav>
        <div class="content">
          <iframe
            id="example-frame"
            src="${getIframeSrc()}"
            frameborder="0"
          ></iframe>
          <div class="content-overlay" id="loading-overlay">
            <div class="spinner"></div>
            <div class="loading-text">Loading ${activeFw.name} / ${EXAMPLES.find(e => e.id === activeExample)!.name}...</div>
          </div>
        </div>
      </div>
    </div>
  `

  // Event listeners
  document.querySelectorAll('.fw-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFramework = (btn as HTMLElement).dataset.fw as FrameworkId
      render()
    })
  })

  document.querySelectorAll('.example-link').forEach(btn => {
    btn.addEventListener('click', () => {
      activeExample = (btn as HTMLElement).dataset.ex as ExampleId
      render()
    })
  })

  // Handle iframe load
  const iframe = document.getElementById('example-frame') as HTMLIFrameElement
  const overlay = document.getElementById('loading-overlay') as HTMLDivElement

  iframe.addEventListener('load', () => {
    overlay.classList.add('hidden')
  })

  iframe.addEventListener('error', () => {
    overlay.innerHTML = `
      <div class="error-msg">
        <div class="error-icon">⚠</div>
        <div><strong>${activeFw.name} showcase not running</strong></div>
        <div class="error-hint">Start it with: <code>./run.sh showcase ${activeFw.id}</code> on port ${activeFw.port}</div>
      </div>
    `
  })

  // Timeout fallback for connection refused (iframe won't fire error for that)
  setTimeout(() => {
    if (!overlay.classList.contains('hidden')) {
      overlay.innerHTML = `
        <div class="error-msg">
          <div class="error-icon">⚠</div>
          <div><strong>${activeFw.name} showcase not detected on port ${activeFw.port}</strong></div>
          <div class="error-hint">
            Run: <code>./run.sh all</code> to start everything<br>
            Or:  <code>./run.sh showcase ${activeFw.id}</code> for just ${activeFw.name}
          </div>
        </div>
      `
    }
  }, 5000)
}

// Inject styles
const style = document.createElement('style')
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f0f1a;
    color: #e0e0e0;
    overflow: hidden;
    height: 100vh;
  }

  .shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  /* ── Top Bar ── */
  .topbar {
    display: flex;
    align-items: center;
    height: 56px;
    background: #16162a;
    border-bottom: 1px solid #2a2a4a;
    padding: 0 20px;
    gap: 24px;
    flex-shrink: 0;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: 12px;
  }

  .brand-icon {
    font-size: 24px;
  }

  .brand-name {
    font-size: 20px;
    font-weight: 700;
    background: linear-gradient(135deg, #4361ee, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .brand-tag {
    font-size: 11px;
    color: #666;
    background: #1e1e3a;
    padding: 2px 8px;
    border-radius: 10px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .framework-tabs {
    display: flex;
    gap: 4px;
    height: 100%;
    align-items: stretch;
  }

  .fw-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    color: #888;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .fw-tab:hover {
    color: #ccc;
    background: rgba(255,255,255,0.03);
  }

  .fw-tab.active {
    font-weight: 600;
  }

  .fw-logo {
    font-size: 16px;
  }

  .topbar-status {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #666;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── Main Layout ── */
  .main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* ── Sidebar ── */
  .sidebar {
    width: 260px;
    background: #1a1a2e;
    border-right: 1px solid #2a2a4a;
    display: flex;
    flex-direction: column;
    padding: 16px 0;
    overflow-y: auto;
    flex-shrink: 0;
  }

  .sidebar-header {
    padding: 4px 20px 16px;
    font-size: 13px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid #2a2a4a;
    margin-bottom: 8px;
  }

  .example-group {
    margin-bottom: 4px;
  }

  .group-label {
    padding: 10px 20px 4px;
    font-size: 10px;
    font-weight: 700;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .example-link {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 12px 20px;
    background: none;
    border: none;
    border-left: 3px solid transparent;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .example-link:hover {
    background: rgba(255,255,255,0.04);
  }

  .example-link.active {
    background: rgba(255,255,255,0.06);
    border-left-color: var(--link-accent, #4361ee);
  }

  .example-name {
    font-size: 14px;
    font-weight: 500;
    color: #e0e0e0;
  }

  .example-link.active .example-name {
    color: #fff;
    font-weight: 600;
  }

  .example-desc {
    font-size: 11px;
    color: #666;
    margin-top: 3px;
    line-height: 1.3;
  }

  /* ── Content ── */
  .content {
    flex: 1;
    position: relative;
    background: #f8fafc;
  }

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: #fff;
  }

  .content-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    gap: 16px;
    transition: opacity 0.3s;
  }

  .content-overlay.hidden {
    opacity: 0;
    pointer-events: none;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e0e0e0;
    border-top-color: #4361ee;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    font-size: 14px;
    color: #888;
  }

  .error-msg {
    text-align: center;
    color: #555;
    line-height: 1.8;
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }

  .error-msg strong {
    color: #333;
    font-size: 16px;
  }

  .error-hint {
    margin-top: 8px;
    font-size: 13px;
    color: #888;
  }

  .error-hint code {
    background: #1a1a2e;
    color: #7c3aed;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 13px;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
`
document.head.appendChild(style)

// Parse URL hash for deep linking: #react/todo-list
function parseHash() {
  const hash = window.location.hash.replace('#', '')
  if (!hash) return
  const [fw, ex] = hash.split('/')
  if (FRAMEWORKS.find(f => f.id === fw)) activeFramework = fw as FrameworkId
  if (EXAMPLES.find(e => e.id === ex)) activeExample = ex as ExampleId
}

function updateHash() {
  window.location.hash = `${activeFramework}/${activeExample}`
}

// Override render to also update hash
const _origRender = render
const renderWithHash = () => {
  updateHash()
  _origRender()
}

// Initial load
parseHash()

// Replace render calls with hash-updating version
// We need to re-bind after first render
render()

// Watch for hash changes (back/forward navigation)
window.addEventListener('hashchange', () => {
  parseHash()
  render()
})
