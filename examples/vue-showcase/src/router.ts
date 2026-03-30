import { createRouter, createWebHistory } from 'vue-router'

import TodoListPage from './pages/TodoListPage.vue'
import ApiCallPage from './pages/ApiCallPage.vue'
import SimpleAnimationPage from './pages/SimpleAnimationPage.vue'
import ComplexAnimationPage from './pages/ComplexAnimationPage.vue'
import DragApiAnimationPage from './pages/DragApiAnimationPage.vue'
import RealtimeDashboardPage from './pages/RealtimeDashboardPage.vue'
import FormWizardPage from './pages/FormWizardPage.vue'

const routes = [
  { path: '/', redirect: '/todo-list' },
  { path: '/todo-list', name: 'todo-list', component: TodoListPage },
  { path: '/api-call', name: 'api-call', component: ApiCallPage },
  { path: '/simple-animation', name: 'simple-animation', component: SimpleAnimationPage },
  { path: '/complex-animation', name: 'complex-animation', component: ComplexAnimationPage },
  { path: '/drag-api-animation', name: 'drag-api-animation', component: DragApiAnimationPage },
  { path: '/realtime-dashboard', name: 'realtime-dashboard', component: RealtimeDashboardPage },
  { path: '/form-wizard', name: 'form-wizard', component: FormWizardPage },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
