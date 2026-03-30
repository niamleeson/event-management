import React, { Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Lazy-loaded page wrappers
// Each page imports its own engine + App and wraps in PulseProvider
// ---------------------------------------------------------------------------

// Basics
const TodoListPage = React.lazy(() => import('./pages/TodoListPage'))
const ApiCallPage = React.lazy(() => import('./pages/ApiCallPage'))
const SimpleAnimationPage = React.lazy(() => import('./pages/SimpleAnimationPage'))
const ComplexAnimationPage = React.lazy(() => import('./pages/ComplexAnimationPage'))
const DragApiAnimationPage = React.lazy(() => import('./pages/DragApiAnimationPage'))
const RealtimeDashboardPage = React.lazy(() => import('./pages/RealtimeDashboardPage'))
const FormWizardPage = React.lazy(() => import('./pages/FormWizardPage'))

// 3D Animations
const CardFlip3DPage = React.lazy(() => import('./pages/CardFlip3DPage'))
const CubeMenu3DPage = React.lazy(() => import('./pages/CubeMenu3DPage'))
const ParticleExplosion3DPage = React.lazy(() => import('./pages/ParticleExplosion3DPage'))
const Carousel3DPage = React.lazy(() => import('./pages/Carousel3DPage'))
const LayeredParallax3DPage = React.lazy(() => import('./pages/LayeredParallax3DPage'))
const MorphingGrid3DPage = React.lazy(() => import('./pages/MorphingGrid3DPage'))

// Complex UI
const SpreadsheetPage = React.lazy(() => import('./pages/SpreadsheetPage'))
const ChatAppPage = React.lazy(() => import('./pages/ChatAppPage'))
const MusicPlayerPage = React.lazy(() => import('./pages/MusicPlayerPage'))
const VirtualScrollPage = React.lazy(() => import('./pages/VirtualScrollPage'))
const CollaborativeEditorPage = React.lazy(() => import('./pages/CollaborativeEditorPage'))
const ImageFiltersPage = React.lazy(() => import('./pages/ImageFiltersPage'))
const GanttChartPage = React.lazy(() => import('./pages/GanttChartPage'))
const NotificationSystemPage = React.lazy(() => import('./pages/NotificationSystemPage'))
const FileTreePage = React.lazy(() => import('./pages/FileTreePage'))
const StockDashboardPage = React.lazy(() => import('./pages/StockDashboardPage'))
const SortableGridPage = React.lazy(() => import('./pages/SortableGridPage'))
const ModalSystemPage = React.lazy(() => import('./pages/ModalSystemPage'))
const CanvasPaintPage = React.lazy(() => import('./pages/CanvasPaintPage'))
const DataTablePage = React.lazy(() => import('./pages/DataTablePage'))

// ---------------------------------------------------------------------------
// Loading fallback
// ---------------------------------------------------------------------------

function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        color: '#94a3b8',
        fontSize: 15,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #4361ee',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }}
        />
        Loading example...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function withSuspense(Component: React.LazyExoticComponent<React.ComponentType>) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  )
}

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------

export interface RouteInfo {
  path: string
  label: string
  description: string
  section: 'basics' | '3d' | 'complex'
}

export const routeInfo: RouteInfo[] = [
  // Basics
  {
    path: '/todo-list',
    label: 'Todo List',
    description: 'Event-driven todos with validation',
    section: 'basics',
  },
  {
    path: '/api-call',
    label: 'API Call',
    description: 'Async search with debounce & cancel',
    section: 'basics',
  },
  {
    path: '/simple-animation',
    label: 'Simple Animation',
    description: 'Tween-animated counter with color',
    section: 'basics',
  },
  {
    path: '/complex-animation',
    label: 'Complex Animation',
    description: 'Staggered cards with springs & joins',
    section: 'basics',
  },
  {
    path: '/drag-api-animation',
    label: 'Drag + API + Animation',
    description: 'Kanban board with drag, save & retry',
    section: 'basics',
  },
  {
    path: '/realtime-dashboard',
    label: 'Realtime Dashboard',
    description: 'Live metrics with threshold alerts',
    section: 'basics',
  },
  {
    path: '/form-wizard',
    label: 'Form Wizard',
    description: 'Multi-step form with validation',
    section: 'basics',
  },

  // 3D Animations
  {
    path: '/3d-card-flip',
    label: '3D Card Flip',
    description: 'Interactive card flip animation',
    section: '3d',
  },
  {
    path: '/3d-cube-menu',
    label: '3D Cube Menu',
    description: 'Rotating cube navigation',
    section: '3d',
  },
  {
    path: '/3d-particle-explosion',
    label: '3D Particles',
    description: 'Particle explosion effects',
    section: '3d',
  },
  {
    path: '/3d-carousel',
    label: '3D Carousel',
    description: 'Rotating 3D carousel',
    section: '3d',
  },
  {
    path: '/3d-layered-parallax',
    label: '3D Parallax',
    description: 'Layered parallax depth effect',
    section: '3d',
  },
  {
    path: '/3d-morphing-grid',
    label: '3D Morphing Grid',
    description: 'Grid morphing transitions',
    section: '3d',
  },

  // Complex UI
  {
    path: '/spreadsheet',
    label: 'Spreadsheet',
    description: 'Cell editing with formulas',
    section: 'complex',
  },
  {
    path: '/chat-app',
    label: 'Chat App',
    description: 'Real-time messaging interface',
    section: 'complex',
  },
  {
    path: '/music-player',
    label: 'Music Player',
    description: 'Audio player with playlist',
    section: 'complex',
  },
  {
    path: '/virtual-scroll',
    label: 'Virtual Scroll',
    description: 'Virtualized list rendering',
    section: 'complex',
  },
  {
    path: '/collaborative-editor',
    label: 'Collaborative Editor',
    description: 'Multi-user text editing',
    section: 'complex',
  },
  {
    path: '/image-filters',
    label: 'Image Filters',
    description: 'Real-time image processing',
    section: 'complex',
  },
  {
    path: '/gantt-chart',
    label: 'Gantt Chart',
    description: 'Project timeline visualization',
    section: 'complex',
  },
  {
    path: '/notification-system',
    label: 'Notifications',
    description: 'Toast notification system',
    section: 'complex',
  },
  {
    path: '/file-tree',
    label: 'File Tree',
    description: 'Hierarchical file browser',
    section: 'complex',
  },
  {
    path: '/stock-dashboard',
    label: 'Stock Dashboard',
    description: 'Live stock price tracker',
    section: 'complex',
  },
  {
    path: '/sortable-grid',
    label: 'Sortable Grid',
    description: 'Drag-to-reorder grid layout',
    section: 'complex',
  },
  {
    path: '/modal-system',
    label: 'Modal System',
    description: 'Stacked modal management',
    section: 'complex',
  },
  {
    path: '/canvas-paint',
    label: 'Canvas Paint',
    description: 'Drawing canvas application',
    section: 'complex',
  },
  {
    path: '/data-table',
    label: 'Data Table',
    description: 'Sortable, filterable data grid',
    section: 'complex',
  },
]

export const routes: RouteObject[] = [
  // Basics
  { path: 'todo-list', element: withSuspense(TodoListPage) },
  { path: 'api-call', element: withSuspense(ApiCallPage) },
  { path: 'simple-animation', element: withSuspense(SimpleAnimationPage) },
  { path: 'complex-animation', element: withSuspense(ComplexAnimationPage) },
  { path: 'drag-api-animation', element: withSuspense(DragApiAnimationPage) },
  { path: 'realtime-dashboard', element: withSuspense(RealtimeDashboardPage) },
  { path: 'form-wizard', element: withSuspense(FormWizardPage) },

  // 3D Animations
  { path: '3d-card-flip', element: withSuspense(CardFlip3DPage) },
  { path: '3d-cube-menu', element: withSuspense(CubeMenu3DPage) },
  { path: '3d-particle-explosion', element: withSuspense(ParticleExplosion3DPage) },
  { path: '3d-carousel', element: withSuspense(Carousel3DPage) },
  { path: '3d-layered-parallax', element: withSuspense(LayeredParallax3DPage) },
  { path: '3d-morphing-grid', element: withSuspense(MorphingGrid3DPage) },

  // Complex UI
  { path: 'spreadsheet', element: withSuspense(SpreadsheetPage) },
  { path: 'chat-app', element: withSuspense(ChatAppPage) },
  { path: 'music-player', element: withSuspense(MusicPlayerPage) },
  { path: 'virtual-scroll', element: withSuspense(VirtualScrollPage) },
  { path: 'collaborative-editor', element: withSuspense(CollaborativeEditorPage) },
  { path: 'image-filters', element: withSuspense(ImageFiltersPage) },
  { path: 'gantt-chart', element: withSuspense(GanttChartPage) },
  { path: 'notification-system', element: withSuspense(NotificationSystemPage) },
  { path: 'file-tree', element: withSuspense(FileTreePage) },
  { path: 'stock-dashboard', element: withSuspense(StockDashboardPage) },
  { path: 'sortable-grid', element: withSuspense(SortableGridPage) },
  { path: 'modal-system', element: withSuspense(ModalSystemPage) },
  { path: 'canvas-paint', element: withSuspense(CanvasPaintPage) },
  { path: 'data-table', element: withSuspense(DataTablePage) },
]
