<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, watch, onUnmounted } from 'vue'
import { createDevTools } from '@pulse/devtools'
import type { DevTools } from '@pulse/devtools'

const route = useRoute()
const router = useRouter()

interface NavItem {
  path: string
  label: string
  description: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Basics',
    items: [
      { path: '/todo-list', label: 'Todo List', description: 'Events, pipes, signals' },
      { path: '/api-call', label: 'API Call', description: 'Async with latest-wins' },
      { path: '/simple-animation', label: 'Simple Animation', description: 'Tweens and springs' },
      { path: '/complex-animation', label: 'Complex Animation', description: 'Staggered tweens, joins' },
      { path: '/drag-api-animation', label: 'Drag + API', description: 'Kanban with spring physics' },
      { path: '/realtime-dashboard', label: 'Realtime Dashboard', description: 'Streaming metrics, alerts' },
      { path: '/form-wizard', label: 'Form Wizard', description: 'Multi-step validation, joins' },
    ],
  },
  {
    title: '3D Animations',
    items: [
      { path: '/3d-card-flip', label: '3D Card Flip', description: 'Interactive card flip' },
      { path: '/3d-cube-menu', label: '3D Cube Menu', description: 'Rotating cube navigation' },
      { path: '/3d-particle-explosion', label: '3D Particles', description: 'Particle explosion effects' },
      { path: '/3d-carousel', label: '3D Carousel', description: 'Rotating 3D carousel' },
      { path: '/3d-layered-parallax', label: '3D Parallax', description: 'Layered parallax depth' },
      { path: '/3d-morphing-grid', label: '3D Morphing Grid', description: 'Grid morphing transitions' },
    ],
  },
  {
    title: 'Complex UI',
    items: [
      { path: '/spreadsheet', label: 'Spreadsheet', description: 'Cell editing with formulas' },
      { path: '/chat-app', label: 'Chat App', description: 'Real-time messaging' },
      { path: '/music-player', label: 'Music Player', description: 'Audio player with playlist' },
      { path: '/virtual-scroll', label: 'Virtual Scroll', description: 'Virtualized list rendering' },
      { path: '/collaborative-editor', label: 'Collaborative Editor', description: 'Multi-user text editing' },
      { path: '/image-filters', label: 'Image Filters', description: 'Real-time image processing' },
      { path: '/gantt-chart', label: 'Gantt Chart', description: 'Project timeline visualization' },
      { path: '/notification-system', label: 'Notifications', description: 'Toast notification system' },
      { path: '/file-tree', label: 'File Tree', description: 'Hierarchical file browser' },
      { path: '/stock-dashboard', label: 'Stock Dashboard', description: 'Live stock price tracker' },
      { path: '/sortable-grid', label: 'Sortable Grid', description: 'Drag-to-reorder grid' },
      { path: '/modal-system', label: 'Modal System', description: 'Stacked modal management' },
      { path: '/canvas-paint', label: 'Canvas Paint', description: 'Drawing canvas application' },
      { path: '/data-table', label: 'Data Table', description: 'Sortable, filterable grid' },
    ],
  },
]

const currentPath = computed(() => route.path)

const devtoolsInstance = ref<DevTools | null>(null)
const devtoolsOpen = ref(false)

function destroyDevTools() {
  if (devtoolsInstance.value) {
    devtoolsInstance.value.destroy()
    devtoolsInstance.value = null
  }
  devtoolsOpen.value = false
}

function toggleDevTools() {
  if (devtoolsInstance.value) {
    destroyDevTools()
  } else {
    const engine = (window as any).__pulseEngine
    if (engine) {
      devtoolsInstance.value = createDevTools(engine, { position: 'bottom', theme: 'dark' })
      devtoolsOpen.value = true
    }
  }
}

// When route changes, destroy and re-create devtools if open
watch(currentPath, () => {
  if (devtoolsOpen.value) {
    if (devtoolsInstance.value) {
      devtoolsInstance.value.destroy()
      devtoolsInstance.value = null
    }
    setTimeout(() => {
      const engine = (window as any).__pulseEngine
      if (engine) {
        devtoolsInstance.value = createDevTools(engine, { position: 'bottom', theme: 'dark' })
      }
    }, 100)
  }
})

onUnmounted(() => {
  if (devtoolsInstance.value) {
    devtoolsInstance.value.destroy()
    devtoolsInstance.value = null
  }
})
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">P</span>
          <span class="logo-text">Pulse</span>
        </div>
        <p class="sidebar-subtitle">Vue 3 Examples</p>
      </div>
      <nav class="nav">
        <div v-for="section in navSections" :key="section.title" class="nav-section">
          <div class="nav-section-title">{{ section.title }}</div>
          <RouterLink
            v-for="item in section.items"
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ active: currentPath === item.path }"
          >
            <span class="nav-label">{{ item.label }}</span>
            <span class="nav-desc">{{ item.description }}</span>
          </RouterLink>
        </div>
      </nav>
      <button
        class="devtools-btn"
        :class="{ active: devtoolsOpen }"
        @click="toggleDevTools"
        title="Toggle Pulse DevTools"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
        </svg>
        DevTools
      </button>
      <div class="sidebar-footer">
        <a
          href="https://github.com/nicholasgalante1997/pulse"
          target="_blank"
          class="footer-link"
        >
          GitHub
        </a>
      </div>
    </aside>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  overflow-y: auto;
}

.sidebar-header {
  padding: 28px 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #4361ee;
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: -0.5px;
}

.logo-text {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.sidebar-subtitle {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 6px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.nav {
  flex: 1;
  padding: 12px 12px;
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
  padding: 12px 14px;
  border-radius: 10px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.15s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.nav-link.active {
  background: #4361ee;
  color: #fff;
  box-shadow: 0 4px 16px rgba(67, 97, 238, 0.35);
}

.nav-label {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
}

.nav-desc {
  font-size: 0.72rem;
  opacity: 0.55;
  margin-top: 2px;
  line-height: 1.3;
}

.nav-link.active .nav-desc {
  opacity: 0.75;
}

.devtools-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 12px 4px;
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
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-link {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.35);
  text-decoration: none;
  transition: color 0.15s;
}

.footer-link:hover {
  color: rgba(255, 255, 255, 0.7);
}

.content {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  background: #f5f6fa;
}
</style>
