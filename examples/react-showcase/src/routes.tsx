import React, { Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Lazy-loaded page wrappers
// Each page imports its own engine + App and wraps in PulseProvider
// ---------------------------------------------------------------------------

const TodoListPage = React.lazy(() => import('./pages/TodoListPage'))
const ApiCallPage = React.lazy(() => import('./pages/ApiCallPage'))
const SimpleAnimationPage = React.lazy(() => import('./pages/SimpleAnimationPage'))
const ComplexAnimationPage = React.lazy(() => import('./pages/ComplexAnimationPage'))
const DragApiAnimationPage = React.lazy(() => import('./pages/DragApiAnimationPage'))
const RealtimeDashboardPage = React.lazy(() => import('./pages/RealtimeDashboardPage'))
const FormWizardPage = React.lazy(() => import('./pages/FormWizardPage'))

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
}

export const routeInfo: RouteInfo[] = [
  {
    path: '/todo-list',
    label: 'Todo List',
    description: 'Event-driven todos with validation',
  },
  {
    path: '/api-call',
    label: 'API Call',
    description: 'Async search with debounce & cancel',
  },
  {
    path: '/simple-animation',
    label: 'Simple Animation',
    description: 'Tween-animated counter with color',
  },
  {
    path: '/complex-animation',
    label: 'Complex Animation',
    description: 'Staggered cards with springs & joins',
  },
  {
    path: '/drag-api-animation',
    label: 'Drag + API + Animation',
    description: 'Kanban board with drag, save & retry',
  },
  {
    path: '/realtime-dashboard',
    label: 'Realtime Dashboard',
    description: 'Live metrics with threshold alerts',
  },
  {
    path: '/form-wizard',
    label: 'Form Wizard',
    description: 'Multi-step form with validation',
  },
]

export const routes: RouteObject[] = [
  { path: 'todo-list', element: withSuspense(TodoListPage) },
  { path: 'api-call', element: withSuspense(ApiCallPage) },
  { path: 'simple-animation', element: withSuspense(SimpleAnimationPage) },
  { path: 'complex-animation', element: withSuspense(ComplexAnimationPage) },
  { path: 'drag-api-animation', element: withSuspense(DragApiAnimationPage) },
  { path: 'realtime-dashboard', element: withSuspense(RealtimeDashboardPage) },
  { path: 'form-wizard', element: withSuspense(FormWizardPage) },
]
