export interface RouteInfo {
  path: string
  label: string
  description: string
}

export const routeInfos: RouteInfo[] = [
  { path: '/todo-list', label: 'Todo List', description: 'CRUD with validation pipes' },
  { path: '/api-call', label: 'API Call', description: 'Async search with cancellation' },
  { path: '/simple-animation', label: 'Simple Animation', description: 'Tween + spring counter' },
  { path: '/complex-animation', label: 'Complex Animation', description: 'Staggered card entrance' },
  { path: '/drag-api-animation', label: 'Drag + API', description: 'Kanban with drag, save, undo' },
  { path: '/realtime-dashboard', label: 'Realtime Dashboard', description: 'Live metrics with alerts' },
  { path: '/form-wizard', label: 'Form Wizard', description: 'Multi-step form with validation' },
  { path: '/3d-card-flip', label: '3D Card Flip', description: 'Flip tweens, spring hover, CSS perspective' },
  { path: '/3d-cube-menu', label: '3D Cube Menu', description: 'Drag-rotate spring, snap 90\u00B0, glow' },
  { path: '/3d-particle-explosion', label: '3D Particles', description: 'Canvas physics, gravity, trails' },
  { path: '/3d-carousel', label: '3D Carousel', description: '8 items, auto-rotate, spring angle' },
  { path: '/3d-layered-parallax', label: '3D Parallax', description: '5 layers, mouse spring, day/night' },
  { path: '/3d-morphing-grid', label: '3D Morphing Grid', description: '4x4 morph shapes, staggered tweens' },
  { path: '/spreadsheet', label: 'Spreadsheet', description: '8x8 grid, formulas, cascade eval' },
  { path: '/chat-app', label: 'Chat App', description: '2 bots, typing indicators, read receipts' },
  { path: '/music-player', label: 'Music Player', description: '32-bar visualizer, playlist, beats' },
  { path: '/virtual-scroll', label: 'Virtual Scroll', description: '10K items, virtual render, prefetch' },
  { path: '/collaborative-editor', label: 'Collab Editor', description: 'Multi-user, spring cursors, history' },
  { path: '/image-filters', label: 'Image Filters', description: 'CSS pipeline, reorder, undo/redo' },
  { path: '/gantt-chart', label: 'Gantt Chart', description: 'Tasks, drag, SVG arrows, zoom' },
  { path: '/notification-system', label: 'Notifications', description: 'Toast stack, auto-dismiss, reflow' },
  { path: '/file-tree', label: 'File Tree', description: 'Nested expand, icons, context menu' },
  { path: '/stock-dashboard', label: 'Stock Dashboard', description: '8 stocks, sparklines, alerts, dark' },
  { path: '/sortable-grid', label: 'Sortable Grid', description: 'Drag reorder, spring positions' },
  { path: '/modal-system', label: 'Modal System', description: 'Stacked modals, tweens, backdrop' },
  { path: '/canvas-paint', label: 'Canvas Paint', description: 'Tools, colors, layers, undo/redo' },
  { path: '/data-table', label: 'Data Table', description: '1K rows, sort/filter/paginate, expand' },
]
