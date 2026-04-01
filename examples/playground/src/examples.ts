import type { ComponentType } from 'react'

export interface ExampleEntry {
  id: string
  name: string
  category: 'core' | 'animation' | '3d' | 'data'
  description: string
  load: () => Promise<{
    default: ComponentType
    engine: any
    startLoop: () => void
    stopLoop: () => void
  }>
}

/**
 * Helper: wrap an example module import pair (App + engine) into the
 * standard shape expected by the playground.  Because many examples
 * start their rAF / setInterval loops at module-evaluation time, we
 * cannot really "stop" them once the module is loaded.  Instead we
 * provide no-op start/stop and rely on engine.destroy() for cleanup.
 */
function entry(
  id: string,
  name: string,
  category: ExampleEntry['category'],
  description: string,
  load: () => Promise<{ default: ComponentType; engine: any; startLoop: () => void; stopLoop: () => void }>,
): ExampleEntry {
  return { id, name, category, description, load }
}

function loadExample(appImport: () => Promise<any>, engineImport: () => Promise<any>) {
  return () =>
    Promise.all([appImport(), engineImport()]).then(([app, eng]) => ({
      default: app.default as ComponentType,
      engine: eng.engine,
      startLoop: (eng.startLoop ?? eng.startFeed ?? eng.startTicker ?? (() => {})) as () => void,
      stopLoop: (eng.stopLoop ?? eng.stopFeed ?? eng.stopTicker ?? (() => {})) as () => void,
    }))
}

// ---------------------------------------------------------------------------
// Registry — all 28 React examples
// ---------------------------------------------------------------------------

export const examples: ExampleEntry[] = [
  // ---- Core ----
  entry(
    'todo-list',
    'Todo List',
    'core',
    'Classic todo app with validation, filtering, and reactive state',
    loadExample(
      () => import('../../react/todo-list/src/App'),
      () => import('../../react/todo-list/src/engine'),
    ),
  ),
  entry(
    'form-wizard',
    'Form Wizard',
    'core',
    'Multi-step form with validation and navigation',
    loadExample(
      () => import('../../react/form-wizard/src/App'),
      () => import('../../react/form-wizard/src/engine'),
    ),
  ),
  entry(
    'chat-app',
    'Chat App',
    'core',
    'Real-time chat interface with message threading',
    loadExample(
      () => import('../../react/chat-app/src/App'),
      () => import('../../react/chat-app/src/engine'),
    ),
  ),
  entry(
    'modal-system',
    'Modal System',
    'core',
    'Stacking modal dialogs with focus management',
    loadExample(
      () => import('../../react/modal-system/src/App'),
      () => import('../../react/modal-system/src/engine'),
    ),
  ),
  entry(
    'notification-system',
    'Notification System',
    'core',
    'Toast notifications with auto-dismiss and stacking',
    loadExample(
      () => import('../../react/notification-system/src/App'),
      () => import('../../react/notification-system/src/engine'),
    ),
  ),
  entry(
    'file-tree',
    'File Tree',
    'core',
    'Expandable file tree with selection and context menu',
    loadExample(
      () => import('../../react/file-tree/src/App'),
      () => import('../../react/file-tree/src/engine'),
    ),
  ),
  entry(
    'api-call',
    'API Call',
    'core',
    'Async data fetching with loading states and error handling',
    loadExample(
      () => import('../../react/api-call/src/App'),
      () => import('../../react/api-call/src/engine'),
    ),
  ),
  entry(
    'collaborative-editor',
    'Collaborative Editor',
    'core',
    'Multi-cursor collaborative text editor simulation',
    loadExample(
      () => import('../../react/collaborative-editor/src/App'),
      () => import('../../react/collaborative-editor/src/engine'),
    ),
  ),
  entry(
    'judgment',
    'Judgment',
    'core',
    'Decision-making flow with weighted criteria evaluation',
    loadExample(
      () => import('../../react/judgment/src/App'),
      () => import('../../react/judgment/src/engine'),
    ),
  ),

  // ---- Animation ----
  entry(
    'simple-animation',
    'Simple Animation',
    'animation',
    'Animated counter with spring physics and color interpolation',
    loadExample(
      () => import('../../react/simple-animation/src/App'),
      () => import('../../react/simple-animation/src/engine'),
    ),
  ),
  entry(
    'complex-animation',
    'Complex Animation',
    'animation',
    'Staggered card entrance with hover springs and welcome sequence',
    loadExample(
      () => import('../../react/complex-animation/src/App'),
      () => import('../../react/complex-animation/src/engine'),
    ),
  ),
  entry(
    'drag-api-animation',
    'Drag Animation',
    'animation',
    'Drag-and-drop with physics-based snapping and trails',
    loadExample(
      () => import('../../react/drag-api-animation/src/App'),
      () => import('../../react/drag-api-animation/src/engine'),
    ),
  ),
  entry(
    'sortable-grid',
    'Sortable Grid',
    'animation',
    'Drag-to-reorder grid with animated transitions',
    loadExample(
      () => import('../../react/sortable-grid/src/App'),
      () => import('../../react/sortable-grid/src/engine'),
    ),
  ),
  entry(
    'canvas-paint',
    'Canvas Paint',
    'animation',
    'Freeform drawing canvas with brush tools and undo',
    loadExample(
      () => import('../../react/canvas-paint/src/App'),
      () => import('../../react/canvas-paint/src/engine'),
    ),
  ),
  entry(
    'music-player',
    'Music Player',
    'animation',
    'Audio player with waveform visualization and playlist',
    loadExample(
      () => import('../../react/music-player/src/App'),
      () => import('../../react/music-player/src/engine'),
    ),
  ),
  entry(
    'image-filters',
    'Image Filters',
    'animation',
    'Real-time image filter pipeline with adjustable parameters',
    loadExample(
      () => import('../../react/image-filters/src/App'),
      () => import('../../react/image-filters/src/engine'),
    ),
  ),

  // ---- 3D ----
  entry(
    '3d-card-flip',
    '3D Card Flip',
    '3d',
    'Interactive card flip with perspective transforms',
    loadExample(
      () => import('../../react/3d-card-flip/src/App'),
      () => import('../../react/3d-card-flip/src/engine'),
    ),
  ),
  entry(
    '3d-carousel',
    '3D Carousel',
    '3d',
    'Rotating 3D carousel with depth-of-field effect',
    loadExample(
      () => import('../../react/3d-carousel/src/App'),
      () => import('../../react/3d-carousel/src/engine'),
    ),
  ),
  entry(
    '3d-cube-menu',
    '3D Cube Menu',
    '3d',
    'Navigation menu mapped onto a rotating cube',
    loadExample(
      () => import('../../react/3d-cube-menu/src/App'),
      () => import('../../react/3d-cube-menu/src/engine'),
    ),
  ),
  entry(
    '3d-layered-parallax',
    '3D Layered Parallax',
    '3d',
    'Multi-layer parallax effect with mouse tracking',
    loadExample(
      () => import('../../react/3d-layered-parallax/src/App'),
      () => import('../../react/3d-layered-parallax/src/engine'),
    ),
  ),
  entry(
    '3d-morphing-grid',
    '3D Morphing Grid',
    '3d',
    'Grid of elements that morph between configurations',
    loadExample(
      () => import('../../react/3d-morphing-grid/src/App'),
      () => import('../../react/3d-morphing-grid/src/engine'),
    ),
  ),
  entry(
    '3d-particle-explosion',
    '3D Particle Explosion',
    '3d',
    'Click-triggered particle explosions with 3D transforms',
    loadExample(
      () => import('../../react/3d-particle-explosion/src/App'),
      () => import('../../react/3d-particle-explosion/src/engine'),
    ),
  ),

  // ---- Data ----
  entry(
    'data-table',
    'Data Table',
    'data',
    'Sortable, filterable, paginated table with 1000 rows',
    loadExample(
      () => import('../../react/data-table/src/App'),
      () => import('../../react/data-table/src/engine'),
    ),
  ),
  entry(
    'spreadsheet',
    'Spreadsheet',
    'data',
    'Excel-like spreadsheet with formulas and cell references',
    loadExample(
      () => import('../../react/spreadsheet/src/App'),
      () => import('../../react/spreadsheet/src/engine'),
    ),
  ),
  entry(
    'realtime-dashboard',
    'Realtime Dashboard',
    'data',
    'Live metrics dashboard with charts and threshold alerts',
    loadExample(
      () => import('../../react/realtime-dashboard/src/App'),
      () => import('../../react/realtime-dashboard/src/engine'),
    ),
  ),
  entry(
    'stock-dashboard',
    'Stock Dashboard',
    'data',
    'Real-time stock ticker with watchlist and price alerts',
    loadExample(
      () => import('../../react/stock-dashboard/src/App'),
      () => import('../../react/stock-dashboard/src/engine'),
    ),
  ),
  entry(
    'gantt-chart',
    'Gantt Chart',
    'data',
    'Project timeline with task dependencies and drag-to-resize',
    loadExample(
      () => import('../../react/gantt-chart/src/App'),
      () => import('../../react/gantt-chart/src/engine'),
    ),
  ),
  entry(
    'virtual-scroll',
    'Virtual Scroll',
    'data',
    'Virtualized list rendering thousands of items efficiently',
    loadExample(
      () => import('../../react/virtual-scroll/src/App'),
      () => import('../../react/virtual-scroll/src/engine'),
    ),
  ),
]

export const categories = [
  { key: 'core' as const, label: 'Core', color: '#4361ee' },
  { key: 'animation' as const, label: 'Animation', color: '#f72585' },
  { key: '3d' as const, label: '3D', color: '#7209b7' },
  { key: 'data' as const, label: 'Data', color: '#2a9d8f' },
]
