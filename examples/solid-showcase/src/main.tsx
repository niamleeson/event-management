import { render } from 'solid-js/web'
import { Router, Route, Navigate } from '@solidjs/router'
import { lazy } from 'solid-js'
import App from './App'

// Basics
const TodoListPage = lazy(() => import('./pages/TodoListPage'))
const ApiCallPage = lazy(() => import('./pages/ApiCallPage'))
const SimpleAnimationPage = lazy(() => import('./pages/SimpleAnimationPage'))
const ComplexAnimationPage = lazy(() => import('./pages/ComplexAnimationPage'))
const DragApiAnimationPage = lazy(() => import('./pages/DragApiAnimationPage'))
const RealtimeDashboardPage = lazy(() => import('./pages/RealtimeDashboardPage'))
const FormWizardPage = lazy(() => import('./pages/FormWizardPage'))

// 3D Animations
const CardFlip3DPage = lazy(() => import('./pages/CardFlip3DPage'))
const CubeMenu3DPage = lazy(() => import('./pages/CubeMenu3DPage'))
const ParticleExplosion3DPage = lazy(() => import('./pages/ParticleExplosion3DPage'))
const Carousel3DPage = lazy(() => import('./pages/Carousel3DPage'))
const LayeredParallax3DPage = lazy(() => import('./pages/LayeredParallax3DPage'))
const MorphingGrid3DPage = lazy(() => import('./pages/MorphingGrid3DPage'))

// Complex UI
const SpreadsheetPage = lazy(() => import('./pages/SpreadsheetPage'))
const ChatAppPage = lazy(() => import('./pages/ChatAppPage'))
const MusicPlayerPage = lazy(() => import('./pages/MusicPlayerPage'))
const VirtualScrollPage = lazy(() => import('./pages/VirtualScrollPage'))
const CollaborativeEditorPage = lazy(() => import('./pages/CollaborativeEditorPage'))
const ImageFiltersPage = lazy(() => import('./pages/ImageFiltersPage'))
const GanttChartPage = lazy(() => import('./pages/GanttChartPage'))
const NotificationSystemPage = lazy(() => import('./pages/NotificationSystemPage'))
const FileTreePage = lazy(() => import('./pages/FileTreePage'))
const StockDashboardPage = lazy(() => import('./pages/StockDashboardPage'))
const SortableGridPage = lazy(() => import('./pages/SortableGridPage'))
const ModalSystemPage = lazy(() => import('./pages/ModalSystemPage'))
const CanvasPaintPage = lazy(() => import('./pages/CanvasPaintPage'))
const DataTablePage = lazy(() => import('./pages/DataTablePage'))

render(
  () => (
    <Router root={App}>
      <Route path="/" component={() => <Navigate href="/todo-list" />} />

      {/* Basics */}
      <Route path="/todo-list" component={TodoListPage} />
      <Route path="/api-call" component={ApiCallPage} />
      <Route path="/simple-animation" component={SimpleAnimationPage} />
      <Route path="/complex-animation" component={ComplexAnimationPage} />
      <Route path="/drag-api-animation" component={DragApiAnimationPage} />
      <Route path="/realtime-dashboard" component={RealtimeDashboardPage} />
      <Route path="/form-wizard" component={FormWizardPage} />

      {/* 3D Animations */}
      <Route path="/3d-card-flip" component={CardFlip3DPage} />
      <Route path="/3d-cube-menu" component={CubeMenu3DPage} />
      <Route path="/3d-particle-explosion" component={ParticleExplosion3DPage} />
      <Route path="/3d-carousel" component={Carousel3DPage} />
      <Route path="/3d-layered-parallax" component={LayeredParallax3DPage} />
      <Route path="/3d-morphing-grid" component={MorphingGrid3DPage} />

      {/* Complex UI */}
      <Route path="/spreadsheet" component={SpreadsheetPage} />
      <Route path="/chat-app" component={ChatAppPage} />
      <Route path="/music-player" component={MusicPlayerPage} />
      <Route path="/virtual-scroll" component={VirtualScrollPage} />
      <Route path="/collaborative-editor" component={CollaborativeEditorPage} />
      <Route path="/image-filters" component={ImageFiltersPage} />
      <Route path="/gantt-chart" component={GanttChartPage} />
      <Route path="/notification-system" component={NotificationSystemPage} />
      <Route path="/file-tree" component={FileTreePage} />
      <Route path="/stock-dashboard" component={StockDashboardPage} />
      <Route path="/sortable-grid" component={SortableGridPage} />
      <Route path="/modal-system" component={ModalSystemPage} />
      <Route path="/canvas-paint" component={CanvasPaintPage} />
      <Route path="/data-table" component={DataTablePage} />
    </Router>
  ),
  document.getElementById('root')!,
)
