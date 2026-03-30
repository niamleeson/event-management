import { createRouter, createWebHistory } from 'vue-router';
// Basics
import TodoListPage from './pages/TodoListPage.vue';
import ApiCallPage from './pages/ApiCallPage.vue';
import SimpleAnimationPage from './pages/SimpleAnimationPage.vue';
import ComplexAnimationPage from './pages/ComplexAnimationPage.vue';
import DragApiAnimationPage from './pages/DragApiAnimationPage.vue';
import RealtimeDashboardPage from './pages/RealtimeDashboardPage.vue';
import FormWizardPage from './pages/FormWizardPage.vue';
// 3D Animations
import CardFlip3DPage from './pages/CardFlip3DPage.vue';
import CubeMenu3DPage from './pages/CubeMenu3DPage.vue';
import ParticleExplosion3DPage from './pages/ParticleExplosion3DPage.vue';
import Carousel3DPage from './pages/Carousel3DPage.vue';
import LayeredParallax3DPage from './pages/LayeredParallax3DPage.vue';
import MorphingGrid3DPage from './pages/MorphingGrid3DPage.vue';
// Complex UI
import SpreadsheetPage from './pages/SpreadsheetPage.vue';
import ChatAppPage from './pages/ChatAppPage.vue';
import MusicPlayerPage from './pages/MusicPlayerPage.vue';
import VirtualScrollPage from './pages/VirtualScrollPage.vue';
import CollaborativeEditorPage from './pages/CollaborativeEditorPage.vue';
import ImageFiltersPage from './pages/ImageFiltersPage.vue';
import GanttChartPage from './pages/GanttChartPage.vue';
import NotificationSystemPage from './pages/NotificationSystemPage.vue';
import FileTreePage from './pages/FileTreePage.vue';
import StockDashboardPage from './pages/StockDashboardPage.vue';
import SortableGridPage from './pages/SortableGridPage.vue';
import ModalSystemPage from './pages/ModalSystemPage.vue';
import CanvasPaintPage from './pages/CanvasPaintPage.vue';
import DataTablePage from './pages/DataTablePage.vue';
const routes = [
    { path: '/', redirect: '/todo-list' },
    // Basics
    { path: '/todo-list', name: 'todo-list', component: TodoListPage },
    { path: '/api-call', name: 'api-call', component: ApiCallPage },
    { path: '/simple-animation', name: 'simple-animation', component: SimpleAnimationPage },
    { path: '/complex-animation', name: 'complex-animation', component: ComplexAnimationPage },
    { path: '/drag-api-animation', name: 'drag-api-animation', component: DragApiAnimationPage },
    { path: '/realtime-dashboard', name: 'realtime-dashboard', component: RealtimeDashboardPage },
    { path: '/form-wizard', name: 'form-wizard', component: FormWizardPage },
    // 3D Animations
    { path: '/3d-card-flip', name: '3d-card-flip', component: CardFlip3DPage },
    { path: '/3d-cube-menu', name: '3d-cube-menu', component: CubeMenu3DPage },
    { path: '/3d-particle-explosion', name: '3d-particle-explosion', component: ParticleExplosion3DPage },
    { path: '/3d-carousel', name: '3d-carousel', component: Carousel3DPage },
    { path: '/3d-layered-parallax', name: '3d-layered-parallax', component: LayeredParallax3DPage },
    { path: '/3d-morphing-grid', name: '3d-morphing-grid', component: MorphingGrid3DPage },
    // Complex UI
    { path: '/spreadsheet', name: 'spreadsheet', component: SpreadsheetPage },
    { path: '/chat-app', name: 'chat-app', component: ChatAppPage },
    { path: '/music-player', name: 'music-player', component: MusicPlayerPage },
    { path: '/virtual-scroll', name: 'virtual-scroll', component: VirtualScrollPage },
    { path: '/collaborative-editor', name: 'collaborative-editor', component: CollaborativeEditorPage },
    { path: '/image-filters', name: 'image-filters', component: ImageFiltersPage },
    { path: '/gantt-chart', name: 'gantt-chart', component: GanttChartPage },
    { path: '/notification-system', name: 'notification-system', component: NotificationSystemPage },
    { path: '/file-tree', name: 'file-tree', component: FileTreePage },
    { path: '/stock-dashboard', name: 'stock-dashboard', component: StockDashboardPage },
    { path: '/sortable-grid', name: 'sortable-grid', component: SortableGridPage },
    { path: '/modal-system', name: 'modal-system', component: ModalSystemPage },
    { path: '/canvas-paint', name: 'canvas-paint', component: CanvasPaintPage },
    { path: '/data-table', name: 'data-table', component: DataTablePage },
];
export const router = createRouter({
    history: createWebHistory(),
    routes,
});
