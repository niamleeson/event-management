import type { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', redirectTo: 'todo-list', pathMatch: 'full' },
  {
    path: 'todo-list',
    loadComponent: () =>
      import('./examples/todo-list/todo-list.component').then(
        (m) => m.TodoListComponent,
      ),
  },
  {
    path: 'api-call',
    loadComponent: () =>
      import('./examples/api-call/api-call.component').then(
        (m) => m.ApiCallComponent,
      ),
  },
  {
    path: 'simple-animation',
    loadComponent: () =>
      import('./examples/simple-animation/simple-animation.component').then(
        (m) => m.SimpleAnimationComponent,
      ),
  },
  {
    path: 'complex-animation',
    loadComponent: () =>
      import('./examples/complex-animation/complex-animation.component').then(
        (m) => m.ComplexAnimationComponent,
      ),
  },
  {
    path: 'drag-api-animation',
    loadComponent: () =>
      import('./examples/drag-api-animation/drag-api-animation.component').then(
        (m) => m.DragApiAnimationComponent,
      ),
  },
  {
    path: 'realtime-dashboard',
    loadComponent: () =>
      import('./examples/realtime-dashboard/realtime-dashboard.component').then(
        (m) => m.RealtimeDashboardComponent,
      ),
  },
  {
    path: 'form-wizard',
    loadComponent: () =>
      import('./examples/form-wizard/form-wizard.component').then(
        (m) => m.FormWizardComponent,
      ),
  },
  // --- 3D Examples ---
  {
    path: '3d-card-flip',
    loadComponent: () =>
      import('./examples/3d-card-flip/3d-card-flip.component').then(
        (m) => m.ThreeDCardFlipComponent,
      ),
  },
  {
    path: '3d-cube-menu',
    loadComponent: () =>
      import('./examples/3d-cube-menu/3d-cube-menu.component').then(
        (m) => m.ThreeDCubeMenuComponent,
      ),
  },
  {
    path: '3d-particle-explosion',
    loadComponent: () =>
      import('./examples/3d-particle-explosion/3d-particle-explosion.component').then(
        (m) => m.ThreeDParticleExplosionComponent,
      ),
  },
  {
    path: '3d-carousel',
    loadComponent: () =>
      import('./examples/3d-carousel/3d-carousel.component').then(
        (m) => m.ThreeDCarouselComponent,
      ),
  },
  {
    path: '3d-layered-parallax',
    loadComponent: () =>
      import('./examples/3d-layered-parallax/3d-layered-parallax.component').then(
        (m) => m.ThreeDLayeredParallaxComponent,
      ),
  },
  {
    path: '3d-morphing-grid',
    loadComponent: () =>
      import('./examples/3d-morphing-grid/3d-morphing-grid.component').then(
        (m) => m.ThreeDMorphingGridComponent,
      ),
  },
  // --- Complex UI ---
  {
    path: 'spreadsheet',
    loadComponent: () =>
      import('./examples/spreadsheet/spreadsheet.component').then(
        (m) => m.SpreadsheetComponent,
      ),
  },
  {
    path: 'chat-app',
    loadComponent: () =>
      import('./examples/chat-app/chat-app.component').then(
        (m) => m.ChatAppComponent,
      ),
  },
  {
    path: 'music-player',
    loadComponent: () =>
      import('./examples/music-player/music-player.component').then(
        (m) => m.MusicPlayerComponent,
      ),
  },
  {
    path: 'virtual-scroll',
    loadComponent: () =>
      import('./examples/virtual-scroll/virtual-scroll.component').then(
        (m) => m.VirtualScrollComponent,
      ),
  },
  {
    path: 'collaborative-editor',
    loadComponent: () =>
      import('./examples/collaborative-editor/collaborative-editor.component').then(
        (m) => m.CollaborativeEditorComponent,
      ),
  },
  {
    path: 'image-filters',
    loadComponent: () =>
      import('./examples/image-filters/image-filters.component').then(
        (m) => m.ImageFiltersComponent,
      ),
  },
  {
    path: 'gantt-chart',
    loadComponent: () =>
      import('./examples/gantt-chart/gantt-chart.component').then(
        (m) => m.GanttChartComponent,
      ),
  },
  {
    path: 'notification-system',
    loadComponent: () =>
      import('./examples/notification-system/notification-system.component').then(
        (m) => m.NotificationSystemComponent,
      ),
  },
  {
    path: 'file-tree',
    loadComponent: () =>
      import('./examples/file-tree/file-tree.component').then(
        (m) => m.FileTreeComponent,
      ),
  },
  {
    path: 'stock-dashboard',
    loadComponent: () =>
      import('./examples/stock-dashboard/stock-dashboard.component').then(
        (m) => m.StockDashboardComponent,
      ),
  },
  {
    path: 'sortable-grid',
    loadComponent: () =>
      import('./examples/sortable-grid/sortable-grid.component').then(
        (m) => m.SortableGridComponent,
      ),
  },
  {
    path: 'modal-system',
    loadComponent: () =>
      import('./examples/modal-system/modal-system.component').then(
        (m) => m.ModalSystemComponent,
      ),
  },
  {
    path: 'canvas-paint',
    loadComponent: () =>
      import('./examples/canvas-paint/canvas-paint.component').then(
        (m) => m.CanvasPaintComponent,
      ),
  },
  {
    path: 'data-table',
    loadComponent: () =>
      import('./examples/data-table/data-table.component').then(
        (m) => m.DataTableComponent,
      ),
  },
]
