export interface RouteInfo {
  path: string
  label: string
  description: string
  section: 'basics' | '3d' | 'complex'
}

export const routeInfos: RouteInfo[] = [
  // Basics
  { path: '/todo-list', label: 'Todo List', description: 'CRUD with validation pipes', section: 'basics' },
  { path: '/api-call', label: 'API Call', description: 'Async search with cancellation', section: 'basics' },
  { path: '/simple-animation', label: 'Simple Animation', description: 'Tween + spring counter', section: 'basics' },
  { path: '/complex-animation', label: 'Complex Animation', description: 'Staggered card entrance', section: 'basics' },
  { path: '/drag-api-animation', label: 'Drag + API', description: 'Kanban with drag, save, undo', section: 'basics' },
  { path: '/realtime-dashboard', label: 'Realtime Dashboard', description: 'Live metrics with alerts', section: 'basics' },
  { path: '/form-wizard', label: 'Form Wizard', description: 'Multi-step form with validation', section: 'basics' },

  // 3D Animations
  { path: '/3d-card-flip', label: '3D Card Flip', description: 'Interactive card flip animation', section: '3d' },
  { path: '/3d-cube-menu', label: '3D Cube Menu', description: 'Rotating cube navigation', section: '3d' },
  { path: '/3d-particle-explosion', label: '3D Particles', description: 'Particle explosion effects', section: '3d' },
  { path: '/3d-carousel', label: '3D Carousel', description: 'Rotating 3D carousel', section: '3d' },
  { path: '/3d-layered-parallax', label: '3D Parallax', description: 'Layered parallax depth effect', section: '3d' },
  { path: '/3d-morphing-grid', label: '3D Morphing Grid', description: 'Grid morphing transitions', section: '3d' },

  // Complex UI
  { path: '/spreadsheet', label: 'Spreadsheet', description: 'Cell editing with formulas', section: 'complex' },
  { path: '/chat-app', label: 'Chat App', description: 'Real-time messaging interface', section: 'complex' },
  { path: '/music-player', label: 'Music Player', description: 'Audio player with playlist', section: 'complex' },
  { path: '/virtual-scroll', label: 'Virtual Scroll', description: 'Virtualized list rendering', section: 'complex' },
  { path: '/collaborative-editor', label: 'Collaborative Editor', description: 'Multi-user text editing', section: 'complex' },
  { path: '/image-filters', label: 'Image Filters', description: 'Real-time image processing', section: 'complex' },
  { path: '/gantt-chart', label: 'Gantt Chart', description: 'Project timeline visualization', section: 'complex' },
  { path: '/notification-system', label: 'Notifications', description: 'Toast notification system', section: 'complex' },
  { path: '/file-tree', label: 'File Tree', description: 'Hierarchical file browser', section: 'complex' },
  { path: '/stock-dashboard', label: 'Stock Dashboard', description: 'Live stock price tracker', section: 'complex' },
  { path: '/sortable-grid', label: 'Sortable Grid', description: 'Drag-to-reorder grid layout', section: 'complex' },
  { path: '/modal-system', label: 'Modal System', description: 'Stacked modal management', section: 'complex' },
  { path: '/canvas-paint', label: 'Canvas Paint', description: 'Drawing canvas application', section: 'complex' },
  { path: '/data-table', label: 'Data Table', description: 'Sortable, filterable data grid', section: 'complex' },
]

export const sectionLabels: Record<string, string> = {
  basics: 'Basics',
  '3d': '3D Animations',
  complex: 'Complex UI',
}
