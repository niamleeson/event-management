import { useRoute, useRouter } from 'vue-router';
import { computed, ref, watch, onUnmounted } from 'vue';
import { createDevTools } from '@pulse/devtools';
const route = useRoute();
const router = useRouter();
const navSections = [
    {
        title: 'Basics',
        items: [
            { path: '/todo-list', label: 'Todo List', description: 'Events, pipes, signals' },
            { path: '/api-call', label: 'API Call', description: 'Async with latest-wins' },
            { path: '/simple-animation', label: 'Simple Animation', description: 'Tweens and springs' },
            { path: '/complex-animation', label: 'Complex Animation', description: 'Staggered tweens, joins' },
            { path: '/drag-api-animation', label: 'Drag + API', description: 'Kanban with spring physics' },
            { path: '/realtime-dashboard', label: 'Realtime Dashboard', description: 'Streaming metrics, alerts' },
            { path: '/form-wizard', label: 'Form Wizard', description: 'Multi-step validation, joins' },
        ],
    },
    {
        title: '3D Animations',
        items: [
            { path: '/3d-card-flip', label: '3D Card Flip', description: 'Interactive card flip' },
            { path: '/3d-cube-menu', label: '3D Cube Menu', description: 'Rotating cube navigation' },
            { path: '/3d-particle-explosion', label: '3D Particles', description: 'Particle explosion effects' },
            { path: '/3d-carousel', label: '3D Carousel', description: 'Rotating 3D carousel' },
            { path: '/3d-layered-parallax', label: '3D Parallax', description: 'Layered parallax depth' },
            { path: '/3d-morphing-grid', label: '3D Morphing Grid', description: 'Grid morphing transitions' },
        ],
    },
    {
        title: 'Complex UI',
        items: [
            { path: '/spreadsheet', label: 'Spreadsheet', description: 'Cell editing with formulas' },
            { path: '/chat-app', label: 'Chat App', description: 'Real-time messaging' },
            { path: '/music-player', label: 'Music Player', description: 'Audio player with playlist' },
            { path: '/virtual-scroll', label: 'Virtual Scroll', description: 'Virtualized list rendering' },
            { path: '/collaborative-editor', label: 'Collaborative Editor', description: 'Multi-user text editing' },
            { path: '/image-filters', label: 'Image Filters', description: 'Real-time image processing' },
            { path: '/gantt-chart', label: 'Gantt Chart', description: 'Project timeline visualization' },
            { path: '/notification-system', label: 'Notifications', description: 'Toast notification system' },
            { path: '/file-tree', label: 'File Tree', description: 'Hierarchical file browser' },
            { path: '/stock-dashboard', label: 'Stock Dashboard', description: 'Live stock price tracker' },
            { path: '/sortable-grid', label: 'Sortable Grid', description: 'Drag-to-reorder grid' },
            { path: '/modal-system', label: 'Modal System', description: 'Stacked modal management' },
            { path: '/canvas-paint', label: 'Canvas Paint', description: 'Drawing canvas application' },
            { path: '/data-table', label: 'Data Table', description: 'Sortable, filterable grid' },
        ],
    },
];
const currentPath = computed(() => route.path);
const devtoolsInstance = ref(null);
const devtoolsOpen = ref(false);
function destroyDevTools() {
    if (devtoolsInstance.value) {
        devtoolsInstance.value.destroy();
        devtoolsInstance.value = null;
    }
    devtoolsOpen.value = false;
}
function toggleDevTools() {
    if (devtoolsInstance.value) {
        destroyDevTools();
    }
    else {
        const engine = window.__pulseEngine;
        if (engine) {
            devtoolsInstance.value = createDevTools(engine, { position: 'bottom', theme: 'dark' });
            devtoolsOpen.value = true;
        }
    }
}
// When route changes, destroy and re-create devtools if open
watch(currentPath, () => {
    if (devtoolsOpen.value) {
        if (devtoolsInstance.value) {
            devtoolsInstance.value.destroy();
            devtoolsInstance.value = null;
        }
        setTimeout(() => {
            const engine = window.__pulseEngine;
            if (engine) {
                devtoolsInstance.value = createDevTools(engine, { position: 'bottom', theme: 'dark' });
            }
        }, 100);
    }
});
onUnmounted(() => {
    if (devtoolsInstance.value) {
        devtoolsInstance.value.destroy();
        devtoolsInstance.value = null;
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['nav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['devtools-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['devtools-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-link']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "layout" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "logo" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "logo-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "logo-text" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "sidebar-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "nav" },
});
for (const [section] of __VLS_getVForSourceType((__VLS_ctx.navSections))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (section.title),
        ...{ class: "nav-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "nav-section-title" },
    });
    (section.title);
    for (const [item] of __VLS_getVForSourceType((section.items))) {
        const __VLS_0 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.RouterLink, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            key: (item.path),
            to: (item.path),
            ...{ class: "nav-link" },
            ...{ class: ({ active: __VLS_ctx.currentPath === item.path }) },
        }));
        const __VLS_2 = __VLS_1({
            key: (item.path),
            to: (item.path),
            ...{ class: "nav-link" },
            ...{ class: ({ active: __VLS_ctx.currentPath === item.path }) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_3.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "nav-label" },
        });
        (item.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "nav-desc" },
        });
        (item.description);
        var __VLS_3;
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toggleDevTools) },
    ...{ class: "devtools-btn" },
    ...{ class: ({ active: __VLS_ctx.devtoolsOpen }) },
    title: "Toggle Pulse DevTools",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M12 20V10",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M18 20V4",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M6 20v-4",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-footer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    href: "https://github.com/nicholasgalante1997/pulse",
    target: "_blank",
    ...{ class: "footer-link" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "content" },
});
const __VLS_4 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
/** @type {__VLS_StyleScopedClasses['layout']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['logo']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-text']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['nav']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-section']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-label']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['devtools-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-link']} */ ;
/** @type {__VLS_StyleScopedClasses['content']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            navSections: navSections,
            currentPath: currentPath,
            devtoolsOpen: devtoolsOpen,
            toggleDevTools: toggleDevTools,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
