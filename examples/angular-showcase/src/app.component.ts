import { Component, OnDestroy } from '@angular/core'
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router'
import { createDevTools } from '@pulse/devtools'
import type { DevTools } from '@pulse/devtools'
import { Subscription, filter } from 'rxjs'

interface NavItem {
  path: string
  label: string
  description: string
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="logo">Pulse</h1>
          <p class="tagline">Angular Showcase</p>
        </div>
        <nav class="nav">
          @for (item of navItems; track item.path) {
            <a
              class="nav-link"
              [routerLink]="item.path"
              routerLinkActive="active"
            >
              <span class="nav-label">{{ item.label }}</span>
              <span class="nav-desc">{{ item.description }}</span>
            </a>
          }
        </nav>
        <button
          class="devtools-btn"
          [class.active]="devtoolsOpen"
          (click)="toggleDevTools()"
          title="Toggle Pulse DevTools"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
          </svg>
          DevTools
        </button>
        <div class="sidebar-footer">
          <p>Built with @pulse/core</p>
        </div>
      </aside>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 240px;
      min-width: 240px;
      background: #1a1a2e;
      color: #fff;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 1.5rem 1.25rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #4361ee, #7c3aed);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .tagline {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 0.25rem;
    }

    .nav {
      flex: 1;
      padding: 0.75rem 0;
    }

    .nav-link {
      display: block;
      padding: 0.65rem 1.25rem;
      text-decoration: none;
      color: rgba(255, 255, 255, 0.6);
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.85);
    }

    .nav-link.active {
      background: rgba(67, 97, 238, 0.12);
      color: #fff;
      border-left-color: #4361ee;
    }

    .nav-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .nav-link.active .nav-label {
      color: #4361ee;
    }

    .nav-desc {
      display: block;
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.3);
      margin-top: 0.15rem;
      line-height: 1.3;
    }

    .nav-link.active .nav-desc {
      color: rgba(67, 97, 238, 0.6);
    }

    .devtools-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 8px 1.25rem 4px;
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
      padding: 1rem 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .sidebar-footer p {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.25);
    }

    .content {
      flex: 1;
      margin-left: 240px;
      background: #fff;
      min-height: 100vh;
    }
  `],
})
export class AppComponent implements OnDestroy {
  navItems: NavItem[] = [
    {
      path: 'todo-list',
      label: 'Todo List',
      description: 'CRUD with validation pipes',
    },
    {
      path: 'api-call',
      label: 'API Call',
      description: 'Async search with cancellation',
    },
    {
      path: 'simple-animation',
      label: 'Simple Animation',
      description: 'Tween-powered counter',
    },
    {
      path: 'complex-animation',
      label: 'Complex Animation',
      description: 'Staggered card entrance',
    },
    {
      path: 'drag-api-animation',
      label: 'Drag & Drop',
      description: 'Kanban with spring physics',
    },
    {
      path: 'realtime-dashboard',
      label: 'Realtime Dashboard',
      description: 'Live metrics with alerts',
    },
    {
      path: 'form-wizard',
      label: 'Form Wizard',
      description: 'Multi-step form with validation',
    },
    // 3D Examples
    {
      path: '3d-card-flip',
      label: '3D Card Flip',
      description: '4x2 grid with flip tweens',
    },
    {
      path: '3d-cube-menu',
      label: '3D Cube Menu',
      description: 'Drag-rotate cube, spring snap',
    },
    {
      path: '3d-particle-explosion',
      label: 'Particle Explosion',
      description: 'Canvas particles with physics',
    },
    {
      path: '3d-carousel',
      label: '3D Carousel',
      description: 'Auto-rotate 3D circle layout',
    },
    {
      path: '3d-layered-parallax',
      label: 'Layered Parallax',
      description: '5-layer spring camera tilt',
    },
    {
      path: '3d-morphing-grid',
      label: 'Morphing Grid',
      description: '4x4 staggered shape morph',
    },
    // Complex UI
    {
      path: 'spreadsheet',
      label: 'Spreadsheet',
      description: '8x8 grid with formula cascade',
    },
    {
      path: 'chat-app',
      label: 'Chat App',
      description: '2 bots, typing, read receipts',
    },
    {
      path: 'music-player',
      label: 'Music Player',
      description: '32-bar visualizer, playlist',
    },
    {
      path: 'virtual-scroll',
      label: 'Virtual Scroll',
      description: '10K items, async page load',
    },
    {
      path: 'collaborative-editor',
      label: 'Collaborative Editor',
      description: 'Multi-user cursors, edit history',
    },
    {
      path: 'image-filters',
      label: 'Image Filters',
      description: 'CSS filter pipeline, undo/redo',
    },
    {
      path: 'gantt-chart',
      label: 'Gantt Chart',
      description: 'Drag tasks, SVG arrows, zoom',
    },
    {
      path: 'notification-system',
      label: 'Notifications',
      description: 'Toast stack, auto-dismiss',
    },
    {
      path: 'file-tree',
      label: 'File Tree',
      description: 'Nested expand, keyboard nav',
    },
    {
      path: 'stock-dashboard',
      label: 'Stock Dashboard',
      description: '8 stocks, sparklines, alerts',
    },
    {
      path: 'sortable-grid',
      label: 'Sortable Grid',
      description: '4-col drag reorder, shuffle',
    },
    {
      path: 'modal-system',
      label: 'Modal System',
      description: 'Stacked modals, blur, escape',
    },
    {
      path: 'canvas-paint',
      label: 'Canvas Paint',
      description: 'Draw tools, layers, undo/redo',
    },
    {
      path: 'data-table',
      label: 'Data Table',
      description: '1K rows, sort/filter/paginate',
    },
  ]

  devtoolsOpen = false
  private devtoolsInstance: DevTools | null = null
  private routerSub: Subscription

  constructor(private router: Router) {
    // When the route changes, reconnect devtools if open
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.reconnectDevToolsIfOpen()
      })
  }

  ngOnDestroy(): void {
    this.routerSub.unsubscribe()
    if (this.devtoolsInstance) {
      this.devtoolsInstance.destroy()
      this.devtoolsInstance = null
    }
  }

  toggleDevTools(): void {
    if (this.devtoolsInstance) {
      this.devtoolsInstance.destroy()
      this.devtoolsInstance = null
      this.devtoolsOpen = false
    } else {
      const engine = (window as any).__pulseEngine
      if (engine) {
        this.devtoolsInstance = createDevTools(engine, { position: 'bottom', theme: 'dark' })
        this.devtoolsOpen = true
      }
    }
  }

  private reconnectDevToolsIfOpen(): void {
    if (this.devtoolsOpen) {
      if (this.devtoolsInstance) {
        this.devtoolsInstance.destroy()
        this.devtoolsInstance = null
      }
      setTimeout(() => {
        const engine = (window as any).__pulseEngine
        if (engine) {
          this.devtoolsInstance = createDevTools(engine, { position: 'bottom', theme: 'dark' })
        }
      }, 100)
    }
  }
}
