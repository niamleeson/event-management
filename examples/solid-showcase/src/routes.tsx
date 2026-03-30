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
]
