import { render } from 'solid-js/web'
import { Router, Route, Navigate } from '@solidjs/router'
import { lazy } from 'solid-js'
import App from './App'

const TodoListPage = lazy(() => import('./pages/TodoListPage'))
const ApiCallPage = lazy(() => import('./pages/ApiCallPage'))
const SimpleAnimationPage = lazy(() => import('./pages/SimpleAnimationPage'))
const ComplexAnimationPage = lazy(() => import('./pages/ComplexAnimationPage'))
const DragApiAnimationPage = lazy(() => import('./pages/DragApiAnimationPage'))
const RealtimeDashboardPage = lazy(() => import('./pages/RealtimeDashboardPage'))
const FormWizardPage = lazy(() => import('./pages/FormWizardPage'))

render(
  () => (
    <Router root={App}>
      <Route path="/" component={() => <Navigate href="/todo-list" />} />
      <Route path="/todo-list" component={TodoListPage} />
      <Route path="/api-call" component={ApiCallPage} />
      <Route path="/simple-animation" component={SimpleAnimationPage} />
      <Route path="/complex-animation" component={ComplexAnimationPage} />
      <Route path="/drag-api-animation" component={DragApiAnimationPage} />
      <Route path="/realtime-dashboard" component={RealtimeDashboardPage} />
      <Route path="/form-wizard" component={FormWizardPage} />
    </Router>
  ),
  document.getElementById('root')!,
)
