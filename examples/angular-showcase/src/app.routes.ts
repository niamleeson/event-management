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
]
